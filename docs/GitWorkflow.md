# Git Workflow

## Overview

Meadow uses a **modified Git Flow** branching strategy combined with **Conventional Commits** for commit messages and an automated CI/CD pipeline for building, testing, and deploying.

---

## Branch Strategy

### Branch Hierarchy

```
main
  └── develop
       ├── feature/feature-name
       ├── bugfix/bug-description
       ├── chore/task-description
       └── release/x.y.z
            └── hotfix/critical-fix
```

### Branch Types

| Branch | Base Branch | Lifespan | Purpose |
|---|---|---|---|
| `main` | — | Permanent | Production-ready code. Only merges from `develop` and `hotfix` branches. |
| `develop` | `main` | Permanent | Integration branch for ongoing work. All feature branches merge here. |
| `feature/*` | `develop` | Short-lived | New features and enhancements. Naming: `feature/login-screen`, `feature/offline-sync`. |
| `bugfix/*` | `develop` | Short-lived | Non-critical bug fixes found during development. |
| `chore/*` | `develop` | Short-lived | Maintenance tasks, refactoring, dependency updates. |
| `release/*` | `develop` | Temporary | Release preparation: final QA, version bumps, changelog updates. |
| `hotfix/*` | `main` | Short-lived | Critical production issues requiring immediate fix. Merges to both `main` and `develop`. |

### Branch Naming Conventions

- Use lowercase with hyphens as separators.
- Include a ticket/issue number when applicable.
- Be descriptive but concise.

```
feature/ME-123-login-animation
bugfix/crash-on-empty-state
chore/upgrade-dependencies
hotfix/payment-processing-error
```

---

## Commit Message Conventions

Meadow follows the **Conventional Commits 1.0.0** specification.

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Usage |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only changes |
| `style` | Code style changes (formatting, semicolons, etc.) — not production code |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or correcting tests |
| `chore` | Changes to the build process, dependencies, or tooling |
| `ci` | CI/CD configuration changes |
| `revert` | Reverts a previous commit |

### Scopes

Optional but encouraged for larger codebases:

```
feat(auth): add biometric login support
fix(profile): resolve avatar upload crash
docs(readme): update setup instructions
```

### Examples

```
feat: add dark mode support

Implement system-level and manual dark mode toggle.
Closes #142
```

```
fix(api): handle timeout errors gracefully

Add retry logic with exponential backoff for network timeouts.
Fixes ME-89
```

```
chore(deps): upgrade react-native from 0.72 to 0.73
```

### Rules

1. **Imperative mood** — "add" not "added" or "adds".
2. **Capitalization** — lowercase after the type/scope.
3. **No period** at the end of the subject line.
4. **Subject ≤ 72 characters**.
5. **Body wraps at 80 characters**.
6. **Footer** references issue/PR numbers when applicable.

---

## Pull Request Process

### Creating a Pull Request

1. Ensure the branch name follows conventions.
2. Push the branch and open a PR against the appropriate base branch (usually `develop`).
3. Fill in the PR template completely.

### PR Template

```markdown
## Description
[Brief description of changes]

## Type of Change
- [ ] feat: New feature
- [ ] fix: Bug fix
- [ ] refactor: Code refactoring
- [ ] test: Test changes
- [ ] chore: Maintenance
- [ ] docs: Documentation

## Testing
- [ ] Unit tests pass
- [ ] Manual testing completed
- [ ] Tested on both iOS and Android

## Screenshots / Videos
[Attach if UI changes]

## Related Issues
Closes #[issue-number]
```

### PR Size Guidelines

- **Keep PRs small and focused** — prefer multiple small PRs over a single large one.
- **Maximum 400 lines changed** (excluding generated files, lockfiles, and tests).
- **Single concern** — each PR should address one feature, fix, or improvement.

---

## Code Review Requirements

### Minimum Reviewers

| Branch Target | Minimum Approvals |
|---|---|
| `develop` | 1 |
| `main` | 2 |
| `release/*` | 2 |
| `hotfix/*` | 1 (emergency) |

### Reviewer Checklist

- [ ] Does the code follow project style guidelines?
- [ ] Are there sufficient unit tests?
- [ ] Are edge cases handled?
- [ ] Is error handling appropriate?
- [ ] Are there any security concerns?
- [ ] Does the code introduce any performance regressions?
- [ ] Are API changes backward-compatible?
- [ ] Is the documentation updated if needed?

### Code Review Etiquette

- **Be constructive and specific** — suggest solutions, not just problems.
- **Respond within 24 hours** during business days.
- **Approval is not just "LGTM"** — verify the changes work as intended.
- **Request changes with clear reasoning** — explain why a change is needed.

---

## Merge Strategy

### For `feature/*` → `develop`

**Squash merge** is preferred:

```bash
git checkout develop
git merge --squash feature/my-feature
git commit -m "feat: add my feature"
```

This keeps a linear history by collapsing all feature branch commits into a single conventional commit.

### For `develop` → `main`

**Merge commit (no fast-forward)** is used:

```bash
git checkout main
git merge --no-ff develop
git tag -a "v1.2.3" -m "Release 1.2.3"
```

This preserves the semantic grouping of the release and creates an explicit merge point.

### For `hotfix/*` → `main` and `develop`

**Merge commit (no fast-forward)** for both targets to ensure the hotfix is recorded in both branches.

---

## Release Branches

### Creating a Release Branch

```bash
git checkout develop
git checkout -b release/1.2.0
```

### Release Branch Activities

1. **Version bump** — Update version strings in all configuration files.
2. **Changelog** — Finalize release notes in `CHANGELOG.md`.
3. **QA** — Run final test suite and manual regression testing.
4. **Localization** — Ensure all translations are complete.
5. **Code freeze** — No new features; only bug fixes and polish.

### Finalizing a Release

```bash
git checkout main
git merge --no-ff release/1.2.0
git tag -a "v1.2.0" -m "Release 1.2.0"

git checkout develop
git merge --no-ff release/1.2.0

git branch -d release/1.2.0
```

---

## Tagging

### Tag Format

- **Release tags**: `vMAJOR.MINOR.PATCH` (e.g., `v1.2.0`, `v2.0.0`)
- **Pre-release tags**: `vMAJOR.MINOR.PATCH-alpha.N`, `vMAJOR.MINOR.PATCH-beta.N`, `vMAJOR.MINOR.PATCH-rc.N`
- **Build tags**: `build/YYYYMMDD.N` (CI-generated build identifiers)

### Tag Creation

All release tags are **annotated** (not lightweight):

```bash
git tag -a "v1.2.0" -m "Release 1.2.0 - Dark mode, offline sync"
git push --tags
```

### Tag Promotion

Pre-release tags can be promoted to release tags after QA sign-off:

```
v1.2.0-rc.1  →  v1.2.0  (after final approval)
```

---

## CI/CD Integration

### Automated Checks

Every push and pull request triggers:

1. **Linting** — ESLint, SwiftLint, or equivalent.
2. **Type checking** — TypeScript, Kotlin, or Swift compiler checks.
3. **Unit tests** — All test suites run.
4. **Build** — App builds for both platforms.

### Branch Protection Rules

| Branch | Rules |
|---|---|
| `main` | — Requires PR with 2 approvals<br>— Must be up-to-date with base<br>— Status checks must pass<br>— No direct pushes |
| `develop` | — Requires PR with 1 approval<br>— Status checks must pass<br>— No direct pushes |

---

## Quick Reference

```bash
# Start a new feature
git checkout develop
git checkout -b feature/my-feature
# ... work ...
git commit -m "feat: implement my feature"
git push -u origin feature/my-feature

# Merge feature back to develop (squash)
git checkout develop
git merge --squash feature/my-feature
git commit -m "feat: implement my feature"
git branch -d feature/my-feature

# Create a release
git checkout develop
git checkout -b release/1.2.0
# ... finalize ...
git checkout main
git merge --no-ff release/1.2.0
git tag -a "v1.2.0" -m "Release 1.2.0"
git checkout develop
git merge --no-ff release/1.2.0

# Hotfix on production
git checkout main
git checkout -b hotfix/critical-fix
# ... fix ...
git commit -m "fix: resolve critical issue"
git checkout main
git merge --no-ff hotfix/critical-fix
git tag -a "v1.2.1" -m "Hotfix 1.2.1"
git checkout develop
git merge --no-ff hotfix/critical-fix
```

---

## Best Practices

- **Commit early, commit often** — small, logical commits are easier to review and revert.
- **Write meaningful commit messages** — the diff shows *what* changed; the message explains *why*.
- **Rebase feature branches** against `develop` daily to minimize merge conflicts.
- **Delete branches after merging** — keep the remote repository clean.
- **Never force push to shared branches** (`main`, `develop`, `release/*`).
- **Use `git stash`** for work-in-progress that isn't ready to commit.
- **Protect `main` and `develop`** with branch protection rules in the repository settings.
