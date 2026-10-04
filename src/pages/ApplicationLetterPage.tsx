import { useState } from 'react'
import { SiteLayout } from '../components/SiteLayout'
import { readSavedResumeDetails } from '../utils/resumeStorage'

export default function ApplicationLetterPage() {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  const [recipient, setRecipient] = useState('')
  const [experience, setExperience] = useState('')
  const [motivation, setMotivation] = useState('')
  const [letter, setLetter] = useState('')
  const [message, setMessage] = useState('')

  const loadSavedResume = () => {
    const details = readSavedResumeDetails()
    if (!details?.resumeText) {
      setMessage('No saved resume found. Add your details here or save a draft in Resume Builder first.')
      return
    }

    setName(details.name)
    setRole(details.targetRole)
    setExperience(details.highlights || details.resumeText)
    setMessage('Loaded your saved resume details. Review and edit them before drafting your letter.')
  }

  const createLetter = () => {
    if (!role.trim()) {
      setMessage('Add the role you are applying for first.')
      return
    }
    if (!experience.trim() && !motivation.trim()) {
      setMessage('Add at least one relevant experience detail or a reason you want the role.')
      return
    }

    const greeting = recipient.trim() ? `Dear ${recipient.trim()},` : 'Dear Hiring Manager,'
    const companyPhrase = company.trim() ? ` at ${company.trim()}` : ''
    const paragraphs = [
      greeting,
      `I am writing to apply for the ${role.trim()} position${companyPhrase}.`,
      experience.trim() ? `My relevant background includes ${experience.trim()}` : '',
      motivation.trim() ? motivation.trim() : '',
      'Thank you for considering my application. I would welcome the chance to discuss how my experience could support your team.',
      `Sincerely,\n${name.trim() || '[Your name]'}`,
    ].filter(Boolean)

    setLetter(paragraphs.join('\n\n'))
    setMessage('Draft created. Review the wording and make it your own before sending.')
  }

  const copyLetter = async () => {
    if (!letter.trim()) return
    try {
      await navigator.clipboard.writeText(letter)
      setMessage('Letter copied to your clipboard.')
    } catch {
      setMessage('Copy is unavailable here. Select the letter text and copy it manually.')
    }
  }

  const downloadLetter = () => {
    if (!letter.trim()) return
    const file = new Blob([letter], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = 'application-letter.txt'
    link.click()
    URL.revokeObjectURL(url)
    setMessage('Text file downloaded.')
  }

  return (
    <SiteLayout activePage="letter">
      <main className="site-main tool-page letter-page">
        <div className="site-shell tool-shell">
          <header className="tool-heading">
            <span className="page-kicker">Application letter</span>
            <h1>Write a note that sounds like you.</h1>
            <p>Add the details you want to share. We’ll shape them into an editable first draft without adding experience for you.</p>
          </header>

          <div className="letter-workspace">
            <section className="tool-form-card letter-details-card">
              <div className="tool-card-heading">
                <div><span className="tool-overline">Your details</span><h2>Start with the essentials</h2></div>
                <button className="text-button saved-draft-button" type="button" onClick={loadSavedResume}>
                  <i className="bi bi-folder2-open" aria-hidden="true" /> Use saved resume
                </button>
              </div>
              <div className="letter-field-grid">
                <label className="tool-field"><span>Your name</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" /></label>
                <label className="tool-field"><span>Role you want</span><input value={role} onChange={(event) => setRole(event.target.value)} placeholder="e.g. Operations Coordinator" /></label>
                <label className="tool-field"><span>Company <small>Optional</small></span><input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Company name" /></label>
                <label className="tool-field"><span>Hiring manager <small>Optional</small></span><input value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="Name, if known" /></label>
              </div>
              <label className="tool-field"><span>Relevant experience or proof</span><textarea rows={5} value={experience} onChange={(event) => setExperience(event.target.value)} placeholder="What experience, achievement, or strength should the employer know about?" /></label>
              <label className="tool-field"><span>Why this role interests you <small>Optional</small></span><textarea rows={3} value={motivation} onChange={(event) => setMotivation(event.target.value)} placeholder="Add a specific reason you want to work with this team or in this role." /></label>
              <div className="tool-form-footer">
                <p className="tool-privacy-note"><i className="bi bi-shield-check" aria-hidden="true" /> Drafted in this browser.</p>
                <button className="primary-button" type="button" onClick={createLetter}><i className="bi bi-pencil-square" aria-hidden="true" /> Create first draft</button>
              </div>
            </section>

            <section className="letter-output-card">
              <div className="tool-card-heading letter-output-heading">
                <div><span className="tool-overline">Editable draft</span><h2>Your application letter</h2></div>
                <div className="letter-output-actions">
                  <button className="secondary-button compact-button" type="button" onClick={copyLetter} disabled={!letter.trim()}><i className="bi bi-copy" aria-hidden="true" /> Copy</button>
                  <button className="secondary-button compact-button" type="button" onClick={downloadLetter} disabled={!letter.trim()}><i className="bi bi-download" aria-hidden="true" /> Download</button>
                </div>
              </div>
              <textarea className="letter-output" aria-label="Editable application letter draft" value={letter} onChange={(event) => setLetter(event.target.value)} placeholder="Your first draft will appear here. You can edit it before copying or downloading." />
              <p className="letter-review-note"><i className="bi bi-info-circle" aria-hidden="true" /> Check every detail and personalize the draft before you send it.</p>
              {message && <p className="tool-status" role="status">{message}</p>}
            </section>
          </div>
        </div>
      </main>
    </SiteLayout>
  )
}
