export function ugandaMobile(input: string) {
  let digits = input.replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('256')) digits = digits.slice(3)
  else if (digits.startsWith('0')) digits = digits.slice(1)
  if (!/^\d{9}$/.test(digits)) return ''
  return `256${digits}`
}

export function suggestedNetwork(phone: string): 'mtnmomo' | 'airtel' | null {
  const prefix = phone.slice(3, 5)
  if (['76', '77', '78', '79', '31', '39'].includes(prefix)) return 'mtnmomo'
  if (['70', '74', '75', '20'].includes(prefix)) return 'airtel'
  return null
}
