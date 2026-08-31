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

function save(png, file) {
  const target = path.join(root, file);
  ensureDir(path.dirname(file));
  fs.writeFileSync(target, PNG.sync.write(png));
}

function journalBackground(file, top, bottom, draw) {
  const png = canvas(1672, 941);
  fillGradient(png, top, bottom);
  draw(png);
  save(png, `assets/journal-backgrounds/${file}.png`);
}

function drawGround(png, color) {
  polygon(png, [[0, 735], [420, 640], [840, 730], [1230, 610], [1672, 700], [1672, 941], [0, 941]], color);
}

function drawNotebook(png, x, y, scale) {
  rect(png, x, y, 210 * scale, 145 * scale, rgba('#F8F0D7', 238));
  rect(png, x + 15 * scale, y, 9 * scale, 145 * scale, rgba('#D78D78', 255));
  for (let i = 1; i < 5; i += 1) line(png, x + 42 * scale, y + i * 25 * scale, x + 190 * scale, y + i * 25 * scale, 3 * scale, rgba('#C9BCA4', 180));
}

function drawMug(png, x, y, scale) {
  rect(png, x, y, 130 * scale, 105 * scale, rgba('#F0D4B2', 245));
  circle(png, x + 130 * scale, y + 52 * scale, 34 * scale, rgba('#F0D4B2', 245));
  circle(png, x + 130 * scale, y + 52 * scale, 20 * scale, rgba('#7D5945', 255));
  ellipse(png, x + 65 * scale, y, 67 * scale, 18 * scale, rgba('#5F4135', 230));
}

function generateJournalBackgrounds() {
  journalBackground('winter', '#DEEAF0', '#AFC7D4', (png) => {
    circle(png, 1330, 200, 86, rgba('#F8F5E8', 215));
    drawGround(png, rgba('#F5F5F0', 255));
    for (let i = 0; i < 22; i += 1) circle(png, 80 + i * 75, 90 + ((i * 97) % 520), 5 + (i % 3) * 3, rgba('#FFFFFF', 210));
    rect(png, 300, 610, 260, 180, rgba('#7B5D46', 245));
    rect(png, 328, 640, 204, 105, rgba('#F18A45', 235));
    polygon(png, [[270, 620], [430, 505], [590, 620]], rgba('#5A4637', 255));
  });
  journalBackground('spring', '#DDEED8', '#F8D9DA', (png) => {
    drawGround(png, rgba('#9BBF7E', 255));
    for (let i = 0; i < 9; i += 1) {
      const x = 150 + i * 160;
      line(png, x, 720, x + 20, 560 - (i % 2) * 70, 9, rgba('#668F65', 255));
      circle(png, x + 20, 550 - (i % 2) * 70, 34, rgba(i % 2 ? '#F0A7B6' : '#FFF2A6', 238));
    }
  });
  journalBackground('summer', '#9EDDF0', '#F9D69A', (png) => {
    circle(png, 1280, 200, 120, rgba('#FFD45A', 245));
    for (let i = 0; i < 7; i += 1) line(png, 0, 690 + i * 38, 1672, 660 + i * 38, 16, rgba(i % 2 ? '#5DB7C6' : '#3B9CAD', 175));
    polygon(png, [[0, 780], [1672, 720], [1672, 941], [0, 941]], rgba('#EAB875', 255));
    polygon(png, [[410, 585], [475, 385], [545, 585]], rgba('#F5E8C7', 255));
    polygon(png, [[430, 410], [520, 410], [475, 345]], rgba('#FF8C75', 245));
  });
  journalBackground('fall', '#E9BA71', '#8E6047', (png) => {
    drawGround(png, rgba('#9B6B46', 255));
    for (let i = 0; i < 16; i += 1) {
      const x = 70 + i * 102;
      const y = 160 + ((i * 141) % 470);
      ellipse(png, x, y, 34, 18, rgba(i % 3 === 0 ? '#B65332' : i % 3 === 1 ? '#C98239' : '#8F7D3D', 225));
      line(png, x - 20, y + 12, x + 20, y - 12, 3, rgba('#5D422A', 210));
    }
    circle(png, 1180, 705, 74, rgba('#C96E31', 245));
    circle(png, 1245, 705, 74, rgba('#D67A37', 245));
    rect(png, 1208, 600, 24, 70, rgba('#5D422A', 255));
  });
  journalBackground('moonlit-lake', '#172D46', '#3B536B', (png) => {
    circle(png, 1240, 170, 85, rgba('#FFF6CF', 240));
    for (let i = 0; i < 6; i += 1) line(png, 80, 680 + i * 35, 1590, 655 + i * 35, 13, rgba('#7EA1B3', 135));
    polygon(png, [[0, 710], [360, 560], [680, 720], [1010, 545], [1672, 735], [1672, 941], [0, 941]], rgba('#203748', 255));
  });
  journalBackground('cozy-reading-nook', '#B47A57', '#6E5042', (png) => {
    rect(png, 0, 690, 1672, 251, rgba('#8B5D45', 255));
    circle(png, 1370, 210, 90, rgba('#F5D58C', 210));
    drawNotebook(png, 650, 570, 1.55);
    drawMug(png, 1030, 605, 1.2);
    rect(png, 230, 240, 280, 420, rgba('#E6CFA2', 160));
  });
  journalBackground('school', '#DDE7EF', '#B8CBE0', (png) => {
    rect(png, 0, 700, 1672, 241, rgba('#CDA576', 255));
    drawNotebook(png, 340, 500, 1.8);
    rect(png, 1000, 495, 90, 265, rgba('#F3C04D', 255));
    polygon(png, [[1000, 495], [1045, 425], [1090, 495]], rgba('#E98945', 255));
    circle(png, 1260, 540, 70, rgba('#8CB78A', 245));
    rect(png, 1190, 540, 140, 190, rgba('#8CB78A', 245));
  });
  journalBackground('office', '#CFD8DC', '#8FA4A9', (png) => {
    rect(png, 0, 705, 1672, 236, rgba('#A7896C', 255));
    rect(png, 540, 395, 590, 300, rgba('#33434D', 255));
    rect(png, 580, 435, 510, 220, rgba('#E5F3F4', 255));
    rect(png, 785, 695, 100, 95, rgba('#33434D', 255));
    drawMug(png, 1180, 640, 1.1);
  });
  journalBackground('rainy-window', '#6B7C86', '#36484F', (png) => {
    rect(png, 250, 90, 1170, 590, rgba('#CFD7D9', 80));
    line(png, 835, 90, 835, 680, 14, rgba('#30434A', 190));
    line(png, 250, 385, 1420, 385, 14, rgba('#30434A', 190));
    for (let i = 0; i < 34; i += 1) line(png, 130 + ((i * 131) % 1420), 110 + ((i * 83) % 520), 118 + ((i * 131) % 1420), 158 + ((i * 83) % 520), 5, rgba('#DCEBEE', 155));
  });
  journalBackground('mountain-sunrise', '#F2C078', '#8BB6C9', (png) => {
    circle(png, 890, 350, 115, rgba('#FFE08B', 245));
    polygon(png, [[0, 750], [420, 350], [795, 755]], rgba('#566F72', 255));
    polygon(png, [[520, 760], [1110, 280], [1672, 770]], rgba('#496169', 255));
    polygon(png, [[980, 386], [1110, 280], [1245, 395]], rgba('#F5F2E8', 245));
    drawGround(png, rgba('#6D8B66', 255));
  });
  journalBackground('greenhouse', '#CDE4D2', '#7FA37E', (png) => {
    for (let i = 0; i < 7; i += 1) line(png, 90 + i * 240, 120, 320 + i * 210, 790, 8, rgba('#E8F2E8', 145));
    rect(png, 0, 735, 1672, 206, rgba('#6E8E63', 255));
    for (let i = 0; i < 10; i += 1) {
      const x = 120 + i * 155;
      line(png, x, 760, x + 45, 565 - (i % 3) * 40, 10, rgba('#557E4F', 255));
      ellipse(png, x + 20, 635, 70, 28, rgba('#7DAE69', 240));
      ellipse(png, x + 70, 585, 65, 25, rgba('#89B874', 230));
    }
  });
  journalBackground('cafe-morning', '#E9C9A7', '#9E7154', (png) => {
    circle(png, 1260, 180, 100, rgba('#F8D685', 220));
    rect(png, 0, 705, 1672, 236, rgba('#9A6A4E', 255));
    drawMug(png, 620, 555, 1.7);
    rect(png, 930, 610, 310, 70, rgba('#D7A05F', 250));
    rect(png, 956, 515, 250, 105, rgba('#F0D190', 250));
    for (let i = 0; i < 3; i += 1) line(png, 690 + i * 42, 505, 670 + i * 42, 435, 8, rgba('#FFF0D8', 125));
  });
}

function sticker(file, draw) {
  const png = canvas(180, 180);
  draw(png);
  save(png, `assets/stickers/${file}.png`);
}

function drawCatFace(png, fur, accent, mood) {
  circle(png, 90, 96, 58, rgba(fur, 255));
  polygon(png, [[42, 72], [58, 28], [78, 72]], rgba(fur, 255));
  polygon(png, [[102, 72], [124, 28], [138, 74]], rgba(fur, 255));
  polygon(png, [[55, 62], [60, 42], [70, 65]], rgba(accent, 170));
  polygon(png, [[113, 64], [122, 42], [128, 64]], rgba(accent, 170));
  circle(png, 68, 92, 6, rgba('#2E2A26', 255));
  circle(png, 112, 92, 6, rgba('#2E2A26', 255));
  polygon(png, [[86, 104], [94, 104], [90, 111]], rgba('#D7837B', 255));
  if (mood === 'sleepy') {
    line(png, 60, 92, 76, 92, 4, rgba('#2E2A26', 255));
    line(png, 104, 92, 120, 92, 4, rgba('#2E2A26', 255));
  } else if (mood === 'curious') {
    line(png, 58, 78, 76, 82, 4, rgba('#2E2A26', 255));
    line(png, 104, 82, 122, 76, 4, rgba('#2E2A26', 255));
  }
  line(png, 90, 111, 82, 119, 3, rgba('#2E2A26', 255));
  line(png, 90, 111, 98, 119, 3, rgba('#2E2A26', 255));
  line(png, 56, 112, 26, 103, 3, rgba('#7B6259', 205));
  line(png, 57, 122, 28, 125, 3, rgba('#7B6259', 205));
  line(png, 124, 112, 154, 103, 3, rgba('#7B6259', 205));
  line(png, 123, 122, 152, 125, 3, rgba('#7B6259', 205));
}

function generateStickers() {
  sticker('cat/sleepy', (png) => drawCatFace(png, '#E7B98E', '#F2D1B8', 'sleepy'));
  sticker('cat/curious', (png) => drawCatFace(png, '#5B5148', '#D6B59B', 'curious'));
  sticker('cat/cozy', (png) => {
    drawCatFace(png, '#D8D1C5', '#F1D7C1', 'cozy');
    rect(png, 43, 132, 94, 22, rgba('#9E6F60', 245));
  });
  sticker('school/notebook', (png) => {
    drawNotebook(png, 37, 38, 0.52);
    circle(png, 55, 62, 6, rgba('#E2A74E', 255));
    circle(png, 55, 92, 6, rgba('#E2A74E', 255));
  });
  sticker('school/pencil', (png) => {
    polygon(png, [[48, 134], [122, 42], [142, 58], [68, 150]], rgba('#F2C94C', 255));
    polygon(png, [[122, 42], [137, 24], [142, 58]], rgba('#DCA66A', 255));
    polygon(png, [[135, 27], [144, 16], [142, 37]], rgba('#3A302C', 255));
    line(png, 57, 128, 130, 50, 5, rgba('#E68B49', 210));
  });
  sticker('school/backpack', (png) => {
    rect(png, 48, 55, 84, 92, rgba('#6B8E9F', 255));
    circle(png, 90, 56, 28, rgba('#6B8E9F', 255));
    rect(png, 63, 92, 54, 38, rgba('#F0D7A5', 235));
    line(png, 63, 55, 48, 118, 8, rgba('#4D6874', 255));
    line(png, 117, 55, 132, 118, 8, rgba('#4D6874', 255));
  });
  sticker('summer/sun', (png) => {
    for (let i = 0; i < 12; i += 1) {
      const a = (Math.PI * 2 * i) / 12;
      line(png, 90 + Math.cos(a) * 44, 90 + Math.sin(a) * 44, 90 + Math.cos(a) * 69, 90 + Math.sin(a) * 69, 8, rgba('#F6B23C', 240));
    }
    circle(png, 90, 90, 42, rgba('#FFD466', 255));
    circle(png, 76, 84, 5, rgba('#7A542E', 255));
    circle(png, 104, 84, 5, rgba('#7A542E', 255));
    line(png, 78, 104, 102, 104, 4, rgba('#7A542E', 255));
  });
  sticker('summer/wave', (png) => {
    for (let i = 0; i < 3; i += 1) line(png, 25, 82 + i * 23, 155, 82 + i * 23, 15, rgba(i === 1 ? '#3BA9C6' : '#75CFE0', 245));
    circle(png, 126, 70, 31, rgba('#75CFE0', 245));
    circle(png, 137, 65, 23, rgba('#FFFFFF', 210));
  });
  sticker('summer/ice-cream', (png) => {
    polygon(png, [[72, 88], [108, 88], [90, 154]], rgba('#DCA66A', 255));
    line(png, 79, 104, 101, 125, 3, rgba('#B98250', 180));
    line(png, 101, 104, 79, 125, 3, rgba('#B98250', 180));
    circle(png, 73, 76, 28, rgba('#F6A6B2', 255));
    circle(png, 104, 76, 28, rgba('#F7D77A', 255));
    circle(png, 90, 54, 28, rgba('#9BD0B3', 255));
  });
  sticker('winter/snowflake', (png) => {
    for (let i = 0; i < 6; i += 1) {
      const a = (Math.PI * 2 * i) / 6;
      const innerX = 90 + Math.cos(a) * 16;
      const innerY = 90 + Math.sin(a) * 16;
      const outerX = 90 + Math.cos(a) * 62;
      const outerY = 90 + Math.sin(a) * 62;
      line(png, innerX, innerY, outerX, outerY, 7, rgba('#A9D6E5', 245));
      line(png, outerX, outerY, outerX - Math.cos(a + 0.8) * 18, outerY - Math.sin(a + 0.8) * 18, 4, rgba('#A9D6E5', 220));
      line(png, outerX, outerY, outerX - Math.cos(a - 0.8) * 18, outerY - Math.sin(a - 0.8) * 18, 4, rgba('#A9D6E5', 220));
    }
    circle(png, 90, 90, 13, rgba('#E4F4F8', 255));
  });
  sticker('winter/scarf', (png) => {
    line(png, 44, 72, 132, 72, 26, rgba('#B76565', 255));
    line(png, 88, 76, 88, 142, 24, rgba('#B76565', 255));
    line(png, 44, 88, 132, 88, 8, rgba('#E7D2B3', 210));
    line(png, 88, 102, 88, 132, 8, rgba('#E7D2B3', 210));
    rect(png, 76, 138, 24, 12, rgba('#B76565', 255));
  });
  sticker('winter/snow-globe', (png) => {
    circle(png, 90, 78, 45, rgba('#C9E3EB', 165));
    rect(png, 55, 118, 70, 26, rgba('#8A6A55', 255));
    rect(png, 45, 140, 90, 13, rgba('#6A5044', 255));
    circle(png, 74, 72, 5, rgba('#FFFFFF', 230));
    circle(png, 106, 63, 4, rgba('#FFFFFF', 230));
    polygon(png, [[72, 106], [90, 70], [108, 106]], rgba('#5F8B69', 230));
    rect(png, 85, 102, 10, 13, rgba('#6A5044', 230));
  });
  sticker('spring/blossom', (png) => {
    petalFlower(png, 90, 86, 1.7, '#F2A7B5', '#E2B84A');
    line(png, 90, 112, 90, 150, 7, rgba('#6F9B67', 245));
    ellipse(png, 72, 132, 20, 9, rgba('#8DBD7E', 230));
    ellipse(png, 108, 122, 20, 9, rgba('#8DBD7E', 230));
  });
  sticker('spring/tulip', (png) => {
    line(png, 90, 83, 90, 150, 8, rgba('#5F9662', 245));
    ellipse(png, 69, 122, 25, 10, rgba('#7CAD70', 230));
    ellipse(png, 111, 132, 25, 10, rgba('#7CAD70', 230));
    polygon(png, [[58, 80], [72, 40], [90, 72], [108, 40], [122, 80], [108, 114], [72, 114]], rgba('#E8839B', 255));
    circle(png, 90, 83, 34, rgba('#F19BB0', 220));
  });
  sticker('spring/daisy', (png) => {
    petalFlower(png, 90, 86, 1.85, '#FFF2CC', '#D99F2F');
    line(png, 90, 112, 90, 150, 7, rgba('#6E9E62', 245));
    ellipse(png, 70, 134, 22, 10, rgba('#8DBD7E', 220));
  });
  sticker('fall/leaf', (png) => {
    ellipse(png, 88, 88, 55, 30, rgba('#C86E37', 255));
    line(png, 48, 113, 128, 63, 7, rgba('#6B4B2E', 180));
    line(png, 85, 88, 62, 71, 4, rgba('#6B4B2E', 140));
    line(png, 91, 91, 118, 96, 4, rgba('#6B4B2E', 140));
    line(png, 122, 66, 144, 48, 6, rgba('#6B4B2E', 180));
  });
  sticker('fall/pumpkin', (png) => {
    circle(png, 70, 94, 36, rgba('#C66D35', 245));
    circle(png, 110, 94, 36, rgba('#D67A37', 245));
    circle(png, 90, 94, 42, rgba('#DF8740', 255));
    rect(png, 84, 44, 14, 28, rgba('#5D422A', 255));
    ellipse(png, 108, 54, 25, 9, rgba('#6E8B45', 220));
  });
  sticker('fall/acorn', (png) => {
    circle(png, 90, 102, 42, rgba('#A77242', 255));
    polygon(png, [[50, 82], [70, 48], [110, 48], [130, 82]], rgba('#6B4D35', 255));
    line(png, 58, 78, 122, 78, 6, rgba('#4D3A2B', 155));
    line(png, 88, 48, 100, 30, 6, rgba('#4D3A2B', 210));
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
generateAppIdentityAssets();
