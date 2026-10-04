import { SiteLayout } from '../components/SiteLayout'

const tools = [
  {
    href: '/resume-builder',
    icon: 'bi-file-earmark-person',
    title: 'Resume builder',
    copy: 'Build a clean resume around your experience and the role you want.',
    action: 'Build a resume',
  },
  {
    href: '/resume-checker',
    icon: 'bi-search',
    title: 'Resume checker',
    copy: 'Compare your resume with a job post and spot useful keywords to review.',
    action: 'Check a resume',
  },
  {
    href: '/application-letter',
    icon: 'bi-envelope-paper',
    title: 'Application letter',
    copy: 'Turn your real experience and interest into a focused first draft.',
    action: 'Write a letter',
  },
]

export default function LandingPage() {
  return (
    <SiteLayout activePage="home">
      <main className="site-main landing-page">
        <section className="site-shell landing-hero">
          <div className="landing-copy">
            <span className="page-kicker">Your next application, made clearer</span>
            <h1>Make your experience easy to see.</h1>
            <p>
              Build a focused resume, check it against a job post, and prepare an application letter—all in one simple place.
            </p>
            <div className="landing-actions">
              <a className="primary-button" href="/resume-builder">
                <i className="bi bi-arrow-right" aria-hidden="true" /> Build my resume
              </a>
              <a className="secondary-button" href="/resume-checker">Check my resume</a>
            </div>
            <p className="landing-privacy"><i className="bi bi-shield-check" aria-hidden="true" /> Your draft stays on your device when you save it.</p>
          </div>

          <aside className="landing-preview" aria-label="Resume preview illustration">
            <div className="landing-preview-topline">
              <span>RESUMAY! / RESUME</span>
              <i className="bi bi-check-circle-fill" aria-hidden="true" />
            </div>
            <div className="landing-preview-sheet">
              <span className="landing-preview-label">A clearer first impression</span>
              <strong className="landing-preview-name">Your name</strong>
              <span className="landing-preview-role">Target role · Core strengths</span>
              <span className="landing-preview-rule" />
              <span className="landing-preview-section">PROFILE</span>
              <span className="landing-preview-line landing-preview-line-long" />
              <span className="landing-preview-line" />
              <span className="landing-preview-section">EXPERIENCE</span>
              <span className="landing-preview-job">Relevant role <span>2022—2025</span></span>
              <span className="landing-preview-line landing-preview-line-long" />
              <span className="landing-preview-line" />
              <span className="landing-preview-line landing-preview-line-short" />
              <div className="landing-preview-tags"><span>Clear</span><span>Focused</span><span>Yours</span></div>
            </div>
            <div className="landing-preview-note"><i className="bi bi-stars" aria-hidden="true" /> Simple tools for a more focused application</div>
          </aside>
        </section>

        <section className="site-shell landing-tools" aria-labelledby="landing-tools-title">
          <div className="landing-section-heading">
            <span className="page-kicker">Choose what you need</span>
            <h2 id="landing-tools-title">Three useful tools. One clear next step.</h2>
          </div>
          <div className="landing-tool-grid">
            {tools.map((tool) => (
              <a className="landing-tool-card" href={tool.href} key={tool.href}>
                <span className="landing-tool-icon"><i className={`bi ${tool.icon}`} aria-hidden="true" /></span>
                <span className="landing-tool-title">{tool.title}</span>
                <span className="landing-tool-copy">{tool.copy}</span>
                <span className="landing-tool-action">{tool.action}<i className="bi bi-arrow-right" aria-hidden="true" /></span>
              </a>
            ))}
          </div>
        </section>
      </main>
    </SiteLayout>
  )
}
