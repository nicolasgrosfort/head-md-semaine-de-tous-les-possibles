import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import "./style.css";

// ============================================
// VARIABLE D'EXTRUSION — modifie cette valeur !
// ============================================
const EXTRUDE_DEPTH = 20;
// ============================================

// --- Setup renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x1a1a2e);
document.getElementById("app").appendChild(renderer.domElement);

// --- Setup scene & camera ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  2000,
);
camera.position.set(0, 0, 300);

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

// --- Load SVG & extrude ---
const loader = new SVGLoader();

loader.load("/2026-02-17-halftones.svg", (data) => {
  const group = new THREE.Group();

  const extrudeSettings = {
    depth: EXTRUDE_DEPTH,
    bevelEnabled: true,
    bevelThickness: 1,
    bevelSize: 0.5,
    bevelSegments: 3,
  };

  const material = new THREE.MeshStandardMaterial({
    color: 0xe0e0e0,
    metalness: 0.3,
    roughness: 0.4,
    side: THREE.DoubleSide,
  });

  for (const path of data.paths) {
    const fillColor = path.userData.style.fill;

    // Skip paths with no fill
    if (fillColor === "none") continue;

    const shapes = SVGLoader.createShapes(path);

    for (const shape of shapes) {
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      const mesh = new THREE.Mesh(geometry, material);
      group.add(mesh);
    }
  }

  // Center the group
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  group.position.x = -center.x;
  group.position.y = -center.y;
  group.position.z = -center.z;

  // SVG y-axis is inverted compared to Three.js
  group.scale.y *= -1;

  scene.add(group);

  // Adjust camera to fit the object
  const maxDim = Math.max(size.x, size.y, size.z);
  camera.position.set(0, 0, maxDim * 1.8);
  controls.update();
});

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
