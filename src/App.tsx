import './App.css'
import './SitePages.css'
import ResumeBuilderPage from './ResumeBuilderPage'
import ApplicationLetterPage from './pages/ApplicationLetterPage'
import LandingPage from './pages/LandingPage'
import ResumeCheckerPage from './pages/ResumeCheckerPage'

function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'

  if (path === '/resume-builder') return <ResumeBuilderPage />
  if (path === '/resume-checker') return <ResumeCheckerPage />
  if (path === '/application-letter') return <ApplicationLetterPage />
  return <LandingPage />
}

export default App
