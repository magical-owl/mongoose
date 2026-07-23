# Meadow - Project Principles

## Vision

Meadow is a production-grade Expo application platform built with Feature-First + Clean Architecture. It serves as a reusable foundation for future apps (Diary, Journal, Finance, Habit Tracker, AI Companion, Notes, etc.).

## Core Principles

### 1. Architecture Before Features
Every feature must fit within the established architecture. If the architecture doesn't support a feature, extend the architecture first. Never compromise architectural integrity for feature velocity.

### 2. Maintainability Over Speed
Code is read far more often than it is written. Prioritize clarity, consistency, and simplicity. Optimize for the developer who will maintain this code six months from now.

### 3. Consistency Over Cleverness
Use established patterns. Prefer obvious solutions over clever ones. Every unconventional approach must be documented and justified.

### 4. Composition Over Inheritance
Build small, focused, composable units. Favor interfaces and protocols over class hierarchies. Use dependency injection to manage complexity.

### 5. Documentation Is Code
Documentation is not optional. Every feature, service, repository, and architectural decision must be documented. Documentation lives alongside code and is subject to the same review process.

### 6. Security by Default
Security is not an afterthought. All data handling, storage, and transmission must use secure defaults. Sensitive data must be encrypted. Authentication and authorization must be enforced at every layer.

### 7. Accessibility by Default
Every UI component must be accessible. Support VoiceOver (iOS), TalkBack (Android), Dynamic Type, color contrast, and reduced motion. Accessibility is a feature requirement, not a polish item.

### 8. Performance by Measurement
Optimize based on data, not intuition. Profile before and after changes. Establish performance budgets. Avoid premature optimization.

### 9. Offline-First When Practical
Design for offline use as the default. Cache data locally. Queue writes for when connectivity returns. Handle conflicts gracefully.

### 10. Vendor Independence
Abstract third-party dependencies behind interfaces. Avoid vendor lock-in. Prefer standard protocols and formats. Make it possible to swap implementations without changing business logic.

## Decision Framework

When choosing between implementation options, evaluate each option against these criteria in order:

1. **Maintainability** — How easy is it to understand and modify?
2. **Readability** — How clear is the intent?
3. **Testability** — How easy is it to test in isolation?
4. **Scalability** — How well does it handle growth?
5. **Security** — Does it follow security best practices?
6. **Accessibility** — Does it support all users?
7. **Performance** — Does it meet performance budgets?
8. **AI Readability** — Can AI agents understand and work with it?
9. **Long-term Sustainability** — Will it age well?

## Quality Gates

All code must pass before merging:

- [ ] TypeScript strict mode compiles without errors
- [ ] ESLint passes with no warnings
- [ ] All tests pass (unit, integration, component)
- [ ] Test coverage meets thresholds (≥80%)
- [ ] No `any` types used
- [ ] No hardcoded colors, spacing, or prompts
- [ ] No circular dependencies
- [ ] Documentation updated
- [ ] Accessibility verified
- [ ] Security review completed for sensitive changes