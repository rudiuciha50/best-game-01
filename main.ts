/**
 * DUNGEON DELVER — best-game-01 entrypoint
 * Packages the browser game in ./game and ./screenshots into /output
 * and emits dossier.json for the make.fun judge.
 */
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUTPUT = process.env.MAKEFUN_OUTPUT_DIR || '/output';

// Ensure output tree exists
mkdirSync(join(OUTPUT, 'screenshots'), { recursive: true });

// Ship the playable game (static HTML/JS, offline, no network deps)
const gameSrc = join(ROOT, 'game');
const gameDst = join(OUTPUT, 'game');
if (existsSync(gameSrc)) {
  cpSync(gameSrc, gameDst, { recursive: true });
}

// Ship screenshots (cover = first by filename sort)
const shotsSrc = join(ROOT, 'screenshots');
const shotsDst = join(OUTPUT, 'screenshots');
if (existsSync(shotsSrc)) {
  cpSync(shotsSrc, shotsDst, { recursive: true });
}

// Write dossier for the scorer/judge
const dossier = buildDossier(OUTPUT, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(OUTPUT, 'dossier.json'), dossier);

console.log('DUNGEON DELVER packaged to', OUTPUT);