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

  const amount = 50;
  const margin = 2;
  const gap = 1;

  const radius = ((width - margin * 2 - gap * (amount - 1)) / amount) * 0.5;

  for (let line = 0; line < 10; line++) {
    for (let row = 0; row < amount; row++) {
      const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle",
      );

      const x = margin + radius + row * (radius * 2 + gap);
      const y = radius + margin + line * (radius * 2 + gap);

      circle.setAttribute("cx", x);
      circle.setAttribute("cy", y);
      circle.setAttribute("r", radius);
      circle.setAttribute("fill", "white");
      svg.appendChild(circle);
    }
  }

  return svg;
};
