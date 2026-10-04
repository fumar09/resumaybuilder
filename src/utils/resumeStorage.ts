export const RESUME_STORAGE_KEY = 'resumeMayOptimizerData'

export interface SavedResumeDetails {
  resumeText: string
  highlights: string
  jobDescription: string
  targetRole: string
  name: string
}

const readText = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

export function readSavedResumeDetails(): SavedResumeDetails | null {
  try {
    const raw = localStorage.getItem(RESUME_STORAGE_KEY)
    if (!raw) return null

    const saved = JSON.parse(raw) as Record<string, unknown>
    const personalInfo = (saved.personalInfo ?? {}) as Record<string, unknown>
    const sections = [
      readText(personalInfo.name),
      readText(personalInfo.email),
      readText(personalInfo.phone),
      readText(personalInfo.address),
      readText(personalInfo.summary),
    ]
    const highlights = [readText(personalInfo.summary)]

    const experiences = Array.isArray(saved.experience) ? saved.experience : []
    experiences.forEach((value) => {
      const item = value as Record<string, unknown>
      const title = [readText(item.jobTitle), readText(item.company)].filter(Boolean).join(' at ')
      const description = readText(item.description)
      sections.push(title, readText(item.duration), description)
      if (title || description) highlights.push([title, description].filter(Boolean).join(': '))
    })

    const education = Array.isArray(saved.education) ? saved.education : []
    education.forEach((value) => {
      const item = value as Record<string, unknown>
      sections.push(readText(item.degree), readText(item.school), readText(item.year))
    })

    const projects = Array.isArray(saved.projects) ? saved.projects : []
    projects.forEach((value) => {
      const item = value as Record<string, unknown>
      sections.push(readText(item.name), readText(item.description))
    })

    const certifications = Array.isArray(saved.certifications) ? saved.certifications : []
    certifications.forEach((value) => {
      const item = value as Record<string, unknown>
      sections.push(readText(item.name), readText(item.issuer), readText(item.year))
    })

    const skills = Array.isArray(saved.skills) ? saved.skills.map(readText) : []
    const languages = Array.isArray(saved.languages)
      ? saved.languages.flatMap((value) => {
          const item = value as Record<string, unknown>
          return [readText(item.name), readText(item.proficiency)]
        })
      : []

    return {
      resumeText: [...sections, ...skills, ...languages].filter(Boolean).join('\n'),
      highlights: highlights.filter(Boolean).join('\n'),
      jobDescription: readText(saved.jobDescription),
      targetRole: readText(saved.targetRole),
      name: readText(personalInfo.name),
    }
  } catch {
    return null
  }
}
