export type BusinessOffering = {
  title: string
  text: string
}

export type BusinessSlug = 'construction' | 'education' | 'financial-services' | 'talent-development' | 'events-management'

export type Business = {
  slug: BusinessSlug
  number: string
  title: string
  summary: string
  headline: string
  body: string
  offerings: BusinessOffering[]
}

export const businesses: Business[] = [
  {
    slug: 'construction',
    number: '01',
    title: 'Construction',
    summary: 'Building, civil works, renovation and infrastructure development.',
    headline: 'We build places that move Uganda forward.',
    body: 'From homes and commercial spaces to civil works, our construction teams turn ambitious plans into durable places. Every project is managed with clear stages, professional standards and a long-term view of the communities it serves.',
    offerings: [
      { title: 'Building', text: 'Homes and commercial spaces planned and delivered with care from the ground up.' },
      { title: 'Civil works', text: 'Infrastructure that supports communities and the places people use every day.' },
      { title: 'Renovation', text: 'Thoughtful upgrades that extend the life and usefulness of existing buildings.' },
    ],
  },
  {
    slug: 'education',
    number: '02',
    title: 'Education',
    summary: 'Schools and educational development that unlock lasting potential.',
    headline: 'We create environments where people learn.',
    body: 'We support schools and education partners with thoughtful development, management and programmes that widen access to opportunity. The work is about places to learn, and the people who grow inside them.',
    offerings: [
      { title: 'Schools', text: 'Learning environments designed for students, teachers and the communities around them.' },
      { title: 'Development', text: 'Practical support for education partners who want to grow with care and clarity.' },
      { title: 'Programmes', text: 'Initiatives that widen access to learning and lasting opportunity.' },
    ],
  },
  {
    slug: 'financial-services',
    number: '03',
    title: 'Financial Services',
    summary: 'Accessible and reliable financial solutions for growing communities.',
    headline: 'We make progress more accessible.',
    body: 'Our financial services work is designed around trust, clarity and practical support for individuals and growing businesses. People should be able to understand the path in front of them and take the next step with confidence.',
    offerings: [
      { title: 'Trusted support', text: 'Clear financial guidance for people and businesses building something that lasts.' },
      { title: 'Practical solutions', text: 'Services shaped around real needs, not complexity for its own sake.' },
      { title: 'Growing communities', text: 'Access that helps households and enterprises keep moving forward.' },
    ],
  },
  {
    slug: 'talent-development',
    number: '04',
    title: 'Talent Development',
    summary: 'Identifying, training and equipping people to do their best work.',
    headline: 'We develop the people behind the potential.',
    body: 'Through training, mentorship and talent programmes, we help young people and professionals build confidence and capability. The aim is simple: equip people to do their best work.',
    offerings: [
      { title: 'Training', text: 'Practical programmes that build skill, confidence and readiness for real work.' },
      { title: 'Mentorship', text: 'Guidance from people who have walked the path and can share what they learned.' },
      { title: 'Talent programmes', text: 'A structured way to identify potential and help it grow.' },
    ],
  },
  {
    slug: 'events-management',
    number: '05',
    title: 'Events Management',
    summary: 'Professional planning, management and execution of memorable events.',
    headline: 'We bring people together with purpose.',
    body: 'From corporate gatherings to private celebrations, our events team manages every detail with calm, professional execution. The occasion should feel considered, and the people hosting it should feel supported.',
    offerings: [
      { title: 'Planning', text: 'A clear plan for the purpose, the people and the flow of the day.' },
      { title: 'Management', text: 'Calm coordination so hosts can be present while the details are handled.' },
      { title: 'Execution', text: 'Professional delivery for corporate gatherings and private celebrations.' },
    ],
  },
]

export function getBusiness(slug: string) {
  const business = businesses.find((item) => item.slug === slug)
  if (!business) throw new Error(`Unknown business: ${slug}`)
  return business
}
