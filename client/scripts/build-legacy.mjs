// Compiles the legacy ALU Hub UI ahead-of-time.
//
// The original app shipped JSX that was transpiled in the browser by
// @babel/standalone on every page load — slow. Here esbuild transpiles
// the JSX once, at build time. `bundle: false` keeps each file's
// top-level scope as classic global scope, so `App` defined in ALUHub.js
// stays visible to ALUHub_Auth.js, exactly as before.

import esbuild from 'esbuild';
import { cpSync, mkdirSync } from 'node:fs';

const OUT = 'public/app';
mkdirSync(OUT, { recursive: true });

await esbuild.build({
  entryPoints: ['legacy-src/ALUHub.js', 'legacy-src/ALUHub_Auth.js'],
  outdir: OUT,
  bundle: false,
  minify: true,
  loader: { '.js': 'jsx' },
  jsx: 'transform',
  target: ['es2019'],
  logLevel: 'info',
});

cpSync('legacy-src/ALUHub.css', `${OUT}/ALUHub.css`);
cpSync('legacy-src/ALUHub_Auth.css', `${OUT}/ALUHub_Auth.css`);

console.log(`Legacy UI compiled -> ${OUT}/`);
