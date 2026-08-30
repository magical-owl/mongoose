const fs = require('fs');
const path = require('path');

const root = process.cwd();
const sourceRoots = ['app', 'src'];
const importPattern = /import(?:\s+type)?[\s\S]*?\sfrom\s+['"]([^'"]+)['"]/g;

const rules = [
  {
    name: 'Services must not import Zustand stores',
    filePattern: /(^src\/services\/|^src\/features\/[^/]+\/services\/)(?!.*\/__tests__\/).*\.tsx?$/,
    blocked: [/^@\/stores(\/|$)/, /^@stores(\/|$)/, /\/stores\//],
  },
  {
    name: 'Hooks must not import repositories, data sources, API, or AI directly',
    filePattern: /(^src\/hooks\/|^src\/features\/[^/]+\/hooks\/)(?!.*\/__tests__\/).*\.tsx?$/,
    blocked: [
      /^@\/repositories(\/|$)/,
      /^@repositories(\/|$)/,
      /^@\/database(\/|$)/,
      /^@database(\/|$)/,
      /^@\/api(\/|$)/,
      /^@api(\/|$)/,
      /^@\/ai(\/|$)/,
      /^@ai(\/|$)/,
      /\/repositories\//,
      /\/database\//,
      /\/api\//,
      /\/ai\//,
    ],
  },
  {
    name: 'Repositories must not import services, hooks, React, or UI components',
    filePattern: /(^src\/repositories\/|^src\/features\/[^/]+\/repositories\/)(?!.*\/__tests__\/).*\.tsx?$/,
    blocked: [
      'react',
      /^@\/services(\/|$)/,
      /^@services(\/|$)/,
      /^@\/hooks(\/|$)/,
      /^@hooks(\/|$)/,
      /^@\/shared\/components(\/|$)/,
      /^@shared\/components(\/|$)/,
      /\/services\//,
      /\/hooks\//,
      /\/components\//,
    ],
  },
  {
    name: 'Shared utilities must not import app stores',
    filePattern: /^src\/shared\/utils\/(?!.*\/__tests__\/).*\.tsx?$/,
    blocked: [/^@\/stores(\/|$)/, /^@stores(\/|$)/, /\/stores\//],
    allowTypeOnly: true,
  },
];

function walk(target, files = []) {
  const absolutePath = path.join(root, target);
  if (!fs.existsSync(absolutePath)) return files;

  const stat = fs.statSync(absolutePath);
  if (stat.isFile()) {
    if (/\.(ts|tsx)$/.test(absolutePath)) files.push(absolutePath);
    return files;
  }

  for (const entry of fs.readdirSync(absolutePath)) {
    walk(path.join(target, entry), files);
  }
  return files;
}

function isTypeOnlyImport(source, matchIndex) {
  const importStart = source.lastIndexOf('import', matchIndex);
  if (importStart < 0) return false;
  return /^import\s+type\b/.test(source.slice(importStart, matchIndex + 12));
}

function matchesBlockedImport(importPath, blockedRule) {
  if (typeof blockedRule === 'string') return importPath === blockedRule;
  return blockedRule.test(importPath);
}

const errors = [];

for (const file of sourceRoots.flatMap((target) => walk(target))) {
  const relativePath = path.relative(root, file);
  if (relativePath.includes('/__tests__/') || /\.(test|spec)\.tsx?$/.test(relativePath)) {
    continue;
  }
  const contents = fs.readFileSync(file, 'utf8');

  for (const rule of rules) {
    if (!rule.filePattern.test(relativePath)) continue;

    for (const match of contents.matchAll(importPattern)) {
      const importPath = match[1];
      if (!importPath) continue;
      if (rule.allowTypeOnly && isTypeOnlyImport(contents, match.index ?? 0)) continue;

      if (rule.blocked.some((blockedRule) => matchesBlockedImport(importPath, blockedRule))) {
        errors.push(`${relativePath}: ${rule.name}: ${importPath}`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error('Architecture validation failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Architecture validation passed.');
