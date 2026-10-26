export function roomBounds(room) {
  const xs = room.poly.map((p) => p[0]);
  const zs = room.poly.map((p) => p[1]);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs) };
}

// 多边形的视觉中心：取包围盒中心，落在多边形外（L 形房间）时退回到顶点平均
export function roomCenter(room) {
  const b = roomBounds(room);
  const c = [(b.minX + b.maxX) / 2, (b.minZ + b.maxZ) / 2];
  if (pointInPolygon(c, room.poly)) return c;
  const n = room.poly.length;
  return [room.poly.reduce((s, p) => s + p[0], 0) / n, room.poly.reduce((s, p) => s + p[1], 0) / n];
}

export function polygonArea(poly) {
  let sum = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, z1] = poly[i];
    const [x2, z2] = poly[(i + 1) % poly.length];
    sum += x1 * z2 - x2 * z1;
  }
  return Math.abs(sum) / 2;
}

export function pointInPolygon([x, z], poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

export function wallLength(wall) {
  return Math.hypot(wall.b[0] - wall.a[0], wall.b[1] - wall.a[1]);
}

// 按洞口把墙切成实墙段：from/to 是距 a 端的距离，bottom/top 是标高
export function splitWall(wall, height) {
  const length = wallLength(wall);
  const pieces = [];
  let cursor = 0;
  for (const o of wall.openings) {
    if (o.from > cursor) pieces.push({ from: cursor, to: o.from, bottom: 0, top: height });
    if (o.type === 'window' && o.sill > 0) pieces.push({ from: o.from, to: o.to, bottom: 0, top: o.sill });
    if (o.head < height) pieces.push({ from: o.from, to: o.to, bottom: o.head, top: height });
    cursor = Math.max(cursor, o.to);
  }
  if (cursor < length) pieces.push({ from: cursor, to: length, bottom: 0, top: height });
  return pieces;
}
