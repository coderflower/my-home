import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { rooms } from './layout.js';
import { roomCenter, roomBounds } from './geometry.js';
import { buildHouse } from './house.js';
import { buildFurniture, screenMaterial } from './furniture.js';
import './style.css';

const STORAGE_KEY = 'my-home:settings';
const LOW_CUT = 1.05;
// 原始户型图与实测坐标的对应关系：每米像素数，以及坐标原点在图上的像素位置
const PLAN_IMAGE = { src: 'floorplan.png', pxPerMeter: 44, origin: [384, 511] };

const settings = Object.assign(
  { wallMode: 'auto', night: false, labels: true, plan: false, lights: {} },
  loadSettings(),
);

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // 隐私模式等场景写不进去，不影响使用
  }
}

// ---------- 场景 ----------

const viewport = document.getElementById('viewport');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
viewport.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.className = 'labels';
viewport.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);

const bounds = rooms.map(roomBounds).reduce((a, b) => ({
  minX: Math.min(a.minX, b.minX), maxX: Math.max(a.maxX, b.maxX),
  minZ: Math.min(a.minZ, b.minZ), maxZ: Math.max(a.maxZ, b.maxZ),
}));
const center = new THREE.Vector3((bounds.minX + bounds.maxX) / 2, 0, (bounds.minZ + bounds.maxZ) / 2);
const span = Math.max(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 2;
controls.maxDistance = 40;

const house = buildHouse();
scene.add(house.group);
scene.add(buildFurniture());

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(40, 64),
  new THREE.MeshStandardMaterial({ color: 0xd8d4cc, roughness: 1 }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.set(center.x, -0.05, center.z);
ground.receiveShadow = true;
scene.add(ground);

const hemi = new THREE.HemisphereLight(0xe4eef7, 0xb8a58c, 1.4);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff2de, 2.6);
sun.position.set(center.x - 7, 14, center.z + 9);
sun.target.position.copy(center);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = sun.shadow.camera.bottom = -span * 0.75;
sun.shadow.camera.right = sun.shadow.camera.top = span * 0.75;
sun.shadow.camera.far = 50;
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.02;
scene.add(sun, sun.target);

// ---------- 灯光 ----------

const roomLights = new Map();
for (const room of rooms) {
  if (room.floor === 'outdoor' && room.id !== 'balcony') continue;
  const [x, z] = roomCenter(room);
  const light = new THREE.PointLight(0xffd9a8, 0, 7, 2);
  light.position.set(x, 2.45, z);
  scene.add(light);
  roomLights.set(room.id, light);
}

function applyLighting() {
  const night = settings.night;
  scene.background = new THREE.Color(night ? 0x141922 : 0xeef1f4);
  hemi.intensity = night ? 0.12 : 1.4;
  sun.intensity = night ? 0.18 : 2.6;
  sun.color.set(night ? 0x9fb4d9 : 0xfff2de);
  ground.material.color.set(night ? 0x2a2f38 : 0xd8d4cc);
  for (const [id, light] of roomLights) {
    light.intensity = night && settings.lights[id] !== false ? 5 : 0;
  }
  screenMaterial.emissive.set(night ? 0x1b2a44 : 0x000000);
}

// ---------- 户型图对照 ----------

const planTexture = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}${PLAN_IMAGE.src}`, (tex) => {
  const { width, height } = tex.image;
  const { pxPerMeter, origin } = PLAN_IMAGE;
  planMesh.scale.set(width / pxPerMeter, height / pxPerMeter, 1);
  planMesh.position.set((width / 2 - origin[0]) / pxPerMeter, 0.015, (height / 2 - origin[1]) / pxPerMeter);
});
planTexture.colorSpace = THREE.SRGBColorSpace;
const planMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.MeshBasicMaterial({ map: planTexture, transparent: true, opacity: 0.8, depthWrite: false }),
);
planMesh.rotation.x = -Math.PI / 2;
planMesh.renderOrder = 1;
scene.add(planMesh);

// ---------- 房间标签 ----------

const labels = [];
for (const room of rooms) {
  const el = document.createElement('div');
  el.className = 'room-label';
  el.innerHTML = `<b>${room.name}</b><span>${room.area.toFixed(1)} m²</span>`;
  const label = new CSS2DObject(el);
  const [x, z] = roomCenter(room);
  label.position.set(x, 0.1, z);
  scene.add(label);
  labels.push(label);
}

// ---------- 墙体显示 ----------

const structure = [];
scene.traverse((obj) => {
  if (obj.isMesh && obj.userData.base) {
    obj.updateWorldMatrix(true, false);
    const box = new THREE.Box3().setFromObject(obj);
    obj.userData.center = box.getCenter(new THREE.Vector3());
    structure.push(obj);
  }
});

function setFaded(mesh, faded) {
  if (mesh.userData.faded === faded) return;
  mesh.userData.faded = faded;
  const { kind } = mesh.userData;
  if (kind === 'wall') {
    for (const m of [mesh.material].flat()) {
      m.transparent = faded;
      m.opacity = faded ? 0.12 : 1;
      m.depthWrite = !faded;
    }
    mesh.castShadow = !faded;
  } else if (kind === 'frame' || kind === 'glass') {
    mesh.visible = !faded;
  }
}

function applyWallMode() {
  const low = settings.wallMode === 'low';
  for (const mesh of structure) {
    const { y0, y1, cy } = mesh.userData.base;
    const top = low ? Math.min(y1, LOW_CUT) : y1;
    if (top <= y0 + 0.001) {
      mesh.visible = false;
      continue;
    }
    mesh.visible = true;
    mesh.userData.faded = undefined;
    setFaded(mesh, false);
    const ratio = (top - y0) / (y1 - y0);
    mesh.scale.y = ratio;
    mesh.position.y = cy - (y1 - y0) / 2 + ((y1 - y0) * ratio) / 2;
  }
}

const toCamera = new THREE.Vector3();
const offset = new THREE.Vector3();
// 自动避让：相机与观察点之间、且朝向相机的墙段变透明
function updateCutaway() {
  if (settings.wallMode !== 'auto') return;
  toCamera.subVectors(camera.position, controls.target).setY(0);
  const planar = toCamera.length();
  const steep = planar < 0.35 * (camera.position.y - controls.target.y);
  toCamera.normalize();
  for (const mesh of structure) {
    const { kind, center: c, normal } = mesh.userData;
    if (kind === 'leaf') continue;
    offset.subVectors(c, controls.target).setY(0);
    let faded = !steep && offset.dot(toCamera) > 0.3;
    if (faded && normal) faded = Math.abs(normal.dot(toCamera)) > 0.3;
    setFaded(mesh, faded);
  }
}

// ---------- 相机 ----------

const tween = { active: false, t: 0, fromPos: new THREE.Vector3(), toPos: new THREE.Vector3(), fromTarget: new THREE.Vector3(), toTarget: new THREE.Vector3() };

function flyTo(position, target) {
  tween.active = true;
  tween.t = 0;
  tween.fromPos.copy(camera.position);
  tween.fromTarget.copy(controls.target);
  tween.toPos.copy(position);
  tween.toTarget.copy(target);
}

// 让半径为 radius 的球完整落在画面内所需的相机距离，竖屏时按水平视角算
function fitDistance(radius) {
  const vfov = THREE.MathUtils.degToRad(camera.fov);
  const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
  return radius / Math.sin(Math.min(vfov, hfov) / 2);
}

function defaultView() {
  const dir = new THREE.Vector3(-0.45, 0.8, 0.75).normalize();
  return [center.clone().addScaledVector(dir, fitDistance(span * 0.55)), center.clone()];
}

function topView() {
  return [new THREE.Vector3(center.x, fitDistance(span * 0.52), center.z + 0.01), center.clone()];
}

function focusRoom(id) {
  const room = rooms.find((r) => r.id === id);
  const b = roomBounds(room);
  const [x, z] = roomCenter(room);
  const size = Math.max(b.maxX - b.minX, b.maxZ - b.minZ);
  const target = new THREE.Vector3(x, 0.6, z);
  const dir = new THREE.Vector3().subVectors(camera.position, controls.target).setY(0);
  if (dir.lengthSq() < 0.01) dir.set(-0.5, 0, 1);
  const dist = fitDistance(size * 0.75 + 0.8);
  dir.normalize().multiplyScalar(dist * 0.6);
  flyTo(new THREE.Vector3(x + dir.x, target.y + dist * 0.8, z + dir.z), target);
  setActiveRoom(id);
}

resize();
const [initPos, initTarget] = defaultView();
camera.position.copy(initPos);
controls.target.copy(initTarget);

// ---------- 交互 ----------

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const leaves = house.doors.map((d) => d.leaf);
const floorMeshes = [...house.floors.values()];
let downAt = null;

renderer.domElement.addEventListener('pointerdown', (e) => {
  downAt = [e.clientX, e.clientY];
});

renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects([...leaves, ...floorMeshes], false)[0];
  if (!hit) return;
  if (hit.object.userData.door) {
    const door = hit.object.userData.door;
    door.open = !door.open;
  } else if (hit.object.userData.room) {
    focusRoom(hit.object.userData.room);
  }
});

// ---------- 界面 ----------

const roomList = document.getElementById('room-list');
const totalArea = rooms.reduce((sum, r) => sum + r.area, 0);
document.getElementById('total-area').textContent = `${totalArea.toFixed(1)} m²`;

for (const room of rooms) {
  const li = document.createElement('li');
  li.dataset.room = room.id;
  const btn = document.createElement('button');
  btn.className = 'room-btn';
  btn.innerHTML = `<span>${room.name}</span><small>${room.area.toFixed(1)} m²</small>`;
  btn.addEventListener('click', () => {
    focusRoom(room.id);
    document.body.classList.remove('panel-open');
  });
  li.appendChild(btn);
  if (roomLights.has(room.id)) {
    const lightBtn = document.createElement('button');
    lightBtn.className = 'light-btn';
    lightBtn.title = `${room.name}灯光`;
    lightBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg>';
    lightBtn.addEventListener('click', () => {
      settings.lights[room.id] = settings.lights[room.id] === false;
      saveSettings();
      syncUi();
      applyLighting();
    });
    li.appendChild(lightBtn);
  }
  roomList.appendChild(li);
}

function setActiveRoom(id) {
  for (const li of roomList.children) li.classList.toggle('active', li.dataset.room === id);
}

const buttons = {
  view3d: document.getElementById('btn-3d'),
  viewTop: document.getElementById('btn-top'),
  reset: document.getElementById('btn-reset'),
  night: document.getElementById('btn-night'),
  labels: document.getElementById('btn-labels'),
  plan: document.getElementById('btn-plan'),
  panel: document.getElementById('btn-panel'),
};
const wallButtons = document.querySelectorAll('[data-wall]');

buttons.view3d.addEventListener('click', () => flyTo(...defaultView()));
buttons.viewTop.addEventListener('click', () => flyTo(...topView()));
buttons.reset.addEventListener('click', () => {
  flyTo(...defaultView());
  setActiveRoom(null);
  for (const door of house.doors) door.open = door.defaultOpen;
});
buttons.night.addEventListener('click', () => toggle('night'));
buttons.labels.addEventListener('click', () => toggle('labels'));
buttons.plan.addEventListener('click', () => toggle('plan'));
buttons.panel.addEventListener('click', () => document.body.classList.toggle('panel-open'));
for (const btn of wallButtons) {
  btn.addEventListener('click', () => {
    settings.wallMode = btn.dataset.wall;
    saveSettings();
    applyWallMode();
    syncUi();
  });
}

function toggle(key) {
  settings[key] = !settings[key];
  saveSettings();
  applyLighting();
  syncUi();
}

function syncUi() {
  buttons.night.classList.toggle('on', settings.night);
  buttons.labels.classList.toggle('on', settings.labels);
  buttons.plan.classList.toggle('on', settings.plan);
  for (const btn of wallButtons) btn.classList.toggle('on', btn.dataset.wall === settings.wallMode);
  for (const li of roomList.children) {
    const on = settings.night && settings.lights[li.dataset.room] !== false;
    li.querySelector('.light-btn')?.classList.toggle('on', on);
  }
  document.body.classList.toggle('night', settings.night);
  for (const label of labels) label.visible = settings.labels;
  planMesh.visible = settings.plan;
}

// ---------- 渲染循环 ----------

function resize() {
  const { clientWidth: w, clientHeight: h } = viewport;
  renderer.setSize(w, h);
  labelRenderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);

const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  if (tween.active) {
    tween.t = Math.min(1, tween.t + dt / 0.7);
    const k = 1 - Math.pow(1 - tween.t, 3);
    camera.position.lerpVectors(tween.fromPos, tween.toPos, k);
    controls.target.lerpVectors(tween.fromTarget, tween.toTarget, k);
    if (tween.t >= 1) tween.active = false;
  }
  for (const door of house.doors) {
    const goal = door.open ? door.openAngle : 0;
    door.current += (goal - door.current) * Math.min(1, dt * 8);
    door.pivot.rotation.y = door.current;
  }
  controls.update();
  updateCutaway();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
  requestAnimationFrame(frame);
}

applyLighting();
applyWallMode();
syncUi();
frame();
