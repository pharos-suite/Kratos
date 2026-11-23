// Draws the launcher icons (legacy, round, adaptive foreground) from the Kratos column mark.
// Run from the repo root after changing public/favicon.svg: node mobile/icones.mjs
import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";

const RES = new URL("./android/app/src/main/res/", import.meta.url).pathname;
const DENSITES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const LOGO = readFileSync(new URL("../public/favicon.svg", import.meta.url), "utf8");
// The mark's own tile colour; same as ic_launcher_background.xml.
const FOND = "#DED8CC";
// The column alone, without its tile: what sits on the adaptive background and in the round icon.
const COLONNE = LOGO.replace(/<rect[^>]*\/>/, "");
const page = (taille, svg, contenu, forme) => `
  <style>
    html, body { margin: 0; background: transparent; }
    .icone { width: ${taille}px; height: ${taille}px; display: grid; place-items: center; overflow: hidden; background: ${forme === "rond" ? FOND : "transparent"}; border-radius: ${forme === "rond" ? "50%" : "0"}; }
    svg { width: ${contenu}%; display: block; }
  </style>
  <div class="icone">${svg}</div>`;

const b = await chromium.launch();
const p = await b.newPage({ deviceScaleFactor: 1 });
for (const [d, k] of Object.entries(DENSITES)) {
  mkdirSync(`${RES}mipmap-${d}`, { recursive: true });
  // Adaptive foreground: 108dp canvas, the column (56% of its own viewBox) inside the 66dp safe zone.
  for (const [nom, taille, svg, contenu, forme] of [
    ["ic_launcher_foreground", 108 * k, COLONNE, 80, null],
    ["ic_launcher", 48 * k, LOGO, 100, null],
    ["ic_launcher_round", 48 * k, COLONNE, 100, "rond"],
  ]) {
    await p.setViewportSize({ width: Math.round(taille), height: Math.round(taille) });
    await p.setContent(page(Math.round(taille), svg, contenu, forme));
    await p.locator(".icone").screenshot({ path: `${RES}mipmap-${d}/${nom}.png`, omitBackground: true });
  }
}
await b.close();
console.log("Icônes écrites dans", RES);
