import { getSeoData } from './seo';

const DEFAULT_TITLE = 'Elariz — Frontend Developer Portfolio';
const DEFAULT_DESCRIPTION =
  'Interactive, high-performance web applications and 3D web experience portfolio showcasing modern front-end development.';

export default async function SeoContent() {
  const { globalInfo, projects, faqList } = await getSeoData();
  const aboutMe =
    globalInfo?.aboutMe || 'Front-end developer building responsive, high-performance web applications and 3D web experiences.';

  return (
    <div id="seo-content" className="sr-only-seo">
      <header>
        <h1>{globalInfo?.siteTitle || DEFAULT_TITLE}</h1>
        <p>{globalInfo?.siteDescription || DEFAULT_DESCRIPTION}</p>
      </header>
      <nav aria-label="Main Navigation">
        <ul>
          <li><a href="/">Home (The Corridor)</a></li>
          <li><a href="/gallery">Gallery &amp; Projects</a></li>
          <li><a href="/about">About Me</a></li>
          <li><a href="/contact">Contact &amp; Socials</a></li>
        </ul>
      </nav>
      <section id="about">
        <h2>About Me</h2>
        <p>{aboutMe}</p>
        {globalInfo?.githubUrl && <a href={globalInfo.githubUrl}>GitHub</a>}
        {globalInfo?.linkedinUrl && <a href={globalInfo.linkedinUrl}>LinkedIn</a>}
      </section>
      {projects?.length > 0 && (
        <section id="projects">
          <h2>Projects</h2>
          <ul>
            {projects.map((project) => (
              <li key={project._id || project.title}>
                <h3>{project.seoTitle || project.title}</h3>
                <p>{project.seoDescription || project.description || ''}</p>
                {project.url && <a href={project.url}>Visit {project.seoTitle || project.title}</a>}
              </li>
            ))}
          </ul>
        </section>
      )}
      {faqList?.length > 0 && (
        <section id="faq">
          <h2>Frequently Asked Questions (FAQ)</h2>
          {faqList.map((item) => (
            <article key={item._id || item.question}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}