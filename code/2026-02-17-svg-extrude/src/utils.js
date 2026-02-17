export const generateSVG = (width = 182.42, height = 253.28) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  // Add base rectangle with "base" id
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", 0);
  rect.setAttribute("y", 0);
  rect.setAttribute("width", width);
  rect.setAttribute("height", height);
  rect.setAttribute("fill", "black");
  rect.setAttribute("id", "base");
  svg.appendChild(rect);

  // --- Halftone gradient settings ---
  const margin = 8;
  const cols = 50;
  const spacing = (width - margin * 2) / cols;
  const rows = Math.floor((height - margin * 2) / spacing);
  const maxRadius = spacing * 0.4; // rayon max d'un point
  const minRadius = spacing * 0.2; // rayon min d'un point

  // Direction du dégradé : de haut (gros) vers bas (petit)
  // Tu peux changer gradientFn pour varier l'effet
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = margin + spacing * 0.5 + col * spacing;
      const cy = margin + spacing * 0.5 + row * spacing;

      // t va de 0 (haut) à 1 (bas)
      const t = row / (rows - 1);

      // Interpolation du rayon : gros en haut, petit en bas
      const radius = maxRadius * (1 - t) + minRadius * t;

      if (radius < 0.1) continue; // skip les points trop petits

      const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle",
      );
      circle.setAttribute("cx", cx);
      circle.setAttribute("cy", cy);
      circle.setAttribute("r", radius);
      circle.setAttribute("fill", "white");
      svg.appendChild(circle);
    }
  }

  return svg;
};
