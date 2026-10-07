export interface SiteProject {
  _id?: string;
  title: string;
  id: string | null;
  url: string | null;
  description: string;
  front: string | null;
  painted: string | null;
  frontImage: string | null;
  paintedImage: string | null;
  techStack: string[] | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface SiteFaq {
  _id?: string;
  question: string;
  answer: string;
}

export interface SiteGlobalInfo {
  siteTitle?: string | null;
  siteDescription?: string | null;
  aboutMe?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  xUrl?: string | null;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  youtubeUrl?: string | null;
}

export interface SiteData {
  globalInfo: SiteGlobalInfo | null;
  projects: SiteProject[];
  faqList: SiteFaq[];
}

export const siteData: SiteData = {
  // TODO: Replace these static defaults with finalized profile content.
  globalInfo: {
    siteTitle: 'Elariz — Frontend Developer Portfolio',
    siteDescription:
      'Interactive, high-performance web applications and 3D web experience portfolio showcasing modern front-end development.',
    aboutMe:
      'Front-end developer building responsive, high-performance web applications and 3D web experiences.',
  },
  projects: [
    {
      _id: 'monetune',
      title: 'MONETUNE',
      id: 'monetune',
      url: 'https://monetune.pl',
      description:
        'MoneTune is a step-by-step blueprint that teaches beginners how to generate passive income using AI-created music. Without any musical skills, you will learn how to easily produce professional tracks, publish them on platforms like Spotify, and monetize your digital assets.',
      front: '/textures/gallery/monetuneprzod.webp',
      painted: '/textures/gallery/monetuneprzod_painted.webp',
      frontImage: '/textures/gallery/monetuneprzod.webp',
      paintedImage: '/textures/gallery/monetuneprzod_painted.webp',
      techStack: [
        '/textures/gallery/wordpresslogo.webp',
        '/textures/gallery/elementorlogo.webp',
        '/textures/gallery/phplogo.webp',
        '/textures/gallery/csslogo.webp',
      ],
    },
    {
      _id: 'timber',
      title: 'TIMBERKITTY',
      id: 'timber',
      url: 'https://timberkitty.netlify.app',
      description:
        'TimberKitty is an addictive, free-to-play browser arcade game built in pure JavaScript. Players control a lumberjack cat to chop wood, save birds, complete daily missions, and compete on global leaderboards.',
      front: '/textures/gallery/timberkittyprzod.webp',
      painted: '/textures/gallery/timberkittyprzod_painted.webp',
      frontImage: '/textures/gallery/timberkittyprzod.webp',
      paintedImage: '/textures/gallery/timberkittyprzod_painted.webp',
      techStack: [
        '/textures/gallery/jslogo.webp',
        '/textures/gallery/htmllogo.webp',
        '/textures/gallery/csslogo.webp',
        '/textures/gallery/firebaselogo.webp',
      ],
    },
    {
      _id: 'young',
      title: 'YOUNG MULTI',
      id: 'young',
      url: 'https://young-multi-strona.netlify.app',
      description:
        'A sleek, modern concept website dedicated to the Polish rapper and creator Young Multi. It serves as a promotional landing page designed to highlight his personal brand, music, and online presence.',
      front: '/textures/gallery/youngmultiprzod.webp',
      painted: '/textures/gallery/youngmultiprzod_painted.webp',
      frontImage: '/textures/gallery/youngmultiprzod.webp',
      paintedImage: '/textures/gallery/youngmultiprzod_painted.webp',
      techStack: [
        '/textures/gallery/reactlogo.webp',
        '/textures/gallery/tailwindlogo.webp',
        '/textures/gallery/htmllogo.webp',
        '/textures/gallery/netlifylogo.webp',
      ],
    },
    {
      _id: 'bio',
      title: 'BIO',
      id: 'bio',
      url: 'https://tomkingbio.netlify.app',
      description:
        'A fast, modern personal bio page serving as a central hub for my digital footprint. It showcases my latest coding projects, web development services, YouTube videos, and recommended music artists.',
      front: '/textures/gallery/bioprzod.webp',
      painted: '/textures/gallery/bioprzod_painted.webp',
      frontImage: '/textures/gallery/bioprzod.webp',
      paintedImage: '/textures/gallery/bioprzod_painted.webp',
      techStack: [
        '/textures/gallery/htmllogo.webp',
        '/textures/gallery/csslogo.webp',
        '/textures/gallery/jslogo.webp',
        '/textures/gallery/netlifylogo.webp',
      ],
    },
  ],
  // TODO: Add approved FAQ questions and answers when available.
  faqList: [],
};
