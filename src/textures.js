import * as THREE from 'three';

function canvasTexture(size, draw, metersPerTile) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  draw(canvas.getContext('2d'), size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  // 地面 UV 直接用米坐标，repeat 设为每米重复几次
  texture.repeat.set(1 / metersPerTile, 1 / metersPerTile);
  return texture;
}

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// 1.2 m 见方：8 条 15 cm 宽、120 cm 长的木地板，逐行错缝
export function woodTexture() {
  return canvasTexture(1024, (ctx, size) => {
    const rand = seeded(7);
    const rows = 8;
    const rowH = size / rows;
    for (let r = 0; r < rows; r++) {
      const offset = (r % 4) * size * 0.25;
      for (let k = -1; k < 2; k++) {
        const x0 = offset + k * size;
        const tone = 0.88 + rand() * 0.18;
        ctx.fillStyle = `rgb(${Math.round(188 * tone)}, ${Math.round(150 * tone)}, ${Math.round(104 * tone)})`;
        ctx.fillRect(x0, r * rowH, size, rowH);
        for (let g = 0; g < 14; g++) {
          const y = r * rowH + rand() * rowH;
          ctx.strokeStyle = `rgba(90, 58, 34, ${0.06 + rand() * 0.1})`;
          ctx.lineWidth = 1 + rand() * 2;
          ctx.beginPath();
          ctx.moveTo(x0, y);
          for (let x = 0; x <= size; x += 64) ctx.lineTo(x0 + x, y + Math.sin(x / 90 + g) * 3 * rand());
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(70, 45, 28, 0.55)';
        ctx.fillRect(x0, r * rowH, 2, rowH);
      }
      ctx.fillStyle = 'rgba(70, 45, 28, 0.45)';
      ctx.fillRect(0, r * rowH, size, 2);
    }
  }, 1.2);
}

export function tileTexture(base, grout, meters) {
  return canvasTexture(512, (ctx, size) => {
    const rand = seeded(11);
    const n = 2;
    const cell = size / n;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const t = 0.96 + rand() * 0.06;
        ctx.fillStyle = `rgb(${base.map((c) => Math.round(c * t)).join(',')})`;
        ctx.fillRect(i * cell, j * cell, cell, cell);
      }
    }
    ctx.strokeStyle = grout;
    ctx.lineWidth = 4;
    for (let k = 0; k <= n; k++) {
      ctx.beginPath();
      ctx.moveTo(k * cell, 0);
      ctx.lineTo(k * cell, size);
      ctx.moveTo(0, k * cell);
      ctx.lineTo(size, k * cell);
      ctx.stroke();
    }
  }, meters);
}

// 中古几何地毯：奶油底，芥末黄 / 砖红 / 青绿半圆与圆点交替
export function rugTexture() {
  const texture = canvasTexture(1024, (ctx, size) => {
    ctx.fillStyle = '#ece2cd';
    ctx.fillRect(0, 0, size, size);
    const colors = ['#c9962f', '#a5552f', '#4f7d7c', '#7f8b6c'];
    const n = 4;
    const cell = size / n;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        ctx.fillStyle = colors[(i + j * 2) % colors.length];
        ctx.beginPath();
        const cx = i * cell + cell / 2;
        const cy = j * cell + cell / 2;
        if ((i + j) % 2) {
          ctx.arc(cx, cy + cell * 0.18, cell * 0.36, Math.PI, 0);
        } else {
          ctx.arc(cx, cy, cell * 0.16, 0, Math.PI * 2);
        }
        ctx.fill();
      }
    }
    ctx.strokeStyle = '#5e3d26';
    ctx.lineWidth = 10;
    ctx.strokeRect(18, 18, size - 36, size - 36);
  }, 1);
  texture.repeat.set(1, 1);
  return texture;
}
