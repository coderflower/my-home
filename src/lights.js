import * as THREE from 'three';
import { rooms } from './layout.js';
import { roomCenter } from './geometry.js';
import { lampMaterials } from './furniture.js';

const CEILING_Y = 2.66;

const center = (id, dx = 0, dz = 0) => {
  const [x, z] = roomCenter(rooms.find((r) => r.id === id));
  return [x + dx, z + dz];
};

// kind：ceiling 吸顶灯（本模块建灯具）/ lamp 家具上的灯（灯罩材质来自 furniture.js 的 lampMaterials）
// power 为夜晚满亮度时的点光源强度，y 为光源高度
export const FIXTURES = [
  { id: 'entry', name: '玄关筒灯', room: 'entry', kind: 'ceiling', at: center('entry'), power: 3 },
  { id: 'living', name: '客厅主灯', room: 'living', kind: 'ceiling', at: [-0.3, 3.8], power: 6 },
  { id: 'dining', name: '餐厅吊灯', room: 'living', kind: 'lamp', lamp: 'dining', at: [0.2, 0.55], y: 1.75, power: 4 },
  { id: 'floor', name: '沙发落地灯', room: 'living', kind: 'lamp', lamp: 'floor', at: [1.325, 5.125], y: 1.6, power: 2.5 },
  { id: 'kitchen', name: '厨房吸顶灯', room: 'kitchen', kind: 'ceiling', at: center('kitchen'), power: 4 },
  { id: 'bath', name: '卫生间灯', room: 'bath', kind: 'ceiling', at: center('bath'), power: 3 },
  { id: 'hall', name: '过道灯', room: 'hall', kind: 'ceiling', at: [3.2, 1.55], power: 3 },
  { id: 'master', name: '主卧主灯', room: 'master', kind: 'ceiling', at: [6.2, 3.9], power: 5 },
  { id: 'master-bedside', name: '主卧床头灯', room: 'master', kind: 'lamp', lamp: 'masterBedside', at: [7.425, 4.92], y: 0.75, power: 1.5 },
  { id: 'closet', name: '衣帽间灯', room: 'master', kind: 'ceiling', at: [6.6, 2.2], power: 2 },
  { id: 'bedroom', name: '次卧主灯', room: 'bedroom', kind: 'ceiling', at: center('bedroom'), power: 4 },
  { id: 'bedroom-bedside', name: '次卧床头灯', room: 'bedroom', kind: 'lamp', lamp: 'guestBedside', at: [4.37, 4.91], y: 0.75, power: 1.5 },
  { id: 'kids', name: '儿童房主灯', room: 'kids', kind: 'ceiling', at: center('kids'), power: 4 },
  { id: 'balcony', name: '阳台灯', room: 'balcony', kind: 'ceiling', at: center('balcony'), power: 2.5 },
];

export const SCENES = {
  home: { name: '回家', on: ['entry', 'living', 'dining', 'kitchen', 'hall'] },
  relax: { name: '夜晚', on: ['floor', 'master-bedside', 'bedroom-bedside'], brightness: 45, temperature: 2700, night: true },
  all: { name: '全开', on: FIXTURES.map((f) => f.id) },
  away: { name: '离家', on: [] },
};

// 色温（K）近似转 RGB，取自 Tanner Helland 的拟合公式
function kelvinToColor(kelvin, target) {
  const t = kelvin / 100;
  const r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
  const g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  const c = (v) => Math.min(255, Math.max(0, v)) / 255;
  return target.setRGB(c(r), c(g), c(b), THREE.SRGBColorSpace);
}

const offColor = new THREE.Color(0xd9d6d0);

export function buildLights(scene) {
  const fixtures = new Map();
  for (const f of FIXTURES) {
    const [x, z] = f.at;
    const light = new THREE.PointLight(0xffd9a8, 0, f.kind === 'lamp' ? 4 : 6, 2);
    light.position.set(x, f.kind === 'ceiling' ? CEILING_Y - 0.15 : f.y, z);
    scene.add(light);
    let material;
    let mesh = null;
    if (f.kind === 'ceiling') {
      material = new THREE.MeshStandardMaterial({ color: offColor, roughness: 0.4 });
      mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.04, 32), material);
      mesh.position.set(x, CEILING_Y, z);
      mesh.userData.fixture = f.id;
      scene.add(mesh);
    } else {
      material = lampMaterials[f.lamp];
    }
    fixtures.set(f.id, { ...f, light, material, mesh });
  }

  const warm = new THREE.Color();
  function apply({ states, night, brightness, temperature, lowWalls }) {
    kelvinToColor(temperature, warm);
    const level = brightness / 100;
    for (const f of fixtures.values()) {
      const on = !!states[f.id];
      f.light.color.copy(warm);
      f.light.intensity = on ? f.power * level * (night ? 1 : 0.35) : 0;
      if (f.kind === 'ceiling') {
        f.material.color.copy(on ? warm : offColor);
        f.mesh.visible = !lowWalls;
      }
      f.material.emissive.copy(warm).multiplyScalar(on ? 0.4 + level * 0.6 : 0);
    }
  }

  const meshes = [...fixtures.values()].filter((f) => f.mesh).map((f) => f.mesh);
  return { fixtures, apply, meshes };
}
