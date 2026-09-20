#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png']);
const ROOT = process.cwd();
const ASSETS_DIR = path.join(ROOT, 'assets');

function walkImages(directory) {
  const results = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkImages(absolutePath));
      continue;
    }
    const extension = path.extname(entry.name).toLowerCase();
    if (IMAGE_EXTENSIONS.has(extension)) results.push(absolutePath);
  }
  return results;
}

function readPngDimensions(buffer) {
  const signature = buffer.subarray(0, 8).toString('hex');
  if (signature !== '89504e470d0a1a0a') return null;
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function readJpegDimensions(buffer) {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;

  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    const isStartOfFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    const segmentLength = buffer.readUInt16BE(offset + 2);
    if (isStartOfFrame) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + segmentLength;
  }

  return null;
}

function readDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  const extension = path.extname(filePath).toLowerCase();
  if (extension === '.png') return readPngDimensions(buffer);
  if (extension === '.jpg' || extension === '.jpeg') return readJpegDimensions(buffer);
  return null;
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

function main() {
  if (!fs.existsSync(ASSETS_DIR)) {
    throw new Error('assets directory not found');
  }

  const rows = walkImages(ASSETS_DIR)
    .map((filePath) => {
      const stats = fs.statSync(filePath);
      const dimensions = readDimensions(filePath);
      return {
        path: path.relative(ROOT, filePath),
        bytes: stats.size,
        dimensions: dimensions ? `${dimensions.width}x${dimensions.height}` : 'unknown',
      };
    })
    .sort((a, b) => b.bytes - a.bytes);

  console.log('| Path | Dimensions | File size |');
  console.log('| --- | ---: | ---: |');
  for (const row of rows) {
    console.log(`| \`${row.path}\` | ${row.dimensions} | ${formatBytes(row.bytes)} |`);
  }
}

main();
