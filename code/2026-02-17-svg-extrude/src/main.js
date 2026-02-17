import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { STLExporter } from "three/addons/exporters/STLExporter.js";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { generateSVG } from "./utils.js";

import "./style.css";

const svg = generateSVG(182.42, 253.28);

const svgString = new XMLSerializer().serializeToString(svg);

// ============================================
// VARIABLES — modifie ces valeurs !
// ============================================
const BASE_EXTRUDE_DEPTH = 6; // profondeur de la base #base (mm)
const STAMP_EXTRUDE_DEPTH = 8; // profondeur du reste du tampon (mm)
// ============================================

// --- Setup renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0xf5f5f5);
document.getElementById("app").appendChild(renderer.domElement);

// --- Setup scene & camera ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  2000,
);
camera.position.set(0, 0, 100);

// --- OrbitControls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// --- Lights ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(100, 100, 200);
scene.add(directionalLight);

const backLight = new THREE.DirectionalLight(0xffffff, 0.4);
backLight.position.set(-100, -100, -200);
scene.add(backLight);

// --- Parse SVG & extrude ---
const loader = new SVGLoader();

loader.load("/bleu-unified.svg", (data) => {
  const group = new THREE.Group();

  const baseExtrudeSettings = {
    depth: BASE_EXTRUDE_DEPTH,
    bevelEnabled: false,
  };

  const stampExtrudeSettings = {
    depth: STAMP_EXTRUDE_DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.2,
    bevelSize: 0.1,
    bevelSegments: 2,
  };

  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    metalness: 0.2,
    roughness: 0.5,
    side: THREE.DoubleSide,
  });

  const stampMaterial = new THREE.MeshStandardMaterial({
    color: 0xe0e0e0,
    metalness: 0.3,
    roughness: 0.4,
    side: THREE.DoubleSide,
  });

  for (const path of data.paths) {
    const fillColor = path.userData.style.fill;
    if (fillColor === "none") continue;

    const isBase = path.userData.node.id === "base";
    const settings = isBase ? baseExtrudeSettings : stampExtrudeSettings;
    const material = isBase ? baseMaterial : stampMaterial;

    const shapes = SVGLoader.createShapes(path);

    for (const shape of shapes) {
      const geometry = new THREE.ExtrudeGeometry(shape, settings);
      const mesh = new THREE.Mesh(geometry, material);
      group.add(mesh);
    }
  }

  // SVG y-axis is inverted compared to Three.js
  group.scale.y *= -1;

  // Centrer le tout après le flip
  const fullBox = new THREE.Box3().setFromObject(group);
  const fullCenter = fullBox.getCenter(new THREE.Vector3());
  const fullSize = fullBox.getSize(new THREE.Vector3());

  group.position.sub(fullCenter);

  scene.add(group);

  // Ajuster la caméra et le point de pivot des contrôles
  const maxDim = Math.max(fullSize.x, fullSize.y, fullSize.z);
  camera.position.set(0, 0, maxDim * 1.8);
  controls.target.set(0, 0, 0);
  controls.update();
});
// const data = loader.parse(svgString);

console.log("SVG:", svg);

// --- Export STL ---
function exportSTL() {
  const exporter = new STLExporter();
  const result = exporter.parse(scene, { binary: true });
  const blob = new Blob([result], { type: "application/octet-stream" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "halftone-stamp.stl";
  link.click();
  URL.revokeObjectURL(link.href);
}

// Bouton d'export
const btn = document.createElement("button");
btn.textContent = "Exporter STL";
btn.style.cssText =
  "position:fixed;top:20px;right:20px;padding:10px 20px;font-size:14px;cursor:pointer;background:#222;color:#fff;border:none;border-radius:6px;z-index:10;";
btn.addEventListener("click", exportSTL);
document.body.appendChild(btn);

// --- Animation loop ---
function animate() {
  controls.update();
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

// --- Resize ---
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
