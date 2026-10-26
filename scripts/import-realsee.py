#!/usr/bin/env python3
"""把如视（贝壳）VR 的户型 JSON 转成 src/layout.js。

用法：python3 scripts/import-realsee.py vr/raw/floorplan.json
户型 JSON 来自 VR 页面加载时请求的 open.realsee.com/floorplan/default 接口，
抓取方法见 README「重新导入户型」。

坐标：x = (图纸X - 37500) / 1000，z = (37500 - 图纸Y) / 1000，单位米，
x 向右、z 向下（与户型图同向）。edgeWall 和 holes 本身已经在这个坐标系里。
"""
import json
import math
import sys
from pathlib import Path

ORIGIN = 37500.0

# VR 里的房间名 → 页面上显示的名称、id、地面材质
# 页面上的房间列表按这里的顺序排列
ROOMS = {
    '过道A': ('entry', '玄关', 'wood'),
    '客厅': ('living', '客餐厅', 'wood'),
    '厨房': ('kitchen', '厨房', 'tile'),
    '卫生间': ('bath', '卫生间', 'tile'),
    '过道B': ('hall', '过道', 'wood'),
    '卧室B': ('master', '主卧室', 'wood'),
    '卧室C': ('bedroom', '次卧', 'wood'),
    '卧室A': ('kids', '儿童房', 'wood'),
    '阳台': ('balcony', '阳台', 'outdoor'),
}
PRIVATE = {'bath', 'kids', 'master', 'bedroom'}


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
                             leaf={'hinge': 'start', 'swing': 1 if private is plus else -1})
                else:
                    o.update(type='opening', head=r(head))
            openings.append(o)
        openings.sort(key=lambda o: o['from'])
        walls.append({
            'a': [r(a[0]), r(a[1])], 'b': [r(b[0]), r(b[1])], 't': r(n1 - n0),
            'height': wall['layout']['height'], 'exterior': wall['type'] == 'edge', 'openings': openings,
        })

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
