import { useState, type ReactNode } from 'react'

export type PageId = 'home' | 'builder' | 'checker' | 'letter'

interface SiteLayoutProps {
  activePage: PageId
  children: ReactNode
}

const navigation: Array<{ id: PageId; label: string; href: string }> = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'builder', label: 'Resume builder', href: '/resume-builder' },
  { id: 'checker', label: 'Resume checker', href: '/resume-checker' },
  { id: 'letter', label: 'Application letter', href: '/application-letter' },
]

export function SiteLayout({ activePage, children }: SiteLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="site-layout">
      <header className="site-header">
        <div className="site-shell site-header-row">
          <a className="site-brand" href="/" aria-label="ResuMay home">
            <img src="/resumay-logo.png" alt="ResuMay!" />
          </a>

          <button
            type="button"
            className="site-menu-button"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <i className={`bi ${menuOpen ? 'bi-x-lg' : 'bi-list'}`} aria-hidden="true" />
          </button>

          <nav className={`site-nav${menuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
            {navigation.map((item) => (
              <a
                key={item.id}
                href={item.href}
                aria-current={activePage === item.id ? 'page' : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <a className="site-header-cta" href="/resume-builder">Build my resume</a>
        </div>
      </header>

      {children}

      <footer className="site-footer">
        <div className="site-shell site-footer-row">
          <a className="site-footer-brand" href="/">ResuMay!</a>
          <p>Clear tools for your next application.</p>
          <nav aria-label="Footer navigation">
            {navigation.slice(1).map((item) => (
              <a key={item.id} href={item.href}>{item.label}</a>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  )
}
