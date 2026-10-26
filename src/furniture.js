import * as THREE from 'three';
import { rugTexture, pegboardTexture } from './textures.js';

const mat = (color, roughness = 0.7, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });

// 颜色由 applyStyle 按风格写入，这里只是占位
const M = Object.fromEntries(
  ['white', 'cream', 'cabinet', 'walnut', 'counter', 'terrazzo', 'sage', 'wood', 'leg', 'cane', 'sofa', 'leather', 'mustard',
    'linen', 'duvet', 'guestDuvet', 'kidDuvet', 'pillow', 'brass', 'pot']
    .map((key) => [key, mat(0xffffff)]),
);
Object.assign(M, {
  white: mat(0xf2ede3, 0.5),
  black: mat(0x1d1f22, 0.4, 0.2),
  metal: mat(0xa9adb1, 0.35, 0.7),
  screen: new THREE.MeshStandardMaterial({ color: 0x0b0d10, roughness: 0.2, emissive: 0x000000 }),
  ceramic: mat(0xffffff, 0.15),
  green: mat(0x4f7445, 0.9),
  opal: new THREE.MeshStandardMaterial({ color: 0xfff6e6, roughness: 0.3 }),
  mirror: mat(0xcfdde3, 0.15, 0.3),
  glass: new THREE.MeshStandardMaterial({ color: 0xcfe6ef, roughness: 0.05, transparent: true, opacity: 0.3, depthWrite: false }),
});

// legs：tapered 锥形外撇 / straight 圆直腿 / square 方腿 / metal 细金属腿 / plinth 包底
// handle：knob 圆钮 / bar 竖条拉手 / ring 吊环 / hidden 隐藏拉槽
// slats：床头与电视背景用竖条格栅；lounge：eames 伊姆斯躺椅，其余为布艺单椅
export const STYLES = [
  {
    id: 'midcentury', name: '中古风', legs: 'tapered', handle: 'knob', slats: true, lounge: 'eames',
    wall: 0xf0e9dc, door: 0x7a5233, metal: 0.85,
    colors: {
      cabinet: 0x7a5537, walnut: 0x5e3d26, cream: 0xeee4cf, counter: 0xf4efe6, terrazzo: 0xe6ddcc, sage: 0x7f8b6c,
      wood: 0x9a6639, leg: 0x5e3d26, cane: 0xd6bd86, sofa: 0xa5552f, leather: 0x8a4a22, mustard: 0xc9962f,
      linen: 0xf0e8d8, duvet: 0xc9962f, guestDuvet: 0x7f8b6c, kidDuvet: 0x5f8a8b, pillow: 0xf6f0e3, brass: 0xb8913f, pot: 0xb5643c,
    },
    rug: { pattern: 'geo', base: '#ece2cd', colors: ['#c9962f', '#a5552f', '#4f7d7c', '#7f8b6c'], border: '#5e3d26' },
  },
  {
    id: 'chinese', name: '新中式', legs: 'square', handle: 'ring', slats: true, lounge: 'armchair',
    wall: 0xf3efe7, door: 0x4a2f22, metal: 0.8,
    colors: {
      cabinet: 0x4a2f22, walnut: 0x3b2419, cream: 0xf1ece2, counter: 0xf5f2ec, terrazzo: 0xece8e0, sage: 0x8a9a8c,
      wood: 0x4a2f22, leg: 0x3b2419, cane: 0xe8e1d3, sofa: 0xe4dccc, leather: 0x2f4a4a, mustard: 0x2f4a4a,
      linen: 0xf3eee4, duvet: 0xb8a27a, guestDuvet: 0x8fa39a, kidDuvet: 0x6e86a3, pillow: 0xf8f4ec, brass: 0xa8823f, pot: 0x2f3d4a,
    },
    rug: { pattern: 'border', base: '#ece6da', colors: ['#2f4a4a'], border: '#2f4a4a' },
  },
  {
    id: 'nordic', name: '北欧风', legs: 'straight', handle: 'knob', slats: false, lounge: 'armchair',
    wall: 0xf7f6f3, door: 0xf1efea, metal: 0,
    colors: {
      cabinet: 0xf2f0eb, walnut: 0xc9a77c, cream: 0xf2f0eb, counter: 0xf7f6f3, terrazzo: 0xe9e9e6, sage: 0xb7c4c8,
      wood: 0xd2b48a, leg: 0xc9a77c, cane: 0xbfc2c4, sofa: 0xa9adb0, leather: 0xd8c3a5, mustard: 0xd8b45a,
      linen: 0xf6f5f2, duvet: 0xe3e6e9, guestDuvet: 0xb9c7cf, kidDuvet: 0xe7c6b5, pillow: 0xffffff, brass: 0xc9a77c, pot: 0xf4f4f2,
    },
    rug: { pattern: 'stripe', base: '#efefec', colors: ['#2e3236', '#c9ccce'], border: '#efefec' },
  },
  {
    id: 'modern', name: '现代简约', legs: 'metal', handle: 'bar', slats: false, lounge: 'armchair',
    wall: 0xf5f5f4, door: 0xe6e6e4, metal: 0.3,
    colors: {
      cabinet: 0xe9e8e6, walnut: 0x3a3b3d, cream: 0xe9e8e6, counter: 0xf2f2f2, terrazzo: 0xd9d9d9, sage: 0x9a9c9e,
      wood: 0x2b2c2e, leg: 0x1d1f22, cane: 0x8f9396, sofa: 0x5d6266, leather: 0x2b2c2e, mustard: 0xbfc3c6,
      linen: 0xf1f1f1, duvet: 0xd5d8db, guestDuvet: 0x9aa3ab, kidDuvet: 0x8fb0c7, pillow: 0xfafafa, brass: 0x1d1f22, pot: 0xdcdcdc,
    },
    rug: { pattern: 'plain', base: '#9a9ea2', colors: [], border: '#6f7378' },
  },
  {
    id: 'cream', name: '奶油风', legs: 'plinth', handle: 'hidden', slats: false, lounge: 'armchair',
    wall: 0xf4ece0, door: 0xeee3d1, metal: 0.6,
    colors: {
      cabinet: 0xeee3d1, walnut: 0xd8c2a3, cream: 0xf3ebde, counter: 0xf7f2ea, terrazzo: 0xefe6d8, sage: 0xe8dcc8,
      wood: 0xd8c2a3, leg: 0xe2d1b8, cane: 0xf1e7d8, sofa: 0xf1e9dc, leather: 0xc89b6d, mustard: 0xc89b6d,
      linen: 0xfaf5ec, duvet: 0xefe4d2, guestDuvet: 0xe8d3bf, kidDuvet: 0xf1d7c9, pillow: 0xfffaf2, brass: 0xcdb48a, pot: 0xe9dcc8,
    },
    rug: { pattern: 'plain', base: '#efe5d4', colors: [], border: '#e2d2bb' },
  },
  {
    id: 'natural', name: '原木风', legs: 'straight', handle: 'knob', slats: true, lounge: 'armchair',
    wall: 0xf2ede3, door: 0xc9a57a, metal: 0,
    colors: {
      cabinet: 0xc9a57a, walnut: 0xb48a5c, cream: 0xe9dcc6, counter: 0xf3eee5, terrazzo: 0xe4dccd, sage: 0x9aa58a,
      wood: 0xc09868, leg: 0xb48a5c, cane: 0xd8c8a8, sofa: 0xd9cdb5, leather: 0x8a9a6e, mustard: 0x8a9a6e,
      linen: 0xf3eee4, duvet: 0xe6dcc8, guestDuvet: 0xc9c2a8, kidDuvet: 0xb9c6a2, pillow: 0xf8f4ea, brass: 0xa5825a, pot: 0xa9a196,
    },
    rug: { pattern: 'border', base: '#cdb894', colors: ['#a88d63'], border: '#a88d63' },
  },
  {
    id: 'luxury', name: '轻奢风', legs: 'metal', handle: 'bar', slats: false, lounge: 'armchair',
    wall: 0xeeebe6, door: 0x3a3634, metal: 0.9,
    colors: {
      cabinet: 0x8c8782, walnut: 0x2e2b29, cream: 0xd9d4cc, counter: 0xf3f1ee, terrazzo: 0xf0eeea, sage: 0x3a3634,
      wood: 0x2e2b29, leg: 0xc9a86a, cane: 0x6e7378, sofa: 0x6e7378, leather: 0x2f5d50, mustard: 0xc5a46d,
      linen: 0xeceae6, duvet: 0xbfb8ae, guestDuvet: 0x9da3a6, kidDuvet: 0xd8c0b8, pillow: 0xf6f4f0, brass: 0xc9a86a, pot: 0x2e2b29,
    },
    rug: { pattern: 'border', base: '#b9b6b1', colors: ['#c9a86a'], border: '#c9a86a' },
  },
];

// 家具上的灯各用一份灯罩材质，lights.js 按开关状态改发光
export const lampMaterials = Object.fromEntries(
  ['dining', 'floor', 'masterBedside', 'guestBedside'].map((key) => [key, M.opal.clone()]),
);

let style = STYLES[0];

function applyStyle(id) {
  style = STYLES.find((s) => s.id === id) ?? STYLES[0];
  for (const [key, color] of Object.entries(style.colors)) M[key].color.setHex(color);
  M.brass.metalness = style.metal;
  M.brass.roughness = style.metal > 0.5 ? 0.3 : 0.6;
  M.leg.metalness = style.legs === 'metal' ? style.metal : 0;
  M.leg.roughness = style.legs === 'metal' ? 0.3 : 0.55;
}

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

function sphere(r, material, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  return mesh;
}

// 柜门把手，样式随风格
function handle(x, y, z) {
  if (style.handle === 'bar') return box(0.016, 0.22, 0.02, M.brass, x, y - 0.11, z + 0.01);
  if (style.handle === 'hidden') return box(0.14, 0.008, 0.008, M.black, x, y + 0.2, z + 0.002);
  const mesh = style.handle === 'ring'
    ? new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.005, 8, 24), M.brass)
    : new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.025, 16), M.brass);
  if (style.handle === 'knob') mesh.rotation.x = Math.PI / 2;
  mesh.position.set(x, y, z + 0.012);
  return mesh;
}

// 家具腿，样式随风格；pivot 在腿顶部，倾斜时腿脚向外撇
function legs(g, w, d, height, inset = 0.06, material = M.leg) {
  if (style.legs === 'plinth') {
    g.add(box(w - inset * 2, height, d - inset * 2, material));
    return;
  }
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    let leg;
    if (style.legs === 'square') leg = box(0.04, height, 0.04, material, 0, -height);
    else if (style.legs === 'metal') leg = cyl(0.008, 0.008, height, material, 0, -height, 0, 8);
    else if (style.legs === 'straight') leg = cyl(0.018, 0.016, height, material, 0, -height, 0, 10);
    else leg = cyl(0.022, 0.012, height, material, 0, -height, 0, 10);
    const pivot = new THREE.Group();
    pivot.position.set((sx * w) / 2 - sx * inset, height, (sz * d) / 2 - sz * inset);
    if (style.legs === 'tapered') pivot.rotation.set(-sz * 0.1, 0, sx * 0.1);
    pivot.add(leg);
    g.add(pivot);
  }
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

// 低床架；床头为竖条格栅或软包
function bed(color) {
  return (g, w, d) => {
    g.add(box(w, 0.16, d, M.walnut, 0, 0.16));
    legs(g, w, d, 0.16, 0.08);
    g.add(box(w - 0.06, 0.22, d - 0.1, M.linen, 0, 0.3, 0.03));
    g.add(box(w - 0.02, 0.06, d * 0.68, color, 0, 0.52, d * 0.15));
    if (style.slats) {
      const slats = Math.round(w / 0.12);
      for (let i = 0; i < slats; i++) {
        g.add(box(w / slats - 0.02, 0.62, 0.05, M.walnut, -w / 2 + (w / slats) * (i + 0.5), 0.32, -d / 2 + 0.03));
      }
      g.add(box(w + 0.04, 0.04, 0.08, M.walnut, 0, 0.94, -d / 2 + 0.03));
    } else {
      g.add(box(w + 0.04, 0.78, 0.12, M.cane, 0, 0.2, -d / 2 + 0.04));
    }
    const pillows = w > 1.3 ? [-w / 4, w / 4] : [0];
    for (const x of pillows) g.add(box(Math.min(0.6, w / 2 - 0.1), 0.12, 0.38, M.pillow, x, 0.5, -d / 2 + 0.3));
    g.add(box(Math.min(0.4, w / 3), 0.1, 0.12, M.mustard, 0, 0.56, -d / 2 + 0.52));
  };
}

// 一排柜门，每扇带把手
function cabinetDoors(g, x0, x1, y0, height, d, width = 0.45, material = M.cabinet, knobY = null) {
  if (x1 - x0 < 0.1) return;
  const n = Math.max(1, Math.round((x1 - x0) / width));
  const dw = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const x = x0 + dw * (i + 0.5);
    g.add(box(dw - 0.006, height, d, material, x, y0));
    const kx = x + (i % 2 ? -1 : 1) * (dw / 2 - 0.05);
    g.add(handle(kx, knobY ?? y0 + Math.min(height / 2, 1.0), d / 2));
  }
}

function wardrobe(height = 2.3) {
  return (g, w, d) => {
    g.add(box(w, 0.08, d - 0.04, M.walnut, 0, 0, -0.02));
    cabinetDoors(g, -w / 2, w / 2, 0.08, height - 0.08, d, 0.5);
  };
}

function nightstand(g, w, d) {
  legs(g, w, d, 0.2, 0.05);
  g.add(box(w, 0.32, d, M.walnut, 0, 0.2));
  g.add(box(w - 0.04, 0.005, 0.01, M.black, 0, 0.36, d / 2 + 0.002));
  g.add(handle(0, 0.44, d / 2));
  g.add(handle(0, 0.28, d / 2));
}

// 餐椅：编织座面 + 靠背横杆
function chair(g, w, d) {
  legs(g, w, d, 0.42, 0.05);
  g.add(box(w - 0.04, 0.04, d - 0.04, M.cane, 0, 0.42));
  g.add(box(w - 0.02, 0.025, 0.04, M.wood, 0, 0.42, d / 2 - 0.03));
  for (const s of [-1, 1]) g.add(cyl(0.012, 0.016, 0.3, M.wood, (s * (w - 0.1)) / 2, 0.44, -d / 2 + 0.06, 8));
  g.add(box(w - 0.04, 0.05, 0.06, M.wood, 0, 0.72, -d / 2 + 0.06));
}

function table(height, top) {
  return (g, w, d) => {
    g.add(box(w, 0.035, d, top, 0, height - 0.035));
    g.add(box(w - 0.16, 0.06, d - 0.16, top, 0, height - 0.095));
    legs(g, w, d, height - 0.035, 0.12);
  };
}

// 三人沙发：独立靠包；中古风为木扶手，其余为软包扶手
function sofa(g, w, d) {
  legs(g, w, d, 0.16, 0.08);
  g.add(box(w, 0.04, d, M.walnut, 0, 0.16));
  const seats = 3;
  const inner = w - 0.12;
  for (let i = 0; i < seats; i++) {
    const sw = inner / seats;
    const x = -inner / 2 + sw * (i + 0.5);
    g.add(box(sw - 0.02, 0.18, d - 0.22, M.sofa, x, 0.2, 0.08));
    g.add(box(sw - 0.04, 0.44, 0.16, M.sofa, x, 0.38, -d / 2 + 0.16));
  }
  g.add(box(w, 0.5, 0.08, M.sofa, 0, 0.2, -d / 2 + 0.04));
  for (const s of [-1, 1]) {
    if (style.legs === 'tapered') {
      g.add(box(0.06, 0.04, d - 0.04, M.walnut, (s * (w - 0.06)) / 2, 0.56));
      g.add(box(0.04, 0.36, 0.04, M.walnut, (s * (w - 0.06)) / 2, 0.2, d / 2 - 0.06));
    } else {
      g.add(box(0.14, 0.42, d, M.sofa, (s * (w - 0.14)) / 2, 0.2));
    }
  }
  g.add(box(0.36, 0.3, 0.12, M.mustard, -inner / 3, 0.4, -d / 2 + 0.3));
}

// 满墙电视柜：中间电视龛（悬空地柜 + 顶柜 + 背板），两侧通顶柜。niche 为电视龛中心的局部 x
function tvCabinetWall(niche, nicheWidth = 2.6, height = 2.68) {
  return (g, w, d) => {
    const n0 = niche - nicheWidth / 2;
    const n1 = niche + nicheWidth / 2;
    cabinetDoors(g, -w / 2, n0, 0, height, d);
    cabinetDoors(g, n1, w / 2, 0, height, d);
    cabinetDoors(g, n0, n1, 0.2, 0.42, d, 0.65, M.walnut, 0.41);
    cabinetDoors(g, n0, n1, 2.3, height - 2.3, d, 0.65, M.cabinet, 2.36);
    if (style.slats) {
      const slats = Math.round(nicheWidth / 0.08);
      for (let i = 0; i < slats; i++) {
        g.add(box(nicheWidth / slats - 0.015, 1.68, 0.03, M.wood, n0 + (nicheWidth / slats) * (i + 0.5), 0.62, -d / 2 + 0.015));
      }
    } else {
      g.add(box(nicheWidth, 1.68, 0.03, M.walnut, niche, 0.62, -d / 2 + 0.015));
    }
    g.add(box(1.65, 0.95, 0.04, M.screen, niche, 1.0, -d / 2 + 0.06));
  };
}

// 餐边柜：下柜 + 台面 + 开放格背板 + 通顶吊柜
function sideboard(height = 2.68) {
  return (g, w, d) => {
    cabinetDoors(g, -w / 2, w / 2, 0.1, 0.72, d, 0.45, M.walnut, 0.7);
    g.add(box(w, 0.1, d - 0.04, M.black, 0, 0, -0.02));
    g.add(box(w, 0.03, d + 0.02, M.terrazzo, 0, 0.82, 0.01));
    g.add(box(w, 0.6, 0.03, M.sage, 0, 0.85, -d / 2 + 0.015));
    cabinetDoors(g, -w / 2, w / 2, 1.45, height - 1.45, d - 0.05, 0.45, M.cream, 1.52);
  };
}

// 单椅：中古风为伊姆斯躺椅（木壳 + 皮垫 + 星形底座），其余风格为布艺单椅
function lounge(g, w, d) {
  if (style.lounge !== 'eames') {
    legs(g, w, d, 0.14, 0.06);
    g.add(box(w, 0.26, d, M.leather, 0, 0.14));
    g.add(box(w, 0.42, 0.14, M.leather, 0, 0.4, -d / 2 + 0.07));
    for (const s of [-1, 1]) g.add(box(0.12, 0.22, d, M.leather, (s * (w - 0.12)) / 2, 0.4));
    return;
  }
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const foot = box(0.04, 0.03, Math.min(w, d) / 2, M.black, 0, 0.02);
    foot.position.set((Math.cos(a) * Math.min(w, d)) / 4, 0.035, (Math.sin(a) * Math.min(w, d)) / 4);
    foot.rotation.y = -a + Math.PI / 2;
    g.add(foot);
  }
  g.add(cyl(0.03, 0.03, 0.25, M.black, 0, 0.03));
  g.add(box(w, 0.06, d - 0.1, M.walnut, 0, 0.28, 0.03));
  g.add(box(w - 0.08, 0.1, d - 0.16, M.leather, 0, 0.34, 0.05));
  const back = new THREE.Group();
  back.position.set(0, 0.34, -d / 2 + 0.08);
  back.rotation.x = -0.25;
  back.add(box(w, 0.6, 0.06, M.walnut, 0, 0, -0.04));
  back.add(box(w - 0.08, 0.56, 0.08, M.leather, 0, 0.02, 0.02));
  g.add(back);
  for (const s of [-1, 1]) g.add(box(0.08, 0.04, d * 0.6, M.leather, (s * (w - 0.08)) / 2, 0.52, 0.02));
}

function plant(g) {
  legs(g, 0.3, 0.3, 0.22, 0.04);
  g.add(cyl(0.15, 0.15, 0.02, M.wood, 0, 0.22));
  g.add(cyl(0.15, 0.11, 0.3, M.pot, 0, 0.24));
  const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), M.green);
  leaf.position.y = 0.92;
  leaf.scale.set(1, 1.3, 1);
  leaf.castShadow = true;
  g.add(leaf);
}

// 落地灯：乳白球形灯罩
function floorLamp(g) {
  g.add(cyl(0.14, 0.15, 0.025, M.brass));
  g.add(cyl(0.01, 0.01, 1.45, M.brass));
  g.add(sphere(0.16, lampMaterials.floor, 0, 1.6, 0));
}

// 床头台灯，y0 为床头柜台面高度
function tableLamp(y0, material) {
  return (g) => {
    g.add(cyl(0.06, 0.07, 0.03, M.brass, 0, y0));
    g.add(cyl(0.008, 0.008, 0.22, M.brass, 0, y0 + 0.03));
    g.add(cyl(0.08, 0.12, 0.16, material, 0, y0 + 0.2));
  };
}

// 乳白球形吊灯
function pendant(g) {
  g.add(cyl(0.006, 0.006, 0.8, M.brass, 0, 1.9));
  g.add(cyl(0.05, 0.05, 0.02, M.brass, 0, 2.68));
  g.add(sphere(0.2, lampMaterials.dining, 0, 1.75, 0));
}

function coffeeTable(g, w, d) {
  legs(g, w, d, 0.36, 0.2);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.04, 48), M.walnut);
  top.scale.set(w, 1, d);
  top.position.y = 0.38;
  top.castShadow = top.receiveShadow = true;
  g.add(top);
}

function counter(g, w, d) {
  cabinetDoors(g, -w / 2, w / 2, 0.08, 0.82, d - 0.02, 0.45, M.cabinet, 0.75);
  g.add(box(w, 0.08, d - 0.08, M.black, 0, 0, -0.04));
  g.add(box(w, 0.04, d, M.terrazzo, 0, 0.9));
}

function upperCabinet(g, w, d) {
  cabinetDoors(g, -w / 2, w / 2, 1.5, 0.7, d, 0.45, M.cream, 1.56);
  g.add(box(w, 0.56, 0.01, M.sage, 0, 0.94, -d / 2 + 0.005));
}

function fridge(g, w, d) {
  g.add(box(w, 1.85, d, M.cream));
  if (w < 0.8) {
    g.add(box(0.02, 0.5, 0.03, M.brass, w / 2 - 0.08, 1.1, d / 2 + 0.01));
    return;
  }
  g.add(box(0.006, 1.85, 0.01, M.black, 0, 0, d / 2 + 0.003));
  g.add(box(w, 0.006, 0.01, M.black, 0, 0.95, d / 2 + 0.003));
  for (const x of [-0.04, 0.04]) {
    g.add(box(0.02, 0.45, 0.03, M.brass, x, 1.15, d / 2 + 0.01));
    g.add(box(0.02, 0.3, 0.03, M.brass, x, 0.55, d / 2 + 0.01));
  }
}

// 窄推拉侧柜：整块门板随内部拉篮一起拉出
function pullOutCabinet(height) {
  return (g, w, d) => {
    g.add(box(w, height, d, M.cabinet));
    g.add(box(0.025, 0.02, 0.025, M.brass, 0, height - 0.12, d / 2 + 0.01));
  };
}

// 洞洞板：板面颜色随风格取柜门浅色，挂一块搁板、几只挂钩、一个帆布包和钥匙；y0、height 为板的离地高度和板高
function pegboard(y0, height) {
  return (g, w, d) => {
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(w, height, d),
      new THREE.MeshStandardMaterial({ map: pegboardTexture(w, height), color: M.cream.color, roughness: 0.7 }),
    );
    board.position.set(0, y0 + height / 2, 0);
    board.receiveShadow = true;
    g.add(board);
    const front = d / 2;
    g.add(box(0.5, 0.025, 0.16, M.wood, -w / 2 + 0.35, 1.75, front + 0.08));
    g.add(box(0.14, 0.1, 0.1, M.mustard, -w / 2 + 0.25, 1.775, front + 0.08));
    g.add(cyl(0.04, 0.035, 0.12, M.pot, -w / 2 + 0.45, 1.775, front + 0.08));
    for (const x of [0.1, 0.3, 0.5]) g.add(box(0.012, 0.012, 0.08, M.brass, x - w / 2 + 0.2, 1.45, front + 0.04));
    g.add(box(0.32, 0.38, 0.06, M.sofa, w / 2 - 0.35, 1.0, front + 0.04));
    g.add(box(0.012, 0.012, 0.08, M.brass, w / 2 - 0.35, 1.45, front + 0.04));
    g.add(box(0.04, 0.07, 0.01, M.metal, -w / 2 + 0.3, 1.34, front + 0.08));
  };
}

function toilet(g) {
  g.add(box(0.38, 0.36, 0.16, M.ceramic, 0, 0.4, -0.27));
  g.add(cyl(0.17, 0.14, 0.4, M.ceramic, 0, 0, 0.02));
  g.add(cyl(0.19, 0.19, 0.03, M.ceramic, 0, 0.4, 0.04));
}

// 浴室柜 + 圆镜
function vanity(g, w, d) {
  cabinetDoors(g, -w / 2, w / 2, 0.35, 0.5, d, 0.5, M.walnut, 0.75);
  g.add(box(w, 0.03, d, M.terrazzo, 0, 0.85));
  g.add(cyl(0.18, 0.15, 0.12, M.ceramic, 0, 0.88, 0.02));
  const mirror = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.02, 48), M.mirror);
  mirror.rotation.x = Math.PI / 2;
  mirror.position.set(0, 1.5, -d / 2 + 0.02);
  g.add(mirror);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.335, 0.012, 8, 48), M.brass);
  rim.position.set(0, 1.5, -d / 2 + 0.03);
  g.add(rim);
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
  cabinetDoors(g, -w / 2, w / 2, 0, 0.8, d, 0.45, M.cabinet, 0.7);
  g.add(box(w, 0.04, d, M.terrazzo, 0, 0.8));
  g.add(box(w - 0.14, 0.02, d - 0.2, M.metal, 0, 0.83, 0.02));
  g.add(cyl(0.015, 0.015, 0.3, M.brass, 0, 0.84, -d / 2 + 0.06, 8));
  g.add(box(0.03, 0.03, 0.18, M.brass, 0, 1.11, -d / 2 + 0.14));
}

function wallCabinet(y0, height) {
  return (g, w, d) => cabinetDoors(g, -w / 2, w / 2, y0, height, d, 0.45, M.cream, y0 + 0.06);
}

function desk(g, w, d) {
  g.add(box(w, 0.035, d, M.walnut, 0, 0.715));
  g.add(box(0.5, 0.14, d - 0.04, M.walnut, w / 2 - 0.27, 0.575, 0.02));
  g.add(handle(w / 2 - 0.27, 0.645, d / 2));
  legs(g, w, d, 0.715, 0.08);
}

// 显示器：底座 + 立杆 + 屏幕，y0 为桌面高度，屏幕朝 +z
function monitor(y0) {
  return (g, w) => {
    g.add(box(0.22, 0.012, 0.16, M.black, 0, y0, -0.02));
    g.add(box(0.03, 0.2, 0.02, M.black, 0, y0, -0.06));
    g.add(box(w, w * 0.58, 0.025, M.black, 0, y0 + 0.12, -0.04));
    g.add(box(w - 0.02, w * 0.58 - 0.02, 0.005, M.screen, 0, y0 + 0.13, -0.025));
  };
}

// 一排竖放的书，颜色轮换
function books(g, x0, x1, y, z, depth = 0.18) {
  const colors = [M.mustard, M.sage, M.cream, M.sofa, M.walnut];
  let x = x0;
  for (let i = 0; x < x1 - 0.03; i++) {
    const t = 0.025 + (i % 3) * 0.008;
    g.add(box(t, 0.18 + (i % 4) * 0.025, depth, colors[i % colors.length], x + t / 2, y, z));
    x += t + 0.004;
  }
}

// 墙面开放搁板：三层木板，每层摆一段书
function wallShelves(g, w, d) {
  for (const [i, y] of [1.3, 1.6, 1.9].entries()) {
    g.add(box(w, 0.025, d, M.walnut, 0, y));
    books(g, -w / 2 + 0.05 + (i % 2) * 0.2, w / 2 - 0.25 + (i % 2) * 0.2, y + 0.025, 0, d * 0.7);
  }
}

// 窗前通长悬浮书桌：东侧桌下两层抽屉，西侧为工位；work 为工位中心的局部 x
function longDesk(work) {
  return (g, w, d) => {
    g.add(box(w, 0.04, d, M.walnut, 0, 0.72));
    g.add(box(w, 0.06, 0.02, M.walnut, 0, 0.66, d / 2 - 0.01));
    const x1 = -w / 2 + 0.9;
    for (const y of [0.3, 0.48]) cabinetDoors(g, -w / 2, x1, y, 0.17, d - 0.02, 0.45, M.cabinet, y + 0.12);
    g.add(box(0.9, 0.04, d - 0.04, M.walnut, -w / 2 + 0.45, 0.26, -0.02));
    const screen = new THREE.Group();
    screen.position.set(work, 0, -d / 2 + 0.2);
    monitor(0.76)(screen, 0.6);
    g.add(screen);
    g.add(box(0.42, 0.015, 0.14, M.black, work, 0.76, 0.08));
    g.add(cyl(0.07, 0.06, 0.12, M.pot, -w / 2 + 0.2, 0.76, -d / 2 + 0.15));
    g.add(sphere(0.12, M.green, -w / 2 + 0.2, 1.0, -d / 2 + 0.15));
    books(g, -w / 2 + 0.4, -w / 2 + 0.7, 0.76, -d / 2 + 0.12, 0.16);
  };
}

// 抬高窗台：0.45 米高木台 + 坐垫靠枕，台下抽屉
function windowSeat(g, w, d) {
  cabinetDoors(g, -w / 2, w / 2, 0.06, 0.37, d - 0.02, 0.5, M.cabinet, 0.3);
  g.add(box(w, 0.06, d - 0.06, M.black, 0, 0, -0.03));
  g.add(box(w, 0.03, d, M.walnut, 0, 0.43));
  g.add(box(w - 0.06, 0.07, d - 0.06, M.linen, 0, 0.46));
  for (const [x, m] of [[-w / 2 + 0.25, M.mustard], [w / 2 - 0.25, M.pillow]]) {
    const pillow = box(0.38, 0.32, 0.12, m, x, 0.52, -d / 2 + 0.1);
    pillow.rotation.x = -0.2;
    g.add(pillow);
  }
}

// 与窗台相接的书桌：靠窗台一侧落地侧板支撑，另一端入墙
function seatDesk(g, w, d) {
  g.add(box(w, 0.04, d, M.walnut, 0, 0.72));
  g.add(box(0.04, 0.72, d, M.walnut, -w / 2 + 0.02, 0));
  g.add(box(w - 0.04, 0.12, 0.02, M.walnut, 0.02, 0.6, -d / 2 + 0.01));
  const screen = new THREE.Group();
  screen.position.set(0.05, 0, -d / 2 + 0.2);
  monitor(0.76)(screen, 0.6);
  g.add(screen);
  g.add(box(0.42, 0.015, 0.14, M.black, 0.05, 0.76, 0.06));
}

function shower(g, w, d) {
  g.add(box(w, 2.0, 0.02, M.glass, 0, 0.02, d / 2));
  g.add(cyl(0.12, 0.12, 0.02, M.brass, 0, 2.05, 0));
  g.add(cyl(0.012, 0.012, 1.2, M.brass, 0, 0.9, -d / 2 + 0.04, 8));
}

function rug(parent, [x1, z1, x2, z2]) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(x2 - x1, z2 - z1),
    new THREE.MeshStandardMaterial({ map: rugTexture(style.rug), roughness: 1 }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set((x1 + x2) / 2, 0.006, (z1 + z2) / 2);
  mesh.receiveShadow = true;
  parent.add(mesh);
}

// 主卧南侧内凹（宽 2.1 米、深 0.8 米的落地窗）的书桌方案
export const BAY_PLANS = [
  { id: 'none', name: '不做' },
  { id: 'long', name: '通长书桌' },
  { id: 'side', name: '侧墙书桌' },
  { id: 'seat', name: '窗台+书桌' },
];

function masterBay(g, plan) {
  if (plan === 'long') {
    place(g, [5.197, 5.37, 7.297, 5.92], 'north', longDesk(0.6));
    place(g, [5.197, 5.12, 5.447, 5.92], 'east', wallShelves);
    place(g, [7.047, 5.12, 7.297, 5.92], 'west', wallShelves);
    place(g, [5.42, 4.86, 5.87, 5.31], 'south', chair);
  } else if (plan === 'side') {
    place(g, [6.697, 5.12, 7.297, 5.92], 'west', desk);
    place(g, [6.947, 5.12, 7.297, 5.92], 'west', wallCabinet(1.5, 0.7));
    place(g, [6.977, 5.22, 7.277, 5.82], 'west', monitor(0.75));
    place(g, [6.2, 5.3, 6.65, 5.75], 'east', chair);
    place(g, [5.25, 5.55, 5.55, 5.85], 'south', plant);
  } else if (plan === 'seat') {
    place(g, [6.297, 5.12, 7.297, 5.92], 'north', windowSeat);
    place(g, [5.197, 5.32, 6.297, 5.92], 'north', seatDesk);
    place(g, [5.197, 5.12, 5.447, 5.92], 'east', wallShelves);
    place(g, [5.5, 4.86, 5.95, 5.31], 'south', chair);
  }
}

export function buildFurniture(styleId, bayPlan = 'side') {
  applyStyle(styleId);
  const g = new THREE.Group();

  // 玄关
  place(g, [-1.803, -3.05, -1.482, -2.08], 'east', wardrobe(2.2));
  place(g, [-1.482, -2.08, -1.462, -0.58], 'east', pegboard(0, 2.7));

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
  place(g, [-2.153, -0.38, -1.473, 0.52], 'east', fridge);
  place(g, [-2.173, -0.58, -1.473, -0.39], 'east', pullOutCabinet(1.85));
  place(g, [-2.173, -0.58, -1.473, 0.52], 'east', wallCabinet(1.9, 0.78));
  place(g, [-0.6, 0.15, 1.0, 0.95], 'south', table(0.75, M.walnut));
  place(g, [-0.1, 0.35, 0.5, 0.75], 'south', pendant);
  for (const x of [-0.3, 0.25]) {
    place(g, [x, -0.3, x + 0.45, 0.12], 'south', chair);
    place(g, [x, 0.98, x + 0.45, 1.4], 'north', chair);
  }

  // 客厅
  rug(g, [-1.2, 2.7, 0.6, 4.9]);
  place(g, [0.75, 2.7, 1.597, 4.9], 'west', sofa);
  place(g, [-1.803, 2.5, -1.403, 6.02], 'east', tvCabinetWall(0.46));
  place(g, [-0.75, 3.3, 0.15, 4.3], 'east', coffeeTable);
  const armchair = place(g, [-1.0, 5.1, -0.3, 5.75], 'north', lounge);
  armchair.rotation.y = Math.PI * 0.8;
  place(g, [1.2, 5.0, 1.45, 5.25], 'south', floorLamp);

  // 卫生间与过道洗手台
  place(g, [1.797, -0.73, 2.597, 0.87], 'east', shower);
  place(g, [2.95, -0.73, 3.4, -0.24], 'south', toilet);
  place(g, [3.797, -0.73, 4.797, -0.23], 'south', vanity);

  // 儿童房：东墙床尾柜接书桌，书桌上方吊柜
  place(g, [4.9, -1.63, 6.9, -0.43], 'east', bed(M.kidDuvet));
  place(g, [6.1, 0.92, 7.67, 1.42], 'north', wardrobe());
  place(g, [7.197, -1.63, 7.697, -0.43], 'west', wardrobe(2.4));
  place(g, [7.197, -0.43, 7.697, 0.92], 'west', desk);
  place(g, [7.347, -0.43, 7.697, 0.92], 'west', wallCabinet(1.85, 0.55));
  place(g, [6.7, 0.0, 7.15, 0.45], 'east', chair);

  // 主卧室，北侧为衣帽间（隔断在 layout.js）
  place(g, [6.097, 1.52, 7.697, 2.07], 'south', wardrobe(2.4));
  place(g, [7.147, 2.07, 7.697, 2.78], 'west', wardrobe(2.4));
  place(g, [5.65, 2.92, 7.67, 4.72], 'west', bed(M.duvet));
  place(g, [7.2, 4.72, 7.65, 5.12], 'west', nightstand);
  place(g, [7.2, 4.72, 7.65, 5.12], 'west', tableLamp(0.52, lampMaterials.masterBedside));
  masterBay(g, bayPlan);

  // 次卧
  place(g, [2.9, 2.22, 4.59, 2.82], 'south', wardrobe());
  place(g, [2.55, 3.15, 4.59, 4.7], 'west', bed(M.guestDuvet));
  place(g, [4.15, 4.72, 4.59, 5.1], 'west', nightstand);
  place(g, [4.15, 4.72, 4.59, 5.1], 'west', tableLamp(0.52, lampMaterials.guestBedside));

  // 阳台
  place(g, [3.897, 5.32, 4.497, 5.94], 'west', washerDryer);
  place(g, [3.897, 5.97, 4.497, 6.6], 'west', laundrySink);
  place(g, [3.897, 5.32, 4.497, 6.6], 'west', wallCabinet(1.8, 0.62));
  place(g, [1.82, 6.22, 2.17, 6.57], 'south', plant);
  place(g, [2.0, 5.9, 3.8, 5.95], 'south', (gg, w) => gg.add(box(w, 0.03, 0.03, M.metal, 0, 2.4)));

  return g;
}

export const screenMaterial = M.screen;
export const sharedMaterials = new Set([...Object.values(M), ...Object.values(lampMaterials)]);
export const currentStyle = () => style;
