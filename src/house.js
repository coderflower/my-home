import * as THREE from 'three';
import { rooms, walls, WALL_HEIGHT } from './layout.js';
import { splitWall, wallLength } from './geometry.js';
import { woodTexture, tileTexture } from './textures.js';

const frameMat = new THREE.MeshStandardMaterial({ color: 0x8d9093, roughness: 0.5, metalness: 0.4 });
const glassMat = new THREE.MeshPhysicalMaterial({
  color: 0xcfe6ef, roughness: 0.05, transparent: true, opacity: 0.28, depthWrite: false,
});
const leafMat = new THREE.MeshStandardMaterial({ color: 0x7a5233, roughness: 0.55 });
const entryLeafMat = new THREE.MeshStandardMaterial({ color: 0x4a4c50, roughness: 0.5, metalness: 0.3 });

// 结构构件统一记录原始上下标高，矮墙模式据此按高度裁切
function structural(mesh, y0, y1, kind) {
  mesh.userData.base = { y0, y1, cy: mesh.position.y };
  mesh.userData.kind = kind;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// 每段墙独立材质，自动避让时才能单独调透明度；顶面深色便于俯视时看清墙线
const wallSides = [];

export function setHouseColors({ wall, door }) {
  for (const m of wallSides) m.color.setHex(wall);
  leafMat.color.setHex(door);
}

function wallMaterial() {
  const side = new THREE.MeshStandardMaterial({ color: 0xf0e9dc, roughness: 0.95 });
  wallSides.push(side);
  const top = new THREE.MeshStandardMaterial({ color: 0x3b3b3b, roughness: 0.9 });
  return [side, side, top, side, side, side];
}

// 墙的局部坐标系：x 沿墙从 a 到 b，z 为墙法向，原点在 a 端墙中线
function localBox(x0, x1, y0, y1, depth, material, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, depth), material);
  mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, z);
  return mesh;
}

function buildFloors(group) {
  const mats = {
    wood: new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.55 }),
    tile: new THREE.MeshStandardMaterial({ map: tileTexture([226, 224, 218], '#b9b5ad', 0.6), roughness: 0.35 }),
    stone: new THREE.MeshStandardMaterial({ map: tileTexture([214, 206, 186], '#bfb39b', 0.8), roughness: 0.3 }),
    outdoor: new THREE.MeshStandardMaterial({ map: tileTexture([118, 120, 122], '#55585b', 0.4), roughness: 0.8 }),
  };
  const floors = new Map();
  for (const room of rooms) {
    // Shape 在 XY 平面，绕 X 轴转 -90° 后 y 变为 -z，因此这里取 -z
    const shape = new THREE.Shape(room.poly.map(([x, z]) => new THREE.Vector2(x, -z)));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, -0.04, 0);
    const mesh = new THREE.Mesh(geo, mats[room.floor]);
    mesh.receiveShadow = true;
    mesh.userData.room = room.id;
    group.add(mesh);
    floors.set(room.id, mesh);
  }
  return floors;
}

function addGlass(frame, x0, x1, y0, y1, z = 0) {
  const ft = 0.05;
  const glass = localBox(x0, x1, y0, y1, 0.02, glassMat, z);
  structural(glass, y0, y1, 'glass');
  glass.castShadow = false;
  frame.add(glass);
  const mid = (x0 + x1) / 2;
  const parts = [
    [x0, x1, y0, y0 + ft],
    [x0, x1, y1 - ft, y1],
    [x0, x0 + ft, y0, y1],
    [x1 - ft, x1, y0, y1],
    [mid - ft / 2, mid + ft / 2, y0, y1],
  ];
  for (const [p0, p1, q0, q1] of parts) {
    frame.add(structural(localBox(p0, p1, q0, q1, 0.07, frameMat, z), q0, q1, 'frame'));
  }
}

function addDoor(frame, doors, o) {
  if (o.sliding) {
    const w = (o.to - o.from) / 2 + 0.03;
    addGlass(frame, o.from, o.from + w, 0, o.head, -0.025);
    addGlass(frame, o.to - w, o.to, 0, o.head, 0.025);
    return;
  }
  if (!o.leaf) return;
  const width = o.to - o.from - 0.02;
  const h = o.head - 0.01;
  const atStart = o.leaf.hinge === 'start';
  const dir = atStart ? 1 : -1;
  const pivot = new THREE.Group();
  pivot.position.x = atStart ? o.from + 0.01 : o.to - 0.01;
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(width, h, 0.04), o.entry ? entryLeafMat : leafMat);
  leaf.geometry.translate((dir * width) / 2, 0, 0);
  leaf.position.y = h / 2;
  pivot.add(structural(leaf, 0, h, 'leaf'));
  const knob = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.14), frameMat);
  knob.position.set(dir * (width - 0.08), 1.0, 0);
  pivot.add(structural(knob, 0.985, 1.015, 'leaf'));
  frame.add(pivot);
  // 门扇绕铰链转向法向 swing 一侧
  const openAngle = -dir * o.leaf.swing * THREE.MathUtils.degToRad(88);
  const door = { pivot, leaf, openAngle, defaultOpen: !o.entry, open: !o.entry, current: 0 };
  door.current = door.open ? openAngle : 0;
  pivot.rotation.y = door.current;
  leaf.userData.door = door;
  doors.push(door);
}

export function buildHouse() {
  const group = new THREE.Group();
  const floors = buildFloors(group);
  const doors = [];

  for (const wall of walls) {
    const [ax, az] = wall.a;
    const ux = (wall.b[0] - ax) / wallLength(wall);
    const uz = (wall.b[1] - az) / wallLength(wall);
    const frame = new THREE.Group();
    frame.position.set(ax, 0, az);
    frame.rotation.y = Math.atan2(-uz, ux);
    group.add(frame);
    const normal = new THREE.Vector3(-uz, 0, ux);
    for (const piece of splitWall(wall, WALL_HEIGHT)) {
      const mesh = localBox(piece.from, piece.to, piece.bottom, piece.top, wall.t, wallMaterial());
      mesh.userData.normal = normal;
      frame.add(structural(mesh, piece.bottom, piece.top, 'wall'));
    }
    for (const o of wall.openings) {
      if (o.type === 'window') addGlass(frame, o.from, o.to, o.sill, o.head);
      if (o.type === 'door') addDoor(frame, doors, o);
    }
  }

  return { group, floors, doors };
}
