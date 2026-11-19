import type { ImageMetadata } from 'astro';

import profilePicture from '../assets/ProfilePicture.jpeg';
import investigationsBanner from '../assets/images/1-improved.jpeg';
import projectsBanner from '../assets/images/new.jpeg';
import blogBanner from '../assets/images/4-improved.jpeg';
import blogCover from '../assets/images/rickomender-deskroom.png';
import archonVanguardCert from '../assets/certs/ArchonVanguard-intern-cert.png';
import elDahraCert from '../assets/certs/ElDahra_internship.jpeg';
import fortinetCert from '../assets/certs/FortinetSecurity-NTI.png';
import cyberThreatCert from '../assets/certs/CyberThreatManagement.png';
import networkingBasicsCert from '../assets/certs/NetworkingBasics.png';

/**
 * Images referenced from JSON data use their public URL (e.g. /certs/foo.png).
 * Importing the same files from src/assets lets Astro optimize the rendered
 * copies while keeping the original public URLs available for links/downloads.
 */
const localImages: Record<string, ImageMetadata> = {
  '/ProfilePicture.jpeg': profilePicture,
  '/images/1-improved.jpeg': investigationsBanner,
  '/images/new.jpeg': projectsBanner,
  '/images/4-improved.jpeg': blogBanner,
  '/images/rickomender-deskroom.png': blogCover,
  '/certs/ArchonVanguard-intern-cert.png': archonVanguardCert,
  '/certs/ElDahra_internship.jpeg': elDahraCert,
  '/certs/FortinetSecurity-NTI.png': fortinetCert,
  '/certs/CyberThreatManagement.png': cyberThreatCert,
  '/certs/NetworkingBasics.png': networkingBasicsCert,
};

// Also pick up any image dropped into src/assets (e.g. a new blog screenshot
// in src/assets/images/foo.png) so markdown can reference it as /images/foo.png.
const assetModules = import.meta.glob<ImageMetadata>('../assets/**/*.{png,jpg,jpeg,webp,avif,gif,svg}', {
  eager: true,
  import: 'default',
});

for (const [modulePath, image] of Object.entries(assetModules)) {
  const publicPath = modulePath.replace(/^\.\.\/assets/, '');
  if (!localImages[publicPath]) localImages[publicPath] = image;
}

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

function normalizePath(src: string): string {
  let path = src.split(/[?#]/, 1)[0];

  if (base && path.startsWith(base)) {
    path = path.slice(base.length) || '/';
  }

  if (!path.startsWith('/') && !/^[a-z][a-z0-9+.-]*:/i.test(path)) {
    path = `/${path}`;
  }

  return path;
}

/** Resolve a public image path to an optimizable asset when one is available. */
export function resolveImage(src: string): ImageMetadata | string;
export function resolveImage(src?: string | null): ImageMetadata | string | undefined;
export function resolveImage(src?: string | null): ImageMetadata | string | undefined {
  if (!src) return undefined;

  if (/^(https?:)?\/\//i.test(src) || src.startsWith('data:')) {
    return src;
  }

  const path = normalizePath(src);
  return localImages[path] ?? path;
}

/**
 * Resolve an Obsidian-style embed name (e.g. `![[diagram.png]]`) to a public
 * path. A bare filename is matched against src/assets first, then falls back
 * to /images/<filename> (public/images).
 */
export function resolveImageByName(name: string): string {
  const trimmed = name.trim().replace(/^\.\//, '');
  if (!trimmed) return '';

  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:')) {
    return trimmed;
  }

  if (trimmed.includes('/')) {
    return normalizePath(trimmed);
  }

  const match = Object.keys(localImages).find(
    (key) => key.slice(key.lastIndexOf('/') + 1) === trimmed,
  );

  return match ?? `/images/${trimmed}`;
}


