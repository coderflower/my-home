#!/usr/bin/env python3
"""从 CAD 户型图里提取墙线，供 import-realsee.py 校正尺寸。

用法：
  dwg2dxf -y -o vr/raw/plan.dxf <户型.dwg>      # brew install libredwg
  pip install ezdxf
  python3 scripts/extract-cad.py vr/raw/plan.dxf

输出 vr/cad-walls.json：水平、竖直墙线，已换算到 layout.js 的坐标系（米）。
"""
import json
import sys
from pathlib import Path

from ezdxf import recover

# 原始结构平面图在模型空间里的图块
PLAN_BLOCK = 'A$C3EDF5E39'
LAYERS = {'WALL', 'S-WALL-LINE1', 'WINDOW'}
# CAD 轴⑨ 对齐 VR 的 x = 1.697，轴 C 对齐 z = 5.22
CAD_ORIGIN = (429342.0, -61082.0)
VR_ORIGIN = (1.697, 5.22)


def to_vr(x, y):
    return (round((x - CAD_ORIGIN[0]) / 1000 + VR_ORIGIN[0], 3),
            round(VR_ORIGIN[1] - (y - CAD_ORIGIN[1]) / 1000, 3))


def segments(entities, depth=0):
    for e in entities:
        kind = e.dxftype()
        if kind == 'LINE':
            yield e.dxf.layer, e.dxf.start, e.dxf.end
        elif kind == 'LWPOLYLINE':
            pts = [p[:2] for p in e.get_points()]
            if e.closed:
                pts.append(pts[0])
            for a, b in zip(pts, pts[1:]):
                yield e.dxf.layer, a, b
        elif kind == 'INSERT' and depth < 3:
            yield from segments(e.virtual_entities(), depth + 1)


def main(src, out):
    doc, _ = recover.readfile(src)
    plan = next(e for e in doc.modelspace().query('INSERT') if e.dxf.name == PLAN_BLOCK)
    lines = set()
    for layer, a, b in segments(plan.virtual_entities()):
        if layer not in LAYERS:
            continue
        (x1, z1), (x2, z2) = to_vr(a[0], a[1]), to_vr(b[0], b[1])
        if abs(x1 - x2) < 0.002 and abs(z1 - z2) > 0.05:
            lines.add(('x', x1, min(z1, z2), max(z1, z2)))
        elif abs(z1 - z2) < 0.002 and abs(x1 - x2) > 0.05:
            lines.add(('z', z1, min(x1, x2), max(x1, x2)))
    rows = [json.dumps({'axis': a, 'at': at, 'from': f, 'to': t}) for a, at, f, t in sorted(lines)]
    Path(out).write_text('[\n' + ',\n'.join(rows) + '\n]\n')
    print(f'{len(rows)} 条墙线 → {out}')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit('用法：python3 scripts/extract-cad.py <户型.dxf> [输出路径]')
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else 'vr/cad-walls.json')
