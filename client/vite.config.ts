import { defineConfig, loadEnv } from 'vite';

// The legacy ALU Hub UI is compiled ahead-of-time into public/app/ by
// scripts/build-legacy.mjs and loaded as plain classic scripts — no
// in-browser Babel, which is the main speed win over the old setup.
export default defineConfig(({ mode }) => {
  // Load .env / .env.<mode> AND process.env so deploy platforms like
  // Render (which inject env vars at build time, not via .env files)
  // also work. We need this to substitute %VITE_*% tokens in
  // index.html at build time — without it the tokens ship to the
  // browser literally and the app posts to "%VITE_API_URL%/api/..."
  // which Cloudflare rejects with a 400.
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };

  return {
    server: { port: 5173 },
    preview: { port: 5173 },
    build: { target: 'es2019' },
    plugins: [
      {
        name: 'html-vite-env-replace',
        transformIndexHtml: {
          order: 'pre' as const,
          handler(html: string) {
            return html.replace(/%(VITE_[A-Z0-9_]+)%/g, (_match, name: string) => {
              const value = env[name];
              if (value === undefined || value === '') {
                // Loud warning during build so missing vars on Render are obvious
                // in the deploy logs.
                console.warn(`[vite] ${name} is not set — %${name}% left blank in index.html`);
                return '';
              }
              return value;
            });
          },
        },
      },
    ],
  };
});
