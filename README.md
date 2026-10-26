# my-home

可交互的三维户型，Three.js + Vite 纯前端，部署在 GitHub Pages：<https://coderflower.github.io/my-home/>

户型取自贝壳（如视）VR 的实测数据：9 个房间、52 段墙、17 处门窗洞口，套内净面积 75.6 m²。家具为示意摆放。

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
- 叠加原始户型图对照、房间名称开关、夜晚模式；夜晚可单独开关每个房间的灯。
- 点击门扇开关门。

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

## 代码

- `src/layout.js`：户型数据（生成）。
- `src/geometry.js`：面积、中心点、墙体按洞口切分。
- `src/house.js`：地面、墙体、门窗。
- `src/furniture.js`：家具，坐标单位为米，与 `layout.js` 同一坐标系。
- `src/main.js`：场景、灯光、相机和界面。
- `public/floorplan.png`：原始户型图，`main.js` 里的 `PLAN_IMAGE` 负责与实测坐标对齐。
