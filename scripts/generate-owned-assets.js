#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const root = path.resolve(__dirname, '..');

function ensureDir(dir) {
  fs.mkdirSync(path.join(root, dir), { recursive: true });
}

function rgba(hex, alpha = 255) {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
    a: alpha,
  };
}

function mix(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function canvas(width, height, color) {
  const png = new PNG({ width, height });
  const bg = color ? rgba(color.hex, color.alpha ?? 255) : { r: 0, g: 0, b: 0, a: 0 };
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (width * y + x) << 2;
      png.data[i] = bg.r;
      png.data[i + 1] = bg.g;
      png.data[i + 2] = bg.b;
      png.data[i + 3] = bg.a;
    }
  }
  return png;
}

function setPixel(png, x, y, color) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  const i = (png.width * Math.round(y) + Math.round(x)) << 2;
  const srcA = color.a / 255;
  const dstA = png.data[i + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA <= 0) return;
  png.data[i] = Math.round((color.r * srcA + png.data[i] * dstA * (1 - srcA)) / outA);
  png.data[i + 1] = Math.round((color.g * srcA + png.data[i + 1] * dstA * (1 - srcA)) / outA);
  png.data[i + 2] = Math.round((color.b * srcA + png.data[i + 2] * dstA * (1 - srcA)) / outA);
  png.data[i + 3] = Math.round(outA * 255);
}

function fillGradient(png, topHex, bottomHex) {
  const top = rgba(topHex);
  const bottom = rgba(bottomHex);
  for (let y = 0; y < png.height; y += 1) {
    const t = y / Math.max(1, png.height - 1);
    const row = { r: mix(top.r, bottom.r, t), g: mix(top.g, bottom.g, t), b: mix(top.b, bottom.b, t), a: 255 };
    for (let x = 0; x < png.width; x += 1) setPixel(png, x, y, row);
  }
}

function rect(png, x, y, w, h, color) {
  for (let py = Math.round(y); py < y + h; py += 1) {
    for (let px = Math.round(x); px < x + w; px += 1) setPixel(png, px, py, color);
  }
}

function circle(png, cx, cy, r, color) {
  const r2 = r * r;
  for (let y = Math.floor(cy - r); y <= cy + r; y += 1) {
    for (let x = Math.floor(cx - r); x <= cx + r; x += 1) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r2) setPixel(png, x, y, color);
    }
  }
}

function ellipse(png, cx, cy, rx, ry, color) {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y += 1) {
    for (let x = Math.floor(cx - rx); x <= cx + rx; x += 1) {
      if (((x - cx) ** 2) / (rx ** 2) + ((y - cy) ** 2) / (ry ** 2) <= 1) setPixel(png, x, y, color);
    }
  }
}

function polygon(png, points, color) {
  const minY = Math.floor(Math.min(...points.map((p) => p[1])));
  const maxY = Math.ceil(Math.max(...points.map((p) => p[1])));
  for (let y = minY; y <= maxY; y += 1) {
    const nodes = [];
    for (let i = 0; i < points.length; i += 1) {
      const j = (i + points.length - 1) % points.length;
      const yi = points[i][1];
      const yj = points[j][1];
      const xi = points[i][0];
      const xj = points[j][0];
      if ((yi < y && yj >= y) || (yj < y && yi >= y)) nodes.push(xi + ((y - yi) / (yj - yi)) * (xj - xi));
    }
    nodes.sort((a, b) => a - b);
    for (let i = 0; i < nodes.length; i += 2) {
      for (let x = Math.floor(nodes[i]); x < nodes[i + 1]; x += 1) setPixel(png, x, y, color);
    }
  }
}

function line(png, x1, y1, x2, y2, width, color) {
  const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / Math.max(1, steps);
    circle(png, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, width / 2, color);
  }
}

function hashPixel(x, y, salt) {
  let value = ((x + 1) * 374761393 + (y + 1) * 668265263 + salt * 1442695041) >>> 0;
  value = Math.imul(value ^ (value >>> 13), 1274126177) >>> 0;
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function isTransparent(png, x, y) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return true;
  return png.data[((png.width * y + x) << 2) + 3] === 0;
}

function applyHandmadeTexture(png, options = {}) {
  const {
    salt = 1,
    colorJitter = 18,
    alphaJitter = 42,
    toothChance = 0.09,
    edgeFadeChance = 0.28,
    preserveOpaqueAlpha = false,
  } = options;

  const original = Buffer.from(png.data);

  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const i = (png.width * y + x) << 2;
      const alpha = original[i + 3];
      if (alpha === 0) continue;

      const noise = hashPixel(x, y, salt);
      const tooth = hashPixel(Math.floor(x / 3), Math.floor(y / 3), salt + 17);
      const softGrain = hashPixel(Math.floor(x / 5), Math.floor(y / 5), salt + 71);
      const edge =
        isTransparent(png, x - 1, y) ||
        isTransparent(png, x + 1, y) ||
        isTransparent(png, x, y - 1) ||
        isTransparent(png, x, y + 1);
      let jitter = Math.round((noise - 0.5) * colorJitter + (softGrain - 0.5) * colorJitter * 0.55);

      if (edge && hashPixel(x, y, salt + 83) < 0.42) jitter += 5;

      png.data[i] = Math.max(0, Math.min(255, original[i] + jitter));
      png.data[i + 1] = Math.max(0, Math.min(255, original[i + 1] + jitter));
      png.data[i + 2] = Math.max(0, Math.min(255, original[i + 2] + jitter));

      if (!preserveOpaqueAlpha) {
        let nextAlpha = alpha - Math.round(hashPixel(x, y, salt + 29) * alphaJitter);
        if (tooth < toothChance) nextAlpha = Math.round(nextAlpha * 0.42);
        if (edge && hashPixel(x, y, salt + 43) < edgeFadeChance) nextAlpha = Math.round(nextAlpha * 0.54);
        png.data[i + 3] = Math.max(0, Math.min(255, nextAlpha));
      } else if (tooth < toothChance * 0.35) {
        const lift = Math.round(10 + hashPixel(x, y, salt + 53) * 18);
        png.data[i] = Math.min(255, png.data[i] + lift);
        png.data[i + 1] = Math.min(255, png.data[i + 1] + lift);
        png.data[i + 2] = Math.min(255, png.data[i + 2] + lift);
      }
    }
  }
}

function addPaperFlecks(png, options = {}) {
  const {
    salt = 1,
    count = 120,
    light = '#FFF7E6',
    dark = '#4A3D34',
    maxRadius = 1.6,
    alpha = 56,
  } = options;

  for (let i = 0; i < count; i += 1) {
    const x = Math.floor(hashPixel(i, 11, salt) * png.width);
    const y = Math.floor(hashPixel(i, 17, salt) * png.height);
    const idx = (png.width * y + x) << 2;
    if (png.data[idx + 3] === 0) continue;
    const color = hashPixel(i, 23, salt) > 0.5 ? light : dark;
    const radius = 0.7 + hashPixel(i, 29, salt) * maxRadius;
    const opacity = Math.round(alpha * (0.35 + hashPixel(i, 31, salt) * 0.65));
    circle(png, x, y, radius, rgba(color, opacity));
  }
}

function softenTransparentEdges(png) {
  const original = Buffer.from(png.data);
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const i = (png.width * y + x) << 2;
      const alpha = original[i + 3];
      if (alpha === 0) continue;
      const edge =
        original[((png.width * Math.max(0, y - 1) + x) << 2) + 3] === 0 ||
        original[((png.width * Math.min(png.height - 1, y + 1) + x) << 2) + 3] === 0 ||
        original[((png.width * y + Math.max(0, x - 1)) << 2) + 3] === 0 ||
        original[((png.width * y + Math.min(png.width - 1, x + 1)) << 2) + 3] === 0;
      if (edge) png.data[i + 3] = Math.max(0, Math.round(alpha * 0.86));
    }
  }
}

function samplePremultiplied(png, x, y) {
  const clampedX = Math.max(0, Math.min(png.width - 1, x));
  const clampedY = Math.max(0, Math.min(png.height - 1, y));
  const i = (png.width * clampedY + clampedX) << 2;
  const alpha = png.data[i + 3] / 255;
  return {
    r: png.data[i] * alpha,
    g: png.data[i + 1] * alpha,
    b: png.data[i + 2] * alpha,
    a: alpha,
  };
}

function upscalePng(png, factor) {
  if (factor === 1) return png;
  const next = new PNG({ width: png.width * factor, height: png.height * factor });
  for (let y = 0; y < next.height; y += 1) {
    const sourceY = (y + 0.5) / factor - 0.5;
    const y0 = Math.floor(sourceY);
    const y1 = y0 + 1;
    const ty = sourceY - y0;
    for (let x = 0; x < next.width; x += 1) {
      const sourceX = (x + 0.5) / factor - 0.5;
      const x0 = Math.floor(sourceX);
      const x1 = x0 + 1;
      const tx = sourceX - x0;
      const c00 = samplePremultiplied(png, x0, y0);
      const c10 = samplePremultiplied(png, x1, y0);
      const c01 = samplePremultiplied(png, x0, y1);
      const c11 = samplePremultiplied(png, x1, y1);
      const topA = c00.a + (c10.a - c00.a) * tx;
      const bottomA = c01.a + (c11.a - c01.a) * tx;
      const outA = topA + (bottomA - topA) * ty;
      const topR = c00.r + (c10.r - c00.r) * tx;
      const bottomR = c01.r + (c11.r - c01.r) * tx;
      const topG = c00.g + (c10.g - c00.g) * tx;
      const bottomG = c01.g + (c11.g - c01.g) * tx;
      const topB = c00.b + (c10.b - c00.b) * tx;
      const bottomB = c01.b + (c11.b - c01.b) * tx;
      const i = (next.width * y + x) << 2;
      next.data[i + 3] = Math.round(outA * 255);
      if (outA <= 0.001) {
        next.data[i] = 0;
        next.data[i + 1] = 0;
        next.data[i + 2] = 0;
      } else {
        next.data[i] = Math.round((topR + (bottomR - topR) * ty) / outA);
        next.data[i + 1] = Math.round((topG + (bottomG - topG) * ty) / outA);
        next.data[i + 2] = Math.round((topB + (bottomB - topB) * ty) / outA);
      }
    }
  }
  return next;
}

function save(png, file, options = {}) {
  const target = path.join(root, file);
  ensureDir(path.dirname(file));
  fs.writeFileSync(target, PNG.sync.write(upscalePng(png, options.upscale ?? 1)));
}

function applyCoverPaperGrain(png, salt) {
  for (let i = 0; i < 1200; i += 1) {
    const x = Math.floor(hashPixel(i, 7, salt) * png.width);
    const y = Math.floor(hashPixel(i, 13, salt) * png.height);
    const light = hashPixel(i, 19, salt) > 0.5;
    circle(png, x, y, hashPixel(i, 23, salt) > 0.82 ? 2 : 1, rgba(light ? '#FFF4DA' : '#5E4637', light ? 12 : 8));
  }
}

function journalBackground(file, top, bottom, draw) {
  const png = canvas(1672, 941);
  fillGradient(png, top, bottom);
  draw(png);
  applyCoverPaperGrain(png, file.length * 31);
  save(png, `assets/journal-backgrounds/${file}.png`);
}

function drawGround(png, color) {
  polygon(png, [[0, 735], [420, 640], [840, 730], [1230, 610], [1672, 700], [1672, 941], [0, 941]], color);
}

function softBlob(png, x, y, rx, ry, color) {
  ellipse(png, x, y, rx, ry, rgba(color, 52));
  ellipse(png, x + rx * 0.12, y - ry * 0.08, rx * 0.82, ry * 0.72, rgba(color, 42));
}

function drawCloud(png, x, y, scale, color = '#F8F0DF', alpha = 190) {
  ellipse(png, x, y + 18 * scale, 72 * scale, 25 * scale, rgba(color, alpha));
  circle(png, x - 46 * scale, y + 10 * scale, 27 * scale, rgba(color, alpha));
  circle(png, x - 10 * scale, y - 4 * scale, 35 * scale, rgba(color, alpha));
  circle(png, x + 36 * scale, y + 7 * scale, 29 * scale, rgba(color, alpha));
}

function drawCoverLeafCluster(png, x, y, scale, leafColor = '#789B68', stemColor = '#536F4D') {
  line(png, x, y + 80 * scale, x + 22 * scale, y - 42 * scale, 8 * scale, rgba(stemColor, 210));
  ellipse(png, x - 25 * scale, y + 35 * scale, 42 * scale, 16 * scale, rgba(leafColor, 190));
  ellipse(png, x + 32 * scale, y + 5 * scale, 44 * scale, 17 * scale, rgba(leafColor, 205));
  ellipse(png, x - 18 * scale, y - 20 * scale, 35 * scale, 14 * scale, rgba(leafColor, 180));
}

function drawSoftWindow(png, x, y, w, h, color = '#F6E3B8') {
  roundedRect(png, x + 18, y + 18, w, h, 24, rgba('#2E2520', 34));
  roundedRect(png, x, y, w, h, 24, rgba(color, 96));
  line(png, x + w * 0.5, y + 18, x + w * 0.5, y + h - 18, 8, rgba('#FFFFFF', 50));
  line(png, x + 18, y + h * 0.52, x + w - 18, y + h * 0.52, 8, rgba('#FFFFFF', 45));
}

function drawNotebook(png, x, y, scale) {
  roundedRect(png, x + 10 * scale, y + 12 * scale, 210 * scale, 145 * scale, 18 * scale, rgba('#2E2520', 34));
  roundedRect(png, x, y, 210 * scale, 145 * scale, 18 * scale, rgba('#F8F0D7', 238));
  roundedRect(png, x + 15 * scale, y, 12 * scale, 145 * scale, 6 * scale, rgba('#D78D78', 255));
  for (let i = 1; i < 5; i += 1) line(png, x + 42 * scale, y + i * 25 * scale, x + 190 * scale, y + i * 25 * scale, 3 * scale, rgba('#C9BCA4', 180));
}

function drawMug(png, x, y, scale) {
  roundedRect(png, x + 8 * scale, y + 9 * scale, 130 * scale, 105 * scale, 22 * scale, rgba('#2E2520', 34));
  roundedRect(png, x, y, 130 * scale, 105 * scale, 22 * scale, rgba('#F0D4B2', 245));
  circle(png, x + 130 * scale, y + 52 * scale, 34 * scale, rgba('#F0D4B2', 245));
  circle(png, x + 130 * scale, y + 52 * scale, 20 * scale, rgba('#7D5945', 255));
  ellipse(png, x + 65 * scale, y, 67 * scale, 18 * scale, rgba('#5F4135', 230));
}

function generateJournalBackgrounds() {
  journalBackground('winter', '#DEEAF0', '#AFC7D4', (png) => {
    softBlob(png, 1320, 190, 170, 130, '#FFF8DF');
    circle(png, 1330, 200, 92, rgba('#F8F5E8', 230));
    drawCloud(png, 350, 240, 1.3, '#F6FBFB', 132);
    drawCloud(png, 940, 315, 1, '#F6FBFB', 110);
    polygon(png, [[0, 710], [360, 640], [760, 700], [1180, 610], [1672, 690], [1672, 941], [0, 941]], rgba('#F4F3EA', 255));
    polygon(png, [[0, 770], [520, 690], [960, 750], [1370, 670], [1672, 735], [1672, 941], [0, 941]], rgba('#E5EDF0', 250));
    roundedRect(png, 305, 600, 250, 190, 18, rgba('#6F5745', 250));
    roundedRect(png, 336, 638, 188, 103, 14, rgba('#F18A45', 238));
    polygon(png, [[260, 616], [430, 498], [603, 616]], rgba('#554437', 255));
    roundedRect(png, 400, 548, 62, 52, 8, rgba('#6F5745', 255));
    for (let i = 0; i < 26; i += 1) circle(png, 70 + i * 66, 95 + ((i * 97) % 530), 4 + (i % 3) * 2, rgba('#FFFFFF', 170));
  });
  journalBackground('spring', '#DDEED8', '#F8D9DA', (png) => {
    softBlob(png, 470, 220, 260, 150, '#FFF4CB');
    drawCloud(png, 1130, 240, 1.1, '#FFF7EA', 130);
    polygon(png, [[0, 725], [380, 630], [860, 700], [1240, 620], [1672, 720], [1672, 941], [0, 941]], rgba('#9BBF7E', 255));
    polygon(png, [[0, 800], [520, 720], [1000, 790], [1672, 700], [1672, 941], [0, 941]], rgba('#7EA66F', 218));
    for (let i = 0; i < 10; i += 1) {
      const x = 125 + i * 158;
      const y = 605 - (i % 3) * 42;
      line(png, x, 750, x + 16, y, 11, rgba('#668F65', 235));
      circle(png, x + 18, y, 42, rgba(i % 2 ? '#F0A7B6' : '#FFF2A6', 232));
      circle(png, x + 4, y - 8, 22, rgba(i % 2 ? '#F7C8CE' : '#FFF8CA', 190));
    }
    drawCoverLeafCluster(png, 1420, 690, 1.15, '#7CA86D');
  });
  journalBackground('summer', '#9EDDF0', '#F9D69A', (png) => {
    softBlob(png, 1280, 200, 210, 170, '#FFE081');
    circle(png, 1280, 200, 126, rgba('#FFD45A', 245));
    for (let i = 0; i < 7; i += 1) line(png, -20, 665 + i * 42, 1690, 642 + i * 38, 26, rgba(i % 2 ? '#5DB7C6' : '#3B9CAD', 160));
    polygon(png, [[0, 780], [500, 735], [1060, 770], [1672, 714], [1672, 941], [0, 941]], rgba('#EAB875', 255));
    polygon(png, [[0, 844], [650, 782], [1200, 830], [1672, 782], [1672, 941], [0, 941]], rgba('#D8A96A', 165));
    roundedRect(png, 422, 442, 116, 160, 24, rgba('#F5E8C7', 255));
    polygon(png, [[405, 430], [555, 430], [480, 340]], rgba('#FF8C75', 245));
    line(png, 480, 602, 480, 730, 12, rgba('#7A5840', 170));
    drawCloud(png, 320, 260, 1.1, '#FFF4DD', 126);
  });
  journalBackground('fall', '#E9BA71', '#8E6047', (png) => {
    softBlob(png, 1240, 190, 220, 155, '#FFD28B');
    drawGround(png, rgba('#9B6B46', 255));
    polygon(png, [[0, 815], [450, 700], [930, 780], [1370, 690], [1672, 760], [1672, 941], [0, 941]], rgba('#7F593F', 185));
    for (let i = 0; i < 18; i += 1) {
      const x = 70 + i * 95;
      const y = 155 + ((i * 137) % 455);
      ellipse(png, x, y, 44, 24, rgba(i % 3 === 0 ? '#B65332' : i % 3 === 1 ? '#C98239' : '#8F7D3D', 210));
      line(png, x - 25, y + 14, x + 25, y - 14, 5, rgba('#5D422A', 150));
    }
    circle(png, 1165, 700, 82, rgba('#C96E31', 245));
    circle(png, 1250, 700, 82, rgba('#D67A37', 245));
    circle(png, 1210, 700, 94, rgba('#D98742', 245));
    roundedRect(png, 1196, 592, 32, 82, 9, rgba('#5D422A', 255));
    ellipse(png, 1265, 628, 70, 20, rgba('#7F8A4F', 160));
  });
  journalBackground('moonlit-lake', '#172D46', '#3B536B', (png) => {
    softBlob(png, 1240, 170, 180, 135, '#FFF6CF');
    circle(png, 1240, 170, 88, rgba('#FFF6CF', 240));
    drawCloud(png, 520, 250, 1.15, '#C6D4D7', 72);
    for (let i = 0; i < 8; i += 1) line(png, 80, 660 + i * 34, 1590, 642 + i * 31, 22, rgba('#7EA1B3', 105));
    polygon(png, [[0, 710], [360, 550], [680, 720], [1010, 530], [1672, 735], [1672, 941], [0, 941]], rgba('#203748', 255));
    polygon(png, [[0, 800], [500, 680], [850, 790], [1280, 660], [1672, 805], [1672, 941], [0, 941]], rgba('#172B3B', 225));
  });
  journalBackground('cozy-reading-nook', '#B47A57', '#6E5042', (png) => {
    softBlob(png, 1370, 230, 220, 170, '#F5D58C');
    roundedRect(png, 0, 690, 1672, 251, 0, rgba('#8B5D45', 255));
    circle(png, 1370, 210, 95, rgba('#F5D58C', 210));
    drawNotebook(png, 650, 570, 1.55);
    drawMug(png, 1030, 605, 1.2);
    drawSoftWindow(png, 220, 225, 300, 420, '#E6CFA2');
    roundedRect(png, 1230, 470, 210, 250, 32, rgba('#5F4238', 140));
  });
  journalBackground('school', '#DDE7EF', '#B8CBE0', (png) => {
    drawCloud(png, 1180, 220, 1.2, '#F9F4E8', 126);
    roundedRect(png, 0, 700, 1672, 241, 0, rgba('#CDA576', 255));
    roundedRect(png, 70, 742, 1530, 90, 18, rgba('#B98E5E', 70));
    drawNotebook(png, 340, 500, 1.8);
    roundedRect(png, 1000, 495, 90, 265, 18, rgba('#F3C04D', 255));
    polygon(png, [[1000, 495], [1045, 425], [1090, 495]], rgba('#E98945', 255));
    circle(png, 1260, 540, 70, rgba('#8CB78A', 245));
    roundedRect(png, 1190, 540, 140, 190, 28, rgba('#8CB78A', 245));
  });
  journalBackground('office', '#CFD8DC', '#8FA4A9', (png) => {
    drawSoftWindow(png, 175, 130, 330, 430, '#EAF1EF');
    roundedRect(png, 0, 705, 1672, 236, 0, rgba('#A7896C', 255));
    roundedRect(png, 532, 388, 606, 312, 24, rgba('#2F3E47', 245));
    roundedRect(png, 580, 435, 510, 220, 18, rgba('#E5F3F4', 255));
    roundedRect(png, 785, 695, 100, 95, 10, rgba('#33434D', 255));
    drawMug(png, 1180, 640, 1.1);
  });
  journalBackground('rainy-window', '#6B7C86', '#36484F', (png) => {
    roundedRect(png, 248, 92, 1172, 590, 34, rgba('#CFD7D9', 82));
    roundedRect(png, 250, 90, 1170, 590, 34, rgba('#CFD7D9', 70));
    line(png, 835, 105, 835, 665, 18, rgba('#30434A', 170));
    line(png, 265, 385, 1405, 385, 18, rgba('#30434A', 170));
    softBlob(png, 1110, 240, 190, 130, '#DCEBEE');
    for (let i = 0; i < 38; i += 1) line(png, 130 + ((i * 131) % 1420), 110 + ((i * 83) % 520), 118 + ((i * 131) % 1420), 168 + ((i * 83) % 520), 7, rgba('#DCEBEE', 128));
  });
  journalBackground('mountain-sunrise', '#F2C078', '#8BB6C9', (png) => {
    softBlob(png, 890, 350, 220, 150, '#FFE08B');
    circle(png, 890, 350, 120, rgba('#FFE08B', 245));
    polygon(png, [[0, 750], [420, 340], [810, 760]], rgba('#566F72', 255));
    polygon(png, [[520, 760], [1110, 270], [1672, 770]], rgba('#496169', 255));
    polygon(png, [[0, 810], [420, 420], [795, 810]], rgba('#425C62', 175));
    polygon(png, [[720, 800], [1110, 355], [1672, 805]], rgba('#3E5860', 150));
    polygon(png, [[980, 386], [1110, 280], [1245, 395]], rgba('#F5F2E8', 245));
    drawGround(png, rgba('#6D8B66', 255));
  });
  journalBackground('greenhouse', '#CDE4D2', '#7FA37E', (png) => {
    softBlob(png, 1160, 210, 260, 170, '#FFF6D8');
    for (let i = 0; i < 7; i += 1) line(png, 90 + i * 240, 120, 320 + i * 210, 790, 12, rgba('#E8F2E8', 118));
    roundedRect(png, 0, 735, 1672, 206, 0, rgba('#6E8E63', 255));
    for (let i = 0; i < 10; i += 1) {
      const x = 120 + i * 155;
      line(png, x, 760, x + 45, 565 - (i % 3) * 40, 13, rgba('#557E4F', 245));
      ellipse(png, x + 20, 635, 84, 34, rgba('#7DAE69', 230));
      ellipse(png, x + 70, 585, 78, 30, rgba('#89B874', 220));
    }
  });
  journalBackground('cafe-morning', '#E9C9A7', '#9E7154', (png) => {
    softBlob(png, 1260, 180, 220, 150, '#F8D685');
    circle(png, 1260, 180, 106, rgba('#F8D685', 220));
    roundedRect(png, 0, 705, 1672, 236, 0, rgba('#9A6A4E', 255));
    drawSoftWindow(png, 225, 195, 260, 390, '#F3CFA2');
    drawMug(png, 620, 555, 1.7);
    roundedRect(png, 930, 610, 310, 70, 18, rgba('#D7A05F', 250));
    roundedRect(png, 956, 515, 250, 105, 20, rgba('#F0D190', 250));
    for (let i = 0; i < 3; i += 1) line(png, 690 + i * 42, 505, 670 + i * 42, 435, 8, rgba('#FFF0D8', 125));
  });
}

function sticker(file, draw) {
  const png = canvas(180, 180);
  draw(png);
  applyHandmadeTexture(png, {
    salt: file.length * 47,
    colorJitter: 8,
    alphaJitter: 5,
    toothChance: 0.006,
    edgeFadeChance: 0.06,
  });
  addPaperFlecks(png, {
    salt: file.length * 83,
    count: 42,
    maxRadius: 0.85,
    alpha: 26,
  });
  softenTransparentEdges(png);
  save(png, `assets/stickers/${file}.png`, { upscale: 2 });
}

const STICKER_INK = '#3F342D';
const STICKER_SKETCH = '#6B584D';
const STICKER_CREAM = '#FFF3DA';
const STICKER_BLUSH = '#D99691';

function roundedRect(png, x, y, w, h, r, color) {
  rect(png, x + r, y, w - r * 2, h, color);
  rect(png, x, y + r, w, h - r * 2, color);
  circle(png, x + r, y + r, r, color);
  circle(png, x + w - r, y + r, r, color);
  circle(png, x + r, y + h - r, r, color);
  circle(png, x + w - r, y + h - r, r, color);
}

function handLine(png, x1, y1, x2, y2, width, color, salt = 1) {
  const dx = (hashPixel(x1, y1, salt) - 0.5) * 2.6;
  const dy = (hashPixel(x2, y2, salt + 3) - 0.5) * 2.6;
  line(png, x1 + dx, y1 + dy, x2 - dy * 0.4, y2 + dx * 0.4, width, color);
  line(png, x1 + dx * 0.3 + 1.4, y1 + dy * 0.3 - 1.1, x2 - dy * 0.2 + 1.2, y2 + dx * 0.2 - 0.8, Math.max(1, width * 0.32), rgba(STICKER_SKETCH, 105));
}

function sketchSpark(png, x, y, size, color = '#D8A047') {
  handLine(png, x, y - size, x, y + size, Math.max(1, size * 0.18), rgba(color, 190), size);
  handLine(png, x - size, y, x + size, y, Math.max(1, size * 0.18), rgba(color, 180), size + 5);
  handLine(png, x - size * 0.45, y - size * 0.45, x + size * 0.45, y + size * 0.45, Math.max(1, size * 0.12), rgba(color, 130), size + 9);
}

function chalkHighlight(png, x1, y1, x2, y2, width = 3) {
  handLine(png, x1, y1, x2, y2, width, rgba(STICKER_CREAM, 120), x1 + y2);
}

function addOvalCheeks(png, leftX, rightX, y, color = STICKER_BLUSH) {
  ellipse(png, leftX, y, 6, 4, rgba(color, 92));
  ellipse(png, rightX, y + 1, 6, 4, rgba(color, 82));
}

function addTinyFace(png, leftEyeX, rightEyeX, eyeY, mouthY, expression = 'soft') {
  circle(png, leftEyeX, eyeY, 3.5, rgba(STICKER_INK, 235));
  circle(png, rightEyeX, eyeY + 1, 3.5, rgba(STICKER_INK, 235));
  if (expression === 'smile') {
    handLine(png, leftEyeX + 5, mouthY, rightEyeX - 5, mouthY - 1, 2, rgba(STICKER_INK, 205), mouthY);
  } else if (expression === 'sleepy') {
    handLine(png, leftEyeX - 4, eyeY, leftEyeX + 5, eyeY + 1, 2, rgba(STICKER_INK, 220), mouthY + 1);
    handLine(png, rightEyeX - 5, eyeY + 1, rightEyeX + 4, eyeY, 2, rgba(STICKER_INK, 220), mouthY + 2);
    handLine(png, leftEyeX + 8, mouthY, rightEyeX - 8, mouthY, 2, rgba(STICKER_INK, 180), mouthY + 3);
  } else {
    handLine(png, leftEyeX + 7, mouthY, rightEyeX - 7, mouthY, 2, rgba(STICKER_INK, 190), mouthY + 4);
  }
}

function addStickerLiftShadow(png, cx, cy, rx, ry) {
  ellipse(png, cx + 3, cy + 6, rx, ry, rgba('#2E2621', 46));
}

function drawSoftEllipseSticker(png, cx, cy, rx, ry, fill, shadow = '#8D6E5A') {
  addStickerLiftShadow(png, cx, cy, rx + 4, ry + 2);
  ellipse(png, cx - 1, cy, rx + 5, ry + 5, rgba(STICKER_INK, 235));
  ellipse(png, cx, cy, rx, ry, rgba(fill, 255));
  ellipse(png, cx + 3, cy - 2, rx - 4, ry - 5, rgba(fill, 190));
  handLine(png, cx - rx * 0.72, cy - ry * 0.45, cx - rx * 0.18, cy - ry * 0.72, 2, rgba(STICKER_SKETCH, 115), cx);
  chalkHighlight(png, cx - rx * 0.42, cy - ry * 0.36, cx - rx * 0.12, cy - ry * 0.48, 3);
}

function drawCatFace(png, fur, accent, mood) {
  addStickerLiftShadow(png, 94, 104, 58, 44);
  ellipse(png, 89, 96, 63, 56, rgba(STICKER_INK, 245));
  polygon(png, [[39, 76], [56, 29], [82, 73]], rgba(STICKER_INK, 245));
  polygon(png, [[100, 72], [126, 31], [141, 78]], rgba(STICKER_INK, 245));
  ellipse(png, 90, 96, 58, 51, rgba(fur, 255));
  polygon(png, [[44, 75], [59, 38], [77, 75]], rgba(fur, 255));
  polygon(png, [[104, 73], [124, 39], [136, 76]], rgba(fur, 255));
  polygon(png, [[55, 63], [60, 47], [70, 66]], rgba(accent, 180));
  polygon(png, [[114, 65], [123, 47], [129, 66]], rgba(accent, 180));
  circle(png, 68, 92, 5, rgba(STICKER_INK, 255));
  circle(png, 111, 91, 5, rgba(STICKER_INK, 255));
  polygon(png, [[86, 105], [95, 104], [90, 112]], rgba('#B87976', 255));
  if (mood === 'sleepy') {
    handLine(png, 60, 92, 76, 91, 3, rgba(STICKER_INK, 255), 17);
    handLine(png, 103, 91, 119, 90, 3, rgba(STICKER_INK, 255), 19);
  } else if (mood === 'curious') {
    handLine(png, 58, 79, 76, 82, 3, rgba(STICKER_INK, 255), 21);
    handLine(png, 104, 82, 122, 77, 3, rgba(STICKER_INK, 255), 23);
  }
  handLine(png, 90, 111, 82, 119, 2, rgba(STICKER_INK, 255), 25);
  handLine(png, 90, 111, 99, 118, 2, rgba(STICKER_INK, 255), 27);
  addOvalCheeks(png, 61, 119, 106);
  handLine(png, 55, 112, 27, 103, 2, rgba('#766257', 190), 29);
  handLine(png, 57, 122, 29, 126, 2, rgba('#766257', 190), 31);
  handLine(png, 124, 112, 153, 102, 2, rgba('#766257', 190), 33);
  handLine(png, 123, 122, 153, 126, 2, rgba('#766257', 190), 35);
  chalkHighlight(png, 60, 72, 82, 62);
  sketchSpark(png, 137, 46, 7);
}

function generateStickers() {
  sticker('cat/sleepy', (png) => drawCatFace(png, '#DDB58F', '#EACAB0', 'sleepy'));
  sticker('cat/curious', (png) => drawCatFace(png, '#78685C', '#C7A38E', 'curious'));
  sticker('cat/cozy', (png) => {
    drawCatFace(png, '#D8D1C5', '#EFD3BD', 'cozy');
    roundedRect(png, 41, 130, 96, 25, 12, rgba(STICKER_INK, 230));
    roundedRect(png, 45, 132, 88, 20, 10, rgba('#A87668', 245));
    handLine(png, 55, 142, 125, 143, 3, rgba('#EAD3B9', 150), 37);
  });
  sticker('school/notebook', (png) => {
    addStickerLiftShadow(png, 88, 94, 54, 58);
    polygon(png, [[43, 35], [137, 44], [129, 145], [34, 136]], rgba(STICKER_INK, 240));
    polygon(png, [[48, 39], [134, 47], [126, 140], [39, 132]], rgba('#F1E5C7', 255));
    polygon(png, [[48, 39], [65, 41], [56, 135], [39, 132]], rgba('#C98278', 255));
    handLine(png, 77, 67, 119, 70, 3, rgba('#B9A98F', 175), 41);
    handLine(png, 75, 91, 119, 93, 3, rgba('#B9A98F', 160), 43);
    handLine(png, 73, 115, 108, 117, 3, rgba('#B9A98F', 155), 45);
    circle(png, 56, 64, 5, rgba('#D6A24A', 240));
    circle(png, 54, 96, 5, rgba('#D6A24A', 240));
    sketchSpark(png, 136, 34, 7);
  });
  sticker('school/pencil', (png) => {
    addStickerLiftShadow(png, 94, 94, 52, 28);
    polygon(png, [[45, 133], [120, 38], [144, 55], [68, 151]], rgba(STICKER_INK, 240));
    polygon(png, [[51, 132], [122, 45], [137, 57], [68, 145]], rgba('#E8BF58', 255));
    polygon(png, [[122, 45], [137, 24], [143, 57]], rgba('#D1A06E', 255));
    polygon(png, [[136, 27], [146, 17], [143, 39]], rgba(STICKER_INK, 255));
    handLine(png, 60, 127, 128, 50, 4, rgba('#BA7248', 180), 47);
    chalkHighlight(png, 78, 106, 116, 60);
    sketchSpark(png, 45, 48, 6);
  });
  sticker('school/backpack', (png) => {
    addStickerLiftShadow(png, 91, 105, 48, 50);
    roundedRect(png, 43, 52, 91, 96, 23, rgba(STICKER_INK, 240));
    roundedRect(png, 48, 56, 82, 88, 21, rgba('#7896A2', 255));
    roundedRect(png, 62, 92, 55, 39, 11, rgba('#EBD4A4', 235));
    handLine(png, 62, 57, 48, 120, 7, rgba('#536B73', 245), 49);
    handLine(png, 118, 57, 131, 119, 7, rgba('#536B73', 245), 51);
    handLine(png, 70, 81, 110, 80, 3, rgba(STICKER_INK, 140), 53);
    addTinyFace(png, 78, 101, 105, 119, 'soft');
    addOvalCheeks(png, 67, 112, 114, '#D7A09A');
    chalkHighlight(png, 63, 64, 91, 61);
  });
  sticker('summer/sun', (png) => {
    for (let i = 0; i < 14; i += 1) {
      const a = (Math.PI * 2 * i) / 14;
      const innerRadius = i % 2 === 0 ? 42 : 45;
      const outerRadius = i % 2 === 0 ? 75 : 68;
      handLine(
        png,
        91 + Math.cos(a) * innerRadius,
        88 + Math.sin(a) * (innerRadius - 3),
        91 + Math.cos(a) * outerRadius,
        88 + Math.sin(a) * (outerRadius - 4),
        8,
        rgba('#D7963E', 240),
        55 + i,
      );
    }
    drawSoftEllipseSticker(png, 90, 90, 43, 39, '#EAC763', '#A97845');
    addTinyFace(png, 75, 105, 85, 105, 'soft');
    addOvalCheeks(png, 66, 115, 96, '#DDA07B');
    chalkHighlight(png, 73, 66, 89, 61, 3);
  });
  sticker('summer/wave', (png) => {
    addStickerLiftShadow(png, 91, 101, 66, 26);
    handLine(png, 25, 96, 151, 92, 30, rgba(STICKER_INK, 230), 69);
    handLine(png, 29, 95, 151, 92, 24, rgba('#6CBFCC', 245), 71);
    ellipse(png, 121, 73, 34, 29, rgba(STICKER_INK, 225));
    ellipse(png, 121, 75, 28, 25, rgba('#6CBFCC', 245));
    ellipse(png, 137, 68, 18, 16, rgba(STICKER_CREAM, 205));
    handLine(png, 38, 117, 130, 115, 10, rgba('#4A9BAB', 190), 73);
    chalkHighlight(png, 48, 85, 92, 81, 4);
    sketchSpark(png, 46, 54, 6);
  });
  sticker('summer/ice-cream', (png) => {
    addStickerLiftShadow(png, 91, 104, 48, 50);
    polygon(png, [[68, 86], [112, 88], [92, 156]], rgba(STICKER_INK, 235));
    polygon(png, [[73, 91], [107, 91], [92, 149]], rgba('#CFA06B', 255));
    handLine(png, 80, 106, 101, 126, 2, rgba('#8F674A', 170), 75);
    handLine(png, 101, 106, 80, 127, 2, rgba('#8F674A', 170), 77);
    circle(png, 71, 78, 31, rgba(STICKER_INK, 235));
    circle(png, 105, 77, 30, rgba(STICKER_INK, 235));
    circle(png, 90, 54, 31, rgba(STICKER_INK, 235));
    circle(png, 72, 78, 27, rgba('#E9A5B1', 255));
    circle(png, 104, 78, 27, rgba('#E9CF78', 255));
    circle(png, 90, 55, 27, rgba('#9FC7A8', 255));
    addTinyFace(png, 82, 99, 73, 90, 'smile');
    addOvalCheeks(png, 72, 110, 83);
    chalkHighlight(png, 80, 50, 94, 45);
  });
  sticker('winter/snowflake', (png) => {
    addStickerLiftShadow(png, 90, 92, 56, 56);
    for (let i = 0; i < 6; i += 1) {
      const a = (Math.PI * 2 * i) / 6;
      const innerX = 90 + Math.cos(a) * 16;
      const innerY = 90 + Math.sin(a) * 16;
      const outerX = 90 + Math.cos(a) * 62;
      const outerY = 90 + Math.sin(a) * 62;
      handLine(png, innerX, innerY, outerX, outerY, 7, rgba('#A9CDD9', 245), 81 + i);
      handLine(png, outerX, outerY, outerX - Math.cos(a + 0.8) * 18, outerY - Math.sin(a + 0.8) * 18, 4, rgba('#A9CDD9', 220), 91 + i);
      handLine(png, outerX, outerY, outerX - Math.cos(a - 0.8) * 18, outerY - Math.sin(a - 0.8) * 18, 4, rgba('#A9CDD9', 220), 101 + i);
    }
    circle(png, 90, 90, 14, rgba(STICKER_CREAM, 235));
    sketchSpark(png, 137, 47, 6);
  });
  sticker('winter/scarf', (png) => {
    addStickerLiftShadow(png, 88, 104, 55, 45);
    handLine(png, 42, 74, 133, 71, 31, rgba(STICKER_INK, 235), 111);
    handLine(png, 88, 75, 91, 143, 28, rgba(STICKER_INK, 235), 113);
    handLine(png, 43, 74, 131, 72, 25, rgba('#A96B68', 255), 115);
    handLine(png, 89, 76, 90, 139, 22, rgba('#A96B68', 255), 117);
    handLine(png, 45, 89, 130, 87, 6, rgba('#E7D2B3', 210), 119);
    handLine(png, 89, 103, 90, 132, 6, rgba('#E7D2B3', 210), 121);
    roundedRect(png, 77, 136, 25, 14, 6, rgba('#A96B68', 250));
    chalkHighlight(png, 54, 62, 88, 61, 4);
  });
  sticker('winter/snow-globe', (png) => {
    addStickerLiftShadow(png, 91, 104, 52, 48);
    circle(png, 90, 78, 49, rgba(STICKER_INK, 220));
    circle(png, 90, 78, 44, rgba('#C9E3EB', 160));
    roundedRect(png, 54, 116, 73, 30, 9, rgba(STICKER_INK, 240));
    roundedRect(png, 58, 119, 66, 24, 8, rgba('#8A6A55', 255));
    roundedRect(png, 44, 138, 92, 16, 7, rgba('#6A5044', 255));
    circle(png, 73, 72, 4, rgba(STICKER_CREAM, 230));
    circle(png, 107, 64, 4, rgba(STICKER_CREAM, 230));
    polygon(png, [[71, 106], [90, 69], [109, 106]], rgba('#6F936F', 230));
    rect(png, 85, 102, 11, 14, rgba('#6A5044', 230));
    sketchSpark(png, 118, 48, 5, '#F5D88C');
    chalkHighlight(png, 67, 53, 82, 45);
  });
  sticker('spring/blossom', (png) => {
    addStickerLiftShadow(png, 91, 96, 52, 58);
    petalFlower(png, 90, 86, 1.85, STICKER_INK, '#B28A36');
    petalFlower(png, 90, 86, 1.62, '#E9A9B2', '#D0A13F');
    handLine(png, 90, 111, 91, 150, 7, rgba('#6F9367', 245), 123);
    ellipse(png, 72, 132, 20, 9, rgba('#8AAE79', 230));
    ellipse(png, 108, 122, 20, 9, rgba('#8AAE79', 230));
    sketchSpark(png, 132, 58, 6);
  });
  sticker('spring/tulip', (png) => {
    addStickerLiftShadow(png, 91, 96, 45, 58);
    handLine(png, 90, 84, 91, 151, 8, rgba('#658E5E', 245), 125);
    ellipse(png, 68, 122, 25, 10, rgba('#82A871', 230));
    ellipse(png, 112, 132, 25, 10, rgba('#82A871', 230));
    polygon(png, [[56, 81], [71, 39], [90, 72], [108, 42], [123, 80], [108, 115], [72, 114]], rgba(STICKER_INK, 235));
    polygon(png, [[61, 81], [74, 47], [91, 76], [107, 48], [118, 82], [106, 109], [74, 109]], rgba('#DF8FA4', 255));
    ellipse(png, 91, 84, 31, 28, rgba('#F1A7B7', 185));
    chalkHighlight(png, 78, 64, 86, 88);
    sketchSpark(png, 126, 50, 6);
  });
  sticker('spring/daisy', (png) => {
    addStickerLiftShadow(png, 91, 98, 52, 58);
    petalFlower(png, 90, 86, 2.05, STICKER_INK, '#B48632');
    petalFlower(png, 90, 86, 1.78, '#F4E9C8', '#D5A13A');
    handLine(png, 90, 112, 91, 150, 7, rgba('#6E9362', 245), 127);
    ellipse(png, 70, 134, 22, 10, rgba('#8CAD7E', 220));
    sketchSpark(png, 128, 47, 6);
  });
  sticker('fall/leaf', (png) => {
    addStickerLiftShadow(png, 91, 92, 57, 32);
    drawSoftEllipseSticker(png, 88, 88, 56, 29, '#BD7445', '#7A563F');
    handLine(png, 48, 114, 128, 62, 6, rgba('#684A32', 180), 129);
    handLine(png, 85, 88, 62, 71, 3, rgba('#684A32', 140), 131);
    handLine(png, 91, 91, 118, 96, 3, rgba('#684A32', 140), 133);
    handLine(png, 122, 66, 144, 48, 5, rgba('#684A32', 180), 135);
  });
  sticker('fall/pumpkin', (png) => {
    addStickerLiftShadow(png, 92, 103, 57, 43);
    circle(png, 70, 96, 40, rgba(STICKER_INK, 235));
    circle(png, 111, 94, 39, rgba(STICKER_INK, 235));
    circle(png, 90, 95, 45, rgba(STICKER_INK, 235));
    circle(png, 70, 96, 34, rgba('#BE7042', 245));
    circle(png, 110, 94, 34, rgba('#C97B42', 245));
    circle(png, 90, 95, 39, rgba('#D68648', 255));
    roundedRect(png, 84, 42, 16, 31, 7, rgba('#63472D', 255));
    ellipse(png, 109, 55, 25, 9, rgba('#74884E', 220));
    addTinyFace(png, 76, 105, 94, 113, 'smile');
    addOvalCheeks(png, 64, 117, 105, '#D59A73');
    chalkHighlight(png, 75, 76, 83, 113);
    sketchSpark(png, 133, 55, 6);
  });
  sticker('fall/acorn', (png) => {
    addStickerLiftShadow(png, 91, 106, 43, 38);
    drawSoftEllipseSticker(png, 91, 104, 43, 39, '#A77B4D', '#77543A');
    polygon(png, [[48, 83], [70, 47], [112, 49], [131, 82]], rgba(STICKER_INK, 245));
    polygon(png, [[53, 81], [72, 53], [110, 54], [126, 81]], rgba('#70533A', 255));
    handLine(png, 58, 78, 122, 79, 5, rgba('#4D3A2B', 155), 137);
    handLine(png, 88, 49, 101, 31, 5, rgba('#4D3A2B', 210), 139);
    addTinyFace(png, 79, 103, 103, 121, 'soft');
    addOvalCheeks(png, 68, 114, 112, '#C48A72');
    chalkHighlight(png, 74, 96, 84, 84);
  });
}

function petalFlower(png, x, y, scale, petal, center) {
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI * 2 * i) / 6;
    ellipse(png, x + Math.cos(a) * 18 * scale, y + Math.sin(a) * 18 * scale, 10 * scale, 18 * scale, rgba(petal, 180));
  }
  circle(png, x, y, 8 * scale, rgba(center, 190));
}

function leafShape(png, x, y, scale, color) {
  ellipse(png, x, y, 26 * scale, 12 * scale, rgba(color, 170));
  line(png, x - 18 * scale, y + 7 * scale, x + 18 * scale, y - 7 * scale, 2 * scale, rgba('#6A5638', 110));
}

function pattern(file, draw) {
  const png = canvas(1024, 1024);
  draw(png);
  applyHandmadeTexture(png, {
    salt: file.length * 59,
    colorJitter: 7,
    alphaJitter: 5,
    toothChance: 0.008,
    edgeFadeChance: 0.08,
  });
  save(png, `assets/patterns/${file}.png`);
}

function generatePatternBackgrounds() {
  pattern('pattern-spring', (png) => {
    const flowers = [[150, 145, 1], [520, 85, 0.8], [860, 210, 1.15], [330, 500, 0.9], [700, 660, 1], [90, 850, 0.75], [930, 910, 0.85]];
    flowers.forEach(([x, y, s]) => petalFlower(png, x, y, s, '#F3B7BE', '#D9A83D'));
    [[240, 330], [590, 290], [795, 470], [455, 840], [120, 600]].forEach(([x, y]) => leafShape(png, x, y, 0.8, '#7E9B6D'));
    [[410, 210], [780, 805], [190, 720]].forEach(([x, y]) => {
      ellipse(png, x, y, 22, 16, rgba('#D6A63E', 175));
      line(png, x - 18, y, x + 18, y, 5, rgba('#5E4B35', 90));
      circle(png, x + 22, y - 12, 8, rgba('#EEE5D6', 130));
    });
  });
  pattern('pattern-summer', (png) => {
    [[120, 180], [700, 140], [520, 760], [910, 620]].forEach(([x, y]) => {
      circle(png, x, y, 38, rgba('#F7BF43', 165));
      for (let i = 0; i < 8; i += 1) {
        const a = (Math.PI * 2 * i) / 8;
        line(png, x + Math.cos(a) * 52, y + Math.sin(a) * 52, x + Math.cos(a) * 72, y + Math.sin(a) * 72, 5, rgba('#E49A35', 130));
      }
    });
    [[300, 360], [820, 355], [245, 880], [660, 520]].forEach(([x, y]) => {
      line(png, x - 55, y, x + 55, y, 11, rgba('#3198AE', 125));
      line(png, x - 45, y + 24, x + 65, y + 24, 11, rgba('#69C5D0', 125));
    });
    [[505, 220], [120, 565], [900, 900]].forEach(([x, y]) => {
      polygon(png, [[x - 18, y + 12], [x + 18, y + 12], [x, y + 70]], rgba('#C9955A', 165));
      circle(png, x - 16, y, 20, rgba('#F2A2AD', 170));
      circle(png, x + 16, y, 20, rgba('#F7D56C', 170));
      circle(png, x, y - 20, 20, rgba('#8DC7A7', 170));
    });
  });
  pattern('pattern-autumn', (png) => {
    [[120, 170], [520, 135], [860, 260], [310, 630], [720, 780], [90, 900], [945, 930]].forEach(([x, y], i) => {
      ellipse(png, x, y, 36, 20, rgba(i % 2 ? '#C98035' : '#A95E37', 165));
      line(png, x - 24, y + 12, x + 24, y - 12, 4, rgba('#5C442D', 105));
    });
    [[350, 330], [780, 530], [210, 785]].forEach(([x, y]) => {
      circle(png, x - 24, y, 32, rgba('#C66D35', 155));
      circle(png, x + 24, y, 32, rgba('#D47B38', 155));
      rect(png, x - 6, y - 54, 12, 34, rgba('#60462B', 145));
    });
    [[625, 320], [440, 900], [910, 120]].forEach(([x, y]) => {
      circle(png, x, y, 20, rgba('#9B6E3E', 160));
      polygon(png, [[x - 20, y - 8], [x, y - 34], [x + 20, y - 8]], rgba('#5D4A34', 140));
    });
  });
  pattern('pattern-winter', (png) => {
    [[160, 170], [530, 120], [840, 290], [270, 600], [690, 750], [100, 895], [940, 910]].forEach(([x, y]) => {
      for (let i = 0; i < 6; i += 1) {
        const a = (Math.PI * 2 * i) / 6;
        line(png, x - Math.cos(a) * 36, y - Math.sin(a) * 36, x + Math.cos(a) * 36, y + Math.sin(a) * 36, 4, rgba('#B9D6E3', 145));
      }
      circle(png, x, y, 6, rgba('#DDEDF2', 175));
    });
    [[365, 350], [835, 575], [410, 850]].forEach(([x, y]) => {
      rect(png, x - 44, y - 20, 88, 62, rgba('#8B614B', 150));
      rect(png, x - 30, y - 8, 60, 38, rgba('#E88945', 150));
      polygon(png, [[x - 54, y - 20], [x, y - 58], [x + 54, y - 20]], rgba('#5B4539', 160));
    });
    [[705, 240], [155, 455], [610, 560]].forEach(([x, y]) => {
      line(png, x - 54, y, x + 54, y, 14, rgba('#B76565', 145));
      line(png, x - 30, y + 24, x + 42, y + 24, 14, rgba('#E7D2B3', 135));
    });
  });
}

function diaryPaperBackground(file, baseHex, draw) {
  const png = canvas(1024, 1024, { hex: baseHex });
  draw(png);
  applyHandmadeTexture(png, {
    salt: file.length * 97,
    colorJitter: 5,
    alphaJitter: 0,
    toothChance: 0.035,
    edgeFadeChance: 0,
    preserveOpaqueAlpha: true,
  });
  addPaperFlecks(png, {
    salt: file.length * 113,
    count: 720,
    light: '#FFFDF5',
    dark: '#6E5A44',
    maxRadius: 1,
    alpha: 10,
  });
  save(png, `assets/diary-paper/${file}.png`);
}

function generateDiaryPaperBackgrounds() {
  diaryPaperBackground('vintage-parchment', '#F3E2C3', (png) => {
    for (let i = 0; i < 16; i += 1) {
      const x = 64 + hashPixel(i, 41, 13) * 900;
      const y = 72 + hashPixel(i, 43, 13) * 880;
      ellipse(png, x, y, 22 + hashPixel(i, 47, 13) * 34, 8 + hashPixel(i, 53, 13) * 16, rgba('#B99667', 9));
    }
  });

  diaryPaperBackground('soft-lined-paper', '#EEF0DC', (png) => {
    for (let i = 0; i < 18; i += 1) {
      const y = 62 + i * 52 + (i % 4 === 0 ? 2 : 0);
      line(png, 36, y, 992, y + (i % 2), 2, rgba('#7C9CA5', 32));
    }
    line(png, 118, 40, 124, 985, 2, rgba('#C48B8B', 28));
  });

  diaryPaperBackground('cream-dot-paper', '#F5EAD0', (png) => {
    for (let i = 0; i < 13; i += 1) {
      const x = 72 + hashPixel(i, 191, 23) * 880;
      const y = 76 + hashPixel(i, 197, 23) * 860;
      const scale = 0.72 + hashPixel(i, 199, 23) * 0.48;
      const tilt = hashPixel(i, 211, 23) > 0.5 ? 1 : -1;
      line(png, x, y - 24 * scale, x + 11 * tilt * scale, y + 28 * scale, 2, rgba('#8F7A5C', 34));
      ellipse(png, x - 9 * tilt * scale, y - 5 * scale, 8 * scale, 22 * scale, rgba('#B9857E', 38));
      ellipse(png, x + 12 * tilt * scale, y + 10 * scale, 7 * scale, 18 * scale, rgba('#8AA07B', 34));
      if (i % 4 === 0) {
        circle(png, x + 20 * tilt * scale, y - 26 * scale, 3.2 * scale, rgba('#A88448', 38));
      }
    }
  });

  diaryPaperBackground('warm-grid-paper', '#F1E1C9', (png) => {
    for (let i = 0; i < 7; i += 1) {
      const x = 86 + hashPixel(i, 223, 29) * 790;
      const y = 74 + hashPixel(i, 229, 29) * 820;
      const width = 112 + hashPixel(i, 233, 29) * 92;
      const height = 30 + hashPixel(i, 239, 29) * 16;
      const color = i % 2 === 0 ? '#FFF4C7' : '#D7C8AF';
      rect(png, x, y, width, height, rgba(color, 48));
      line(png, x + 8, y + height * 0.52, x + width - 8, y + height * 0.48, 1.5, rgba('#8C7057', 32));
    }
    for (let i = 0; i < 9; i += 1) {
      const x = 84 + hashPixel(i, 251, 29) * 850;
      const y = 86 + hashPixel(i, 257, 29) * 830;
      const w = 42 + hashPixel(i, 263, 29) * 52;
      line(png, x, y, x + w, y + (hashPixel(i, 269, 29) - 0.5) * 7, 2, rgba('#7A6251', 34));
      if (i % 3 === 0) {
        line(png, x + 4, y + 15, x + w * 0.72, y + 14, 1.5, rgba('#7A6251', 25));
      }
    }
  });

  diaryPaperBackground('rose-memo-paper', '#F0D9D2', (png) => {
    for (let i = 0; i < 14; i += 1) {
      const y = 78 + i * 64 + (i % 3 === 0 ? 3 : -1);
      line(png, 54, y, 970, y + (i % 2 === 0 ? 1 : -1), 2, rgba('#875C61', 30));
    }
    for (let i = 0; i < 9; i += 1) {
      const x = 80 + hashPixel(i, 151, 17) * 860;
      const y = 80 + hashPixel(i, 157, 17) * 860;
      ellipse(png, x, y, 34 + hashPixel(i, 163, 17) * 28, 10 + hashPixel(i, 167, 17) * 12, rgba('#FFF7EF', 13));
    }
  });

  diaryPaperBackground('blue-notebook-paper', '#DDE8EA', (png) => {
    for (let i = 0; i < 17; i += 1) {
      const y = 66 + i * 55 + (i % 4 === 0 ? 2 : 0);
      line(png, 42, y, 982, y + (i % 2), 2, rgba('#4F7A88', 34));
    }
    line(png, 94, 42, 98, 982, 2, rgba('#9C6B70', 32));
    line(png, 132, 42, 136, 982, 1.4, rgba('#9C6B70', 18));
  });
}

function generateAppIdentityAssets() {
  const makeIcon = (size, transparent = false) => {
    const png = canvas(size, size, transparent ? undefined : { hex: '#F5E6D0' });
    circle(png, size * 0.5, size * 0.5, size * 0.38, rgba('#2F5D50', 255));
    circle(png, size * 0.5, size * 0.5, size * 0.29, rgba('#F7B59E', 255));
    rect(png, size * 0.41, size * 0.31, size * 0.18, size * 0.41, rgba('#FFF7E6', 255));
    line(png, size * 0.45, size * 0.4, size * 0.56, size * 0.4, size * 0.015, rgba('#2F5D50', 180));
    line(png, size * 0.45, size * 0.5, size * 0.56, size * 0.5, size * 0.015, rgba('#2F5D50', 180));
    line(png, size * 0.45, size * 0.6, size * 0.56, size * 0.6, size * 0.015, rgba('#2F5D50', 180));
    return png;
  };
  save(makeIcon(1024), 'assets/icon.png');
  save(makeIcon(48), 'assets/favicon.png');
  save(makeIcon(1024, true), 'assets/splash-icon.png');
  save(makeIcon(853, true), 'assets/splash-logo.png');
  save(canvas(512, 512, { hex: '#F5E6D0' }), 'assets/android-icon-background.png');
  save(makeIcon(512, true), 'assets/android-icon-foreground.png');
  const mono = canvas(432, 432);
  circle(mono, 216, 216, 166, rgba('#FFFFFF', 255));
  circle(mono, 216, 216, 126, rgba('#000000', 255));
  rect(mono, 176, 134, 80, 172, rgba('#FFFFFF', 255));
  save(mono, 'assets/android-icon-monochrome.png');
  const splash = canvas(853, 1844, { hex: '#F7EBD8' });
  const mark = makeIcon(512, true);
  const startX = Math.round((853 - 512) / 2);
  const startY = 560;
  for (let y = 0; y < mark.height; y += 1) {
    for (let x = 0; x < mark.width; x += 1) {
      const i = (mark.width * y + x) << 2;
      setPixel(splash, startX + x, startY + y, { r: mark.data[i], g: mark.data[i + 1], b: mark.data[i + 2], a: mark.data[i + 3] });
    }
  }
  save(splash, 'assets/splash-placeholder.png');
}

generateJournalBackgrounds();
generateStickers();
generatePatternBackgrounds();
generateDiaryPaperBackgrounds();
generateAppIdentityAssets();
