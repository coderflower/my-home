# my-home

可交互的三维户型，Three.js + Vite 纯前端，部署在 GitHub Pages：<https://coderflower.github.io/my-home/>

户型取自贝壳（如视）VR 的实测数据：9 个房间，墙体位置和厚度按开发商 CAD 户型图校正，房间面积沿用 VR 实测的使用面积（合计 75.6 m²）。家具为示意摆放。

## 本地运行

需要 Node.js 20.19+。

```bash
npm install
npm run dev      # 开发
npm test         # 户型数据校验
npm run build    # 产物在 dist/
```

## 部署

推送到 `main` 后，`.github/workflows/pages.yml` 会自动测试、构建并发布到 GitHub Pages。
首次使用需要在仓库 **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**。

`vite.config.js` 用相对路径 `base: './'`，仓库改名后不用改配置。

## 操作

- 拖动旋转、滚轮缩放、右键平移；触屏单指旋转、双指缩放。
- 左侧房间列表或点击地面定位房间；工具条切换三维、俯视和重置视角。
- 墙体三种显示：自动（挡住视线的墙变透明）、矮墙（只留 1 米）、全墙。
- 叠加原始户型图对照、房间名称开关、夜晚模式。
- 灯光：全屋 14 盏灯（吸顶灯、餐厅吊灯、落地灯、床头灯），点击场景里的灯具或灯光面板逐盏开关，可调亮度和色温，一键切换回家、夜晚、全开、离家场景。灯具配置在 `src/lights.js`。
- 点击门扇开关门。
- 右上角一键切换装修风格：中古风、新中式、北欧风、现代简约、奶油风、原木风、轻奢风。布局不变，只换家具材质、腿型、把手、床头和墙门颜色。风格在 `src/furniture.js` 的 `STYLES` 里配置。
- 风格下面按房间切换局部方案，选择会记住：
  - 主卧飘窗：不做、窗前通长书桌、内凹东侧墙小书桌、抬高窗台连书桌。
  - 儿童房：成长型（护栏床 + 低位书桌）、蒙氏地床（房子床 + 床尾矮开放架 + 绘本架 + 衣柜旁连体 1.12 米拐角书桌带玻璃吊柜）、全宽地台（台下抽屉）、半高床（梯柜 + 床下游戏屋）、子母床（下层拖床陪睡）。
  - 方案列表在 `src/furniture.js` 的 `PLANS`，摆放在 `masterBay`、`kidsRoom`。

## 重新导入户型

户型数据 `src/layout.js` 由脚本生成，不要手改。

1. 用电脑 Chrome 打开 VR 链接，F12 打开开发者工具，切到 Network，过滤 `floorplan`。
2. 找到 `open.realsee.com/floorplan/default?...` 这条请求，复制响应体，保存为 `vr/raw/floorplan.json`（该目录不进仓库）。
3. 运行：

```bash
python3 scripts/import-realsee.py vr/raw/floorplan.json
npm test
```

脚本做的事：

- 墙体取 `edgeWall` 的厚度多边形，投影到墙中线方向得到带转角延伸的矩形，外墙沿内侧线向外加厚。
- 门窗取各墙的 `holes`：外墙洞口是窗，靠近 `entrance` 的那个是入户门；内墙洞口按两侧房间判断，卧室和卫生间的门装门扇，卧室通阳台的做推拉门，其余做开敞洞口。
- 房间名称、id、地面材质和列表顺序在脚本顶部的 `ROOMS` 里改。
- 装修改动也在脚本顶部：`REMOVED_BETWEEN` 列出拆掉的内墙（按两侧房间），`ADDED_WALLS` 是新砌的隔断（如主卧衣帽间）。`WALL_FIXES` 修正校正后仍与实际不符的墙（按端点匹配）。
- 有 `vr/cad-walls.json` 时按 CAD 校正：每段墙两侧墙面吸附到最近的一对 CAD 墙线（墙厚随之改为 CAD 的），墙端点和房间轮廓跟着相邻墙面走，门窗洞口保持宽度。

### CAD 墙线

`vr/cad-walls.json` 从 CAD 户型图提取，换 CAD 时重新生成：

```bash
brew install libredwg && pip install ezdxf
dwg2dxf -y -o vr/raw/plan.dxf <户型.dwg>
python3 scripts/extract-cad.py vr/raw/plan.dxf
python3 scripts/import-realsee.py vr/raw/floorplan.json
```

`extract-cad.py` 顶部的 `PLAN_BLOCK` 是原始结构平面图所在的图块，`CAD_ORIGIN` / `VR_ORIGIN` 用轴⑨、轴 C 把 CAD 坐标对齐到 VR 坐标。家具坐标是手写的，墙体变动后要在 `src/furniture.js` 里跟着调整。

## 代码

- `src/layout.js`：户型数据（生成）。
- `src/geometry.js`：面积、中心点、墙体按洞口切分。
- `src/house.js`：地面、墙体、门窗。
- `src/furniture.js`：家具，坐标单位为米，与 `layout.js` 同一坐标系。
- `src/main.js`：场景、灯光、相机和界面。
- `public/floorplan.png`：原始户型图，`main.js` 里的 `PLAN_IMAGE` 负责与实测坐标对齐。
