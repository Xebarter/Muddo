import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { verifyFirebaseIdToken } from '@/lib/firebase/verify-id-token'

const phoneDomain = '@phone.mudogwaluyiira.ug'

function digitsOnly(value: string) {
  return value.replace(/\D/g, '')
}

function samePhone(left: string, right: string) {
  const a = digitsOnly(left)
  const b = digitsOnly(right)
  if (a.length < 9 || b.length < 9) return false
  return a.endsWith(b.slice(-9)) || b.endsWith(a.slice(-9))
}

function adminEmails() {
  return (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

export async function openFirebaseSession(idToken: string) {
  const decoded = await verifyFirebaseIdToken(idToken)
  const phone = decoded.phone_number ?? ''
  const email = (decoded.email ?? '').toLowerCase()
  const name = decoded.name ?? ''
  const picture = decoded.picture ?? ''

  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return { error: 'Sign-in is not configured.' }
  }

  const { data: profiles, error: profileError } = await admin.from('profiles').select('id, email, phone')
  if (profileError) return { error: 'The account directory is not ready. Run the Supabase script, then try again.' }

  const match = (profiles ?? []).find((profile) => {
    if (email && profile.email?.toLowerCase() === email) return true
    if (phone && profile.phone && samePhone(profile.phone, phone)) return true
    return false
  })

  let authEmail = match?.email || email
  if (!authEmail) {
    const local = digitsOnly(phone) || decoded.uid
    authEmail = `${local}${phoneDomain}`
  }

  if (!match) {
    const role = adminEmails().includes(authEmail) || adminEmails().includes(email) ? 'admin' : 'customer'
    const { error: createError } = await admin.auth.admin.createUser({
      email: authEmail,
      email_confirm: true,
      phone: phone || undefined,
      phone_confirm: Boolean(phone),
      user_metadata: { full_name: name, phone, firebase_uid: decoded.uid, avatar_url: picture },
      app_metadata: { role, provider: 'firebase' },
    })
    if (createError && !/already|registered|exists/i.test(createError.message)) {
      const retry = await admin.auth.admin.createUser({
        email: authEmail,
        email_confirm: true,
        user_metadata: { full_name: name, phone, firebase_uid: decoded.uid, avatar_url: picture },
        app_metadata: { role, provider: 'firebase' },
      })
      if (retry.error && !/already|registered|exists/i.test(retry.error.message)) {
        return { error: 'The account could not be opened.' }
      }
    }
  }

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: authEmail,
  })
  const tokenHash = link?.properties?.hashed_token
  if (linkError || !tokenHash) return { error: 'The account could not be opened.' }

  const supabase = await createClient()
  const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' })
  if (verifyError) return { error: 'The account could not be opened.' }

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const patch: { full_name?: string; phone?: string } = {}
    if (name) patch.full_name = name
    else if (!match) patch.full_name = 'Customer'
    if (phone) patch.phone = phone
    if (Object.keys(patch).length) await admin.from('profiles').update(patch).eq('id', user.id)
    if (picture) {
      const { data: current } = await admin.auth.admin.getUserById(user.id)
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: { ...(current.user?.user_metadata ?? {}), avatar_url: picture },
      })
    }

    if (phone) {
      const { data: customers } = await admin.from('customers').select('id, phone, profile_id')
      const customer = (customers ?? []).find((item) => !item.profile_id && item.phone && samePhone(item.phone, phone))
      if (customer) await admin.from('customers').update({ profile_id: user.id }).eq('id', customer.id)
    }
  }

  const role = user?.app_metadata?.role === 'admin' ? 'admin' : 'customer'
  return { role }
}
