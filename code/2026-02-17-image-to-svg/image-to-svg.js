#!/usr/bin/env node
/**
 * image-to-svg.js
 * Convertit une image en SVG pixel par pixel.
 * Chaque pixel noir devient un <rect> dans le SVG.
 *
 * Usage:
 *   node image-to-svg.js <input_image> [output.svg] [--threshold=128] [--color=#000000]
 *
 * Options:
 *   --threshold=N   Seuil de luminosité pour considérer un pixel comme "noir" (0-255, défaut: 128)
 *   --color=#hex    Couleur des pixels dans le SVG (défaut: #000000)
 *   --invert        Inverse la détection (isole les pixels clairs)
 *
 * Exemples:
 *   node image-to-svg.js logo.png logo.svg
 *   node image-to-svg.js logo.png logo_rouge.svg --color=#FF0000 --threshold=100
 *
 * Installation des dépendances:
 *   npm install sharp
 */

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// ─── Parsing des arguments ────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help")) {
  console.log(`
Usage: node image-to-svg.js <input> [output.svg] [options]

Options:
  --threshold=N   Seuil luminosité (0-255, défaut: 128)
  --color=#hex    Couleur SVG des pixels actifs (défaut: #000000)
  --invert        Inverse la sélection (pixels clairs → actifs)
  --help          Affiche cette aide
`);
  process.exit(0);
}

const inputFile = args.find((a) => !a.startsWith("--"));
const outputFile =
  args.filter((a) => !a.startsWith("--")).find((a, i) => i > 0) ||
  path.basename(inputFile, path.extname(inputFile)) + ".svg";

const threshold = parseInt(
  (args.find((a) => a.startsWith("--threshold=")) || "--threshold=128").split(
    "=",
  )[1],
);
const color = (
  args.find((a) => a.startsWith("--color=")) || "--color=#000000"
).split("=")[1];
const invert = args.includes("--invert");

if (!inputFile) {
  console.error("❌ Erreur: fichier d'entrée manquant.");
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error(`❌ Fichier introuvable: ${inputFile}`);
  process.exit(1);
}

// ─── Traitement ───────────────────────────────────────────────────────────────

console.log(`📂 Lecture de: ${inputFile}`);
console.log(`🎯 Seuil: ${threshold} | Couleur: ${color} | Inversé: ${invert}`);

sharp(inputFile)
  .ensureAlpha() // Ajoute canal alpha si absent
  .raw() // Données brutes RGBA
  .toBuffer({ resolveWithObject: true })
  .then(({ data, info }) => {
    const { width, height, channels } = info;
    console.log(
      `📐 Dimensions: ${width} x ${height} px (${width * height} pixels)`,
    );

    // ─── Génération du SVG ─────────────────────────────────────────────────

    let rects = [];

    for (let y = 0; y < height; y++) {
      let x = 0;
      while (x < width) {
        const idx = (y * width + x) * channels;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = channels === 4 ? data[idx + 3] : 255;

        // Luminosité perçue (formule standard)
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        const isActive = invert
          ? luminance > threshold && a > 10
          : luminance <= threshold && a > 10;

        if (isActive) {
          // Optimisation: regroupe les pixels actifs consécutifs sur la même ligne
          let runLength = 1;
          while (x + runLength < width) {
            const nextIdx = (y * width + x + runLength) * channels;
            const nr = data[nextIdx];
            const ng = data[nextIdx + 1];
            const nb = data[nextIdx + 2];
            const na = channels === 4 ? data[nextIdx + 3] : 255;
            const nextLum = 0.299 * nr + 0.587 * ng + 0.114 * nb;
            const nextActive = invert
              ? nextLum > threshold && na > 10
              : nextLum <= threshold && na > 10;
            if (!nextActive) break;
            runLength++;
          }

          rects.push(
            `<rect x="${x}" y="${y}" width="${runLength}" height="1"/>`,
          );
          x += runLength;
        } else {
          x++;
        }
      }
    }

    const activePixels = rects.length;
    console.log(`🟦 Rectangles SVG générés: ${activePixels}`);

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${width}"
     height="${height}"
     viewBox="0 0 ${width} ${height}">
  <g fill="${color}">
    ${rects.join("\n    ")}
  </g>
</svg>`;

    fs.writeFileSync(outputFile, svg, "utf8");
    const sizeKB = (fs.statSync(outputFile).size / 1024).toFixed(1);
    console.log(`✅ SVG enregistré: ${outputFile} (${sizeKB} KB)`);
  })
  .catch((err) => {
    console.error("❌ Erreur sharp:", err.message);
    process.exit(1);
  });
