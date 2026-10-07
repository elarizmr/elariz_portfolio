export type RoomId = 'about' | 'gallery' | 'contact';
export type RoomKey = RoomId | 'null';

export interface RoomMetadata {
  path: string;
  title: string;
  description: string;
}

export const ROOM_META: Record<RoomKey, RoomMetadata> = {
  null: {
    path: '/',
    title: 'Elariz — Frontend Developer Portfolio',
    description:
      'Interactive 3D portfolio by Elariz Recebov, frontend developer. Explore WebGL experiments, React projects & GSAP animations in a hand-drawn gallery.',
  },
  about: {
    path: '/about',
    title: 'About Me — Elariz Portfolio',
    description:
      'Learn about Elariz Recebov, a frontend developer specializing in 3D web experiences, React, Three.js, and GSAP animations.',
  },
  gallery: {
    path: '/gallery',
    title: 'Gallery & Projects — Elariz Portfolio',
    description:
      'Browse the interactive 3D gallery of web development projects by Elariz Recebov. Each project is displayed as a hand-drawn card you can flip and explore.',
  },
  contact: {
    path: '/contact',
    title: 'Contact — Elariz Portfolio',
    description:
      'Get in touch with Elariz Recebov. Find social media links and contact information in this interactive 3D contact room.',
  },
};

export const PATH_TO_ROOM: Record<string, RoomId | null> = {
  '/': null,
  '/about': 'about',
  '/gallery': 'gallery',
  '/contact': 'contact',
};

export function getRoomMetadata(pathname: string): RoomMetadata {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  const room = PATH_TO_ROOM[normalizedPath];
  return ROOM_META[room ?? 'null'];
}
