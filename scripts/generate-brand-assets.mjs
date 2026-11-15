import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import sharp from 'sharp';

const SOURCES = 'assets/brand';
const PUBLIC = 'public';

const required = ['icon.svg', 'icon-maskable.svg', 'og.svg', 'banner.svg'];
for (const f of required) {
  if (!existsSync(`${SOURCES}/${f}`)) {
    console.error(`Missing source asset: ${SOURCES}/${f}`);
    process.exit(1);
  }
}

await mkdir(`${PUBLIC}/icons`, { recursive: true });
await mkdir(`${PUBLIC}/images`, { recursive: true });

const icon = await readFile(`${SOURCES}/icon.svg`);

await copyFile(`${SOURCES}/icon.svg`, `${PUBLIC}/favicon.svg`);

for (const size of [32, 96, 192, 256, 512]) {
  await sharp(icon, { density: 300 }).resize(size, size).png().toFile(`${PUBLIC}/icons/icon-${size}.png`);
}

await sharp(icon, { density: 300 }).resize(180, 180).png().toFile(`${PUBLIC}/apple-touch-icon.png`);

const maskable = await readFile(`${SOURCES}/icon-maskable.svg`);
await sharp(maskable, { density: 300 }).resize(192, 192).png().toFile(`${PUBLIC}/web-app-manifest-192x192.png`);
await sharp(maskable, { density: 300 }).resize(512, 512).png().toFile(`${PUBLIC}/web-app-manifest-512x512.png`);

const og = await readFile(`${SOURCES}/og.svg`);
await sharp(og, { density: 150 }).resize(1200, 630).png().toFile(`${PUBLIC}/images/og.png`);
await sharp(og, { density: 150 }).resize(1200, 675).png().toFile(`${PUBLIC}/images/x.png`);

const banner = await readFile(`${SOURCES}/banner.svg`);
await sharp(banner, { density: 150 }).resize(1920, 1200).png().toFile(`${PUBLIC}/images/banner.png`);

console.log('brand assets generated');
