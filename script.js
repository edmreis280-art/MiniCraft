// ======================
// CENA, CÂMERA E RENDER
// ======================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ======================
// LUZ
// ======================
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(50, 100, 50);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.3));

// ======================
// TEXTURAS (PIXEL ART)
// ======================
function pixelTexture(color) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 16;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 16, 16);
  return new THREE.CanvasTexture(canvas);
}

const materials = [
  new THREE.MeshLambertMaterial({ map: pixelTexture("#3cb371") }), // grama
  new THREE.MeshLambertMaterial({ map: pixelTexture("#8b4513") }), // terra
  new THREE.MeshLambertMaterial({ map: pixelTexture("#888888") }), // pedra
  new THREE.MeshLambertMaterial({ map: pixelTexture("#a0522d") }), // madeira
  new THREE.MeshLambertMaterial({ map: pixelTexture("#f4e99b") })  // areia
];

// ======================
// MUNDO
// ======================
const blocks = [];
const size = 20;

function createBlock(x, y, z, mat) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mesh = new THREE.Mesh(geo, materials[mat]);
  mesh.position.set(x, y, z);
  mesh.userData.type = mat;
  scene.add(mesh);
  blocks.push(mesh);
}

for (let x = -size; x < size; x++) {
  for (let z = -size; z < size; z++) {
    const h = Math.floor(Math.random() * 2);
    createBlock(x, h, z, 0);
    createBlock(x, h - 1, z, 1);
  }
}

// ======================
// JOGADOR
// ======================
camera.position.set(0, 3, 5);

let velocityY = 0;
let canJump = false;

const keys = {};
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

// ======================
// MOUSE LOOK
// ======================
let yaw = 0, pitch = 0;
document.body.requestPointerLock =
  document.body.requestPointerLock ||
  document.body.mozRequestPointerLock;

document.body.addEventListener("click", () => {
  document.body.requestPointerLock();
});

document.addEventListener("mousemove", e => {
  if (document.pointerLockElement === document.body) {
    yaw -= e.movementX * 0.002;
    pitch -= e.movementY * 0.002;
    pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
    camera.rotation.set(pitch, yaw, 0);
  }
});

// ======================
// INVENTÁRIO
// ======================
let selectedBlock = 0;
const slots = document.querySelectorAll(".slot");

document.addEventListener("keydown", e => {
  const n = parseInt(e.key);
  if (n >= 1 && n <= 5) {
    selectedBlock = n - 1;
    slots.forEach(s => s.classList.remove("selected"));
    slots[selectedBlock].classList.add("selected");
  }
});

// ======================
// RAYCAST (QUEBRAR / COLOCAR)
// ======================
const raycaster = new THREE.Raycaster();

document.addEventListener("mousedown", e => {
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hits = raycaster.intersectObjects(blocks);

  if (hits.length === 0) return;
  const hit = hits[0];

  if (e.button === 0) {
    // Quebrar
    scene.remove(hit.object);
    blocks.splice(blocks.indexOf(hit.object), 1);
  }

  if (e.button === 2) {
    // Colocar
    const pos = hit.object.position.clone()
      .add(hit.face.normal);
    createBlock(
      Math.round(pos.x),
      Math.round(pos.y),
      Math.round(pos.z),
      selectedBlock
    );
  }
});

document.addEventListener("contextmenu", e => e.preventDefault());

// ======================
// LOOP PRINCIPAL
// ======================
function animate() {
  requestAnimationFrame(animate);

  const speed = 0.1;
  const dir = new THREE.Vector3();

  if (keys["KeyW"]) dir.z -= speed;
  if (keys["KeyS"]) dir.z += speed;
  if (keys["KeyA"]) dir.x -= speed;
  if (keys["KeyD"]) dir.x += speed;

  dir.applyEuler(camera.rotation);
  camera.position.add(dir);

  // Gravidade
  velocityY -= 0.01;
  camera.position.y += velocityY;

  if (camera.position.y < 2) {
    camera.position.y = 2;
    velocityY = 0;
    canJump = true;
  }

  if (keys["Space"] && canJump) {
    velocityY = 0.25;
    canJump = false;
  }

  renderer.render(scene, camera);
}

animate();

// ======================
// RESIZE
// ======================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
