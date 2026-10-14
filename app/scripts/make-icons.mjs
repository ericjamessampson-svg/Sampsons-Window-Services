// Builds the app icons from one SVG. Run: npm run icons
import sharp from "sharp";

const svg = (pad) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0a6db3"/>
  <g transform="translate(${pad} ${pad}) scale(${(512 - pad * 2) / 512})">
    <path d="M176 70h160a24 24 0 0 1 24 24v330a24 24 0 0 1-24 24H176a24 24 0 0 1-24-24V94a24 24 0 0 1 24-24z" fill="#ffffff"/>
    <circle cx="256" cy="150" r="42" fill="#0a6db3"/>
    <text x="256" y="300" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="96" fill="#0d1f1a">10K</text>
    <rect x="196" y="340" width="120" height="18" rx="9" fill="#f4c95d"/>
    <rect x="216" y="372" width="80" height="14" rx="7" fill="#c9d4cf"/>
  </g>
</svg>`;

const out = [
  ["public/icons/icon-192.png", 192, 0],
  ["public/icons/icon-512.png", 512, 0],
  ["public/icons/maskable-512.png", 512, 56],
  ["public/icons/apple-touch-icon.png", 180, 24],
];
for (const [file, size, pad] of out) {
  await sharp(Buffer.from(svg(pad))).resize(size, size).png().toFile(file);
  console.log("wrote", file);
}
