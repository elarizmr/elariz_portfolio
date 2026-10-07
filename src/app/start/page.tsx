import StartEnhancement from '../../components/start/StartEnhancement';

export const metadata = {
  title: 'Elariz Recebov — Front-End Developer',
};

export default function StartPage() {
  return (
    <>
      <link
        rel="preload"
        href="/start/fonts/barlow-condensed-700-latin.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <div className="start-page">
        <a className="skip-link" href="#links">Skip to links</a>
        <div className="sheet">
          <main>
            <div className="doodle-annotation top-annotation">
              <div className="signature">
                <h1>Elariz Recebov</h1>
                <p className="role">Front-End Developer</p>
              </div>
              <svg className="doodle-squiggle" viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true">
                <path d="M 5,10 Q 30,2 60,12 T 120,8 T 195,12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <nav className="primary" id="links" aria-label="My work" tabIndex={-1}>
              <a className="work-link portfolio-link" href="/" aria-label="Interactive Portfolio">
                <span className="work-label" aria-hidden="true">
                  <span className="word">Interactive</span>{' '}
                  <span className="last-word">
                    <span className="word">Portfolio</span>
                    <svg className="press-arrow" viewBox="0 0 82 82">
                      <path className="arrow-back" d="M8 59 46 20 18 20 18 6 71 7 70 59 56 60 56 32 19 70Z" />
                      <path className="arrow-face" d="M8 59 46 20 18 20 18 6 71 7 70 59 56 60 56 32 19 70Z" />
                    </svg>
                  </span>
                </span>
              </a>
              <a
                className="work-link sketchbook-link"
                href="https://github.com/elarizmr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="UI Projects"
              >
                <span className="work-label" aria-hidden="true">
                  <span className="word">UI</span>{' '}
                  <span className="last-word">
                    <span className="word">Sketchbook</span>
                    <svg className="press-arrow" viewBox="0 0 82 82">
                      <path className="arrow-back" d="M8 59 46 20 18 20 18 6 71 7 70 59 56 60 56 32 19 70Z" />
                      <path className="arrow-face" d="M8 59 46 20 18 20 18 6 71 7 70 59 56 60 56 32 19 70Z" />
                    </svg>
                  </span>
                </span>
              </a>
            </nav>
            <div className="doodle-annotation side-annotation">
              <p className="bio">
                I build interactive, responsive,<br className="wide-break" /> high-performance web applications.
              </p>
              <svg className="doodle-arrow" viewBox="0 0 40 40" aria-hidden="true">
                <path d="M 10,10 Q 25,30 35,35 M 25,35 L 35,35 L 32,25" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <nav className="profiles" aria-label="Profiles">
              <a href="https://github.com/elarizrecebov" target="_blank" rel="noopener noreferrer" aria-label="GitHub">GitHub</a>
              <a href="https://linkedin.com/in/elarizrecebov" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">LinkedIn</a>
            </nav>
          </main>
          <footer>
            <div className="availability-doodle">
              <svg className="doodle-circle" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
                <path d="M 50,2 C 80,0 95,15 90,30 C 80,40 20,40 10,25 C 0,10 30,5 60,8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <p className="availability">AVAILABLE FOR SELECTED PROJECTS</p>
            </div>
          </footer>
        </div>
        <p className="notice" role="status" aria-live="polite" aria-atomic="true" />
      </div>
      <StartEnhancement />
    </>
  );
}