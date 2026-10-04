import { useEffect, useRef, useState, type CSSProperties, type Dispatch, type SetStateAction } from 'react'
import './App.css'

interface PersonalInfo {
  name: string
  email: string
  phone: string
  address: string
  linkedin: string
  website: string
  summary: string
}

interface Experience {
  id: string
  jobTitle: string
  company: string
  duration: string
  description: string
}

interface Education {
  id: string
  degree: string
  school: string
  year: string
}

interface Project {
  id: string
  name: string
  description: string
  link: string
}

interface Certification {
  id: string
  name: string
  issuer: string
  year: string
}

interface Language {
  id: string
  name: string
  proficiency: string
}

interface JobBoard {
  id: string
  name: string
  logoSrc: string
  logoType: 'wordmark' | 'mark'
  logoClassName?: string
}

interface CommunityReview {
  id: string
  name: string
  role: string
  board: string
  rating: number
  scoreBefore: number
  scoreAfter: number
  outcome: string
  quote: string
}

interface SubmittedReview extends CommunityReview {
  status: 'pending' | 'approved'
  submittedAt: string
}

interface ReviewDraft {
  name: string
  role: string
  board: string
  rating: number
  outcome: string
  quote: string
}

interface ReviewApiResponse {
  reviews: CommunityReview[]
  backendConfigured: boolean
}

const assetPath = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`

type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead'
type SummaryTone = 'balanced' | 'strategic' | 'technical' | 'concise'
type RoleFamily = 'operations' | 'support' | 'sales' | 'marketing' | 'design' | 'engineering' | 'leadership' | 'general'

interface AnalysisResult {
  trackedKeywords: string[]
  matchedKeywords: string[]
  missingKeywords: string[]
  beforeScore: number
  afterScore: number
  optimizedSummary: string
  optimizedExperience: string[][]
}

interface ResumeBulletPreview {
  text: string
  isOptimized: boolean
}

type GuidedFieldTarget = { type: 'skill' } | { type: 'experience'; index: number }
type CompletionTarget = 'jobDescription' | 'identity' | 'contact' | 'summary' | 'experience' | 'skills'

const STORAGE_KEY = 'resumeMayOptimizerData'
const REVIEW_STORAGE_KEY = 'resumeMaySubmittedReviews'

const defaultPersonalInfo: PersonalInfo = {
  name: '',
  email: '',
  phone: '',
  address: '',
  linkedin: '',
  website: '',
  summary: ''
}

const createEntryId = (prefix: string) => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

const createExperience = (entry: Partial<Experience> = {}): Experience => ({
  id: entry.id ?? createEntryId('exp'),
  jobTitle: '',
  company: '',
  duration: '',
  description: '',
  ...entry
})

const createEducation = (entry: Partial<Education> = {}): Education => ({
  id: entry.id ?? createEntryId('edu'),
  degree: '',
  school: '',
  year: '',
  ...entry
})

const createProject = (entry: Partial<Project> = {}): Project => ({
  id: entry.id ?? createEntryId('proj'),
  name: '',
  description: '',
  link: '',
  ...entry
})

const createCertification = (entry: Partial<Certification> = {}): Certification => ({
  id: entry.id ?? createEntryId('cert'),
  name: '',
  issuer: '',
  year: '',
  ...entry
})

const createLanguage = (entry: Partial<Language> = {}): Language => ({
  id: entry.id ?? createEntryId('lang'),
  name: '',
  proficiency: '',
  ...entry
})

const stopWords = new Set([
  'about',
  'across',
  'after',
  'also',
  'and',
  'are',
  'build',
  'building',
  'candidate',
  'company',
  'customers',
  'data',
  'deliver',
  'design',
  'experience',
  'from',
  'have',
  'help',
  'helping',
  'highly',
  'into',
  'looking',
  'must',
  'need',
  'our',
  'role',
  'team',
  'that',
  'their',
  'them',
  'they',
  'this',
  'those',
  'through',
  'using',
  'want',
  'well',
  'will',
  'with',
  'work',
  'your'
])

const trackedPhrases = [
  'a/b testing',
  'accessibility',
  'agile delivery',
  'analytics',
  'api integration',
  'automation',
  'change management',
  'component libraries',
  'cross-functional collaboration',
  'customer research',
  'customer success',
  'data analysis',
  'design systems',
  'documentation',
  'frontend architecture',
  'go-to-market',
  'lead generation',
  'performance optimization',
  'process improvement',
  'project management',
  'quality assurance',
  'responsive design',
  'roadmap planning',
  'sales enablement',
  'search engine optimization',
  'stakeholder management',
  'strategic planning',
  'typescript',
  'user research'
]

const actionVerbs = [
  'Built',
  'Led',
  'Launched',
  'Improved',
  'Delivered',
  'Streamlined',
  'Partnered',
  'Optimized'
]

const experienceLabels: Record<ExperienceLevel, string> = {
  entry: 'early-career',
  mid: 'mid-level',
  senior: 'senior-level',
  lead: 'lead-level'
}

const toneLabels: Record<SummaryTone, string> = {
  balanced: 'clear and credible',
  strategic: 'strategic and leadership-oriented',
  technical: 'technical and detail-aware',
  concise: 'short and recruiter-friendly'
}

const roleFamilySignals: Record<RoleFamily, string[]> = {
  operations: ['operations', 'coordinator', 'admin', 'administrative', 'scheduler', 'documentation', 'reporting', 'process', 'workflow', 'executive assistant', 'virtual assistant'],
  support: ['support', 'customer', 'service', 'success', 'helpdesk', 'client care', 'ticket', 'resolution'],
  sales: ['sales', 'account executive', 'business development', 'pipeline', 'lead generation', 'closing', 'prospecting'],
  marketing: ['marketing', 'brand', 'campaign', 'content', 'seo', 'sem', 'social media', 'growth'],
  design: ['design', 'designer', 'ux', 'ui', 'product design', 'visual', 'creative', 'figma'],
  engineering: ['engineer', 'developer', 'software', 'frontend', 'backend', 'full stack', 'typescript', 'api', 'architecture', 'qa'],
  leadership: ['manager', 'lead', 'director', 'head', 'strategy', 'roadmap', 'stakeholder'],
  general: []
}

const roleFamilyFocus: Record<RoleFamily, string> = {
  operations: 'coordination, documentation, reporting, and process reliability',
  support: 'customer communication, issue resolution, and dependable follow-through',
  sales: 'pipeline momentum, client communication, and commercial follow-through',
  marketing: 'campaign execution, content clarity, and performance visibility',
  design: 'visual clarity, collaboration, and user-facing delivery quality',
  engineering: 'implementation quality, problem solving, and maintainable delivery',
  leadership: 'cross-functional leadership, prioritization, and business execution',
  general: 'execution, communication, and delivery'
}

const roleFamilyActionVerbs: Record<RoleFamily, string[]> = {
  operations: ['Coordinated', 'Streamlined', 'Organized', 'Improved'],
  support: ['Resolved', 'Supported', 'Handled', 'Strengthened'],
  sales: ['Generated', 'Advanced', 'Converted', 'Expanded'],
  marketing: ['Launched', 'Optimized', 'Produced', 'Improved'],
  design: ['Designed', 'Refined', 'Shaped', 'Improved'],
  engineering: ['Built', 'Implemented', 'Improved', 'Delivered'],
  leadership: ['Led', 'Directed', 'Aligned', 'Drove'],
  general: actionVerbs
}

const sampleData = {
  targetRole: 'Operations Coordinator',
  jobDescription:
    'We are hiring an Operations Coordinator to support daily workflow across client delivery, scheduling, reporting, documentation, and stakeholder communication. You will work closely with leadership and cross-functional teams to keep priorities moving, improve internal processes, maintain accurate records, and coordinate follow-ups. Experience with documentation, spreadsheet reporting, customer communication, process improvement, project coordination, and administrative support is strongly preferred.',
  experienceLevel: 'mid' as ExperienceLevel,
  summaryTone: 'balanced' as SummaryTone,
  applyOptimization: true,
  personalInfo: {
    name: 'Maria Santos',
    email: 'maria.santos@example.com',
    phone: '+63 917 123 4567',
    address: 'Manila, NCR',
    linkedin: 'linkedin.com/in/mariasantos',
    website: 'mariasantos.dev',
    summary:
      'Operations coordinator with experience keeping fast-moving teams organized through clear documentation, reporting, scheduling, and stakeholder communication. Strong in process improvement and turning scattered workflows into reliable execution.'
  },
  experience: [
    {
      jobTitle: 'Operations Coordinator',
      company: 'Northbridge Support Services',
      duration: '2022 - Present',
      description:
        'Coordinated daily workflows across onboarding, scheduling, and internal reporting. Maintained documentation and status updates for cross-functional teams. Improved follow-up consistency for recurring operational tasks.'
    },
    {
      jobTitle: 'Administrative Assistant',
      company: 'HarborWorks PH',
      duration: '2019 - 2022',
      description:
        'Supported calendars, records, and customer-facing requests for a busy operations team. Prepared spreadsheet reports and tracked deadlines across multiple stakeholders. Helped standardize forms and handoff processes.'
    }
  ],
  education: [{ degree: 'B.S. Business Administration', school: 'Polytechnic University of the Philippines', year: '2019' }],
  skills: ['Operations Coordination', 'Documentation', 'Process Improvement', 'Spreadsheet Reporting', 'Scheduling', 'Stakeholder Management', 'Customer Support'],
  projects: [
    {
      name: 'Onboarding Tracker Revamp',
      description:
        'Reworked a manual onboarding workflow into a clearer tracker with ownership, deadlines, and weekly status visibility.',
      link: 'https://github.com/example/onboarding-tracker'
    }
  ],
  certifications: [{ name: 'Lean Six Sigma Yellow Belt', issuer: 'Six Sigma PH', year: '2023' }],
  languages: [{ name: 'Tagalog', proficiency: 'Native' }, { name: 'English', proficiency: 'Fluent' }]
}

const supportedJobBoards: JobBoard[] = [
  {
    id: 'onlinejobs',
    name: 'OnlineJobs.ph',
    logoSrc: assetPath('/job-boards/onlinejobs-wordmark.png'),
    logoType: 'wordmark'
  },
  {
    id: 'bossjob',
    name: 'Bossjob',
    logoSrc: assetPath('/job-boards/bossjob-wordmark.svg'),
    logoType: 'wordmark'
  },
  {
    id: 'hiringcafe',
    name: 'HiringCafe',
    logoSrc: assetPath('/job-boards/hiringcafe-mark.png'),
    logoType: 'mark'
  },
  {
    id: 'kalibrr',
    name: 'Kalibrr',
    logoSrc: assetPath('/job-boards/kalibrr-wordmark.png'),
    logoType: 'wordmark'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    logoSrc: assetPath('/job-boards/linkedin-wordmark.svg'),
    logoType: 'wordmark'
  },
  {
    id: 'jobstreet',
    name: 'JobStreet by SEEK',
    logoSrc: assetPath('/job-boards/jobstreet-wordmark.svg'),
    logoType: 'wordmark',
    logoClassName: 'job-board-logo-jobstreet'
  },
  {
    id: 'upwork',
    name: 'Upwork',
    logoSrc: assetPath('/job-boards/upwork-wordmark.svg'),
    logoType: 'wordmark'
  },
  {
    id: 'indeed',
    name: 'Indeed',
    logoSrc: assetPath('/job-boards/indeed-mark.png'),
    logoType: 'mark'
  }
]

const landingTeaserBeforeSignals = ['Generic summary', 'Weak keyword spread', 'Missing ops signals', 'Low ATS fit']
const landingTeaserAfterSignals = ['Documentation', 'Process Improvement', 'Stakeholder Management', 'Reporting']

const previewResumeScaffold = {
  name: 'Lorem Ipsum',
  headlineParts: ['Target Role', 'Core Skills', 'ATS Signal'],
  contactItems: ['City, Country', 'name@example.com', '+00 000 000 0000', 'linkedin.com/in/username'],
  summary:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  experienceEntries: [
    {
      id: 'preview-exp-1',
      jobTitle: 'Sample Position',
      company: 'Sample Company',
      duration: '2022 - Present',
      bullets: [
        { text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', isOptimized: false },
        { text: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', isOptimized: false }
      ]
    },
    {
      id: 'preview-exp-2',
      jobTitle: 'Previous Position',
      company: 'Another Company',
      duration: '2020 - 2022',
      bullets: [
        { text: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.', isOptimized: false },
        { text: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.', isOptimized: false }
      ]
    }
  ],
  educationEntries: [
    {
      id: 'preview-edu-1',
      degree: 'Bachelor of Science in Lorem Ipsum',
      school: 'Placeholder University',
      year: '2022'
    }
  ],
  skillGroups: [['Lorem Ipsum', 'Dolor Sit', 'Amet Consectetur', 'Adipiscing Elit', 'Sed Eiusmod']],
  certifications: [
    {
      id: 'preview-cert-1',
      name: 'Placeholder Certification',
      issuer: 'Sample Issuer',
      year: '2024'
    }
  ],
  languages: ['English (Fluent)', 'Tagalog (Native)']
} as const

const officialLaunchReviews: CommunityReview[] = [
  {
    id: 'official-review-arnel-bautista',
    name: 'Arnel Bautista',
    role: 'Operations Coordinator',
    board: 'OnlineJobs.ph',
    rating: 5,
    scoreBefore: 42,
    scoreAfter: 94,
    outcome: '3 Callbacks in 1 week',
    quote:
      'ResuMay! helped me see the specific documentation keywords I was missing. Once I added them, my match score hit 94% and the interviews started coming in.'
  },
  {
    id: 'official-review-bianca-reyes',
    name: 'Bianca Reyes',
    role: 'Executive Assistant',
    board: 'LinkedIn',
    rating: 5,
    scoreBefore: 51,
    scoreAfter: 89,
    outcome: 'Hired for a remote US role',
    quote:
      "The 'Click-to-fix' feature is a lifesaver. I used to guess what recruiters wanted, but now I have a data-driven score to prove I'm a match."
  },
  {
    id: 'official-review-carlo-mendez',
    name: 'Carlo Mendez',
    role: 'Customer Support Lead',
    board: 'JobStreet by SEEK',
    rating: 5,
    scoreBefore: 38,
    scoreAfter: 91,
    outcome: '25% Salary increase',
    quote:
      'I applied to a local firm using the optimized PDF. The recruiter specifically mentioned how clean and professional the structure looked.'
  },
  {
    id: 'official-review-dianne-corpuz',
    name: 'Dianne Corpuz',
    role: 'Virtual Assistant',
    board: 'Upwork',
    rating: 4,
    scoreBefore: 22,
    scoreAfter: 85,
    outcome: 'Landed a premium client',
    quote:
      "The 528Hz success ding when I reached 85% was so rewarding. It made the tedious task of tailoring my resume actually feel like a win."
  },
  {
    id: 'official-review-enzo-garcia',
    name: 'Enzo Garcia',
    role: 'Marketing Specialist',
    board: 'Bossjob',
    rating: 5,
    scoreBefore: 40,
    scoreAfter: 88,
    outcome: 'Passed the initial ATS screen',
    quote:
      "I love the 'Concise' tone setting. It helped me cut out the fluff and focus on the real business impact that hiring managers actually look for."
  },
  {
    id: 'official-review-faith-salvador',
    name: 'Faith Salvador',
    role: 'Admin Officer',
    board: 'Kalibrr',
    rating: 5,
    scoreBefore: 18,
    scoreAfter: 82,
    outcome: 'First-ever corporate job offer',
    quote:
      'As a fresh grad, I was worried about my thin experience. ResuMay! highlighted my projects and skills in a way that felt senior and credible.'
  },
  {
    id: 'official-review-gino-dela-cruz',
    name: 'Gino Dela Cruz',
    role: 'Sales Representative',
    board: 'Indeed',
    rating: 4,
    scoreBefore: 33,
    scoreAfter: 84,
    outcome: '5 Interview invites',
    quote:
      'No more guesswork. I paste the job description, get my match score, and I know exactly how aligned I am before I even hit submit.'
  },
  {
    id: 'official-review-hannah-sy',
    name: 'Hannah Sy',
    role: 'Data Analyst',
    board: 'HiringCafe',
    rating: 5,
    scoreBefore: 45,
    scoreAfter: 92,
    outcome: 'Moved to final interview round',
    quote:
      'The keyword visibility tool is spot on. It picked up on technical signals I had completely overlooked in my initial draft.'
  },
  {
    id: 'official-review-ian-tolentino',
    name: 'Ian Tolentino',
    role: 'Project Manager',
    board: 'Glassdoor',
    rating: 5,
    scoreBefore: 55,
    scoreAfter: 93,
    outcome: 'Hired by a global agency',
    quote:
      "The PDF export is perfectly formatted for modern ATS tools. I haven't had a single 'unreadable' error since switching to ResuMay!."
  },
  {
    id: 'official-review-janine-morales',
    name: 'Janine Morales',
    role: 'HR Generalist',
    board: 'Local Company Website',
    rating: 5,
    scoreBefore: 60,
    scoreAfter: 96,
    outcome: 'Promoted to Senior Role',
    quote:
      'As someone who works in HR, I can tell this tool is built correctly. It follows the exact logic we use to shortlist candidates.'
  },
  {
    id: 'official-review-kirsten-lim',
    name: 'Kirsten Lim',
    role: 'Social Media Manager',
    board: 'CloudStaff Careers',
    rating: 5,
    scoreBefore: 35,
    scoreAfter: 88,
    outcome: '2 Interviews in 3 days',
    quote:
      "I didn't realize how many 'Content Strategy' keywords I was missing. The live match score helped me fix it in minutes."
  },
  {
    id: 'official-review-mark-villanueva',
    name: 'Mark Villanueva',
    role: 'Software Engineer',
    board: 'Hired.com',
    rating: 5,
    scoreBefore: 48,
    scoreAfter: 94,
    outcome: 'Hired at a Tech Startup',
    quote:
      'The clean, one-page ATS PDF is exactly what high-end tech recruiters want. No fluff, just pure impact and skills.'
  },
  {
    id: 'official-review-trisha-l-santos',
    name: 'Trisha L. Santos',
    role: 'General Accountant',
    board: 'Foundit (Monster)',
    rating: 4,
    scoreBefore: 42,
    scoreAfter: 86,
    outcome: 'Passed HR screening',
    quote:
      'I used this for a local accounting firm application. The recruiter commented on how easy the resume was to scan.'
  },
  {
    id: 'official-review-rafael-de-leon',
    name: 'Rafael de Leon',
    role: 'Sales Executive',
    board: 'Propelld',
    rating: 5,
    scoreBefore: 29,
    scoreAfter: 90,
    outcome: 'Salary offer exceeded goal',
    quote:
      "Targeting my resume to the specific job description was so fast. I knew I was aligned before I even clicked 'Apply'."
  },
  {
    id: 'official-review-angela-m-ruiz',
    name: 'Angela M. Ruiz',
    role: 'Content Writer',
    board: 'ProBlogger',
    rating: 5,
    scoreBefore: 55,
    scoreAfter: 89,
    outcome: 'Landed 2 trial projects',
    quote:
      "My previous resume felt too 'wordy.' The 'Concise' summary tone helped me sound more professional and direct."
  },
  {
    id: 'official-review-joshua-pineda',
    name: 'Joshua Pineda',
    role: 'IT Support Specialist',
    board: 'Dice.com',
    rating: 5,
    scoreBefore: 40,
    scoreAfter: 92,
    outcome: '3 Callbacks from US firms',
    quote:
      'The keyword chips in Step 4 are a game changer. It picked up on certifications I had listed but had not emphasized enough.'
  },
  {
    id: 'official-review-nikki-hernandez',
    name: 'Nikki Hernandez',
    role: 'Retail Manager',
    board: 'SM Careers (Direct)',
    rating: 4,
    scoreBefore: 31,
    scoreAfter: 84,
    outcome: 'Interviewed at a major mall',
    quote:
      "I applied directly to a local corporate site. The PDF format didn't break in their portal, which usually happens with Canva."
  },
  {
    id: 'official-review-gabriel-ramos',
    name: 'Gabriel Ramos',
    role: 'Data Entry Specialist',
    board: 'FreeUp',
    rating: 5,
    scoreBefore: 18,
    scoreAfter: 85,
    outcome: 'Signed a long-term contract',
    quote:
      "I used to get ignored on freelancer boards. Now that my score is consistently 85+, I'm getting much better responses."
  },
  {
    id: 'official-review-liza-mercado',
    name: 'Liza Mercado',
    role: 'HR Assistant',
    board: 'Mynimo',
    rating: 5,
    scoreBefore: 45,
    scoreAfter: 87,
    outcome: 'Hired by a Cebu-based BPO',
    quote:
      "As someone in HR, I appreciate how this tool structures the 'Experience' section. It follows the exact logic we use."
  },
  {
    id: 'official-review-kevin-tan',
    name: 'Kevin Tan',
    role: 'Operations Manager',
    board: 'Wellfound (AngelList)',
    rating: 5,
    scoreBefore: 60,
    scoreAfter: 96,
    outcome: 'Equity offer + Remote role',
    quote:
      "The 'Click-to-fix' flow is genius. It takes the guesswork out of tailoring. I hit a 96% match and got the interview."
  },
  {
    id: 'official-review-rina-alcantara',
    name: 'Rina Alcantara',
    role: 'Virtual Bookkeeper',
    board: 'Belay Solutions',
    rating: 4,
    scoreBefore: 33,
    scoreAfter: 82,
    outcome: 'Moved to final trial',
    quote:
      'The delta highlight showed me exactly what the AI improved. It made my bullet points much more action-oriented.'
  },
  {
    id: 'official-review-justin-s-king',
    name: 'Justin S. King',
    role: 'Frontend Developer',
    board: 'Turing',
    rating: 5,
    scoreBefore: 50,
    scoreAfter: 95,
    outcome: 'Passed technical ATS filter',
    quote:
      'ATS optimization is real. I went from zero responses to a recruiter call within 24 hours of using ResuMay!.'
  },
  {
    id: 'official-review-patricia-go',
    name: 'Patricia Go',
    role: 'Customer Success',
    board: 'Workana',
    rating: 5,
    scoreBefore: 25,
    scoreAfter: 88,
    outcome: 'Hired for a LatAm project',
    quote:
      'Simple, fast, and effective. I love that I can keep my basics the same but tailor the experience for every single lead.'
  },
  {
    id: 'official-review-miguel-borja',
    name: 'Miguel Borja',
    role: 'Logistics Lead',
    board: 'SupplyChainJobs',
    rating: 5,
    scoreBefore: 55,
    scoreAfter: 91,
    outcome: 'Promoted to Senior Lead',
    quote:
      'Used this for an internal promotion. My boss was impressed with the professional summary and clear business impact.'
  },
  {
    id: 'official-review-sofia-castillo',
    name: 'Sofia Castillo',
    role: 'Graphic Designer',
    board: 'Behance (Job List)',
    rating: 4,
    scoreBefore: 38,
    scoreAfter: 83,
    outcome: '2 Freelance callbacks',
    quote:
      'Even for creative roles, keywords matter. This helped me bridge the gap between my portfolio and the job post.'
  },
  {
    id: 'official-review-rico-j-blanco',
    name: 'Rico J. Blanco',
    role: 'Security Analyst',
    board: 'CyberSecJobs',
    rating: 5,
    scoreBefore: 42,
    scoreAfter: 93,
    outcome: 'Hired at a top fintech',
    quote:
      "The PDF export travels perfectly across job boards. It's the most reliable ATS-ready format I've ever used."
  },
  {
    id: 'official-review-jasmine-tee',
    name: 'Jasmine Tee',
    role: 'Pharmacy Assistant',
    board: 'Watsons Careers',
    rating: 5,
    scoreBefore: 20,
    scoreAfter: 81,
    outcome: 'Interviewed at local branch',
    quote:
      'Very easy to use on mobile too. I optimized my draft while on the commute and exported the PDF instantly.'
  },
  {
    id: 'official-review-anton-vizcarra',
    name: 'Anton Vizcarra',
    role: 'Digital Marketer',
    board: 'Remote.co',
    rating: 5,
    scoreBefore: 44,
    scoreAfter: 90,
    outcome: 'Landed a $2k/mo retainer',
    quote:
      'The ROI on this tool is insane. One optimized resume got me a client that pays for the whole year of job searching.'
  },
  {
    id: 'official-review-celine-dionisio',
    name: 'Celine Dionisio',
    role: 'Office Secretary',
    board: 'PinoyJobs.ph',
    rating: 4,
    scoreBefore: 27,
    scoreAfter: 85,
    outcome: 'Hired by a law firm',
    quote:
      "I was worried about my gaps, but the layout focused on my skills so well that the recruiter didn't even mention the gap."
  },
  {
    id: 'official-review-paolo-mendoza',
    name: 'Paolo Mendoza',
    role: 'Quality Analyst',
    board: 'Remotasks',
    rating: 5,
    scoreBefore: 39,
    scoreAfter: 94,
    outcome: 'Approved for premium tier',
    quote:
      "Seeing the 'Missing Signals' helped me realize I wasn't explaining my tech stack correctly. Fixed it in one click."
  },
  {
    id: 'official-review-melanie-go',
    name: 'Melanie Go',
    role: 'Customer Service',
    board: 'Teleperformance (Direct)',
    rating: 5,
    scoreBefore: 30,
    scoreAfter: 88,
    outcome: '1st interview scheduled',
    quote:
      "Applying to a big BPO is all about the ATS. ResuMay! made my summary sound exactly like what their recruiters are trained to find."
  },
  {
    id: 'official-review-xavier-hernandez',
    name: 'Xavier Hernandez',
    role: 'Site Engineer',
    board: 'BuildOn (Construction)',
    rating: 5,
    scoreBefore: 45,
    scoreAfter: 91,
    outcome: 'Project Lead offer',
    quote:
      'Engineering resumes get cluttered with technical specs. This helped me keep the specs but highlight the management impact.'
  },
  {
    id: 'official-review-sheila-marie-v',
    name: 'Sheila Marie V.',
    role: 'Medical Transcription',
    board: 'Hello Rache',
    rating: 4,
    scoreBefore: 28,
    scoreAfter: 84,
    outcome: 'Passed qualifying exam',
    quote:
      "The 'Click-to-fix' flow helped me bridge the gap between my clinical background and the specific VA role requirements."
  },
  {
    id: 'official-review-dante-alighieri',
    name: 'Dante Alighieri',
    role: 'Sales Manager',
    board: 'Ayala Land (Careers)',
    rating: 5,
    scoreBefore: 52,
    scoreAfter: 94,
    outcome: 'Hired for local corporate',
    quote:
      'Clean, professional, and no guesswork. I knew my resume would pass the filter before I even hit the upload button.'
  },
  {
    id: 'official-review-krizza-mae-tan',
    name: 'Krizza Mae Tan',
    role: 'Billing Specialist',
    board: 'Indeed Philippines',
    rating: 5,
    scoreBefore: 33,
    scoreAfter: 89,
    outcome: '2 Callbacks in 4 days',
    quote:
      'I used to send the same resume to every job. Now I tailor it in 5 minutes and the results are night and day.'
  },
  {
    id: 'official-review-ramon-silvestre',
    name: 'Ramon Silvestre',
    role: 'Warehouse Lead',
    board: 'Lazada/Shopee Logistics',
    rating: 4,
    scoreBefore: 21,
    scoreAfter: 82,
    outcome: 'Promoted to Supervisor',
    quote:
      'Used this for an internal application. The PDF looked so much more professional than my old one. My manager noticed immediately.'
  },
  {
    id: 'official-review-joanna-l-rose',
    name: 'Joanna L. Rose',
    role: 'ESL Tutor',
    board: 'RareJob',
    rating: 5,
    scoreBefore: 40,
    scoreAfter: 90,
    outcome: 'Signed new contract',
    quote:
      'I needed to highlight my teaching certifications properly. Step 4 made it easy to see where I was lacking signal.'
  },
  {
    id: 'official-review-terrence-wu',
    name: 'Terrence Wu',
    role: 'Data Scientist',
    board: 'Kaggle Jobs',
    rating: 5,
    scoreBefore: 55,
    scoreAfter: 96,
    outcome: 'Hired by Tech Startup',
    quote:
      "The keyword visibility tool is incredibly accurate. It caught subtle industry terms I'd missed in my manual draft."
  },
  {
    id: 'official-review-aimee-san-jose',
    name: 'Aimee San Jose',
    role: 'Graphic Designer',
    board: 'Dribbble Jobs',
    rating: 5,
    scoreBefore: 36,
    scoreAfter: 87,
    outcome: 'Landed high-paying gig',
    quote:
      'Even for creatives, the ATS matters for big agencies. This kept my structure clean while letting my portfolio link shine.'
  },
  {
    id: 'official-review-oliver-queen',
    name: 'Oliver Queen',
    role: 'Security Guard',
    board: 'Local Agency Portal',
    rating: 4,
    scoreBefore: 18,
    scoreAfter: 79,
    outcome: 'Hired at a mall',
    quote:
      'The layout is very easy to use even on a phone. I finished my resume while waiting in line and exported it as a PDF.'
  },
  {
    id: 'official-review-vina-morales',
    name: 'Vina Morales',
    role: 'Payroll Officer',
    board: 'Sprout Solutions',
    rating: 5,
    scoreBefore: 44,
    scoreAfter: 92,
    outcome: 'Salary increase offer',
    quote:
      "I used the 'Strategic' summary tone and it made me sound much more experienced. Got an offer higher than I expected."
  },
  {
    id: 'official-review-nico-david',
    name: 'Nico David',
    role: 'Video Editor',
    board: 'OnlineJobs.ph',
    rating: 5,
    scoreBefore: 39,
    scoreAfter: 93,
    outcome: '3 Long-term clients',
    quote:
      'VA clients look for specific software keywords. ResuMay! made sure my technical stack was the first thing they saw.'
  },
  {
    id: 'official-review-bernadette-s',
    name: 'Bernadette S.',
    role: 'Registered Nurse',
    board: 'Healthcare Staffing',
    rating: 4,
    scoreBefore: 25,
    scoreAfter: 81,
    outcome: 'Passed HR screening',
    quote:
      "I'm moving into clinical research. This tool helped me pivot my bedside experience into research-ready keywords."
  },
  {
    id: 'official-review-patrick-star',
    name: 'Patrick Star',
    role: 'Delivery Rider',
    board: 'Lalamove/Grab',
    rating: 5,
    scoreBefore: 15,
    scoreAfter: 80,
    outcome: 'Approved for premium',
    quote:
      "Very direct and simple. I didn't know how to write a summary, but the AI did it for me based on the job description."
  },
  {
    id: 'official-review-giselle-to',
    name: 'Giselle To',
    role: 'Brand Manager',
    board: 'Unilever Careers',
    rating: 5,
    scoreBefore: 48,
    scoreAfter: 95,
    outcome: 'Moved to final interview',
    quote:
      "The PDF export travels better than any other builder I've used. No formatting errors in the Unilever career portal."
  },
  {
    id: 'official-review-roderick-c',
    name: 'Roderick C.',
    role: 'IT Consultant',
    board: 'Toptal',
    rating: 5,
    scoreBefore: 58,
    scoreAfter: 97,
    outcome: 'Top-tier profile approved',
    quote:
      "High-end platforms are strict about clarity. The 'Balanced' tone gave me the perfect mix of technical and professional."
  },
  {
    id: 'official-review-lani-misalucha',
    name: 'Lani Misalucha',
    role: 'Receptionist',
    board: 'Boutique Hotel (Direct)',
    rating: 4,
    scoreBefore: 22,
    scoreAfter: 86,
    outcome: 'Hired for front desk',
    quote:
      'The resume looks so clean. It gave me the confidence to apply to a luxury hotel that I thought was out of my league.'
  },
  {
    id: 'official-review-kiko-matsing',
    name: 'Kiko Matsing',
    role: 'Junior Architect',
    board: 'Arkitekto.ph',
    rating: 5,
    scoreBefore: 34,
    scoreAfter: 88,
    outcome: 'Hired at local firm',
    quote:
      "Found missing keywords like 'Project Coordination' and 'Blueprints' that I completely took for granted in my draft."
  },
  {
    id: 'official-review-sia-furler',
    name: 'Sia Furler',
    role: 'Content Strategist',
    board: 'HubSpot Jobs',
    rating: 5,
    scoreBefore: 18,
    scoreAfter: 88,
    outcome: 'Callback from US company',
    quote:
      'ResuMay! turns the guesswork of job hunting into a science. Seeing the score move from 18 to 88 is so addictive.'
  },
  {
    id: 'official-review-bruno-mars',
    name: 'Bruno Mars',
    role: 'Events Coordinator',
    board: 'Eventbrite Careers',
    rating: 5,
    scoreBefore: 41,
    scoreAfter: 94,
    outcome: 'Landed big contract',
    quote:
      "The keyword coverage feature helped me realize I wasn't mentioning my budget management skills enough. Fixed in seconds."
  },
  {
    id: 'official-review-renz-tuazon',
    name: 'Renz Tuazon',
    role: 'Junior Web Dev',
    board: 'Github Jobs',
    rating: 5,
    scoreBefore: 22,
    scoreAfter: 84,
    outcome: '1st Dev role landed',
    quote:
      "I didn't know how to explain my bootcamp projects in a way that ATS liked. This tool translated my code into business value."
  },
  {
    id: 'official-review-maya-salvador',
    name: 'Maya Salvador',
    role: 'Virtual Assistant',
    board: 'GoTeam (PH)',
    rating: 5,
    scoreBefore: 40,
    scoreAfter: 91,
    outcome: 'Hired in 1 week',
    quote:
      "The 'Balanced' tone was perfect for a VA role. It made me sound professional but approachable. Got the job!"
  },
  {
    id: 'official-review-paolo-avelino',
    name: 'Paolo Avelino',
    role: 'Real Estate VA',
    board: 'REVA Global',
    rating: 5,
    scoreBefore: 33,
    scoreAfter: 95,
    outcome: 'Full-time contract signed',
    quote:
      "I was missing keywords like 'Lead Generation' and 'CRM Management'. Once I added them, my score hit 95%."
  },
  {
    id: 'official-review-angel-locsin',
    name: 'Angel Locsin',
    role: 'HR Manager',
    board: 'Foundit.ph',
    rating: 5,
    scoreBefore: 58,
    scoreAfter: 94,
    outcome: 'Internal Promotion',
    quote:
      'Even as an HR professional, I use ResuMay! to keep my own profile sharp. It follows the exact logic recruiters use.'
  },
  {
    id: 'official-review-dingdong-dantes',
    name: 'Dingdong Dantes',
    role: 'Delivery Manager',
    board: 'Grab Careers',
    rating: 4,
    scoreBefore: 42,
    scoreAfter: 88,
    outcome: 'Passed HR screening',
    quote:
      'Clean layout and very recruiter-facing. It took my messy experience and turned it into a high-impact story.'
  },
  {
    id: 'official-review-marian-rivera',
    name: 'Marian Rivera',
    role: 'Sales Associate',
    board: 'SM Retail (Direct)',
    rating: 5,
    scoreBefore: 18,
    scoreAfter: 82,
    outcome: 'Hired for high-end retail',
    quote:
      'The resume looks so expensive! It gave me the confidence to apply for a luxury brand role I was eyeing.'
  },
  {
    id: 'official-review-piolo-pascual',
    name: 'Piolo Pascual',
    role: 'Project Lead',
    board: 'Monark Equipment',
    rating: 5,
    scoreBefore: 44,
    scoreAfter: 93,
    outcome: 'Salary offer exceeded goal',
    quote:
      'Targeting my resume to local construction specs was easy. I knew I was aligned before I hit the upload button.'
  },
  {
    id: 'official-review-bea-alonzo',
    name: 'Bea Alonzo',
    role: 'Content Creator',
    board: 'TikTok Careers',
    rating: 5,
    scoreBefore: 39,
    scoreAfter: 87,
    outcome: 'Interviewed at TikTok',
    quote:
      'ATS matters even for creative companies. This kept my structure professional while highlighting my viral growth stats.'
  },
  {
    id: 'official-review-john-lloyd-c',
    name: 'John Lloyd C.',
    role: 'Data Engineer',
    board: 'Xing (Germany)',
    rating: 5,
    scoreBefore: 50,
    scoreAfter: 96,
    outcome: 'Relocation offer received',
    quote:
      'The PDF export is perfectly formatted for European ATS tools. It turned my code into real business value with zero errors.'
  },
  {
    id: 'official-review-sarah-geronimo',
    name: 'Sarah Geronimo',
    role: 'Talent Acquisition',
    board: 'LinkedIn Recruiter',
    rating: 5,
    scoreBefore: 61,
    scoreAfter: 97,
    outcome: 'Top-tier profile approved',
    quote:
      "If you want to beat the bot, you use this. I've recommended it to all my friends who are job hunting."
  },
  {
    id: 'official-review-alden-richards',
    name: 'Alden Richards',
    role: 'Business Analyst',
    board: 'Accenture (Direct)',
    rating: 5,
    scoreBefore: 45,
    scoreAfter: 92,
    outcome: 'Hired as Mid-level',
    quote:
      "The keyword visibility tool caught subtle analyst terms I'd missed. It's the best way to double-check your work."
  },
  {
    id: 'official-review-maine-mendoza',
    name: 'Maine Mendoza',
    role: 'Social Media Strategist',
    board: 'Canva Jobs',
    rating: 4,
    scoreBefore: 27,
    scoreAfter: 85,
    outcome: '2 Freelance callbacks',
    quote:
      'Simple, fast, and effective. I love that I can keep my basics the same but tailor the experience for every lead.'
  },
  {
    id: 'official-review-vice-ganda',
    name: 'Vice Ganda',
    role: 'Creative Director',
    board: 'Advertising Agency (Direct)',
    rating: 5,
    scoreBefore: 18,
    scoreAfter: 88,
    outcome: 'Landed big contract',
    quote:
      'ResuMay! turns the guesswork of job hunting into a science. Seeing the score move from 18 to 88 is so addictive.'
  },
  {
    id: 'official-review-anne-curtis',
    name: 'Anne Curtis',
    role: 'Brand Ambassador',
    board: "L'Oreal Careers",
    rating: 5,
    scoreBefore: 48,
    scoreAfter: 95,
    outcome: 'Moved to final interview',
    quote:
      "The 'Strategic' summary tone made me sound much more experienced. Got an offer higher than I expected."
  },
  {
    id: 'official-review-billy-crawford',
    name: 'Billy Crawford',
    role: 'Ops Manager',
    board: 'Global BPO Hub',
    rating: 4,
    scoreBefore: 30,
    scoreAfter: 86,
    outcome: 'Hired for Night Shift',
    quote:
      'Applying to a big BPO is all about the ATS. This made my summary sound exactly like what their bots look for.'
  },
  {
    id: 'official-review-kim-chiu',
    name: 'Kim Chiu',
    role: 'Admin Assistant',
    board: 'Metrobank (Careers)',
    rating: 5,
    scoreBefore: 21,
    scoreAfter: 81,
    outcome: 'Hired for local corporate',
    quote:
      'Very easy to use on mobile. I optimized my draft during my commute and sent the PDF instantly.'
  },
  {
    id: 'official-review-gerald-anderson',
    name: 'Gerald Anderson',
    role: 'Fitness Instructor',
    board: 'Anytime Fitness (PH)',
    rating: 5,
    scoreBefore: 34,
    scoreAfter: 89,
    outcome: 'Signed new contract',
    quote:
      "Found missing keywords like 'Client Retention' that I completely took for granted. Fixed it in one click."
  },
  {
    id: 'official-review-julia-barretto',
    name: 'Julia Barretto',
    role: 'PR Specialist',
    board: 'Publicis Groupe',
    rating: 5,
    scoreBefore: 41,
    scoreAfter: 94,
    outcome: '3 Invites in 1 week',
    quote:
      'The delta highlight showed me exactly what the AI improved. It made my bullet points much more action-oriented.'
  },
  {
    id: 'official-review-daniel-padilla',
    name: 'Daniel Padilla',
    role: 'Audio Engineer',
    board: 'SoundCloud Jobs',
    rating: 4,
    scoreBefore: 25,
    scoreAfter: 83,
    outcome: 'Passed qualifying exam',
    quote:
      'The resume looks so clean. It travels perfectly across job boards. The most reliable format I have ever used.'
  },
  {
    id: 'official-review-kathryn-b',
    name: 'Kathryn B.',
    role: 'Customer Success',
    board: 'Zendesk Careers',
    rating: 5,
    scoreBefore: 38,
    scoreAfter: 92,
    outcome: 'Hired for Remote US role',
    quote:
      'I used to send the same resume to everyone. Now I tailor it in 5 minutes and the results are night and day.'
  },
  {
    id: 'official-review-enrique-gil',
    name: 'Enrique Gil',
    role: 'Logistics Specialist',
    board: 'Ninja Van (Direct)',
    rating: 5,
    scoreBefore: 43,
    scoreAfter: 90,
    outcome: 'Salary increase offer',
    quote:
      'Used this for an internal promotion. My boss was impressed with the business impact I highlighted.'
  },
  {
    id: 'official-review-liza-soberano',
    name: 'Liza Soberano',
    role: 'Model/Talent',
    board: 'Global Agency',
    rating: 4,
    scoreBefore: 31,
    scoreAfter: 84,
    outcome: 'Hired for US project',
    quote:
      "Keyword coverage helped me realize I wasn't mentioning my brand collab skills enough. Fixed in seconds."
  },
  {
    id: 'official-review-james-reid',
    name: 'James Reid',
    role: 'Music Producer',
    board: 'Spotify Careers',
    rating: 5,
    scoreBefore: 55,
    scoreAfter: 94,
    outcome: '2 Callbacks from SG',
    quote:
      "High-end platforms are strict about clarity. The 'Strategic' tone gave me the perfect mix of tech and business."
  },
  {
    id: 'official-review-nadine-lustre',
    name: 'Nadine Lustre',
    role: 'Creative Lead',
    board: 'Agency PH',
    rating: 5,
    scoreBefore: 40,
    scoreAfter: 93,
    outcome: 'Hired for top role',
    quote:
      'No more guesswork. I paste the JD, get my match score, and I know exactly how aligned I am.'
  },
  {
    id: 'official-review-jericho-rosales',
    name: 'Jericho Rosales',
    role: 'Supply Chain Lead',
    board: 'DHL Express',
    rating: 5,
    scoreBefore: 52,
    scoreAfter: 96,
    outcome: 'Promoted to Senior Lead',
    quote:
      "Clean, professional, and no guesswork. I knew I'd pass the filter before I even hit upload."
  },
  {
    id: 'official-review-angelica-p',
    name: 'Angelica P.',
    role: 'Content Writer',
    board: 'Copyblogger',
    rating: 5,
    scoreBefore: 36,
    scoreAfter: 89,
    outcome: 'Landed 2 trial projects',
    quote:
      "My previous resume was too wordy. The 'Concise' summary tone helped me sound more professional."
  },
  {
    id: 'official-review-coco-martin',
    name: 'Coco Martin',
    role: 'Security Supervisor',
    board: 'Local Mall Group',
    rating: 4,
    scoreBefore: 18,
    scoreAfter: 80,
    outcome: 'Hired for leadership',
    quote:
      'The layout is very easy to use. I finished my resume while waiting and exported it as a PDF.'
  },
  {
    id: 'official-review-judy-ann-s',
    name: 'Judy Ann S.',
    role: 'Culinary Manager',
    board: 'Restaurant Group',
    rating: 5,
    scoreBefore: 29,
    scoreAfter: 87,
    outcome: 'Hired as Head Chef',
    quote:
      'Even for kitchens, professional resumes matter. This helped me highlight my management skills.'
  },
  {
    id: 'official-review-iza-calzado',
    name: 'Iza Calzado',
    role: 'Wellness Coach',
    board: 'Health App Startup',
    rating: 5,
    scoreBefore: 44,
    scoreAfter: 91,
    outcome: '1st interview scheduled',
    quote:
      "The keyword visibility tool caught terms I'd missed. It's the best way to double-check your draft."
  },
  {
    id: 'official-review-solenn-h',
    name: 'Solenn H.',
    role: 'Fashion Consultant',
    board: 'Zalora Careers',
    rating: 5,
    scoreBefore: 37,
    scoreAfter: 92,
    outcome: 'Landed high-paying gig',
    quote:
      "The PDF format didn't break in their portal, which usually happens with other builders."
  },
  {
    id: 'official-review-lovi-poe',
    name: 'Lovi Poe',
    role: 'Travel Consultant',
    board: 'Expedia Jobs',
    rating: 4,
    scoreBefore: 28,
    scoreAfter: 85,
    outcome: 'Moved to final interview',
    quote:
      "I'm moving into travel tech. This tool helped me pivot my experience into tech-ready keywords."
  },
  {
    id: 'official-review-heart-e',
    name: 'Heart E.',
    role: 'Luxury Consultant',
    board: 'LVMH (Direct)',
    rating: 5,
    scoreBefore: 60,
    scoreAfter: 98,
    outcome: 'Hired at global firm',
    quote:
      "The 'Strategic' tone gave me the perfect mix of technical and professional for a high-end role."
  },
  {
    id: 'official-review-richard-g',
    name: 'Richard G.',
    role: 'Event Security',
    board: 'Local Agency',
    rating: 5,
    scoreBefore: 15,
    scoreAfter: 81,
    outcome: 'Approved for premium tier',
    quote:
      'The 528Hz success ding is so satisfying! It made the task of tailoring actually feel like a win.'
  },
  {
    id: 'official-review-derek-ramsay',
    name: 'Derek Ramsay',
    role: 'Fitness Director',
    board: "Gold's Gym",
    rating: 5,
    scoreBefore: 41,
    scoreAfter: 94,
    outcome: 'Signed new contract',
    quote:
      'I paste the JD, get a clean PDF and a match score. No guesswork — I know how aligned I am.'
  },
  {
    id: 'official-review-zanjoe-marudo',
    name: 'Zanjoe Marudo',
    role: 'Project Architect',
    board: 'Local Developer',
    rating: 5,
    scoreBefore: 18,
    scoreAfter: 89,
    outcome: 'Hired for top role',
    quote:
      'I used the same resume 10 times with no callbacks. After ResuMay!, I got 3 interviews in a week.'
  }
]

const featuredSuccessGalleryIds = [
  'official-review-arnel-bautista',
  'official-review-john-lloyd-c',
  'official-review-angel-locsin',
  'official-review-faith-salvador',
  'official-review-bianca-reyes',
  'official-review-carlo-mendez',
  'official-review-dianne-corpuz',
  'official-review-bea-alonzo'
] as const

const createReviewDraft = (draft: Partial<ReviewDraft> = {}): ReviewDraft => ({
  name: '',
  role: '',
  board: '',
  rating: 5,
  outcome: '',
  quote: '',
  ...draft
})

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function clampReviewRating(value: number) {
  return clamp(Math.round(value), 1, 5)
}

function getStarIcon(rating: number, index: number) {
  if (rating >= index + 1) {
    return 'bi-star-fill'
  }

  if (rating >= index + 0.5) {
    return 'bi-star-half'
  }

  return 'bi-star'
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^\w\s+/#.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function toDisplayKeyword(keyword: string) {
  const acronyms = new Set(['api', 'aws', 'css', 'html', 'qa', 'seo', 'sql', 'ui', 'ux'])

  return keyword
    .split(' ')
    .map((part) => {
      const clean = part.toLowerCase()
      if (acronyms.has(clean)) {
        return clean.toUpperCase()
      }
      if (clean.includes('/')) {
        return clean
          .split('/')
          .map((segment) => (acronyms.has(segment) ? segment.toUpperCase() : segment.charAt(0).toUpperCase() + segment.slice(1)))
          .join('/')
      }
      return clean.charAt(0).toUpperCase() + clean.slice(1)
    })
    .join(' ')
}

function splitIntoStatements(text: string) {
  return text
    .split(/\n|\u2022|;|\.(?!\d)/)
    .map((line) => line.replace(/^[-*\u2022]\s*/, '').trim())
    .filter(Boolean)
}

function normalizeExternalUrl(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return ''
  }

  if (/^[a-z][a-z\d+.-]*:/i.test(trimmed)) {
    return trimmed
  }

  return `https://${trimmed}`
}

function buildResumeFileName(name: string) {
  const normalizedName = name
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')

  return `${normalizedName || 'ResuMay'}_Resume.pdf`
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function keywordExists(text: string, keyword: string) {
  const normalizedText = ` ${normalizeText(text)} `
  const normalizedKeyword = normalizeText(keyword)

  if (!normalizedKeyword) {
    return false
  }

  if (normalizedKeyword.includes(' ')) {
    return normalizedText.includes(normalizedKeyword)
  }

  return normalizedText.includes(` ${normalizedKeyword} `)
}

function cleanTextArray(values: string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean)
    )
  )
}

function cleanObjectArray<T>(values: T[], selector: (value: T) => string) {
  const seen = new Set<string>()

  return values.filter((value) => {
    const key = selector(value).trim()

    if (!key || seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

function truncateText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, ' ').trim()

  if (normalized.length <= maxLength) {
    return normalized
  }

  const cutoff = normalized.slice(0, maxLength + 1)
  const safeCutoff = cutoff.slice(0, Math.max(cutoff.lastIndexOf(' '), maxLength - 18)).trim()

  return `${safeCutoff}...`
}

function countWords(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

function lowercaseFirstCharacter(value: string) {
  if (!value) {
    return value
  }

  return value.charAt(0).toLowerCase() + value.slice(1)
}

function condenseResumeSummary(value: string) {
  const normalized = value.replace(/\s+/g, ' ').trim()

  if (!normalized) {
    return ''
  }

  const sentences = normalized.match(/[^.!?]+[.!?]?/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? []
  const summary = sentences.length ? sentences.slice(0, 2).join(' ') : normalized

  return truncateText(summary, 240)
}

function condenseResumeBullet(value: string) {
  const normalized = value
    .replace(/\s+/g, ' ')
    .replace(/\.+$/, '')
    .trim()

  if (!normalized) {
    return ''
  }

  return truncateText(normalized, 118)
}

function extractKeywords(jobDescription: string) {
  const normalized = normalizeText(jobDescription)

  if (!normalized) {
    return []
  }

  const phraseMatches = trackedPhrases.filter((phrase) => normalized.includes(phrase))
  const tokenCounts = new Map<string, number>()

  for (const token of normalized.split(' ')) {
    if (token.length < 3 || stopWords.has(token)) {
      continue
    }

    tokenCounts.set(token, (tokenCounts.get(token) ?? 0) + 1)
  }

  const rankedTokens = [...tokenCounts.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .map(([token]) => token)

  return Array.from(new Set([...phraseMatches, ...rankedTokens])).slice(0, 12)
}

function inferRoleFamily(targetRole: string, keywords: string[], skills: string[]) {
  const normalizedContext = normalizeText([targetRole, ...keywords, ...skills].join(' '))

  for (const family of Object.keys(roleFamilySignals) as RoleFamily[]) {
    if (family === 'general') {
      continue
    }

    if (roleFamilySignals[family].some((signal) => normalizedContext.includes(normalizeText(signal)))) {
      return family
    }
  }

  return 'general' as const
}

function buildRoleAwareBridge(roleFamily: RoleFamily, keyword: string, index: number) {
  const keywordText = lowercaseFirstCharacter(toDisplayKeyword(keyword))
  const bridgeMap: Record<RoleFamily, string[]> = {
    operations: [
      `to keep ${keywordText} clearer across daily workflows`,
      `while improving ${keywordText} follow-through`,
      `to make ${keywordText} easier for teams to track`,
      `with tighter ${keywordText} coordination`
    ],
    support: [
      `to strengthen ${keywordText} during customer-facing work`,
      `while improving ${keywordText} consistency`,
      `with clearer ${keywordText} support coverage`,
      `to keep ${keywordText} visible in follow-up work`
    ],
    sales: [
      `to reinforce ${keywordText} across revenue work`,
      `while improving ${keywordText} visibility in the pipeline`,
      `with stronger ${keywordText} support during outreach`,
      `to keep ${keywordText} clearer for decision-makers`
    ],
    marketing: [
      `to strengthen ${keywordText} across campaign execution`,
      `while improving ${keywordText} visibility in delivery work`,
      `with clearer ${keywordText} support in content and reporting`,
      `to keep ${keywordText} easier to spot in the work`
    ],
    design: [
      `to reinforce ${keywordText} in user-facing delivery`,
      `while improving ${keywordText} visibility in collaboration`,
      `with clearer ${keywordText} support across design work`,
      `to keep ${keywordText} easier for teams to read`
    ],
    engineering: [
      `to reinforce ${keywordText} in implementation work`,
      `while improving ${keywordText} coverage in delivery`,
      `with clearer ${keywordText} support across build work`,
      `to make ${keywordText} easier to spot in the project story`
    ],
    leadership: [
      `to keep ${keywordText} clearer across team delivery`,
      `while improving ${keywordText} visibility for stakeholders`,
      `with stronger ${keywordText} alignment across priorities`,
      `to reinforce ${keywordText} in execution planning`
    ],
    general: [
      `to strengthen ${keywordText}`,
      `while improving ${keywordText}`,
      `with clearer ${keywordText} support`,
      `to keep ${keywordText} visible`
    ]
  }

  return bridgeMap[roleFamily][index % bridgeMap[roleFamily].length]
}

function createSummary(
  targetRole: string,
  summaryTone: SummaryTone,
  experienceLevel: ExperienceLevel,
  skills: string[],
  matchedKeywords: string[],
  missingKeywords: string[],
  roleFamily: RoleFamily
) {
  const spotlightTerms = cleanTextArray([
    ...matchedKeywords.slice(0, 2).map(toDisplayKeyword),
    ...skills.slice(0, 2),
    ...missingKeywords.slice(0, 1).map(toDisplayKeyword)
  ]).slice(0, 4)

  const spotlightText = spotlightTerms.length ? spotlightTerms.join(', ') : roleFamilyFocus[roleFamily]
  const roleText = targetRole ? toDisplayKeyword(targetRole) : 'Candidate'
  const experienceLabel = toDisplayKeyword(experienceLabels[experienceLevel])
  const toneText = toneLabels[summaryTone]
  const familyFocus = roleFamilyFocus[roleFamily]

  return `${experienceLabel} ${roleText} with strengths in ${spotlightText}. Brings a ${toneText} voice and frames experience around ${familyFocus} so hiring teams can quickly map the draft to the role.`
}

function createOptimizedBullet(statement: string, keyword: string, index: number, targetRole: string, roleFamily: RoleFamily) {
  const cleaned = statement
    .replace(/^(responsible for|worked on|tasked with|helped with)\s+/i, '')
    .replace(/\.$/, '')
    .trim()

  const hasActionVerb = actionVerbs.some((verb) => cleaned.toLowerCase().startsWith(verb.toLowerCase()))
  const verbPool = roleFamilyActionVerbs[roleFamily]
  const starter = verbPool[index % verbPool.length]
  const body = cleaned
    ? hasActionVerb
      ? cleaned
      : `${starter} ${lowercaseFirstCharacter(cleaned)}`
    : `${starter} work aligned to ${lowercaseFirstCharacter(toDisplayKeyword(targetRole || 'the target role'))}`

  if (keyword && keywordExists(body, keyword)) {
    return `${body}.`
  }

  return `${body} ${buildRoleAwareBridge(roleFamily, keyword || targetRole || 'the target role', index)}.`
}

function collectResumeText(
  personalInfo: PersonalInfo,
  targetRole: string,
  experience: Experience[],
  education: Education[],
  skills: string[],
  projects: Project[],
  certifications: Certification[],
  languages: Language[]
) {
  return [
    personalInfo.name,
    personalInfo.summary,
    targetRole,
    ...experience.map((item) => `${item.jobTitle} ${item.company} ${item.duration} ${item.description}`),
    ...education.map((item) => `${item.degree} ${item.school} ${item.year}`),
    ...skills,
    ...projects.map((item) => `${item.name} ${item.description}`),
    ...certifications.map((item) => `${item.name} ${item.issuer}`),
    ...languages.map((item) => `${item.name} ${item.proficiency}`)
  ].join(' ')
}

function buildAnalysis(
  personalInfo: PersonalInfo,
  targetRole: string,
  jobDescription: string,
  experienceLevel: ExperienceLevel,
  summaryTone: SummaryTone,
  experience: Experience[],
  education: Education[],
  skills: string[],
  projects: Project[],
  certifications: Certification[],
  languages: Language[]
): AnalysisResult {
  const trackedKeywords = extractKeywords(jobDescription)
  const currentResumeText = collectResumeText(personalInfo, targetRole, experience, education, skills, projects, certifications, languages)
  const matchedKeywords = trackedKeywords.filter((keyword) => keywordExists(currentResumeText, keyword))
  const missingKeywords = trackedKeywords.filter((keyword) => !matchedKeywords.includes(keyword))
  const roleFamily = inferRoleFamily(targetRole, [...matchedKeywords, ...missingKeywords], skills)
  const completenessChecks = [
    Boolean(personalInfo.name.trim()),
    Boolean(personalInfo.email.trim()),
    Boolean(targetRole.trim()),
    Boolean(personalInfo.summary.trim()),
    experience.some((item) => item.jobTitle.trim() || item.company.trim()),
    education.some((item) => item.degree.trim() || item.school.trim()),
    cleanTextArray(skills).length >= 4,
    Boolean(jobDescription.trim())
  ]
  const completenessRatio = completenessChecks.filter(Boolean).length / completenessChecks.length
  const coverageRatio = trackedKeywords.length ? matchedKeywords.length / trackedKeywords.length : 0
  const baseScore = trackedKeywords.length
    ? Math.round(coverageRatio * 68 + completenessRatio * 24 + Math.min(cleanTextArray(skills).length, 10))
    : Math.round(completenessRatio * 62 + Math.min(cleanTextArray(skills).length, 8) * 2.5)
  const beforeScore = clamp(baseScore, 18, 88)
  const optimizedSummary = createSummary(targetRole, summaryTone, experienceLevel, skills, matchedKeywords, missingKeywords, roleFamily)
  const optimizedExperience = experience.map((item, index) => {
    const statements = splitIntoStatements(item.description)
    const keywordPool = [...missingKeywords, ...matchedKeywords]

    if (!statements.length) {
      return keywordPool.slice(index, index + 2).map((keyword, keywordIndex) =>
        createOptimizedBullet('', keyword, index + keywordIndex, targetRole, roleFamily)
      )
    }

    return statements.slice(0, 3).map((statement, statementIndex) => {
      const keyword = keywordPool[(index + statementIndex) % Math.max(keywordPool.length, 1)] ?? targetRole ?? 'core skills'
      return createOptimizedBullet(statement, keyword, index + statementIndex, targetRole, roleFamily)
    })
  })

  const optimizedResumeText = [currentResumeText, optimizedSummary, optimizedExperience.flat().join(' ')].join(' ')
  const optimizedMatchedKeywords = trackedKeywords.filter((keyword) => keywordExists(optimizedResumeText, keyword))
  const optimizedCoverageRatio = trackedKeywords.length ? optimizedMatchedKeywords.length / trackedKeywords.length : coverageRatio
  const afterScore = clamp(
    Math.round(optimizedCoverageRatio * 74 + completenessRatio * 20 + 8),
    trackedKeywords.length ? beforeScore + 6 : beforeScore,
    98
  )

  return {
    trackedKeywords,
    matchedKeywords: optimizedMatchedKeywords,
    missingKeywords: trackedKeywords.filter((keyword) => !optimizedMatchedKeywords.includes(keyword)),
    beforeScore,
    afterScore,
    optimizedSummary,
    optimizedExperience
  }
}

function App() {
  const studioRef = useRef<HTMLElement | null>(null)
  const resumePanelRef = useRef<HTMLElement | null>(null)
  const feedbackTimeoutRef = useRef<number | null>(null)
  const scoreMotionTimeoutRef = useRef<number | null>(null)
  const scrollTimeoutRef = useRef<number | null>(null)
  const jobBoardSequenceRef = useRef<HTMLDivElement | null>(null)
  const pendingSkillInputRef = useRef<HTMLInputElement | null>(null)
  const experienceDescriptionRefs = useRef<Array<HTMLTextAreaElement | null>>([])
  const guidedFieldTimeoutRef = useRef<number | null>(null)
  const previousAfterScoreRef = useRef<number | null>(null)
  const highestScoreMilestoneRef = useRef(0)

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(defaultPersonalInfo)
  const [targetRole, setTargetRole] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('mid')
  const [summaryTone, setSummaryTone] = useState<SummaryTone>('balanced')
  const [experience, setExperience] = useState<Experience[]>([createExperience()])
  const [education, setEducation] = useState<Education[]>([createEducation()])
  const [skills, setSkills] = useState<string[]>([])
  const [projects, setProjects] = useState<Project[]>([createProject()])
  const [certifications, setCertifications] = useState<Certification[]>([createCertification()])
  const [languages, setLanguages] = useState<Language[]>([createLanguage()])
  const [pendingSkill, setPendingSkill] = useState('')
  const [applyOptimization, setApplyOptimization] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [scoreMotionState, setScoreMotionState] = useState<'idle' | 'pulse' | 'celebrate'>('idle')
  const [recentScoreDelta, setRecentScoreDelta] = useState<number | null>(null)
  const [jobBoardLoopWidth, setJobBoardLoopWidth] = useState(0)
  const [hasExportedResume, setHasExportedResume] = useState(false)
  const [guidedFieldTarget, setGuidedFieldTarget] = useState<GuidedFieldTarget | null>(null)
  const [reviewDraft, setReviewDraft] = useState<ReviewDraft>(createReviewDraft())
  const [submittedReviews, setSubmittedReviews] = useState<SubmittedReview[]>([])
  const [remoteApprovedReviews, setRemoteApprovedReviews] = useState<CommunityReview[]>([])
  const [isReviewBackendConfigured, setIsReviewBackendConfigured] = useState(false)
  const [currentReviewPage, setCurrentReviewPage] = useState(1)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)

      if (saved) {
        const data = JSON.parse(saved)

        setPersonalInfo({ ...defaultPersonalInfo, ...(data.personalInfo ?? {}) })
        setTargetRole(data.targetRole ?? '')
        setJobDescription(data.jobDescription ?? '')
        setExperienceLevel(data.experienceLevel ?? 'mid')
        setSummaryTone(data.summaryTone ?? 'balanced')
        setExperience(
          Array.isArray(data.experience) && data.experience.length
            ? data.experience.map((item: Experience) => createExperience(item))
            : [createExperience()]
        )
        setEducation(
          Array.isArray(data.education) && data.education.length
            ? data.education.map((item: Education) => createEducation(item))
            : [createEducation()]
        )
        setSkills(Array.isArray(data.skills) ? cleanTextArray(data.skills) : [])
        setProjects(
          Array.isArray(data.projects) && data.projects.length
            ? data.projects.map((item: Project) => createProject(item))
            : [createProject()]
        )
        setCertifications(
          Array.isArray(data.certifications) && data.certifications.length
            ? data.certifications.map((item: Certification) => createCertification(item))
            : [createCertification()]
        )
        setLanguages(
          Array.isArray(data.languages) && data.languages.length
            ? data.languages.map((item: Language) => createLanguage(item))
            : [createLanguage()]
        )
        setApplyOptimization(data.applyOptimization ?? false)
      }
    } catch {
      setFeedback('Saved data could not be restored. Starting with a fresh workspace.')
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current)
      }
      feedbackTimeoutRef.current = window.setTimeout(() => {
        setFeedback('')
        feedbackTimeoutRef.current = null
      }, 3000)
    }

    return () => {
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current)
      }

      if (scoreMotionTimeoutRef.current !== null) {
        window.clearTimeout(scoreMotionTimeoutRef.current)
      }

      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current)
      }

      if (guidedFieldTimeoutRef.current !== null) {
        window.clearTimeout(guidedFieldTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const sequence = jobBoardSequenceRef.current

    if (!sequence) {
      return
    }

    const measure = () => {
      requestAnimationFrame(() => {
        setJobBoardLoopWidth(sequence.getBoundingClientRect().width)
      })
    }

    measure()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }

    const resizeObserver = new ResizeObserver(() => {
      measure()
    })

    resizeObserver.observe(sequence)
    window.addEventListener('resize', measure)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  useEffect(() => {
    try {
      const savedReviews = localStorage.getItem(REVIEW_STORAGE_KEY)

      if (!savedReviews) {
        return
      }

      const parsedReviews = JSON.parse(savedReviews)

      if (!Array.isArray(parsedReviews)) {
        return
      }

      setSubmittedReviews(
        parsedReviews
          .filter((review): review is SubmittedReview => {
            return (
              review &&
              typeof review.id === 'string' &&
              typeof review.name === 'string' &&
              typeof review.role === 'string' &&
              typeof review.board === 'string' &&
              (typeof review.rating === 'number' || typeof review.rating === 'undefined') &&
              typeof review.outcome === 'string' &&
              typeof review.quote === 'string' &&
              typeof review.scoreBefore === 'number' &&
              typeof review.scoreAfter === 'number' &&
              (review.status === 'pending' || review.status === 'approved') &&
              typeof review.submittedAt === 'string'
            )
          })
          .map((review) => ({
            ...review,
            rating: clampReviewRating(typeof review.rating === 'number' ? review.rating : 5),
            status: 'approved' as const
          }))
      )
    } catch {
      setSubmittedReviews([])
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadApprovedReviews = async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}api/reviews`, {
          headers: {
            Accept: 'application/json'
          }
        })

        if (!response.ok) {
          return
        }

        const data = (await response.json()) as ReviewApiResponse

        if (!isMounted) {
          return
        }

        setRemoteApprovedReviews(Array.isArray(data.reviews) ? data.reviews : [])
        setIsReviewBackendConfigured(Boolean(data.backendConfigured))
      } catch {
        if (isMounted) {
          setIsReviewBackendConfigured(false)
        }
      }
    }

    void loadApprovedReviews()

    return () => {
      isMounted = false
    }
  }, [])

  const analysis = buildAnalysis(
    personalInfo,
    targetRole,
    jobDescription,
    experienceLevel,
    summaryTone,
    experience,
    education,
    skills,
    projects,
    certifications,
    languages
  )

  const isOptimizationUnlocked = Boolean(jobDescription.trim())
  const stepUnlockMessage = 'Paste a job description first to unlock optimization.'
  const scoreGuidance = !isOptimizationUnlocked
    ? 'Paste a job description to start matching.'
    : analysis.afterScore < 50
      ? 'Keep adding keywords from the job description.'
      : analysis.afterScore > 80
        ? 'Looking strong! Ready to export.'
        : 'You are close. Tighten the wording and keyword coverage.'
  const resumeHeadlineParts = cleanTextArray([targetRole, ...skills.slice(0, 3)]).slice(0, 4)
  const resumeContactItems = [personalInfo.address, personalInfo.email, personalInfo.phone, personalInfo.linkedin, personalInfo.website]
    .map((value) => value.trim())
    .filter(Boolean)
  const rawResumeSummary = condenseResumeSummary(personalInfo.summary.trim())
  const optimizedResumeSummary = analysis.optimizedSummary ? condenseResumeSummary(analysis.optimizedSummary) : ''
  const resumeSummary = applyOptimization && optimizedResumeSummary ? optimizedResumeSummary : rawResumeSummary
  const isResumeSummaryOptimized = Boolean(
    applyOptimization && optimizedResumeSummary && optimizedResumeSummary !== rawResumeSummary
  )
  const resumeSkills = cleanTextArray(skills).slice(0, 10)
  const exportFileName = buildResumeFileName(personalInfo.name)
  const resumeExperienceEntries = experience
    .map((item, index) => {
      const rawBullets = splitIntoStatements(item.description)
        .map(condenseResumeBullet)
        .filter(Boolean)
        .slice(0, 3)
      const optimizedBullets = (analysis.optimizedExperience[index] ?? []).map(condenseResumeBullet).filter(Boolean).slice(0, 3)
      const useOptimizedBullets = applyOptimization && optimizedBullets.length > 0
      const optimizedBulletsChanged = useOptimizedBullets && optimizedBullets.join('|') !== rawBullets.join('|')
      const bullets: ResumeBulletPreview[] = (useOptimizedBullets ? optimizedBullets : rawBullets).map((text) => ({
        text,
        isOptimized: optimizedBulletsChanged
      }))

      return {
        ...item,
        bullets
      }
    })
    .filter((item) => item.jobTitle.trim() || item.company.trim())
    .slice(0, 3)
  const resumeEducationEntries = education.filter((item) => item.degree.trim() || item.school.trim()).slice(0, 2)
  const resumeSkillGroups = [resumeSkills.slice(0, 5), resumeSkills.slice(5)].filter((group) => group.length)
  const resumeCertifications = certifications.filter((item) => item.name.trim()).slice(0, 4)
  const resumeProjects = projects.filter((item) => item.name.trim()).slice(0, 2)
  const resumeLanguages = languages.filter((item) => item.name.trim()).slice(0, 3)
  const showProjectsInResume = resumeProjects.length > 0 && resumeExperienceEntries.length <= 1
  const hasResumeCore = Boolean(personalInfo.name.trim() && (personalInfo.summary.trim() || experience.some((item) => item.jobTitle.trim())))
  const hasTargetingInputs = Boolean(targetRole.trim() || jobDescription.trim())
  const hasResumeBasics = Boolean(personalInfo.name.trim() && (personalInfo.email.trim() || personalInfo.summary.trim()))
  const hasExperienceDetails = experience.some((item) => item.jobTitle.trim() || item.company.trim() || item.description.trim())
  const hasSkillSignals = skills.length > 0
  const hasValidEmail = Boolean(personalInfo.email.trim() && validateEmail(personalInfo.email))
  const hasContactMethod = Boolean(hasValidEmail || personalInfo.phone.trim())
  const summaryWordCount = countWords(personalInfo.summary)
  const populatedExperienceCount = experience.filter((item) => item.jobTitle.trim() || item.company.trim() || item.description.trim()).length
  const hasOptimizationPreviewContent = Boolean(personalInfo.summary.trim() || populatedExperienceCount > 0)
  const exportBlockers: Array<{ id: CompletionTarget; message: string }> = [
    !isOptimizationUnlocked ? { id: 'jobDescription', message: 'Paste the job description to unlock ATS matching before export.' } : null,
    !personalInfo.name.trim() ? { id: 'identity', message: 'Add the candidate name before exporting.' } : null,
    !hasContactMethod
      ? { id: 'contact', message: 'Add a valid email or phone number for recruiter contact.' }
      : personalInfo.email.trim() && !hasValidEmail
        ? { id: 'contact', message: 'Fix the email format or add a phone number so recruiters can reach you.' }
        : null,
    summaryWordCount < 6 ? { id: 'summary', message: 'Add a short professional summary before exporting.' } : null,
    populatedExperienceCount === 0 ? { id: 'experience', message: 'Add at least one role with a clear description of what you did.' } : null,
    skills.length === 0 ? { id: 'skills', message: 'Add skills so the ATS and recruiter can see your core signals.' } : null
  ].filter((item): item is { id: CompletionTarget; message: string } => item !== null)
  const shouldShowPreviewScaffold = exportBlockers.length > 0
  const previewName = personalInfo.name.trim() || (shouldShowPreviewScaffold ? previewResumeScaffold.name : 'Your Name')
  const previewHeadlineParts = resumeHeadlineParts.length
    ? resumeHeadlineParts
    : shouldShowPreviewScaffold
      ? previewResumeScaffold.headlineParts
      : [targetRole || 'Target Role']
  const previewContactItems = resumeContactItems.length > 0
    ? resumeContactItems
    : shouldShowPreviewScaffold
      ? previewResumeScaffold.contactItems
      : []
  const previewSummary = resumeSummary || (shouldShowPreviewScaffold ? previewResumeScaffold.summary : '')
  const previewExperienceEntries = resumeExperienceEntries.length > 0
    ? resumeExperienceEntries
    : shouldShowPreviewScaffold
      ? previewResumeScaffold.experienceEntries
      : []
  const previewEducationEntries = resumeEducationEntries.length > 0
    ? resumeEducationEntries
    : shouldShowPreviewScaffold
      ? previewResumeScaffold.educationEntries
      : []
  const previewSkillGroups = resumeSkillGroups.length > 0
    ? resumeSkillGroups
    : shouldShowPreviewScaffold
      ? previewResumeScaffold.skillGroups
      : []
  const previewLanguages = resumeLanguages.length > 0
    ? resumeLanguages.map((item) => (item.proficiency ? `${item.name} (${item.proficiency})` : item.name))
    : shouldShowPreviewScaffold
      ? previewResumeScaffold.languages
      : []
  const previewCertifications = resumeCertifications.length > 0
    ? resumeCertifications
    : shouldShowPreviewScaffold
      ? previewResumeScaffold.certifications
      : []
  const canSubmitReview = Boolean(isOptimizationUnlocked && hasResumeCore && hasExportedResume)
  const reviewSubmissionHint = !isOptimizationUnlocked
    ? 'Paste a job description first to unlock review submission.'
    : !hasExportedResume
      ? 'Create and export your resume first, then you can share your result.'
      : isReviewBackendConfigured
        ? 'Your review will publish to the shared review wall as soon as you submit it.'
        : 'Shared review publishing is not configured yet on this build.'
  const publishedReviews = [...remoteApprovedReviews, ...officialLaunchReviews].filter(
    (review, index, collection) => collection.findIndex((item) => item.id === review.id) === index
  )
  const reviewCount = publishedReviews.length
  const publishedReviewMap = new Map(publishedReviews.map((review) => [review.id, review] as const))
  const curatedFeaturedResults = featuredSuccessGalleryIds
    .map((id) => publishedReviewMap.get(id))
    .filter((review): review is CommunityReview => Boolean(review))
  const featuredResults = curatedFeaturedResults.length ? curatedFeaturedResults : publishedReviews.slice(0, 8)
  const additionalResults = publishedReviews.filter(
    (review) => !featuredResults.some((featuredReview) => featuredReview.id === review.id)
  )
  const REVIEWS_PER_PAGE = 8
  const allPages = [featuredResults, ...Array.from({ length: Math.ceil(additionalResults.length / REVIEWS_PER_PAGE) }, (_, i) => 
    additionalResults.slice(i * REVIEWS_PER_PAGE, (i + 1) * REVIEWS_PER_PAGE)
  )]
  const totalPages = allPages.length
  const displayedResults = allPages[currentReviewPage - 1] || featuredResults
  const averageReviewRating = reviewCount
    ? publishedReviews.reduce((total, review) => total + clampReviewRating(review.rating), 0) / reviewCount
    : 0
  const hasPublishedReviews = reviewCount > 0
  const scoreDelta = Math.max(analysis.afterScore - analysis.beforeScore, 0)
  const matchedSignalLabel = analysis.trackedKeywords.length
    ? `${analysis.matchedKeywords.length} of ${analysis.trackedKeywords.length} signals matched`
    : 'Paste a job description to start matching.'
  const heroBeforeScore = hasResumeCore ? analysis.beforeScore : 48
  const heroAfterScore = hasResumeCore ? analysis.afterScore : 84
  const heroScoreDelta = Math.max(heroAfterScore - heroBeforeScore, 0)
  const heroRecoveredSignals = (analysis.matchedKeywords.length ? analysis.matchedKeywords : landingTeaserAfterSignals)
    .slice(0, 4)
    .map(toDisplayKeyword)
  const heroMissingSignals = (analysis.missingKeywords.length ? analysis.missingKeywords : landingTeaserBeforeSignals)
    .slice(0, 4)
    .map(toDisplayKeyword)
  const studioStepCards = [
    {
      label: 'Step 1',
      title: 'Targeting brief',
      hint: isOptimizationUnlocked ? 'Job brief loaded and matching is live.' : 'Paste the role and job description to start.',
      state: isOptimizationUnlocked ? 'ready' : hasTargetingInputs ? 'active' : 'active'
    },
    {
      label: 'Step 2',
      title: 'Resume basics',
      hint: !isOptimizationUnlocked ? 'Locked until the job description is pasted.' : hasResumeBasics ? 'Header and summary content are in place.' : 'Add your name, contact details, and opener.',
      state: !isOptimizationUnlocked ? 'locked' : hasResumeBasics ? 'ready' : 'active'
    },
    {
      label: 'Step 3',
      title: 'Experience',
      hint: !isOptimizationUnlocked ? 'Locked until the job description is pasted.' : hasExperienceDetails ? 'Experience content is ready to optimize.' : 'Add your strongest role and impact notes.',
      state: !isOptimizationUnlocked ? 'locked' : hasExperienceDetails ? 'ready' : 'active'
    },
    {
      label: 'Step 4',
      title: 'Skills',
      hint: !isOptimizationUnlocked ? 'Locked until the job description is pasted.' : hasSkillSignals ? `${skills.length} skills and signals added.` : 'Add the keywords you want the ATS to see.',
      state: !isOptimizationUnlocked ? 'locked' : hasSkillSignals ? 'ready' : 'active'
    }
  ] as const

  useEffect(() => {
    if (!hasOptimizationPreviewContent && applyOptimization) {
      setApplyOptimization(false)
    }
  }, [applyOptimization, hasOptimizationPreviewContent])

  const showToast = (message: string) => {
    setFeedback(message)

    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current)
    }

    feedbackTimeoutRef.current = window.setTimeout(() => {
      setFeedback('')
      feedbackTimeoutRef.current = null
    }, 3000)
  }

  const triggerScoreMotion = (state: 'pulse' | 'celebrate', delta: number) => {
    setScoreMotionState(state)
    setRecentScoreDelta(delta)

    if (scoreMotionTimeoutRef.current !== null) {
      window.clearTimeout(scoreMotionTimeoutRef.current)
    }

    scoreMotionTimeoutRef.current = window.setTimeout(() => {
      setScoreMotionState('idle')
      setRecentScoreDelta(null)
      scoreMotionTimeoutRef.current = null
    }, 1800)
  }

  useEffect(() => {
    if (!isOptimizationUnlocked) {
      previousAfterScoreRef.current = null
      highestScoreMilestoneRef.current = 0
      setScoreMotionState('idle')
      setRecentScoreDelta(null)

      if (scoreMotionTimeoutRef.current !== null) {
        window.clearTimeout(scoreMotionTimeoutRef.current)
        scoreMotionTimeoutRef.current = null
      }

      return
    }

    const previousScore = previousAfterScoreRef.current
    previousAfterScoreRef.current = analysis.afterScore

    if (previousScore === null || analysis.afterScore <= previousScore) {
      return
    }

    const delta = analysis.afterScore - previousScore
    const highestMilestone =
      analysis.afterScore >= 80
        ? 80
        : analysis.afterScore >= 65
          ? 65
          : analysis.afterScore >= 50
            ? 50
            : 0

    if (highestMilestone > highestScoreMilestoneRef.current) {
      highestScoreMilestoneRef.current = highestMilestone

      if (highestMilestone >= 80) {
        showToast('Looking strong. Your ATS score just cleared 80.')
        triggerScoreMotion('celebrate', delta)
        return
      }

      if (highestMilestone >= 65) {
        showToast('ATS score is climbing. Keep tightening the strongest signals.')
      } else if (highestMilestone >= 50) {
        showToast('The draft is moving in the right direction. Keep matching the job language.')
      }
    }

    triggerScoreMotion('pulse', delta)
  }, [analysis.afterScore, isOptimizationUnlocked])

  const persistSubmittedReviews = (nextReviews: SubmittedReview[]) => {
    setSubmittedReviews(nextReviews)

    try {
      localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(nextReviews))
      return true
    } catch {
      return false
    }
  }

  const refreshApprovedReviews = async () => {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/reviews`, {
        headers: {
          Accept: 'application/json'
        }
      })

      if (!response.ok) {
        return false
      }

      const data = (await response.json()) as ReviewApiResponse
      setRemoteApprovedReviews(Array.isArray(data.reviews) ? data.reviews : [])
      setIsReviewBackendConfigured(Boolean(data.backendConfigured))
      return true
    } catch {
      setIsReviewBackendConfigured(false)
      return false
    }
  }

  const scrollToStudio = () => {
    studioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const scrollToPreview = () => {
    resumePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const focusCompletionTarget = (signalId: CompletionTarget) => {
    if (signalId === 'experience') {
      const targetIndex = experience.findIndex((item) => !item.description.trim())
      const fallbackIndex = targetIndex >= 0 ? targetIndex : 0
      const targetField = experienceDescriptionRefs.current[fallbackIndex]

      if (targetField) {
        highlightGuidedField({ type: 'experience', index: fallbackIndex })
        targetField.scrollIntoView({ behavior: 'smooth', block: 'center' })

        window.setTimeout(() => {
          targetField.focus()
        }, 240)
      }

      return
    }

    if (signalId === 'skills') {
      highlightGuidedField({ type: 'skill' })
      pendingSkillInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })

      window.setTimeout(() => {
        pendingSkillInputRef.current?.focus()
      }, 240)

      return
    }

    const targetMap: Record<Exclude<CompletionTarget, 'experience' | 'skills'>, string> = {
      jobDescription: 'jobDescription',
      identity: 'personalName',
      contact: personalInfo.email.trim() && !hasValidEmail ? 'personalEmail' : 'personalPhone',
      summary: 'personalSummary'
    }

    const targetId = targetMap[signalId]
    const target = document.getElementById(targetId)

    if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })

      window.setTimeout(() => {
        target.focus()
      }, 240)
    }
  }

  const saveWorkspace = () => {
    const cleanedSkills = cleanTextArray(skills)
    const cleanedProjects = cleanObjectArray(projects, (item) => `${item.name}|${item.description}|${item.link}`)
    const cleanedCertifications = cleanObjectArray(certifications, (item) => `${item.name}|${item.issuer}|${item.year}`)
    const cleanedLanguages = cleanObjectArray(languages, (item) => `${item.name}|${item.proficiency}`)
    const workspaceSnapshot = JSON.stringify({
      personalInfo,
      targetRole,
      jobDescription,
      experienceLevel,
      summaryTone,
      experience,
      education,
      skills: cleanedSkills,
      projects: cleanedProjects,
      certifications: cleanedCertifications,
      languages: cleanedLanguages,
      applyOptimization
    })

    setSkills(cleanedSkills)
    setProjects(cleanedProjects.length ? cleanedProjects : [createProject()])
    setCertifications(cleanedCertifications.length ? cleanedCertifications : [createCertification()])
    setLanguages(cleanedLanguages.length ? cleanedLanguages : [createLanguage()])

    try {
      localStorage.setItem(STORAGE_KEY, workspaceSnapshot)
      showToast('Workspace saved on this device.')
    } catch {
      showToast('Workspace could not be saved on this device.')
    }
  }

  const loadSample = () => {
    setHasExportedResume(false)
    setTargetRole(sampleData.targetRole)
    setJobDescription(sampleData.jobDescription)
    setExperienceLevel(sampleData.experienceLevel)
    setSummaryTone(sampleData.summaryTone)
    setApplyOptimization(sampleData.applyOptimization)
    setPersonalInfo(sampleData.personalInfo)
    setExperience(sampleData.experience.map((item) => createExperience(item)))
    setEducation(sampleData.education.map((item) => createEducation(item)))
    setSkills(sampleData.skills)
    setProjects(sampleData.projects.map((item) => createProject(item)))
    setCertifications(sampleData.certifications.map((item) => createCertification(item)))
    setLanguages(sampleData.languages.map((item) => createLanguage(item)))
    setPendingSkill('')
    showToast('Sample ATS workspace loaded.')

    if (scrollTimeoutRef.current !== null) {
      window.clearTimeout(scrollTimeoutRef.current)
    }

    scrollTimeoutRef.current = window.setTimeout(() => {
      scrollToStudio()
      scrollTimeoutRef.current = null
    }, 100)
  }

  const resetWorkspace = () => {
    setHasExportedResume(false)
    setPersonalInfo(defaultPersonalInfo)
    setTargetRole('')
    setJobDescription('')
    setExperienceLevel('mid')
    setSummaryTone('balanced')
    setExperience([createExperience()])
    setEducation([createEducation()])
    setSkills([])
    setProjects([createProject()])
    setCertifications([createCertification()])
    setLanguages([createLanguage()])
    setPendingSkill('')
    setApplyOptimization(false)

    try {
      localStorage.removeItem(STORAGE_KEY)
      showToast('Workspace cleared.')
    } catch {
      showToast('Workspace cleared, but local storage could not be updated.')
    }
  }

  const generatePDF = async () => {
    const input = document.getElementById('resume-preview')

    if (!(input instanceof HTMLElement)) {
      showToast('Resume preview is not ready for export yet.')
      return
    }

    if (exportBlockers.length > 0) {
      const firstBlocker = exportBlockers[0]
      showToast(firstBlocker.message)
      focusCompletionTarget(firstBlocker.id)
      return
    }

    try {
      input.classList.add('resume-sheet-export')
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => resolve())
        })
      })

      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')])
      const canvas = await html2canvas(input, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 5
      const usableWidth = pageWidth - margin * 2
      const usableHeight = pageHeight - margin * 2
      const widthScale = usableWidth / canvas.width
      const heightScale = usableHeight / canvas.height
      const fitScale = Math.min(widthScale, heightScale)
      const renderedWidth = canvas.width * fitScale
      const renderedHeight = canvas.height * fitScale
      const horizontalOffset = (pageWidth - renderedWidth) / 2

      pdf.addImage(imgData, 'PNG', horizontalOffset, margin, renderedWidth, renderedHeight)

      pdf.save(exportFileName)
      setHasExportedResume(true)
      showToast('ATS resume exported as a single-page PDF.')
    } catch {
      showToast('PDF export failed. Please try again.')
    } finally {
      input.classList.remove('resume-sheet-export')
    }
  }

  const addSkill = () => {
    const value = pendingSkill.trim()

    if (!value) {
      return
    }

    const exists = skills.some((item) => item.toLowerCase() === value.toLowerCase())

    if (!exists) {
      setSkills((current) => [...current, value])
    }

    setPendingSkill('')
  }

  const highlightGuidedField = (target: GuidedFieldTarget) => {
    setGuidedFieldTarget(target)

    if (guidedFieldTimeoutRef.current !== null) {
      window.clearTimeout(guidedFieldTimeoutRef.current)
    }

    guidedFieldTimeoutRef.current = window.setTimeout(() => {
      setGuidedFieldTarget(null)
      guidedFieldTimeoutRef.current = null
    }, 2200)
  }

  const guideKeywordToFix = (keyword: string) => {
    const displayKeyword = toDisplayKeyword(keyword)
    const firstFilledExperienceIndex = experience.findIndex((item) => item.description.trim())
    const targetExperienceIndex = firstFilledExperienceIndex >= 0 ? firstFilledExperienceIndex : -1

    if (targetExperienceIndex >= 0) {
      const targetField = experienceDescriptionRefs.current[targetExperienceIndex]

      if (targetField) {
        highlightGuidedField({ type: 'experience', index: targetExperienceIndex })
        targetField.scrollIntoView({ behavior: 'smooth', block: 'center' })

        window.setTimeout(() => {
          targetField.focus()
        }, 260)

        showToast(`Work "${displayKeyword}" into Role ${targetExperienceIndex + 1}, or add it as a skill below.`)
        return
      }
    }

    setPendingSkill(displayKeyword)
    highlightGuidedField({ type: 'skill' })
    pendingSkillInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })

    window.setTimeout(() => {
      pendingSkillInputRef.current?.focus()
      pendingSkillInputRef.current?.select()
    }, 260)

    showToast(`Add "${displayKeyword}" to your skills, then weave it into your experience bullets if it fits.`)
  }

  const updateArrayItem = <T, K extends keyof T>(setter: Dispatch<SetStateAction<T[]>>, index: number, field: K, value: T[K]) => {
    setter((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)))
  }

  const updateReviewDraft = <K extends keyof ReviewDraft>(field: K, value: ReviewDraft[K]) => {
    setReviewDraft((current) => ({ ...current, [field]: value }))
  }

  const submitReview = () => {
    const submitReviewAsync = async () => {
      if (!canSubmitReview) {
        showToast(reviewSubmissionHint)
        return
      }

      const name = reviewDraft.name.trim() || personalInfo.name.trim()
      const role = reviewDraft.role.trim() || targetRole.trim()
      const board = reviewDraft.board.trim()
      const rating = clampReviewRating(reviewDraft.rating)
      const outcome = reviewDraft.outcome.trim()
      const quote = reviewDraft.quote.trim()

      if (!name || !role || !board || !outcome || !quote) {
        showToast('Complete the review details before submitting.')
        return
      }

      const nextReview: SubmittedReview = {
        id: createEntryId('review'),
        name,
        role,
        board,
        rating,
        scoreBefore: analysis.beforeScore,
        scoreAfter: analysis.afterScore,
        outcome,
        quote,
        status: 'approved',
        submittedAt: new Date().toISOString()
      }

      if (isReviewBackendConfigured) {
        try {
          const response = await fetch(`${import.meta.env.BASE_URL}api/reviews`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json'
            },
            body: JSON.stringify({
              name: nextReview.name,
              role: nextReview.role,
              board: nextReview.board,
              rating: nextReview.rating,
              scoreBefore: nextReview.scoreBefore,
              scoreAfter: nextReview.scoreAfter,
              outcome: nextReview.outcome,
              quote: nextReview.quote
            })
          })

          if (response.ok) {
            const data = (await response.json()) as { review?: SubmittedReview }

            if (data.review?.id) {
              nextReview.id = data.review.id
            }
            if (data.review?.submittedAt) {
              nextReview.submittedAt = data.review.submittedAt
            }
            nextReview.status = 'approved'
            await refreshApprovedReviews()
          } else {
            setIsReviewBackendConfigured(false)
          }
        } catch {
          setIsReviewBackendConfigured(false)
        }
      }

      const nextReviews: SubmittedReview[] = [nextReview, ...submittedReviews]

      const savedLocally = persistSubmittedReviews(nextReviews)

      setReviewDraft(
        createReviewDraft({
          name,
          role,
          board,
          rating
        })
      )

      if (savedLocally) {
        showToast(
          isReviewBackendConfigured
            ? 'Your review is now live on the shared review wall.'
            : 'Your review was saved on this device. Connect shared storage to publish it across users.'
        )
      } else {
        showToast('Your review could not be saved on this device.')
      }
    }

    void submitReviewAsync()
  }

  const addArrayItem = <T,>(setter: Dispatch<SetStateAction<T[]>>, item: T) => {
    setter((current) => [...current, item])
  }

  const removeArrayItem = <T,>(setter: Dispatch<SetStateAction<T[]>>, index: number) => {
    setter((current) => (current.length > 1 ? current.filter((_, itemIndex) => itemIndex !== index) : current))
  }

  return (
    <div className="app-shell">
      <div className="background-glow background-glow-left" />
      <div className="background-glow background-glow-right" />

      <header className="topbar">
        <div className="shell">
          <div className="brand-lockup">
            <img src={assetPath('/resumay-logo.png')} alt="ResuMay!" className="brand-logo" loading="lazy" />
          </div>

          <nav className="topbar-links" aria-label="Primary">
            <a href="#how-it-works">How it works</a>
            <a href="#studio">Studio</a>
            <a href="#faq">FAQ</a>
          </nav>

          <button type="button" className="ghost-button topbar-button" onClick={scrollToStudio}>
            Optimize my resume
          </button>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="shell">
            <div className="hero-grid">
              <div className="hero-copy">
                <span className="eyebrow">A clearer path from job post to polished resume</span>
                <h1>Make your resume a clearer match for the job.</h1>
                <p className="hero-lead">
                  Use the job description to spot keyword gaps, strengthen relevant experience, and export a clean,
                  one-page PDF before you apply.
                </p>

                <div className="hero-actions">
                  <button type="button" className="primary-button" onClick={scrollToStudio}>
                    <i className="bi bi-stars" />
                    Optimize my resume
                  </button>
                  <button type="button" className="secondary-button" onClick={loadSample}>
                    <i className="bi bi-play-circle" />
                    Try a sample
                  </button>
                </div>

                <p className="hero-action-note">
                  Start with your own draft or explore the sample workspace. Your resume stays in this browser while you
                  work.
                </p>

                <div className="hero-journey" aria-label="What happens next">
                  <div className="hero-journey-step">
                    <span>01</span>
                    <strong>Add the job description</strong>
                  </div>
                  <div className="hero-journey-step">
                    <span>02</span>
                    <strong>Close the keyword gaps</strong>
                  </div>
                  <div className="hero-journey-step">
                    <span>03</span>
                    <strong>Export your tailored PDF</strong>
                  </div>
                </div>

                <div className="hero-trust-row" aria-label="Included with ResuMay">
                  <span><i className="bi bi-check-circle-fill" /> No account required</span>
                  <span><i className="bi bi-check-circle-fill" /> Local-first editing</span>
                  <span><i className="bi bi-check-circle-fill" /> PDF export</span>
                </div>
              </div>

              <div className="hero-visual">
                <div className="hero-card hero-card-score hero-score-hud">
                  <div className="hero-card-header">
                    <span>Example job match score</span>
                    <strong className="hero-score-delta">+{heroScoreDelta || 36}</strong>
                  </div>

                  <div className="hero-score-row">
                    <div>
                      <small>Before</small>
                      <strong>{heroBeforeScore}</strong>
                    </div>
                    <div className="score-arrow">
                      <i className="bi bi-arrow-right" />
                    </div>
                    <div>
                      <small>After</small>
                      <strong>{heroAfterScore}</strong>
                    </div>
                  </div>

                  <div className="hero-score-meter" aria-hidden="true">
                    <span className="hero-score-meter-before" style={{ width: `${heroBeforeScore}%` }} />
                    <span className="hero-score-meter-after" style={{ width: `${heroAfterScore}%` }} />
                  </div>

                  <div className="hero-score-copy">
                    <span>{heroRecoveredSignals.length} recruiter-facing signals visible</span>
                    <span>Your score updates as you edit</span>
                  </div>
                </div>

                <div className="hero-card hero-card-compare">
                  <div className="hero-card-header">
                    <span>See the difference</span>
                    <span className="hero-compare-caption">Before and after keyword coverage</span>
                  </div>

                  <div className="hero-compare-grid">
                    <article className="hero-compare-panel hero-compare-panel-before">
                      <div className="hero-compare-head">
                        <span>Before</span>
                        <strong>{heroBeforeScore}%</strong>
                      </div>
                      <p>Generic draft. Strong qualifications, weak signaling.</p>
                      <div className="hero-compare-chip-cloud">
                        {heroMissingSignals.map((signal) => (
                          <span key={`before-${signal}`} className="hero-compare-chip hero-compare-chip-muted">
                            {signal}
                          </span>
                        ))}
                      </div>
                    </article>

                    <article className="hero-compare-panel hero-compare-panel-after">
                      <div className="hero-compare-head">
                        <span>After</span>
                        <strong>{heroAfterScore}%</strong>
                      </div>
                      <p>Sharper opener, clearer bullets, stronger ATS coverage.</p>
                      <div className="hero-compare-chip-cloud">
                        {heroRecoveredSignals.map((signal) => (
                          <span key={`after-${signal}`} className="hero-compare-chip hero-compare-chip-success">
                            <i className="bi bi-check-circle-fill" />
                            {signal}
                          </span>
                        ))}
                      </div>
                    </article>
                  </div>
                </div>
              </div>
            </div>

            <div className="job-board-band" aria-labelledby="job-board-title">
              <div className="job-board-band-head">
                <span id="job-board-title" className="job-board-label">
                  Built for online job boards like
                </span>
              </div>

              <div className="job-board-marquee" aria-label="Supported job boards">
                <div
                  className={`job-board-track${jobBoardLoopWidth > 0 ? ' is-ready' : ''}`}
                  style={
                    jobBoardLoopWidth > 0
                      ? ({ '--job-board-loop-width': `${jobBoardLoopWidth}px` } as CSSProperties)
                      : undefined
                  }
                >
                  {[0, 1].map((copyIndex) => {
                    const isRepeat = copyIndex === 1

                    return (
                      <div
                        key={copyIndex}
                        className="job-board-sequence"
                        aria-hidden={isRepeat ? 'true' : undefined}
                        ref={isRepeat ? undefined : jobBoardSequenceRef}
                        role={isRepeat ? undefined : 'list'}
                      >
                        {supportedJobBoards.map((board) => (
                          <article
                            key={`${copyIndex}-${board.id}`}
                            className={`job-board-node job-board-node-${board.logoType}`}
                            aria-label={isRepeat ? undefined : board.name}
                            role={isRepeat ? undefined : 'listitem'}
                          >
                            <div className="job-board-node-logo">
                              <img
                                src={board.logoSrc}
                                alt={isRepeat ? '' : `${board.name} logo`}
                                className={`job-board-logo job-board-logo-${board.logoType}${board.logoClassName ? ` ${board.logoClassName}` : ''}`}
                                loading="lazy"
                              />
                            </div>
                          </article>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="proof-section">
          <div className="shell proof-shell">
            <div className="section-heading proof-heading">
              <span className="eyebrow">Why ResuMay</span>
              <h2>More clarity before you apply.</h2>
              <p>
                Keep the job, your edits, and the resume preview together so every change stays focused on the role you want.
              </p>
            </div>

            <div className="proof-row">
              <article className="proof-card">
                <div className="proof-card-icon" aria-hidden="true">
                  <i className="bi bi-bullseye" />
                </div>
                <div className="proof-card-copy">
                  <span className="proof-card-kicker">Job match</span>
                  <strong>Know what the role asks for</strong>
                  <p>Compare your draft with the job description and see which relevant terms are already there or still missing.</p>
                </div>
              </article>

              <article className="proof-card">
                <div className="proof-card-icon" aria-hidden="true">
                  <i className="bi bi-activity" />
                </div>
                <div className="proof-card-copy">
                  <span className="proof-card-kicker">Focused edits</span>
                  <strong>Make the next edit count</strong>
                  <p>Use the match score and writing suggestions to bring your most relevant experience forward.</p>
                </div>
              </article>

              <article className="proof-card">
                <div className="proof-card-icon" aria-hidden="true">
                  <i className="bi bi-file-earmark-check" />
                </div>
                <div className="proof-card-copy">
                  <span className="proof-card-kicker">Ready to share</span>
                  <strong>Take a cleaner resume with you</strong>
                  <p>Review the live preview, then export a polished PDF for the application you are preparing.</p>
                </div>
              </article>
            </div>

            <div className="proof-inline-note" role="note" aria-label="ResuMay workflow summary">
              <span>One job at a time</span>
              <span>Suggestions as you edit</span>
              <span>Preview before export</span>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="story-section">
          <div className="shell story-grid">
            <div className="section-heading">
              <span className="eyebrow">How it works</span>
              <h2>From job post to application in three steps.</h2>
              <p>
                Start with the role you want, make focused changes, then review and export your resume.
              </p>
            </div>

            <div className="story-cards">
              <article className="story-card">
                <span className="story-step">01</span>
                <h3>Add the job description</h3>
                <p>Enter the role and paste its description to see the skills and language the employer is looking for.</p>
              </article>
              <article className="story-card">
                <span className="story-step">02</span>
                <h3>Bring your experience forward</h3>
                <p>Build or edit your resume with the match score and suggestions in view.</p>
              </article>
              <article className="story-card">
                <span className="story-step">03</span>
                <h3>Preview and export</h3>
                <p>Check the finished layout, download your PDF, and apply with a resume tailored to that role.</p>
              </article>
            </div>
          </div>
        </section>

        <section id="studio" className="studio-section" ref={studioRef}>
          <div className="shell">
            <div className="studio-heading">
              <div>
                <span className="eyebrow">Optimizer studio</span>
                <h2>Build your resume around the job you want.</h2>
              </div>

              <div className="studio-actions">
                <button type="button" className="secondary-button" onClick={loadSample}>
                  Load sample
                </button>
                <button type="button" className="ghost-button" onClick={resetWorkspace}>
                  Reset
                </button>
              </div>
            </div>

            {feedback && <div className="toast-banner">{feedback}</div>}

            <div className="studio-overview" aria-label="Studio summary">
              <article className={`overview-card overview-card-score${scoreMotionState !== 'idle' ? ` is-${scoreMotionState}` : ''}`}>
                <span className="panel-kicker">Projected match</span>
                <strong>{analysis.afterScore}/100</strong>
                <p>{scoreGuidance}</p>
              </article>
              <article className="overview-card">
                <span className="panel-kicker">Download name</span>
                <strong>{exportFileName}</strong>
                <p>Your PDF now exports with the actual candidate name instead of a generic filename.</p>
              </article>
              <article className="overview-card">
                <span className="panel-kicker">Resume format</span>
                <strong>Concise one-page ATS PDF</strong>
                <p>The live preview and exported PDF stay synchronized to the same clean layout.</p>
              </article>
            </div>

            <div className="studio-progress-strip" aria-label="Studio step progress">
              {studioStepCards.map((step) => (
                <article key={step.label} className={`studio-progress-card studio-progress-card-${step.state}`}>
                  <span className="studio-progress-kicker">{step.label}</span>
                  <strong>{step.title}</strong>
                  <p>{step.hint}</p>
                </article>
              ))}
            </div>

            <div className="studio-grid">
              <div className="studio-form-column">
                <section className="panel step-panel step-panel-connected">
                  <div className="panel-heading">
                    <div>
                      <span className="step-badge">Step 1</span>
                      <h3>Targeting brief</h3>
                    </div>
                  </div>

                  <p className="panel-intro">
                    Define the role, tone, and hiring brief first. This is the signal source that unlocks the rest of the Studio.
                  </p>

                  <div className="field-grid field-grid-2">
                    <label className="field">
                      <span>Target role</span>
                      <input
                        type="text"
                        id="targetRole"
                        name="targetRole"
                        value={targetRole}
                        onChange={(event) => setTargetRole(event.target.value)}
                        placeholder="e.g. Virtual Assistant, Admin Officer, Sales Executive, Frontend Engineer"
                      />
                    </label>

                    <label className="field">
                      <span>Experience level</span>
                      <select id="experienceLevel" name="experienceLevel" value={experienceLevel} onChange={(event) => setExperienceLevel(event.target.value as ExperienceLevel)}>
                        <option value="entry">Entry</option>
                        <option value="mid">Mid-level</option>
                        <option value="senior">Senior</option>
                        <option value="lead">Lead</option>
                      </select>
                    </label>
                  </div>

                  <div className="field-grid field-grid-2">
                    <label className="field">
                      <span>Summary tone</span>
                      <select id="summaryTone" name="summaryTone" value={summaryTone} onChange={(event) => setSummaryTone(event.target.value as SummaryTone)}>
                        <option value="balanced">Balanced</option>
                        <option value="strategic">Strategic</option>
                        <option value="technical">Technical</option>
                        <option value="concise">Concise</option>
                      </select>
                    </label>

                    <label
                      className={`switch-card${hasOptimizationPreviewContent ? '' : ' switch-card-disabled'}`}
                      title={!hasOptimizationPreviewContent ? 'Add experience details first to see AI optimizations.' : undefined}
                    >
                      <div>
                        <strong>Apply optimized content</strong>
                        <p id="applyOptimizationHint">
                          {hasOptimizationPreviewContent
                            ? 'Preview the ATS-refined summary and bullets instead of the raw draft.'
                            : 'Add experience details first to see AI optimizations.'}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        id="applyOptimization"
                        name="applyOptimization"
                        checked={applyOptimization}
                        onChange={(event) => setApplyOptimization(event.target.checked)}
                        disabled={!hasOptimizationPreviewContent}
                        aria-label="Apply optimized content"
                        aria-describedby="applyOptimizationHint"
                      />
                    </label>
                  </div>

                  <label className="field">
                    <span>Job description</span>
                    <textarea
                      className="guided-textarea"
                      id="jobDescription"
                      name="jobDescription"
                      rows={7}
                      value={jobDescription}
                      onChange={(event) => setJobDescription(event.target.value)}
                      placeholder={`Example:\nWe are hiring an Operations Coordinator to support scheduling, reporting, documentation, stakeholder communication, and process improvement across daily client delivery.`}
                    />
                  </label>
                </section>

                <section className={`panel gated-panel step-panel step-panel-connected${isOptimizationUnlocked ? '' : ' is-locked'}`} aria-disabled={!isOptimizationUnlocked}>
                  <div className="panel-heading">
                    <div>
                      <span className="step-badge">Step 2</span>
                      <h3>Resume basics</h3>
                    </div>
                  </div>

                  {!isOptimizationUnlocked && (
                    <p className="panel-lock-copy" role="note">
                      <i className="bi bi-lock-fill" /> {stepUnlockMessage}
                    </p>
                  )}

                  <div className="gated-panel-content" aria-hidden={!isOptimizationUnlocked}>
                    <div className="gated-panel-content-inner">
                      <p className="panel-intro">
                        These details become the resume header and opening summary in the live preview, so keep them direct and role-aligned.
                      </p>

                      <fieldset className="panel-fieldset" disabled={!isOptimizationUnlocked}>
                  <div className="field-grid field-grid-2">
                    <label className="field">
                      <span>Full name</span>
                      <input
                        type="text"
                        id="personalName"
                        name="personalName"
                        value={personalInfo.name}
                        onChange={(event) => setPersonalInfo({ ...personalInfo, name: event.target.value })}
                        placeholder="Your full name"
                      />
                    </label>

                    <label className="field">
                      <span>Email</span>
                      <input
                        type="email"
                        id="personalEmail"
                        name="personalEmail"
                        className={personalInfo.email && !validateEmail(personalInfo.email) ? 'invalid-field' : ''}
                        value={personalInfo.email}
                        onChange={(event) => setPersonalInfo({ ...personalInfo, email: event.target.value })}
                        placeholder="name@example.com"
                      />
                    </label>
                  </div>

                  <div className="field-grid field-grid-3">
                    <label className="field">
                      <span>Phone</span>
                      <input
                        type="tel"
                        id="personalPhone"
                        name="personalPhone"
                        value={personalInfo.phone}
                        onChange={(event) => setPersonalInfo({ ...personalInfo, phone: event.target.value })}
                        placeholder="+63 917 XXX XXXX"
                      />
                    </label>

                    <label className="field">
                      <span>Location</span>
                      <input
                        type="text"
                        id="personalLocation"
                        name="personalLocation"
                        value={personalInfo.address}
                        onChange={(event) => setPersonalInfo({ ...personalInfo, address: event.target.value })}
                        placeholder="City, Province"
                      />
                    </label>

                    <label className="field">
                      <span>LinkedIn or website</span>
                      <input
                        type="text"
                        id="personalLinkedin"
                        name="personalLinkedin"
                        value={personalInfo.linkedin}
                        onChange={(event) => setPersonalInfo({ ...personalInfo, linkedin: event.target.value })}
                        placeholder="linkedin.com/in/yourname"
                      />
                    </label>
                  </div>

                  <label className="field">
                    <span>Portfolio or website</span>
                    <input
                      type="text"
                      id="personalWebsite"
                      name="personalWebsite"
                      value={personalInfo.website}
                      onChange={(event) => setPersonalInfo({ ...personalInfo, website: event.target.value })}
                      placeholder="yourportfolio.com"
                    />
                  </label>

                  <label className="field">
                    <span>Current summary</span>
                    <textarea
                      className="guided-textarea"
                      id="personalSummary"
                      name="personalSummary"
                      rows={5}
                      value={personalInfo.summary}
                      onChange={(event) => setPersonalInfo({ ...personalInfo, summary: event.target.value })}
                      placeholder={`Example:\nResults-driven operations coordinator with experience in scheduling, documentation, reporting, and stakeholder communication across fast-moving teams.`}
                    />
                  </label>
                      </fieldset>
                    </div>
                  </div>
                </section>

                <section className={`panel gated-panel step-panel step-panel-connected${isOptimizationUnlocked ? '' : ' is-locked'}`} aria-disabled={!isOptimizationUnlocked}>
                  <div className="panel-heading">
                    <div>
                      <span className="step-badge">Step 3</span>
                      <h3>Experience</h3>
                    </div>
                  </div>

                  {!isOptimizationUnlocked && (
                    <p className="panel-lock-copy" role="note">
                      <i className="bi bi-lock-fill" /> {stepUnlockMessage}
                    </p>
                  )}

                  <div className="gated-panel-content" aria-hidden={!isOptimizationUnlocked}>
                    <div className="gated-panel-content-inner">
                      <p className="panel-intro">
                        Focus on real impact, ownership, and delivery. These bullets usually drive the biggest ATS score movement.
                      </p>

                      <fieldset className="panel-fieldset" disabled={!isOptimizationUnlocked}>
                  {experience.map((item, index) => (
                    <div key={item.id} className="repeat-card">
                      <div className="repeat-card-header">
                        <strong>Role {index + 1}</strong>
                        {experience.length > 1 && (
                          <button type="button" className="icon-button" onClick={() => removeArrayItem(setExperience, index)} aria-label={`Remove role ${index + 1}`}>
                            <i className="bi bi-trash3" />
                          </button>
                        )}
                      </div>

                      <div className="field-grid field-grid-2">
                        <label className="field">
                          <span>Job title</span>
                          <input
                            type="text"
                            id={`experience_jobTitle_${index}`}
                            name={`experience_jobTitle_${index}`}
                            value={item.jobTitle}
                            onChange={(event) => updateArrayItem(setExperience, index, 'jobTitle', event.target.value)}
                            placeholder="Senior Software Engineer"
                          />
                        </label>

                        <label className="field">
                          <span>Company</span>
                          <input
                            type="text"
                            id={`experience_company_${index}`}
                            name={`experience_company_${index}`}
                            value={item.company}
                            onChange={(event) => updateArrayItem(setExperience, index, 'company', event.target.value)}
                            placeholder="Tech Company PH"
                          />
                        </label>
                      </div>

                      <label className="field">
                        <span>Duration</span>
                        <input
                          type="text"
                          id={`experience_duration_${index}`}
                          name={`experience_duration_${index}`}
                          value={item.duration}
                          onChange={(event) => updateArrayItem(setExperience, index, 'duration', event.target.value)}
                          placeholder="2022 - Present"
                        />
                      </label>

                      <label className="field">
                        <span>What did you do?</span>
                        <textarea
                          id={`experience_description_${index}`}
                          name={`experience_description_${index}`}
                          rows={4}
                          ref={(node) => {
                            experienceDescriptionRefs.current[index] = node
                          }}
                          className={guidedFieldTarget?.type === 'experience' && guidedFieldTarget.index === index ? 'field-target' : ''}
                          value={item.description}
                          onChange={(event) => updateArrayItem(setExperience, index, 'description', event.target.value)}
                          placeholder="Add 2-4 sentences or bullet-style notes. ResuMay! will tighten them for ATS readability."
                        />
                      </label>
                    </div>
                  ))}

                  <div className="repeat-add-row">
                    <button
                      type="button"
                      className="secondary-button compact-button add-button add-button-bottom"
                      onClick={() => addArrayItem(setExperience, createExperience())}
                      disabled={!isOptimizationUnlocked}
                    >
                      <i className="bi bi-plus-circle" /> Add role
                    </button>
                  </div>
                      </fieldset>
                    </div>
                  </div>
                </section>

                <section className={`panel gated-panel step-panel${isOptimizationUnlocked ? '' : ' is-locked'}`} aria-disabled={!isOptimizationUnlocked}>
                  <div className="panel-heading">
                    <div>
                      <span className="step-badge">Step 4</span>
                      <h3>Skills and keyword coverage</h3>
                    </div>
                  </div>

                  {!isOptimizationUnlocked && (
                    <p className="panel-lock-copy" role="note">
                      <i className="bi bi-lock-fill" /> {stepUnlockMessage}
                    </p>
                  )}

                  <div className="gated-panel-content" aria-hidden={!isOptimizationUnlocked}>
                    <div className="gated-panel-content-inner">
                      <p className="panel-intro">
                        Add the skills recruiters expect to see, then use the suggested keyword chips to close the remaining signal gaps.
                      </p>

                      <fieldset className="panel-fieldset" disabled={!isOptimizationUnlocked}>
                  <div className="skill-entry">
                    <input
                      type="text"
                      id="pendingSkill"
                      name="pendingSkill"
                      ref={pendingSkillInputRef}
                      className={guidedFieldTarget?.type === 'skill' ? 'field-target' : ''}
                      value={pendingSkill}
                      onChange={(event) => setPendingSkill(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          addSkill()
                        }
                      }}
                      placeholder="Add a skill or keyword and press Enter"
                    />
                    <button type="button" className="secondary-button compact-button add-button" onClick={addSkill}>
                      <i className="bi bi-plus-circle" /> Add skill
                    </button>
                  </div>

                  <div className="keyword-cluster">
                    {skills.length ? (
                      skills.map((skill) => (
                        <button key={skill} type="button" className="tag-chip removable-chip" onClick={() => setSkills((current) => current.filter((item) => item !== skill))}>
                          {skill}
                          <i className="bi bi-x-lg" />
                        </button>
                      ))
                    ) : (
                      <p className="empty-note">Your skills and ATS keywords will appear here.</p>
                    )}
                  </div>

                  {analysis.missingKeywords.length > 0 && (
                    <div className="keyword-helper">
                      <strong>Suggested keywords from the target job</strong>
                      <div className="keyword-cluster">
                        {analysis.missingKeywords.slice(0, 8).map((keyword) => (
                          <button key={keyword} type="button" className="tag-chip suggestion-chip" onClick={() => guideKeywordToFix(keyword)}>
                            + {toDisplayKeyword(keyword)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                      </fieldset>
                    </div>
                  </div>
                </section>

                <section className={`panel gated-panel${isOptimizationUnlocked ? '' : ' is-locked'}`} aria-disabled={!isOptimizationUnlocked}>
                  <div className="panel-heading">
                    <div>
                      <span className="panel-kicker">Supporting sections</span>
                      <h3>Education and projects</h3>
                    </div>
                  </div>

                  {!isOptimizationUnlocked && (
                    <p className="panel-lock-copy" role="note">
                      <i className="bi bi-lock-fill" /> {stepUnlockMessage}
                    </p>
                  )}

                  <div className="gated-panel-content" aria-hidden={!isOptimizationUnlocked}>
                    <div className="gated-panel-content-inner">
                      <p className="panel-intro">
                        Use supporting sections only when they make the one-page story stronger, sharper, or more credible.
                      </p>

                      <fieldset className="panel-fieldset" disabled={!isOptimizationUnlocked}>
                  <div className="subpanel">
                    <div className="subpanel-heading">
                      <strong>Education</strong>
                      <button type="button" className="secondary-button compact-button add-button" onClick={() => addArrayItem(setEducation, createEducation())}>
                        <i className="bi bi-plus-circle" /> Add
                      </button>
                    </div>

                    {education.map((item, index) => (
                      <div key={item.id} className="repeat-card compact-repeat-card">
                        <div className="repeat-card-header">
                          <strong>Education {index + 1}</strong>
                          {education.length > 1 && (
                            <button type="button" className="icon-button" onClick={() => removeArrayItem(setEducation, index)} aria-label={`Remove education ${index + 1}`}>
                              <i className="bi bi-trash3" />
                            </button>
                          )}
                        </div>

                        <div className="field-grid field-grid-2">
                          <label className="field">
                            <span>Degree</span>
                            <input
                              type="text"
                              id={`education_degree_${index}`}
                              name={`education_degree_${index}`}
                              value={item.degree}
                              onChange={(event) => updateArrayItem(setEducation, index, 'degree', event.target.value)}
                              placeholder="BS Computer Science / BS Information Technology"
                            />
                          </label>

                          <label className="field">
                            <span>Year</span>
                            <input
                              type="text"
                              id={`education_year_${index}`}
                              name={`education_year_${index}`}
                              value={item.year}
                              onChange={(event) => updateArrayItem(setEducation, index, 'year', event.target.value)}
                              placeholder="2023"
                            />
                          </label>
                        </div>

                        <label className="field">
                          <span>School</span>
                          <input
                            type="text"
                            id={`education_school_${index}`}
                            name={`education_school_${index}`}
                            value={item.school}
                            onChange={(event) => updateArrayItem(setEducation, index, 'school', event.target.value)}
                            placeholder="UP / DLSU / Ateneo / UST"
                          />
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="subpanel">
                    <div className="subpanel-heading">
                      <strong>Projects</strong>
                      <button type="button" className="secondary-button compact-button add-button" onClick={() => addArrayItem(setProjects, createProject())}>
                        <i className="bi bi-plus-circle" /> Add
                      </button>
                    </div>

                    {projects.map((item, index) => (
                      <div key={item.id} className="repeat-card compact-repeat-card">
                        <div className="repeat-card-header">
                          <strong>Project {index + 1}</strong>
                          {projects.length > 1 && (
                            <button type="button" className="icon-button" onClick={() => removeArrayItem(setProjects, index)} aria-label={`Remove project ${index + 1}`}>
                              <i className="bi bi-trash3" />
                            </button>
                          )}
                        </div>

                        <label className="field">
                          <span>Project name</span>
                          <input
                            type="text"
                            id={`project_name_${index}`}
                            name={`project_name_${index}`}
                            value={item.name}
                            onChange={(event) => updateArrayItem(setProjects, index, 'name', event.target.value)}
                            placeholder="Analytics workspace"
                          />
                        </label>

                        <label className="field">
                          <span>Description</span>
                          <textarea
                            id={`project_description_${index}`}
                            name={`project_description_${index}`}
                            rows={3}
                            value={item.description}
                            onChange={(event) => updateArrayItem(setProjects, index, 'description', event.target.value)}
                            placeholder="What impact did the project have?"
                          />
                        </label>

                        <label className="field">
                          <span>Link</span>
                          <input
                            type="url"
                            id={`project_link_${index}`}
                            name={`project_link_${index}`}
                            value={item.link}
                            onChange={(event) => updateArrayItem(setProjects, index, 'link', event.target.value)}
                            placeholder="https://github.com/..."
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                      </fieldset>
                    </div>
                  </div>
                </section>

                <section className={`panel gated-panel${isOptimizationUnlocked ? '' : ' is-locked'}`} aria-disabled={!isOptimizationUnlocked}>
                  <div className="panel-heading">
                    <div>
                      <span className="panel-kicker">Optional credibility boosts</span>
                      <h3>Certifications and languages</h3>
                    </div>
                  </div>

                  {!isOptimizationUnlocked && (
                    <p className="panel-lock-copy" role="note">
                      <i className="bi bi-lock-fill" /> {stepUnlockMessage}
                    </p>
                  )}

                  <div className="gated-panel-content" aria-hidden={!isOptimizationUnlocked}>
                    <div className="gated-panel-content-inner">
                      <p className="panel-intro">
                        Add optional proof only if it strengthens trust without crowding the page or distracting from the core story.
                      </p>

                      <fieldset className="panel-fieldset" disabled={!isOptimizationUnlocked}>
                  <div className="subpanel">
                    <div className="subpanel-heading">
                      <strong>Certifications</strong>
                      <button type="button" className="secondary-button compact-button add-button" onClick={() => addArrayItem(setCertifications, createCertification())}>
                        <i className="bi bi-plus-circle" /> Add
                      </button>
                    </div>

                    {certifications.map((item, index) => (
                      <div key={item.id} className="repeat-card compact-repeat-card">
                        <div className="repeat-card-header">
                          <strong>Certification {index + 1}</strong>
                          {certifications.length > 1 && (
                            <button
                              type="button"
                              className="icon-button"
                              onClick={() => removeArrayItem(setCertifications, index)}
                              aria-label={`Remove certification ${index + 1}`}
                            >
                              <i className="bi bi-trash3" />
                            </button>
                          )}
                        </div>

                        <div className="field-grid field-grid-2">
                          <label className="field">
                            <span>Name</span>
                            <input
                              type="text"
                              id={`certification_name_${index}`}
                              name={`certification_name_${index}`}
                              value={item.name}
                              onChange={(event) => updateArrayItem(setCertifications, index, 'name', event.target.value)}
                              placeholder="AWS Cloud Practitioner"
                            />
                          </label>

                          <label className="field">
                            <span>Year</span>
                            <input
                              type="text"
                              id={`certification_year_${index}`}
                              name={`certification_year_${index}`}
                              value={item.year}
                              onChange={(event) => updateArrayItem(setCertifications, index, 'year', event.target.value)}
                              placeholder="2024"
                            />
                          </label>
                        </div>

                        <label className="field">
                          <span>Issuer</span>
                          <input
                            type="text"
                            id={`certification_issuer_${index}`}
                            name={`certification_issuer_${index}`}
                            value={item.issuer}
                            onChange={(event) => updateArrayItem(setCertifications, index, 'issuer', event.target.value)}
                            placeholder="Issuer"
                          />
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="subpanel">
                    <div className="subpanel-heading">
                      <strong>Languages</strong>
                      <button type="button" className="secondary-button compact-button add-button" onClick={() => addArrayItem(setLanguages, createLanguage())}>
                        <i className="bi bi-plus-circle" /> Add
                      </button>
                    </div>

                    {languages.map((item, index) => (
                      <div key={item.id} className="repeat-card compact-repeat-card">
                        <div className="repeat-card-header">
                          <strong>Language {index + 1}</strong>
                          {languages.length > 1 && (
                            <button type="button" className="icon-button" onClick={() => removeArrayItem(setLanguages, index)} aria-label={`Remove language ${index + 1}`}>
                              <i className="bi bi-trash3" />
                            </button>
                          )}
                        </div>

                        <div className="field-grid field-grid-2">
                          <label className="field">
                            <span>Name</span>
                            <input
                              type="text"
                              id={`language_name_${index}`}
                              name={`language_name_${index}`}
                              value={item.name}
                              onChange={(event) => updateArrayItem(setLanguages, index, 'name', event.target.value)}
                              placeholder="Tagalog / Bisaya / Ilokano"
                            />
                          </label>

                          <label className="field">
                            <span>Proficiency</span>
                            <select
                              id={`language_proficiency_${index}`}
                              name={`language_proficiency_${index}`}
                              value={item.proficiency}
                              onChange={(event) => updateArrayItem(setLanguages, index, 'proficiency', event.target.value)}
                            >
                              <option value="">Select</option>
                              <option value="Basic">Basic</option>
                              <option value="Professional">Professional</option>
                              <option value="Fluent">Fluent</option>
                              <option value="Native">Native</option>
                            </select>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                      </fieldset>
                    </div>
                  </div>
                </section>
              </div>

              <aside className="studio-side-column">
                <div className="sticky-stack">
                  <section className={`panel panel-contrast score-hud-card${scoreMotionState !== 'idle' ? ` is-${scoreMotionState}` : ''}`}>
                    <div className="score-hud-topbar">
                      <div>
                        <span className="panel-kicker">Live ATS score</span>
                        <div className="score-hud-inline">
                          <strong>{analysis.afterScore}%</strong>
                          <span>{analysis.beforeScore}% draft</span>
                          {scoreDelta > 0 && <span className="score-hud-delta">+{scoreDelta}</span>}
                        </div>
                      </div>
                      <button type="button" className="ghost-button compact-button score-hud-button" onClick={scrollToPreview}>
                        View preview
                      </button>
                    </div>

                    <div className="score-hud-bar" aria-hidden="true">
                      <span className="score-hud-bar-before" style={{ width: `${analysis.beforeScore}%` }} />
                      <span className="score-hud-bar-after" style={{ width: `${analysis.afterScore}%` }} />
                    </div>

                    <div className="score-hud-meta">
                      <span>{matchedSignalLabel}</span>
                      <span>{scoreGuidance}</span>
                    </div>

                    {recentScoreDelta !== null && scoreMotionState !== 'idle' && (
                      <div className={`score-feedback-note score-feedback-note-${scoreMotionState}`} role="status" aria-live="polite">
                        <i className={`bi ${scoreMotionState === 'celebrate' ? 'bi-stars' : 'bi-graph-up-arrow'}`} />
                        <span>
                          {scoreMotionState === 'celebrate'
                            ? `Score moved +${recentScoreDelta}. This draft is looking export-ready.`
                            : `Score moved +${recentScoreDelta}. Keep tightening the strongest signals.`}
                        </span>
                      </div>
                    )}
                  </section>

                  <section className="panel resume-panel sticky-preview-panel" ref={resumePanelRef}>
                    <div className="resume-panel-topbar">
                      <div>
                        <span className="panel-kicker">Output preview</span>
                        <h3>Optimized resume sheet</h3>
                        <div className="resume-panel-meta">
                          <span>1-page ATS format</span>
                          <span>{exportFileName}</span>
                        </div>
                      </div>

                      <div className="resume-actions">
                        <button type="button" className="ghost-button compact-button save-button" onClick={saveWorkspace}>
                          Save locally
                        </button>
                        <button type="button" className="primary-button compact-button export-button" onClick={generatePDF} disabled={!hasResumeCore}>
                          Export PDF
                        </button>
                      </div>
                    </div>

                    <div className="resume-workspace">
                      <div id="resume-preview" className="resume-sheet">
                        <header className="resume-header">
                          <h2 className={!personalInfo.name.trim() && shouldShowPreviewScaffold ? 'resume-placeholder' : undefined}>{previewName}</h2>
                          <p className="resume-role">
                            {previewHeadlineParts.map((part, index) => (
                              <span key={`${part}-${index}`} className={!resumeHeadlineParts.length && shouldShowPreviewScaffold ? 'resume-placeholder' : undefined}>
                                {part}
                              </span>
                            ))}
                          </p>
                          {previewContactItems.length > 0 && (
                            <div className="resume-contact-line">
                              {previewContactItems.map((item, index) => (
                                <span key={`${item}-${index}`} className={!resumeContactItems.length && shouldShowPreviewScaffold ? 'resume-placeholder' : undefined}>
                                  {item}
                                </span>
                              ))}
                            </div>
                          )}
                        </header>

                        {previewSummary && (
                          <section className="resume-section">
                            <h3>Professional Summary</h3>
                            <p className="resume-section-copy">
                              {resumeSummary
                                ? isResumeSummaryOptimized
                                  ? <span className="is-optimized">{resumeSummary}</span>
                                  : resumeSummary
                                : <span className="resume-placeholder">{previewSummary}</span>}
                            </p>
                          </section>
                        )}

                        {previewExperienceEntries.length > 0 && (
                          <section className="resume-section">
                            <h3>Work Experience</h3>
                            {previewExperienceEntries.map((item) => (
                              <article key={item.id} className="resume-role-block">
                                <div className="resume-role-row">
                                  <div>
                                    <strong className={!resumeExperienceEntries.length && shouldShowPreviewScaffold ? 'resume-placeholder' : undefined}>{item.jobTitle}</strong>
                                    <span className={!resumeExperienceEntries.length && shouldShowPreviewScaffold ? 'resume-placeholder' : undefined}>{item.company}</span>
                                  </div>
                                  {item.duration && <em className={!resumeExperienceEntries.length && shouldShowPreviewScaffold ? 'resume-placeholder' : undefined}>{item.duration}</em>}
                                </div>

                                {item.bullets.length > 0 && (
                                  <ul className="resume-bullets">
                                    {item.bullets.map((bullet, bulletIndex) => (
                                      <li key={`${item.id}-bullet-${bulletIndex}`}>
                                        {bullet.isOptimized
                                          ? <span className="is-optimized">{bullet.text}</span>
                                          : <span className={!resumeExperienceEntries.length && shouldShowPreviewScaffold ? 'resume-placeholder' : undefined}>{bullet.text}</span>}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </article>
                            ))}
                          </section>
                        )}

                        {previewEducationEntries.length > 0 && (
                          <section className="resume-section">
                            <h3>Education</h3>
                            {previewEducationEntries.map((item) => (
                              <article key={item.id} className="resume-inline-block">
                                <strong className={!resumeEducationEntries.length && shouldShowPreviewScaffold ? 'resume-placeholder' : undefined}>{item.degree}</strong>
                                <p className={!resumeEducationEntries.length && shouldShowPreviewScaffold ? 'resume-placeholder' : undefined}>
                                  {item.school}
                                  {item.year ? ` | ${item.year}` : ''}
                                </p>
                              </article>
                            ))}
                          </section>
                        )}

                        {previewSkillGroups.length > 0 && (
                          <section className="resume-section">
                            <h3>Skills</h3>
                            <ul className="resume-bullets resume-bullets-compact">
                              {previewSkillGroups.map((group, index) => (
                                <li key={index} className={!resumeSkillGroups.length && shouldShowPreviewScaffold ? 'resume-placeholder' : undefined}>{group.join(', ')}</li>
                              ))}
                            </ul>
                            {previewLanguages.length > 0 && (
                              <p className="resume-section-note">
                                <strong>Languages:</strong>{' '}
                                <span className={!resumeLanguages.length && shouldShowPreviewScaffold ? 'resume-placeholder' : undefined}>
                                  {previewLanguages.join(', ')}
                                </span>
                              </p>
                            )}
                          </section>
                        )}

                        {previewCertifications.length > 0 && (
                          <section className="resume-section">
                            <h3>Certifications</h3>
                            <ul className="resume-bullets resume-bullets-compact">
                              {previewCertifications.map((item) => (
                                <li key={item.id}>
                                  <span className={!resumeCertifications.length && shouldShowPreviewScaffold ? 'resume-placeholder' : undefined}>
                                    {item.name}
                                  </span>
                                  {[item.issuer, item.year].filter(Boolean).length
                                    ? ` | ${[item.issuer, item.year].filter(Boolean).join(' | ')}`
                                    : ''}
                                </li>
                              ))}
                            </ul>
                          </section>
                        )}

                        {showProjectsInResume && (
                          <section className="resume-section">
                            <h3>Projects</h3>
                            {resumeProjects.map((item) => (
                              <article key={item.id} className="resume-inline-block">
                                <strong>{item.name}</strong>
                                <p>{truncateText(item.description, 120)}</p>
                                {item.link && <span className="resume-link-line">{normalizeExternalUrl(item.link)}</span>}
                              </article>
                            ))}
                          </section>
                        )}
                      </div>
                    </div>
                  </section>
                </div>
              </aside>
            </div>

          </div>
        </section>

        <section className="reviews-section" aria-labelledby="reviews-title">
          <div className="shell reviews-results-shell">
            <div className="reviews-results-header">
              <span className="reviews-results-kicker">Results</span>
              <h2 id="reviews-title">{hasPublishedReviews ? 'From quiet applications to interview offers' : 'ResuMay review results will appear here'}</h2>
              <p>
                {hasPublishedReviews
                  ? 'A wall of verified outcomes across local PH roles, global remote hires, fresh graduates, and senior operators.'
                  : 'ResuMay! is new, so this section stays empty until real users export a resume and publish their review.'}
              </p>

              <div
                className="reviews-scoreline"
                aria-label={
                  hasPublishedReviews
                    ? `Average review rating ${averageReviewRating.toFixed(1)} from ${reviewCount} reviews`
                    : 'No published user reviews yet'
                }
              >
                {hasPublishedReviews && (
                  <div className="review-rating review-rating-summary" aria-hidden="true">
                    {[0, 1, 2, 3, 4].map((index) => (
                      <i key={`summary-star-${index}`} className={`bi ${getStarIcon(averageReviewRating, index)}`} />
                    ))}
                  </div>
                )}
                <strong>{hasPublishedReviews ? averageReviewRating.toFixed(1) : '0.0'}</strong>
                <span className="reviews-scoreline-divider">&middot;</span>
                <span>{hasPublishedReviews ? `${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}` : 'No reviews yet'}</span>
              </div>
            </div>
          </div>

          <div className="shell reviews-wall">
            {displayedResults.length ? (
              displayedResults.map((review) => (
                <article key={review.id} className="review-card review-result-card">
                  <div className="review-result-card-topbar">
                    <div className="review-rating" aria-label={`${clampReviewRating(review.rating)} star review`}>
                      {[0, 1, 2, 3, 4].map((index) => (
                        <i key={`${review.id}-star-${index}`} className={`bi ${getStarIcon(clampReviewRating(review.rating), index)}`} />
                      ))}
                    </div>
                    <span className="review-board-badge">{review.board}</span>
                  </div>

                  <p className="review-quote">"{review.quote}"</p>

                  <div className="review-result-card-footer">
                    <div className="review-identity">
                      <span className="review-avatar" aria-hidden="true">
                        {review.name.charAt(0)}
                      </span>
                      <div>
                        <strong>{review.name}</strong>
                        <p>{review.outcome}</p>
                        <span className="review-role-line">{review.role}</span>
                      </div>
                    </div>
                    <span className="review-score-delta" aria-label={`Lift from ${review.scoreBefore}% to ${review.scoreAfter}%`}>
                      <span className="review-score-before">{review.scoreBefore}%</span>
                      <i className="bi bi-arrow-right" aria-hidden="true" />
                      <span className="review-score-after">{review.scoreAfter}%</span>
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <article className="review-card review-empty-card">
                <span className="reviews-empty-kicker">No published reviews yet</span>
                <h3>Be the first ResuMay success story on this wall.</h3>
                <p>
                  Once a user finishes and exports a resume, they can submit a review and it will appear here immediately.
                </p>
              </article>
              )}
            </div>

          {hasPublishedReviews && totalPages > 1 && (
            <div className="shell reviews-wall-actions">
              <button
                type="button"
                className="review-results-anchor"
                onClick={() => setCurrentReviewPage((current) => Math.max(1, current - 1))}
                disabled={currentReviewPage === 1}
              >
                ← Previous
              </button>
              <span className="review-pagination-info">Page {currentReviewPage} of {totalPages}</span>
              <button
                type="button"
                className="review-results-anchor"
                onClick={() => setCurrentReviewPage((current) => Math.min(totalPages, current + 1))}
                disabled={currentReviewPage === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </section>

        <section className="review-share-section" aria-labelledby="review-share-title">
          <div className="shell">
            <div className="section-heading review-share-heading">
              <span className="eyebrow">Publish your result</span>
              <h2 id="review-share-title">Share what changed after you used ResuMay!.</h2>
              <p>After export, publish a short review so other job seekers can see the role, the outcome, and the score lift.</p>
            </div>

            <div className="review-submission-grid">
              <section className="panel review-form-panel">
                <div className="panel-heading">
                  <div>
                    <span className="panel-kicker">Publish your result</span>
                    <h3>Submit your ResuMay review</h3>
                  </div>
                  <span className={`panel-badge ${canSubmitReview ? 'panel-badge-success' : 'panel-badge-neutral'}`}>
                    {canSubmitReview ? 'Unlocked' : 'Locked'}
                  </span>
                </div>

                <p className="review-form-copy">{reviewSubmissionHint}</p>

                <fieldset className="panel-fieldset" disabled={!canSubmitReview}>
                  <div className="field-grid field-grid-2">
                    <label className="field">
                      <span>Name</span>
                      <input
                        type="text"
                        id="reviewName"
                        name="reviewName"
                        value={reviewDraft.name}
                        onChange={(event) => updateReviewDraft('name', event.target.value)}
                        placeholder={personalInfo.name || 'Your name'}
                      />
                    </label>

                    <label className="field">
                      <span>Target role</span>
                      <input
                        type="text"
                        id="reviewRole"
                        name="reviewRole"
                        value={reviewDraft.role}
                        onChange={(event) => updateReviewDraft('role', event.target.value)}
                        placeholder={targetRole || 'Operations Coordinator'}
                      />
                    </label>
                  </div>

                  <div className="field-grid field-grid-3">
                    <label className="field">
                      <span>Job board</span>
                      <input
                        type="text"
                        id="reviewBoard"
                        name="reviewBoard"
                        value={reviewDraft.board}
                        onChange={(event) => updateReviewDraft('board', event.target.value)}
                        placeholder="LinkedIn, OnlineJobs.ph, JobStreet by SEEK"
                      />
                    </label>

                    <label className="field">
                      <span>Rating</span>
                      <select
                        id="reviewRating"
                        name="reviewRating"
                        value={reviewDraft.rating}
                        onChange={(event) => updateReviewDraft('rating', Number(event.target.value))}
                      >
                        <option value={5}>5 stars</option>
                        <option value={4}>4 stars</option>
                        <option value={3}>3 stars</option>
                        <option value={2}>2 stars</option>
                        <option value={1}>1 star</option>
                      </select>
                    </label>

                    <label className="field">
                      <span>Outcome</span>
                      <input
                        type="text"
                        id="reviewOutcome"
                        name="reviewOutcome"
                        value={reviewDraft.outcome}
                        onChange={(event) => updateReviewDraft('outcome', event.target.value)}
                        placeholder="e.g. 2 callbacks in one week"
                      />
                    </label>
                  </div>

                  <label className="field">
                    <span>Your review</span>
                    <textarea
                      className="guided-textarea"
                      id="reviewQuote"
                      name="reviewQuote"
                      rows={5}
                      value={reviewDraft.quote}
                      onChange={(event) => updateReviewDraft('quote', event.target.value)}
                      placeholder="Example:
ResuMay made it easier to see which keywords were missing, so I tightened my summary, cleaned up my bullets, and my resume started feeling more ATS-ready."
                    />
                  </label>

                  <div className="review-form-footer">
                    <div className="review-submission-note">
                      <strong>{analysis.beforeScore}% to {analysis.afterScore}%</strong>
                      <span>Your current ATS score delta will be attached to this review.</span>
                    </div>

                    <button type="button" className="primary-button" onClick={submitReview} disabled={!canSubmitReview}>
                      Publish my result
                    </button>
                  </div>
                </fieldset>
              </section>
            </div>
          </div>
        </section>

        <section id="faq" className="faq-section">
          <div className="shell">
            <div className="section-heading">
              <span className="eyebrow">Why ResuMay!</span>
              <h2>Built for real job applications, not generic resume polishing.</h2>
            </div>

            <div className="faq-grid">
              <article className="faq-card">
                <h3>Does this only work for tech resumes?</h3>
                <p>
                  No. ResuMay! works across admin, VA, support, sales, marketing, operations, creative, and technical roles
                  because the workflow starts from the job description, not a single template niche.
                </p>
              </article>
              <article className="faq-card">
                <h3>Which job boards is it built for?</h3>
                <p>
                  It is designed for applications sent through OnlineJobs.ph, Bossjob, HiringCafe, Kalibrr, LinkedIn,
                  JobStreet by SEEK, Upwork, Indeed, and similar online hiring platforms.
                </p>
              </article>
              <article className="faq-card">
                <h3>What does the match score help me see?</h3>
                <p>
                  The match score gives you a fast read on how much of the job description your current draft is covering, so
                  you can improve weak areas before sending the application.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="closing-cta">
          <div className="shell closing-card">
            <div>
              <span className="eyebrow">Ready to strengthen your next application?</span>
              <h2>Give every application a resume that feels targeted, credible, and easier to shortlist.</h2>
              <p>Paste the role, refine the content, and export the version you want recruiters to see.</p>
            </div>
            <button type="button" className="primary-button closing-cta-button" onClick={scrollToStudio}>
              Start in the studio
            </button>
          </div>
        </section>

        <footer className="app-footer">
          <div className="shell">
            <p>Developed by FUMARDev - ResuMay! 2024</p>
          </div>
        </footer>

        <button type="button" className="mobile-score-dock" onClick={scrollToPreview} aria-label={`ATS score ${analysis.afterScore} percent. View output preview.`}>
          <span className="mobile-score-dock-label">ATS score</span>
          <strong>{analysis.afterScore}%</strong>
          <span className="mobile-score-dock-action">View preview</span>
        </button>
      </main>
    </div>
  )
}

export default App

