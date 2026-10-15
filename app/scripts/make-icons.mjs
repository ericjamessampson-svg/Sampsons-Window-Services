// Builds the Spur logo files and app icons from brand/spur-logo-source.webp.
// Run: npm run icons
import sharp from "sharp";

const SRC = "brand/spur-logo-source.webp";
const BLUE = { r: 103, g: 187, b: 247 }; // the logo's own blue
const MARK = { left: 223, top: 94, width: 647 - 223 + 1, height: 453 - 94 + 1 }; // the "S" with arrow
const FULL = { left: 91, top: 94, width: 808 - 91 + 1, height: 730 - 94 + 1 }; // mark + "spur"

/** Clean transparent copy of part of the logo, in the logo's exact blue. */
async function cutout(box) {
  const { data, info } = await sharp(SRC).extract(box).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
    // How blue a pixel is (white background = 0, logo = 1), with soft edges kept.
    const a = Math.max(0, Math.min(1, (data[i + 2] - data[i]) / (BLUE.b - BLUE.r)));
    out[j] = BLUE.r;
    out[j + 1] = BLUE.g;
    out[j + 2] = BLUE.b;
    out[j + 3] = Math.round(a * 255);
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png();
}

const mark = await (await cutout(MARK)).toBuffer();
await (await cutout(FULL)).toFile("public/brand/spur-logo.png");
await sharp(mark).toFile("public/brand/spur-mark.png");

/** Square icon: the mark centered on white, taking `scale` of the width. */
async function icon(file, size, scale) {
  const inner = Math.round(size * scale);
  const m = await sharp(mark).resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: "#ffffff" } })
    .composite([{ input: m, gravity: "center" }])
    .flatten({ background: "#ffffff" })
    .png()
    .toFile(file);
  console.log("wrote", file);
}

await icon("public/icons/icon-192.png", 192, 0.74);
await icon("public/icons/icon-512.png", 512, 0.74);
await icon("public/icons/maskable-512.png", 512, 0.56);
await icon("public/icons/apple-touch-icon.png", 180, 0.72);
await icon("public/favicon-32.png", 32, 0.9);
