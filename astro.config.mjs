import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import { existsSync } from 'fs';

const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
  site: 'https://pm-cybersec.github.io',
  base: '/',
  integrations: [tailwind({ applyBaseStyles: false })],
  // Exclude admin page from production builds
  ...(isDev ? {} : {
    vite: {
      build: {
        rollupOptions: {
          external: [/admin/]
        }
      }
    }
  })
});
