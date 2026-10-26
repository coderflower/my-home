import * as THREE from 'three';
import { rugTexture } from './textures.js';

const mat = (color, roughness = 0.7, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });

const M = {
  white: mat(0xf4f3ef, 0.5),
  cabinet: mat(0xeceae4, 0.45),
  counter: mat(0xfafafa, 0.25),
  wood: mat(0xb0835a, 0.6),
  darkWood: mat(0x6b4a33, 0.6),
  fabric: mat(0x8e9295, 0.95),
  sofa: mat(0x5d6266, 0.95),
  linen: mat(0xf2efe8, 0.95),
  duvet: mat(0xc9d3d8, 0.95),
  kidDuvet: mat(0xf0c987, 0.95),
  pillow: mat(0xfbfaf6, 0.95),
  black: mat(0x1d1f22, 0.4, 0.2),
  metal: mat(0xa9adb1, 0.35, 0.7),
  screen: new THREE.MeshStandardMaterial({ color: 0x0b0d10, roughness: 0.2, emissive: 0x000000 }),
  ceramic: mat(0xffffff, 0.15),
  green: mat(0x5b7f4a, 0.9),
  olive: mat(0x7d8452, 0.9),
  cream: mat(0xe8dcc4, 0.9),
  pot: mat(0xc9b8a0, 0.8),
  mirror: mat(0xdfe8ec, 0.05, 0.9),
  glass: new THREE.MeshStandardMaterial({ color: 0xcfe6ef, roughness: 0.05, transparent: true, opacity: 0.3, depthWrite: false }),
};

function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cyl(rTop, rBottom, h, material, x = 0, y = 0, z = 0, seg = 24) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, seg), material);
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

const FACING = { south: 0, east: Math.PI / 2, north: Math.PI, west: -Math.PI / 2 };

// rect 为 [x1, z1, x2, z2]（米）。builder 在局部坐标里建模：宽 w 沿 x，进深 d 沿 z，正面朝 +z
function place(parent, rect, facing, builder) {
  const [x1, z1, x2, z2] = rect;
  const sx = Math.abs(x2 - x1);
  const sz = Math.abs(z2 - z1);
  const sideways = facing === 'east' || facing === 'west';
  const g = new THREE.Group();
  builder(g, sideways ? sz : sx, sideways ? sx : sz);
  g.position.set((x1 + x2) / 2, 0, (z1 + z2) / 2);
  g.rotation.y = FACING[facing];
  parent.add(g);
  return g;
}

function bed(color) {
  return (g, w, d) => {
    g.add(box(w, 0.28, d, M.wood, 0, 0.04));
    g.add(box(w - 0.06, 0.22, d - 0.1, M.linen, 0, 0.32, 0.03));
    g.add(box(w - 0.02, 0.06, d * 0.68, color, 0, 0.54, d * 0.15));
    g.add(box(w + 0.04, 1.0, 0.08, M.darkWood, 0, 0, -d / 2 + 0.02));
    const pillows = w > 1.3 ? [-w / 4, w / 4] : [0];
    for (const x of pillows) g.add(box(Math.min(0.6, w / 2 - 0.1), 0.12, 0.38, M.pillow, x, 0.52, -d / 2 + 0.3));
  };
}

function wardrobe(height = 2.3) {
  return (g, w, d) => {
    const n = Math.max(2, Math.round(w / 0.5));
    const dw = w / n;
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + dw * (i + 0.5);
      g.add(box(dw - 0.008, height, d, M.cabinet, x, 0));
      const hx = x + (i % 2 ? -1 : 1) * (dw / 2 - 0.06);
      g.add(box(0.02, 0.3, 0.025, M.metal, hx, 0.95, d / 2 + 0.01));
    }
  };
}

function nightstand(g, w, d) {
  g.add(box(w, 0.5, d, M.white));
  g.add(box(0.12, 0.02, 0.02, M.metal, 0, 0.36, d / 2 + 0.01));
}

function chair(g, w, d) {
  g.add(box(w, 0.06, d, M.fabric, 0, 0.42));
  g.add(box(w, 0.42, 0.05, M.fabric, 0, 0.48, -d / 2 + 0.03));
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    g.add(cyl(0.015, 0.015, 0.42, M.darkWood, (x * (w - 0.06)) / 2, 0, (z * (d - 0.06)) / 2, 8));
  }
}

function table(height, top) {
  return (g, w, d) => {
    g.add(box(w, 0.04, d, top, 0, height - 0.04));
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      g.add(box(0.05, height - 0.04, 0.05, M.darkWood, (x * (w - 0.1)) / 2, 0, (z * (d - 0.1)) / 2));
    }
  };
}

function sofa(g, w, d) {
  g.add(box(w, 0.2, d, M.sofa, 0, 0.08));
  const seats = 3;
  for (let i = 0; i < seats; i++) {
    const sw = (w - 0.36) / seats;
    g.add(box(sw - 0.02, 0.16, d - 0.28, M.sofa, -w / 2 + 0.18 + sw * (i + 0.5), 0.28, 0.1));
    g.add(box(sw - 0.04, 0.42, 0.18, M.sofa, -w / 2 + 0.18 + sw * (i + 0.5), 0.36, -d / 2 + 0.2));
  }
  g.add(box(w, 0.42, 0.14, M.sofa, 0, 0.28, -d / 2 + 0.07));
  for (const s of [-1, 1]) g.add(box(0.16, 0.42, d, M.sofa, (s * (w - 0.16)) / 2, 0.18));
  for (const s of [-1, 1]) g.add(box(0.05, 0.08, 0.05, M.darkWood, (s * (w - 0.2)) / 2, 0, 0));
}

// 满墙电视柜：中间电视龛（悬空地柜 + 顶柜 + 木饰面背板），两侧通顶柜。niche 为电视龛中心的局部 x
function tvCabinetWall(niche, nicheWidth = 2.6, height = 2.68) {
  const doors = (g, x0, x1, d) => {
    if (x1 - x0 < 0.1) return;
    const n = Math.max(1, Math.round((x1 - x0) / 0.45));
    const dw = (x1 - x0) / n;
    for (let i = 0; i < n; i++) {
      const x = x0 + dw * (i + 0.5);
      g.add(box(dw - 0.008, height, d, M.cabinet, x));
      g.add(box(0.02, 0.4, 0.025, M.metal, x + (i % 2 ? -1 : 1) * (dw / 2 - 0.05), 1.0, d / 2 + 0.01));
    }
  };
  return (g, w, d) => {
    const n0 = niche - nicheWidth / 2;
    const n1 = niche + nicheWidth / 2;
    doors(g, -w / 2, n0, d);
    doors(g, n1, w / 2, d);
    g.add(box(nicheWidth, 0.4, d, M.cabinet, niche, 0.2));
    g.add(box(nicheWidth - 0.1, 0.02, 0.02, M.metal, niche, 0.55, d / 2 + 0.01));
    g.add(box(nicheWidth, height - 2.3, d, M.cabinet, niche, 2.3));
    g.add(box(nicheWidth, 1.7, 0.03, M.wood, niche, 0.6, -d / 2 + 0.015));
    g.add(box(1.65, 0.95, 0.04, M.screen, niche, 1.0, -d / 2 + 0.05));
  };
}

// 餐边柜：下柜 + 台面 + 木饰面开放格 + 通顶吊柜
function sideboard(height = 2.68) {
  return (g, w, d) => {
    const n = Math.max(2, Math.round(w / 0.45));
    const dw = w / n;
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + dw * (i + 0.5);
      const hx = x + (i % 2 ? -1 : 1) * (dw / 2 - 0.05);
      g.add(box(dw - 0.008, 0.82, d, M.cabinet, x));
      g.add(box(0.02, 0.2, 0.025, M.metal, hx, 0.55, d / 2 + 0.01));
      g.add(box(dw - 0.008, height - 1.45, d - 0.05, M.cabinet, x, 1.45, -0.025));
      g.add(box(0.02, 0.2, 0.025, M.metal, hx, 1.5, d / 2 - 0.04));
    }
    g.add(box(w, 0.03, d + 0.02, M.counter, 0, 0.82, 0.01));
    g.add(box(w, 0.6, 0.03, M.wood, 0, 0.85, -d / 2 + 0.015));
  };
}

function lounge(g, w, d) {
  g.add(box(w, 0.36, d, M.olive, 0, 0.1));
  g.add(box(w, 0.5, 0.16, M.olive, 0, 0.46, -d / 2 + 0.08));
  for (const s of [-1, 1]) g.add(box(0.12, 0.3, d, M.olive, (s * (w - 0.12)) / 2, 0.46));
}

function plant(g) {
  g.add(cyl(0.16, 0.12, 0.34, M.pot));
  const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), M.green);
  leaf.position.y = 0.72;
  leaf.scale.set(1, 1.3, 1);
  leaf.castShadow = true;
  g.add(leaf);
}

function floorLamp(g) {
  g.add(cyl(0.14, 0.16, 0.03, M.black));
  g.add(cyl(0.012, 0.012, 1.5, M.black));
  g.add(cyl(0.12, 0.2, 0.26, M.cream, 0, 1.45));
}

function counter(g, w, d) {
  g.add(box(w, 0.82, d - 0.02, M.cabinet, 0, 0.08, -0.01));
  g.add(box(w, 0.08, d - 0.08, M.black, 0, 0, -0.04));
  g.add(box(w, 0.04, d, M.counter, 0, 0.9));
}

function upperCabinet(g, w, d) {
  g.add(box(w, 0.7, d, M.cabinet, 0, 1.5));
}

function fridge(g, w, d) {
  g.add(box(w, 1.85, d, M.metal));
  if (w < 0.8) {
    g.add(box(0.02, 0.5, 0.03, M.black, w / 2 - 0.08, 1.1, d / 2 + 0.01));
    return;
  }
  g.add(box(0.006, 1.85, 0.01, M.black, 0, 0, d / 2 + 0.003));
  g.add(box(w, 0.006, 0.01, M.black, 0, 0.95, d / 2 + 0.003));
  for (const x of [-0.04, 0.04]) {
    g.add(box(0.02, 0.45, 0.03, M.black, x, 1.15, d / 2 + 0.01));
    g.add(box(0.02, 0.3, 0.03, M.black, x, 0.55, d / 2 + 0.01));
  }
}

function toilet(g) {
  g.add(box(0.38, 0.36, 0.16, M.ceramic, 0, 0.4, -0.27));
  g.add(cyl(0.17, 0.14, 0.4, M.ceramic, 0, 0, 0.02));
  g.add(cyl(0.19, 0.19, 0.03, M.ceramic, 0, 0.4, 0.04));
}

function vanity(g, w, d) {
  g.add(box(w, 0.5, d, M.wood, 0, 0.35));
  g.add(box(w, 0.03, d, M.counter, 0, 0.85));
  g.add(cyl(0.18, 0.15, 0.12, M.ceramic, 0, 0.88, 0.02));
  g.add(box(w * 0.8, 0.75, 0.02, M.mirror, 0, 1.15, -d / 2 + 0.01));
}

function washer(g, w, d) {
  g.add(box(w, 0.85, d, M.white));
  const door = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.03, 32), M.glass);
  door.rotation.x = Math.PI / 2;
  door.position.set(0, 0.45, d / 2 + 0.01);
  g.add(door);
}

// 洗衣机在下、烘干机叠放在上
function washerDryer(g, w, d) {
  washer(g, w, d);
  const dryer = new THREE.Group();
  dryer.position.y = 0.87;
  washer(dryer, w, d);
  g.add(dryer);
}

function laundrySink(g, w, d) {
  g.add(box(w, 0.8, d, M.cabinet));
  g.add(box(w, 0.04, d, M.counter, 0, 0.8));
  g.add(box(w - 0.14, 0.02, d - 0.2, M.metal, 0, 0.83, 0.02));
  g.add(cyl(0.015, 0.015, 0.3, M.metal, 0, 0.84, -d / 2 + 0.06, 8));
  g.add(box(0.03, 0.03, 0.18, M.metal, 0, 1.11, -d / 2 + 0.14));
}

function wallCabinet(y0, height) {
  return (g, w, d) => {
    const n = Math.max(2, Math.round(w / 0.45));
    const dw = w / n;
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + dw * (i + 0.5);
      g.add(box(dw - 0.008, height, d, M.cabinet, x, y0));
      g.add(box(0.12, 0.02, 0.025, M.metal, x, y0 + 0.06, d / 2 + 0.01));
    }
  };
}

function acIndoor(g, w) {
  g.add(box(w, 0.28, 0.2, M.white, 0, 2.3));
}

function desk(g, w, d) {
  table(0.75, M.wood)(g, w, d);
}

function shower(g, w, d) {
  g.add(box(w, 2.0, 0.02, M.glass, 0, 0.02, d / 2));
  g.add(cyl(0.12, 0.12, 0.02, M.metal, 0, 2.05, 0));
  g.add(cyl(0.012, 0.012, 1.2, M.metal, 0, 0.9, -d / 2 + 0.04, 8));
}

function rug(parent, [x1, z1, x2, z2]) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(x2 - x1, z2 - z1),
    new THREE.MeshStandardMaterial({ map: rugTexture(), roughness: 1 }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set((x1 + x2) / 2, 0.006, (z1 + z2) / 2);
  mesh.receiveShadow = true;
  parent.add(mesh);
}

export function buildFurniture() {
  const g = new THREE.Group();

  // 玄关
  place(g, [-1.803, -3.05, -1.482, -2.08], 'east', wardrobe(2.2));

  // 厨房：北墙灶台、东墙水槽
  place(g, [0, -3.63, 1.672, -3.03], 'south', counter);
  place(g, [0, -3.63, 1.672, -3.28], 'south', upperCabinet);
  place(g, [0.95, -3.58, 1.5, -3.08], 'south', (gg, w, d) => {
    gg.add(box(w, 0.012, d, M.black, 0, 0.94));
    gg.add(box(w + 0.1, 0.4, d, M.metal, 0, 1.6, -0.02));
  });
  place(g, [1.597, -3.175, 2.197, -0.93], 'west', counter);
  place(g, [1.68, -2.5, 2.13, -1.95], 'west', (gg, w, d) => gg.add(box(w, 0.012, d, M.metal, 0, 0.94)));

  // 餐厅，冰箱放在西墙凹槽里，旁边接餐边柜
  place(g, [-1.803, 0.72, -1.403, 2.5], 'east', sideboard());
  place(g, [-2.153, -0.48, -1.453, 0.42], 'east', fridge);
  place(g, [-0.6, 0.15, 1.0, 0.95], 'south', table(0.75, M.wood));
  for (const x of [-0.3, 0.25]) {
    place(g, [x, -0.3, x + 0.45, 0.12], 'south', chair);
    place(g, [x, 0.98, x + 0.45, 1.4], 'north', chair);
  }

  // 客厅
  rug(g, [-1.2, 2.7, 0.6, 4.9]);
  place(g, [0.75, 2.7, 1.597, 4.9], 'west', sofa);
  place(g, [-1.803, 2.5, -1.403, 6.02], 'east', tvCabinetWall(0.46));
  place(g, [-0.6, 3.5, 0.0, 4.1], 'south', (gg) => {
    gg.add(cyl(0.3, 0.3, 0.04, M.white, 0, 0.38));
    gg.add(cyl(0.04, 0.12, 0.38, M.white));
  });
  const armchair = place(g, [-1.0, 5.1, -0.3, 5.75], 'north', lounge);
  armchair.rotation.y = Math.PI * 0.8;
  place(g, [1.2, 5.0, 1.45, 5.25], 'south', floorLamp);

  // 卫生间与过道洗手台
  place(g, [1.797, -0.73, 2.597, 0.87], 'east', shower);
  place(g, [2.95, -0.73, 3.4, -0.24], 'south', toilet);
  place(g, [3.797, -0.73, 4.797, -0.23], 'south', vanity);

  // 儿童房
  place(g, [4.9, -1.63, 6.9, -0.43], 'east', bed(M.kidDuvet));
  place(g, [6.1, 0.92, 7.67, 1.42], 'north', wardrobe());
  place(g, [7.15, -0.5, 7.67, 0.7], 'west', desk);
  place(g, [6.65, -0.1, 7.1, 0.35], 'east', chair);
  place(g, [4.897, -1.2, 5.017, -0.4], 'east', acIndoor);

  // 主卧室，北侧为衣帽间（隔断在 layout.js）
  place(g, [6.097, 1.52, 7.697, 2.07], 'south', wardrobe(2.4));
  place(g, [7.147, 2.07, 7.697, 2.78], 'west', wardrobe(2.4));
  place(g, [5.65, 2.92, 7.67, 4.72], 'west', bed(M.duvet));
  place(g, [7.2, 4.72, 7.65, 5.12], 'west', nightstand);
  place(g, [4.697, 3.1, 4.817, 3.9], 'east', acIndoor);

  // 次卧
  place(g, [2.9, 2.22, 4.59, 2.82], 'south', wardrobe());
  place(g, [2.55, 3.15, 4.59, 4.7], 'west', bed(M.duvet));
  place(g, [4.15, 4.72, 4.59, 5.1], 'west', nightstand);
  place(g, [1.797, 3.2, 1.917, 4.0], 'east', acIndoor);

  // 阳台
  place(g, [3.897, 5.32, 4.497, 5.94], 'west', washerDryer);
  place(g, [3.897, 5.97, 4.497, 6.6], 'west', laundrySink);
  place(g, [3.897, 5.32, 4.497, 6.6], 'west', wallCabinet(1.8, 0.62));
  place(g, [1.82, 6.22, 2.17, 6.57], 'south', plant);
  place(g, [2.0, 5.9, 3.8, 5.95], 'south', (gg, w) => gg.add(box(w, 0.03, 0.03, M.metal, 0, 2.4)));

  return g;
}

export const screenMaterial = M.screen;
