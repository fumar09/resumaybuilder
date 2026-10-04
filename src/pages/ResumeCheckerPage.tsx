import { useMemo, useState } from 'react'
import { SiteLayout } from '../components/SiteLayout'
import { readSavedResumeDetails } from '../utils/resumeStorage'

const ignoredWords = new Set([
  'about', 'above', 'across', 'after', 'also', 'among', 'and', 'any', 'are', 'because', 'been', 'being', 'both',
  'can', 'candidate', 'could', 'each', 'from', 'have', 'into', 'including', 'must', 'our', 'role', 'should', 'such',
  'team', 'their', 'then', 'these', 'this', 'those', 'through', 'under', 'using', 'will', 'with', 'work', 'your',
])

function getJobTerms(text: string) {
  const counts = new Map<string, number>()
  const tokens = text.toLowerCase().match(/[a-z][a-z0-9+#.-]{2,}/g) ?? []

  tokens.forEach((token) => {
    const term = token.replace(/[.-]+$/g, '')
    if (term.length < 3 || ignoredWords.has(term)) return
    counts.set(term, (counts.get(term) ?? 0) + 1)
  })

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 18)
    .map(([term]) => term)
}

export default function ResumeCheckerPage() {
  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [hasChecked, setHasChecked] = useState(false)
  const [message, setMessage] = useState('')
  const jobTerms = useMemo(() => getJobTerms(jobDescription), [jobDescription])
  const resumeTerms = useMemo(() => new Set((resumeText.toLowerCase().match(/[a-z][a-z0-9+#.-]{2,}/g) ?? [])), [resumeText])
  const matchedTerms = jobTerms.filter((term) => resumeTerms.has(term))
  const missingTerms = jobTerms.filter((term) => !resumeTerms.has(term))
  const score = jobTerms.length ? Math.round((matchedTerms.length / jobTerms.length) * 100) : 0

  const loadSavedDraft = () => {
    const details = readSavedResumeDetails()
    if (!details?.resumeText) {
      setMessage('No saved resume found yet. Build and save one first, or paste your resume below.')
      return
    }

    setResumeText(details.resumeText)
    if (details.jobDescription) setJobDescription(details.jobDescription)
    setHasChecked(false)
    setMessage(details.targetRole ? `Loaded your saved draft for ${details.targetRole}.` : 'Loaded your saved resume draft.')
  }

  const checkResume = () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      setHasChecked(false)
      setMessage('Add both your resume and the job description to see their keyword overlap.')
      return
    }
    setHasChecked(true)
    setMessage('Keyword comparison updated.')
  }

  return (
    <SiteLayout activePage="checker">
      <main className="site-main tool-page checker-page">
        <div className="site-shell tool-shell">
          <header className="tool-heading">
            <span className="page-kicker">Resume checker</span>
            <h1>See how your resume lines up with the job.</h1>
            <p>Paste both documents to find shared terms and keywords you may want to address.</p>
          </header>

          <div className="tool-workspace checker-workspace">
            <section className="tool-form-card" aria-label="Resume and job description">
              <div className="tool-card-heading">
                <h2>Your documents</h2>
                <button className="text-button saved-draft-button" type="button" onClick={loadSavedDraft}>
                  <i className="bi bi-folder2-open" aria-hidden="true" /> Use saved draft
                </button>
              </div>
              <label className="tool-field">
                <span>Your resume</span>
                <textarea
                  rows={11}
                  value={resumeText}
                  onChange={(event) => setResumeText(event.target.value)}
                  placeholder="Paste the text from your resume here…"
                />
                <small>Paste text from your document. File upload is not required.</small>
              </label>
              <label className="tool-field">
                <span>Job description</span>
                <textarea
                  rows={9}
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  placeholder="Paste the job description you are applying to…"
                />
              </label>
              <div className="tool-form-footer">
                <p className="tool-privacy-note"><i className="bi bi-shield-check" aria-hidden="true" /> Compared in this browser.</p>
                <button type="button" className="primary-button" onClick={checkResume}>
                  Check keyword overlap
                </button>
              </div>
              {message && <p className="tool-status" role="status">{message}</p>}
            </section>

            <aside className="checker-results" aria-live="polite">
              {!hasChecked ? (
                <div className="checker-empty-state">
                  <span className="checker-empty-icon"><i className="bi bi-clipboard2-check" aria-hidden="true" /></span>
                  <h2>Your comparison will appear here.</h2>
                  <p>We’ll show exact keyword overlap and terms from the job post that aren’t in your pasted resume.</p>
                </div>
              ) : (
                <>
                  <section className="checker-score-card">
                    <span className="tool-overline">Keyword overlap guide</span>
                    <div className="checker-score-line">
                      <strong>{score}%</strong>
                      <span>{matchedTerms.length} of {jobTerms.length} job terms found</span>
                    </div>
                    <div className="checker-score-track" role="progressbar" aria-label="Keyword overlap" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score}>
                      <span style={{ width: `${score}%` }} />
                    </div>
                    <p>This is a simple keyword comparison, not an ATS prediction or a measure of your qualifications.</p>
                  </section>
                  <section className="checker-term-card">
                    <h2><i className="bi bi-check-circle-fill" aria-hidden="true" /> Found in your resume</h2>
                    {matchedTerms.length ? (
                      <div className="tool-chip-list">{matchedTerms.map((term) => <span className="tool-chip is-found" key={term}>{term}</span>)}</div>
                    ) : <p>No exact matches found in the selected job terms yet.</p>}
                  </section>
                  <section className="checker-term-card">
                    <h2><i className="bi bi-plus-circle" aria-hidden="true" /> Consider addressing</h2>
                    {missingTerms.length ? (
                      <div className="tool-chip-list">{missingTerms.map((term) => <span className="tool-chip" key={term}>{term}</span>)}</div>
                    ) : <p>All selected job terms are present in your pasted resume.</p>}
                    <p className="checker-hint">Only add a term when it truthfully describes your experience.</p>
                  </section>
                </>
              )}
            </aside>
          </div>
        </div>
      </main>
    </SiteLayout>
  )
}
