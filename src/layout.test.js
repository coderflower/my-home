import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rooms, walls, WALL_HEIGHT } from './layout.js';
import { splitWall, wallLength, polygonArea, roomCenter, pointInPolygon } from './geometry.js';

test('墙体有长度和厚度', () => {
  for (const w of walls) {
    assert.ok(wallLength(w) > 0.05, `墙太短 ${JSON.stringify(w.a)}`);
    assert.ok(w.t > 0.03 && w.t < 0.5, `墙厚异常 ${w.t}`);
  }
});

test('洞口落在墙段范围内且互不重叠', () => {
  for (const w of walls) {
    const length = wallLength(w);
    let last = -Infinity;
    for (const o of w.openings) {
      assert.ok(o.from < o.to, `洞口方向错误 ${o.from}-${o.to}`);
      assert.ok(o.from >= 0 && o.to <= length + 1e-6, `洞口 ${o.from}-${o.to} 超出墙长 ${length}`);
      assert.ok(o.from >= last, `洞口重叠于 ${o.from}`);
      assert.ok(o.head <= WALL_HEIGHT, `洞口高于墙顶 ${o.head}`);
      if (o.type === 'window') assert.ok(o.sill < o.head);
      last = o.to;
    }
  }
});

test('墙段切分后实墙不超出墙高', () => {
  for (const w of walls) {
    for (const p of splitWall(w, WALL_HEIGHT)) {
      assert.ok(p.from < p.to && p.bottom < p.top && p.top <= WALL_HEIGHT);
    }
  }
});

test('有且只有一樘入户门', () => {
  const entries = walls.flatMap((w) => w.openings).filter((o) => o.entry);
  assert.equal(entries.length, 1);
});

test('房间 id 唯一，标签中心落在房间内，净面积不大于轮廓面积', () => {
  const ids = new Set();
  for (const room of rooms) {
    assert.ok(!ids.has(room.id), `房间 id 重复：${room.id}`);
    ids.add(room.id);
    assert.ok(pointInPolygon(roomCenter(room), room.poly), `${room.name} 中心不在房间内`);
    assert.ok(room.area > 1 && room.area <= polygonArea(room.poly) + 0.01, `${room.name} 面积 ${room.area}`);
  }
});
