import { SiteLayout } from './components/SiteLayout'
import { RESUME_STORAGE_KEY as STORAGE_KEY } from './utils/resumeStorage'
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'

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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
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

function ResumeBuilderPage() {
  const studioRef = useRef<HTMLElement | null>(null)
  const resumePanelRef = useRef<HTMLElement | null>(null)
  const feedbackTimeoutRef = useRef<number | null>(null)
  const scoreMotionTimeoutRef = useRef<number | null>(null)
  const scrollTimeoutRef = useRef<number | null>(null)
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
  const [guidedFieldTarget, setGuidedFieldTarget] = useState<GuidedFieldTarget | null>(null)

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
  const scoreDelta = Math.max(analysis.afterScore - analysis.beforeScore, 0)
  const matchedSignalLabel = analysis.trackedKeywords.length
    ? `${analysis.matchedKeywords.length} of ${analysis.trackedKeywords.length} signals matched`
    : 'Paste a job description to start matching.'
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

  const addArrayItem = <T,>(setter: Dispatch<SetStateAction<T[]>>, item: T) => {
    setter((current) => [...current, item])
  }

  const removeArrayItem = <T,>(setter: Dispatch<SetStateAction<T[]>>, index: number) => {
    setter((current) => (current.length > 1 ? current.filter((_, itemIndex) => itemIndex !== index) : current))
  }

  return (
    <SiteLayout activePage="builder">
      <main className="site-main builder-page">
        <section id="studio" className="studio-section" ref={studioRef}>
          <div className="shell">
            <div className="studio-heading">
              <div>
                <span className="eyebrow">Resume builder</span>
                <h2>A focused resume for your next role.</h2>
                <p>Start with the job post, add your experience, and check the preview as you go.</p>
              </div>

              <div className="studio-actions">
                <button type="button" className="secondary-button" onClick={loadSample}>
                  Use sample
                </button>
                <button type="button" className="ghost-button" onClick={resetWorkspace}>
                  Reset
                </button>
              </div>
            </div>

            {feedback && <div className="toast-banner">{feedback}</div>}

            <div className="studio-grid">
              <div className="studio-form-column">
                <section className="panel step-panel step-panel-connected">
                  <div className="panel-heading">
                    <div>
                      <span className="step-badge">Step 1</span>
                      <h3>Targeting brief</h3>
                    </div>
                  </div>

                  <label className="field">
                    <span>Target role</span>
                    <input
                      type="text"
                      id="targetRole"
                      name="targetRole"
                      value={targetRole}
                      onChange={(event) => setTargetRole(event.target.value)}
                      placeholder="e.g. Virtual Assistant, Admin Officer, Sales Executive"
                    />
                  </label>

                  <details className="builder-preferences">
                    <summary>Matching preferences</summary>
                    <div className="field-grid field-grid-2">
                      <label className="field">
                        <span>Experience level</span>
                        <select id="experienceLevel" name="experienceLevel" value={experienceLevel} onChange={(event) => setExperienceLevel(event.target.value as ExperienceLevel)}>
                          <option value="entry">Entry</option>
                          <option value="mid">Mid-level</option>
                          <option value="senior">Senior</option>
                          <option value="lead">Lead</option>
                        </select>
                      </label>
                      <label className="field">
                        <span>Summary tone</span>
                        <select id="summaryTone" name="summaryTone" value={summaryTone} onChange={(event) => setSummaryTone(event.target.value as SummaryTone)}>
                          <option value="balanced">Balanced</option>
                          <option value="strategic">Strategic</option>
                          <option value="technical">Technical</option>
                          <option value="concise">Concise</option>
                        </select>
                      </label>
                    </div>
                  </details>

                  <label
                    className={`switch-card${hasOptimizationPreviewContent ? '' : ' switch-card-disabled'}`}
                    title={!hasOptimizationPreviewContent ? 'Add experience details first to see suggestions.' : undefined}
                  >
                    <div>
                      <strong>Use suggested wording</strong>
                      <p id="applyOptimizationHint">
                        {hasOptimizationPreviewContent
                          ? 'Show the suggested summary and experience wording in your preview.'
                          : 'Add experience details to see suggested wording.'}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      id="applyOptimization"
                      name="applyOptimization"
                      checked={applyOptimization}
                      onChange={(event) => setApplyOptimization(event.target.checked)}
                      disabled={!hasOptimizationPreviewContent}
                      aria-label="Use suggested wording in the preview"
                      aria-describedby="applyOptimizationHint"
                    />
                  </label>

                  <label className="field">
                    <span>Job description</span>
                    <textarea
                      className="guided-textarea"
                      id="jobDescription"
                      name="jobDescription"
                      rows={5}
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

                <details className="builder-optional-sections">
                  <summary>
                    <strong>Optional resume sections</strong>
                    <span>Education, projects, certifications, and languages</span>
                  </summary>
                  <div className="builder-optional-content">
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
                </details>
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
      </main>
    </SiteLayout>
  )
}

export default ResumeBuilderPage

