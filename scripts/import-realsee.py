#!/usr/bin/env python3
"""把如视（贝壳）VR 的户型 JSON 转成 src/layout.js。

用法：python3 scripts/import-realsee.py vr/raw/floorplan.json
户型 JSON 来自 VR 页面加载时请求的 open.realsee.com/floorplan/default 接口，
抓取方法见 README「重新导入户型」。

存在 vr/cad-walls.json（scripts/extract-cad.py 从 CAD 提取）时，墙体按 CAD 墙线校正：
每段墙的两侧墙面吸附到最近的一对 CAD 墙线，墙厚随之改为 CAD 的；
墙端点、房间轮廓跟着相邻墙面走，门窗洞口保持宽度、按墙长比例移动。

坐标：x = (图纸X - 37500) / 1000，z = (37500 - 图纸Y) / 1000，单位米，
x 向右、z 向下（与户型图同向）。edgeWall 和 holes 本身已经在这个坐标系里。
"""
import json
import math
import sys
from pathlib import Path

ORIGIN = 37500.0

# VR 里的房间名 → 页面上显示的名称、id、地面材质（精装交付，材质与 VR 实景一致）
# 页面上的房间列表按这里的顺序排列
ROOMS = {
    '过道A': ('entry', '玄关', 'stone'),
    '客厅': ('living', '客餐厅', 'stone'),
    '厨房': ('kitchen', '厨房', 'tile'),
    '卫生间': ('bath', '卫生间', 'tile'),
    '过道B': ('hall', '过道', 'stone'),
    '卧室B': ('master', '主卧室', 'wood'),
    '卧室C': ('bedroom', '次卧', 'wood'),
    '卧室A': ('kids', '儿童房', 'wood'),
    '阳台': ('balcony', '阳台', 'outdoor'),
}
PRIVATE = {'bath', 'kids', 'master', 'bedroom'}
# 门扇默认铰链在洞口起点一侧，这里按房间改到另一侧
HINGE_AT_END = {'bedroom'}
# 装修拆除的内墙：两侧房间为这些组合时整段墙不建
REMOVED_BETWEEN = [{'entry', 'living'}]
# 装修新增的墙（VR 和 CAD 里都没有），坐标为校正后的最终坐标
ADDED_WALLS = [
    # 主卧衣帽间：轻钢龙骨隔断，西端与儿童房墙垛之间留 0.6 米入口，朝床一侧开窗
    {'a': [5.997, 2.83], 'b': [7.697, 2.83], 't': 0.1, 'height': 2.7, 'exterior': False,
     'openings': [{'from': 0.45, 'to': 1.35, 'type': 'window', 'sill': 0.9, 'head': 2.1}]},
]
# 校正后仍与实际不符的墙，按校正后的端点 (a, b) 匹配：值为要改的字段，None 表示不建
WALL_FIXES = {
    # 客厅通过道、通阳台的两段垭口：墙面与餐桌后的卫生间墙对齐，去掉过梁通顶敞开
    ((1.637, 0.92), (1.637, 2.17)): {
        'a': [1.697, 0.92], 'b': [1.697, 2.17], 't': 0.2,
        'openings': [{'from': 0.088, 'to': 1.163, 'type': 'opening', 'head': 2.7}]},
    ((1.637, 6.165), (1.637, 5.17)): {
        'a': [1.697, 6.435], 'b': [1.697, 5.17], 't': 0.2,
        'openings': [{'from': 0, 'to': 1.182, 'type': 'opening', 'head': 2.7}]},
    # 客厅窗与阳台之间的墙垛：VR 拆成了三段薄墙，合成实心一块，砸到离窗内墙面 0.3 米，其余并入垭口
    ((1.457, 6.855), (1.457, 6.165)): {'a': [1.5975, 6.435], 'b': [1.5975, 6.855], 't': 0.401},
    ((1.397, 6.225), (1.798, 6.225)): None,
    ((1.738, 6.165), (1.738, 6.82)): None,
}
# 房间轮廓随 WALL_FIXES 调整的顶点，按校正后的坐标匹配
ROOM_FIXES = {
    'living': {(1.747, 6.165): [1.747, 6.435], (1.397, 6.165): [1.397, 6.435]},
}
CAD_WALLS = Path(__file__).resolve().parent.parent / 'vr' / 'cad-walls.json'


def r(v):
    return round(v, 3)


def point_in_poly(x, z, poly):
    inside = False
    for i in range(len(poly)):
        x1, z1 = poly[i]
        x2, z2 = poly[(i + 1) % len(poly)]
        if (z1 > z) != (z2 > z) and x < x1 + (z - z1) * (x2 - x1) / (z2 - z1):
            inside = not inside
    return inside


def room_at(x, z, rooms):
    for room in rooms:
        if point_in_poly(x, z, room['poly']):
            return room
    return None


def overlap(lo, hi, f, t):
    return min(hi, t) - max(lo, f)


def snap_faces(axis, f0, f1, lo, hi, cad):
    need = min(0.2, (hi - lo) / 2)
    near = [c['at'] for c in cad if c['axis'] == axis and overlap(lo, hi, c['from'], c['to']) >= need]
    pairs = [(abs(c0 - f0) + abs(c1 - f1), c0, c1) for c0 in near for c1 in near
             if 0.08 <= c1 - c0 <= 0.35 and abs(c0 - f0) <= 0.2 and abs(c1 - f1) <= 0.2]
    if pairs:
        _, c0, c1 = min(pairs)
        return c0, c1
    shifts = [c - f for c in near for f in (f0, f1) if abs(c - f) <= 0.12]
    d = min(shifts, key=abs) if shifts else 0.0
    return f0 + d, f1 + d


class Calibration:
    def __init__(self, walls, cad):
        self.rects = []
        self.by_wall = {}
        for w in walls:
            (ax, az), (bx, bz) = w['a'], w['b']
            if abs(ax - bx) < 1e-3:
                axis, at, lo, hi = 'x', ax, min(az, bz), max(az, bz)
            elif abs(az - bz) < 1e-3:
                axis, at, lo, hi = 'z', az, min(ax, bx), max(ax, bx)
            else:
                continue
            f0, f1 = at - w['t'] / 2, at + w['t'] / 2
            self.rects.append((axis, f0, f1, lo, hi, *snap_faces(axis, f0, f1, lo, hi, cad)))
            self.by_wall[id(w)] = self.rects[-1]

    def coord(self, axis, v, lo, hi):
        """校正 axis 方向上的坐标 v；lo..hi 是它在另一方向上的范围。"""
        best = inside = None
        for a, f0, f1, wlo, whi, g0, g1 in self.rects:
            shared = overlap(lo, hi, wlo, whi)
            if a != axis or shared < -0.01:
                continue
            if f0 - 0.005 <= v <= f1 + 0.005:
                if inside is None or shared > inside[0]:
                    inside = (shared, g0 + (min(max(v, f0), f1) - f0) * (g1 - g0) / (f1 - f0))
                continue
            for f, g in ((f0, g0), (f1, g1)):
                if abs(v - f) < 0.4 and (best is None or abs(v - f) < best[0]):
                    best = (abs(v - f), g - f)
        if inside:
            return inside[1]
        return v + (best[1] if best else 0.0)

    def point(self, x, z):
        return self.coord('x', x, z - 0.01, z + 0.01), self.coord('z', z, x - 0.01, x + 0.01)

    def wall(self, w):
        (ax, az), (bx, bz) = w['a'], w['b']
        rect = self.by_wall.get(id(w))
        if rect is None:
            a, b = self.point(ax, az), self.point(bx, bz)
            t = w['t']
        else:
            axis, f0, f1, lo, hi, g0, g1 = rect
            other = 'z' if axis == 'x' else 'x'
            mid, t = (g0 + g1) / 2, g1 - g0
            ea = self.coord(other, az if axis == 'x' else ax, f0, f1)
            eb = self.coord(other, bz if axis == 'x' else bx, f0, f1)
            a, b = ((mid, ea), (mid, eb)) if axis == 'x' else ((ea, mid), (eb, mid))
        old = math.hypot(bx - ax, bz - az)
        new = math.hypot(b[0] - a[0], b[1] - a[1])
        for o in w['openings']:
            width, centre = o['to'] - o['from'], (o['from'] + o['to']) / 2 * new / old
            o['from'], o['to'] = r(max(0.0, centre - width / 2)), r(min(new, centre + width / 2))
        w['a'], w['b'], w['t'] = [r(a[0]), r(a[1])], [r(b[0]), r(b[1])], r(t)

    def room(self, room):
        poly = room['poly']
        n = len(poly)

        def chain(i, k):
            # 与顶点 i 在第 k 个坐标上共线的连续边，返回另一坐标的范围
            span = [poly[i][1 - k]] * 2
            for step in (-1, 1):
                j = i
                while True:
                    nxt = (j + step) % n
                    if nxt == i or abs(poly[nxt][k] - poly[i][k]) > 1e-3:
                        break
                    j = nxt
                    span = [min(span[0], poly[j][1 - k]), max(span[1], poly[j][1 - k])]
            return span

        out = []
        for i, (x, z) in enumerate(poly):
            zs, xs = chain(i, 0), chain(i, 1)
            nx = self.coord('x', x, *zs) if zs[1] - zs[0] > 1e-3 else self.point(x, z)[0]
            nz = self.coord('z', z, *xs) if xs[1] - xs[0] > 1e-3 else self.point(x, z)[1]
            out.append([r(nx), r(nz)])
        room['poly'] = out


def main(src, out):
    data = json.loads(Path(src).read_text())['data']
    points = data['points'][0]
    pts = {p['id']: p for p in points}
    lines = {}
    for p in points:
        for lid in p['lines']:
            lines.setdefault(lid, []).append(((p['x'] - ORIGIN) / 1000, (ORIGIN - p['y']) / 1000))

    rooms = []
    for area in data['areas'][0]:
        rid, name, floor = ROOMS.get(area['roomName'], (area['id'], area['roomName'], 'wood'))
        poly = [[r((pts[i]['x'] - ORIGIN) / 1000), r((ORIGIN - pts[i]['y']) / 1000)] for i in area['points']]
        rooms.append({'id': rid, 'name': name, 'floor': floor, 'area': round(area['sizeWithoutLine'] / 1e6, 2), 'poly': poly})

    order = [v[0] for v in ROOMS.values()]
    rooms.sort(key=lambda room: order.index(room['id']) if room['id'] in order else len(order))

    ent = data['entrance']['position']
    entrance = ((ent['x'] - ORIGIN) / 1000, (ORIGIN - ent['y']) / 1000)

    walls = []
    for wall in data['edgeWall']:
        if wall['type'] == 'fence':
            continue
        (ax, az), (bx, bz) = lines[wall['layout']['id']]
        length = math.hypot(bx - ax, bz - az)
        ux, uz = (bx - ax) / length, (bz - az) / length
        nx, nz = -uz, ux
        # 墙体多边形投影到墙方向和法向，得到带转角延伸的矩形
        along = [(x - ax) * ux + (z - az) * uz for x, z in wall['layout']['polygon']]
        across = [(x - ax) * nx + (z - az) * nz for x, z in wall['layout']['polygon']]
        u0, u1 = min(along), max(along)
        n0, n1 = min(across), max(across)
        off = (n0 + n1) / 2
        a = (ax + ux * u0 + nx * off, az + uz * u0 + nz * off)
        b = (ax + ux * u1 + nx * off, az + uz * u1 + nz * off)

        if wall['type'] != 'edge':
            mx, mz = (ax + bx) / 2, (az + bz) / 2
            sides = {room['id'] for room in (room_at(mx + nx * 0.3, mz + nz * 0.3, rooms),
                                              room_at(mx - nx * 0.3, mz - nz * 0.3, rooms)) if room}
            if sides in REMOVED_BETWEEN:
                continue

        openings = []
        for hole in wall['holes']:
            hu = [(x - a[0]) * ux + (z - a[1]) * uz for x, z in hole['polygon']]
            f, t = max(0.0, min(hu)), min(u1 - u0, max(hu))
            sill, head = hole['offsetY'], hole['offsetY'] + hole['height']
            mid = (f + t) / 2
            mx, mz = a[0] + ux * mid, a[1] + uz * mid
            o = {'from': r(f), 'to': r(t)}
            if wall['type'] == 'edge':
                if math.hypot(mx - entrance[0], mz - entrance[1]) < 0.5:
                    inside = room_at(mx + nx * 0.3, mz + nz * 0.3, rooms)
                    o.update(type='door', head=r(head), entry=True,
                             leaf={'hinge': 'end', 'swing': -1 if inside else 1})
                else:
                    o.update(type='window', sill=r(sill), head=r(head))
            else:
                plus = room_at(mx + nx * 0.3, mz + nz * 0.3, rooms)
                minus = room_at(mx - nx * 0.3, mz - nz * 0.3, rooms)
                width = t - f
                private = next((x for x in (plus, minus) if x and x['id'] in PRIVATE), None)
                balcony = next((x for x in (plus, minus) if x and x['id'] == 'balcony'), None)
                if balcony and private:
                    o.update(type='door', head=r(head), sliding=True)
                elif private and width <= 1.0:
                    o.update(type='door', head=r(head),
                             leaf={'hinge': 'end' if private['id'] in HINGE_AT_END else 'start',
                                   'swing': 1 if private is plus else -1})
                else:
                    o.update(type='opening', head=r(head))
            openings.append(o)
        openings.sort(key=lambda o: o['from'])
        walls.append({
            'a': [r(a[0]), r(a[1])], 'b': [r(b[0]), r(b[1])], 't': r(n1 - n0),
            'height': wall['layout']['height'], 'exterior': wall['type'] == 'edge', 'openings': openings,
        })

    if CAD_WALLS.exists():
        cal = Calibration(walls, json.loads(CAD_WALLS.read_text()))
        for w in walls:
            cal.wall(w)
        for room in rooms:
            cal.room(room)

    fixed = []
    for w in walls:
        key = (tuple(w['a']), tuple(w['b']))
        if key in WALL_FIXES:
            if WALL_FIXES[key] is None:
                continue
            w.update(WALL_FIXES[key])
        fixed.append(w)
    walls = fixed
    for room in rooms:
        moves = ROOM_FIXES.get(room['id'], {})
        room['poly'] = [moves.get(tuple(p), p) for p in room['poly']]

    walls.extend(ADDED_WALLS)
    height = max(w['height'] for w in walls)
    lines_out = [
        '// 由 scripts/import-realsee.py 从如视 VR 户型数据生成，不要手改。',
        '// 单位米；x 向右，z 向下，与户型图同向。',
        '',
        f'export const WALL_HEIGHT = {height};',
        '',
        'export const rooms = [',
        *[f'  {json.dumps(room, ensure_ascii=False)},' for room in rooms],
        '];',
        '',
        'export const walls = [',
        *[f'  {json.dumps(w, ensure_ascii=False)},' for w in walls],
        '];',
        '',
    ]
    Path(out).write_text('\n'.join(lines_out))
    print(f'{len(rooms)} 个房间，{len(walls)} 段墙，{sum(len(w["openings"]) for w in walls)} 处洞口 → {out}')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit('用法：python3 scripts/import-realsee.py <户型 JSON> [输出路径]')
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else 'src/layout.js')
