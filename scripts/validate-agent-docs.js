const fs = require('fs');
const path = require('path');

const root = process.cwd();

const requiredFiles = [
  'AGENTS.md',
  'agents/00-orchestrator.md',
  'agents/01-product-manager.md',
  'agents/02-design-agent.md',
  'agents/03-expo-engineer.md',
  'agents/04-data-architecture.md',
  'agents/05-code-reviewer.md',
  'agents/06-qa-engineer.md',
  'agents/07-security-privacy-reviewer.md',
  'agents/08-release-gatekeeper.md',
  'agents/09-localization-reviewer.md',
  'agents/10-performance-specialist.md',
  'agents/11-monetization-store-commerce-reviewer.md',
  'agents/12-ai-prompt-evaluator.md',
  'agents/README.md',
  'agents/CHANGELOG.md',
  'agents/MIGRATION.md',
  'agents/AGENT_FLOW.md',
  'agents/compliance-gates.md',
  'agents/review-checklist.md',
  'agents/workflows/ui-change.md',
  'agents/workflows/bug-fix.md',
  'agents/workflows/new-feature.md',
  'agents/workflows/data-change.md',
  'agents/workflows/release.md',
  'docs/adr/0000-template.md',
  '.github/PULL_REQUEST_TEMPLATE.md',
  '.github/CODEOWNERS',
  '.github/ISSUE_TEMPLATE/feature_brief.md',
  '.github/ISSUE_TEMPLATE/bug_report.md',
  '.github/ISSUE_TEMPLATE/qa_evidence.md',
];

const scannedRoots = ['AGENTS.md', 'agents', 'docs', '.github'];
const bannedPatterns = [/file:\/\//, /Desktop\/meadow/];
const markdownLinkPattern = /\[[^\]]+\]\(([^)]+)\)/g;

function walk(target, files = []) {
  const absolutePath = path.join(root, target);
  if (!fs.existsSync(absolutePath)) {
    return files;
  }

  const stat = fs.statSync(absolutePath);
  if (stat.isFile()) {
    if (absolutePath.endsWith('.md')) {
      files.push(absolutePath);
    }
    return files;
  }

  for (const entry of fs.readdirSync(absolutePath)) {
    walk(path.join(target, entry), files);
  }

  return files;
}

const errors = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) {
    errors.push(`Missing required agent document: ${file}`);
  }
}

for (const file of scannedRoots.flatMap((target) => walk(target))) {
  const relativePath = path.relative(root, file);
  const contents = fs.readFileSync(file, 'utf8');

  for (const pattern of bannedPatterns) {
    if (pattern.test(contents)) {
      errors.push(`Banned local reference ${pattern} found in ${relativePath}`);
    }
  }

  for (const match of contents.matchAll(markdownLinkPattern)) {
    const linkTarget = match[1].trim();
    if (
      linkTarget.startsWith('http://') ||
      linkTarget.startsWith('https://') ||
      linkTarget.startsWith('#') ||
      linkTarget.startsWith('mailto:')
    ) {
      continue;
    }

    const normalizedTarget = linkTarget.split('#')[0];
    if (!normalizedTarget) {
      continue;
    }

    const absoluteTarget = path.resolve(path.dirname(file), normalizedTarget);
    if (!absoluteTarget.startsWith(root) || !fs.existsSync(absoluteTarget)) {
      errors.push(`Broken markdown link in ${relativePath}: ${linkTarget}`);
    }
  }
}

if (errors.length > 0) {
  console.error('Agent documentation validation failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Agent documentation validation passed.');
