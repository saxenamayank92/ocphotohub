import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const asset = (file) => path.join(root, file);
const output = asset('marketing/app-store/ClubPhotoHub-feature-graphic-1024x500.png');

const [logo, screenshot] = await Promise.all([
  fs.readFile(asset('public/club-photo-hub-icon-512.png')),
  fs.readFile(asset('marketing/app-store/ClubPhotoHub-gallery-1080x1920-android.png')),
]);

const phone = await sharp(screenshot)
  .resize({ width: 236, height: 420, fit: 'cover', position: 'top' })
  .png()
  .toBuffer();

const phoneMask = Buffer.from(`
  <svg width="260" height="444" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="260" height="444" rx="30" fill="#0f1d36"/>
    <rect x="12" y="12" width="236" height="420" rx="21" fill="#f9f7f2"/>
  </svg>`);

const screenRounded = await sharp(phone)
  .composite([{ input: Buffer.from('<svg><rect width="236" height="420" rx="21" ry="21"/></svg>'), blend: 'dest-in' }])
  .png()
  .toBuffer();

const dots = Array.from({ length: 13 }, (_, row) =>
  Array.from({ length: 27 }, (_, col) => `<circle cx="${22 + col * 38}" cy="${20 + row * 38}" r="2" fill="#d4ad5a" opacity="0.26"/>`).join('')
).join('');

const textLayer = Buffer.from(`
  <svg width="1024" height="500" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="500" fill="#101d36"/>
    ${dots}
    <rect x="48" y="48" width="92" height="92" rx="23" fill="#f8f6f1"/>
    <text x="164" y="88" fill="#ffffff" font-family="Arial, sans-serif" font-size="32" font-weight="700">Club PhotoHub</text>
    <text x="164" y="118" fill="#d4ad5a" font-family="Arial, sans-serif" font-size="15" font-weight="700" letter-spacing="2">PRIVATE PHOTO SHARING</text>
    <text x="48" y="235" fill="#ffffff" font-family="Georgia, serif" font-size="55">Private moments.</text>
    <text x="48" y="298" fill="#ffffff" font-family="Georgia, serif" font-size="55">Shared beautifully.</text>
    <text x="51" y="347" fill="#d7e0dc" font-family="Arial, sans-serif" font-size="20">A dedicated, member-only home for every club memory.</text>
    <rect x="50" y="389" width="246" height="52" rx="26" fill="#d4ad5a"/>
    <text x="76" y="422" fill="#101d36" font-family="Arial, sans-serif" font-size="18" font-weight="700">FOR CLUBS &amp; MEMBERS</text>
  </svg>`);

await sharp({
  create: { width: 1024, height: 500, channels: 4, background: '#101d36' },
})
  .composite([
    { input: textLayer },
    { input: await sharp(logo).resize(68, 68).png().toBuffer(), left: 60, top: 60 },
    { input: phoneMask, left: 715, top: 28 },
    { input: screenRounded, left: 727, top: 40 },
  ])
  .png()
  .toFile(output);

console.log(output);
