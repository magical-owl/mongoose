# Dependency Review Reference

Use this reference before adding, replacing, or upgrading a package. New dependencies also require [`agents/compliance-gates.md`](compliance-gates.md).

## Required Context

- `agents/03-expo-engineer.md`
- `agents/security.md`
- `agents/expo.md`
- Current `package.json`

## Review Checklist

- Existing app code or Expo SDK package cannot reasonably solve the problem.
- Package is compatible with the current Expo SDK and React Native version.
- Native modules, config plugins, permissions, and prebuild impact are understood.
- License permits commercial use.
- Package is maintained and has reasonable release health.
- Bundle size and startup impact are acceptable.
- Security and privacy behavior is understood.
- No analytics, tracking, auth, payment, AI, storage, or networking behavior is added silently.

## Install Rule

Use `npx expo install` for Expo-managed packages unless the package documentation requires a different command.

## Output

```text
Package:
Purpose:
Existing alternative:
Expo compatibility:
Native/config impact:
License:
Maintenance:
Bundle impact:
Security impact:
Privacy impact:
Decision:
```
