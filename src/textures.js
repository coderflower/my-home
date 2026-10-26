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

// 洞洞板：每格 20 cm、8×8 个孔，孔距 25 mm
export function pegboardTexture(width, height) {
  const texture = canvasTexture(256, (ctx, size) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = 'rgba(40, 32, 24, 0.75)';
    const n = 8;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        ctx.beginPath();
        ctx.arc(((i + 0.5) * size) / n, ((j + 0.5) * size) / n, size / 64, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, 0.2);
  texture.repeat.set(width / 0.2, height / 0.2);
  return texture;
}

// 地毯：spec.pattern 为 geo 几何半圆圆点 / stripe 条纹 / border 回字边框 / plain 素色带包边
export function rugTexture(spec) {
  const { pattern, base, colors, border } = spec;
  const texture = canvasTexture(1024, (ctx, size) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);
    if (pattern === 'geo') {
      const n = 4;
      const cell = size / n;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          ctx.fillStyle = colors[(i + j * 2) % colors.length];
          ctx.beginPath();
          const cx = i * cell + cell / 2;
          const cy = j * cell + cell / 2;
          if ((i + j) % 2) ctx.arc(cx, cy + cell * 0.18, cell * 0.36, Math.PI, 0);
          else ctx.arc(cx, cy, cell * 0.16, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (pattern === 'stripe') {
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(0, ((i + 0.5) * size) / 12, size, size / 60);
      }
    } else if (pattern === 'border') {
      ctx.strokeStyle = colors[0];
      ctx.lineWidth = 14;
      ctx.strokeRect(110, 110, size - 220, size - 220);
      ctx.lineWidth = 5;
      ctx.strokeRect(150, 150, size - 300, size - 300);
    }
    ctx.strokeStyle = border;
    ctx.lineWidth = 10;
    ctx.strokeRect(18, 18, size - 36, size - 36);
  }, 1);
  texture.repeat.set(1, 1);
  return texture;
}
