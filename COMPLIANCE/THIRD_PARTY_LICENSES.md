# Third-Party License Documentation

## Table of Contents
1. [License Inventory Template](#license-inventory-template)
2. [Open Source Compliance](#open-source-compliance)
3. [Attribution Requirements](#attribution-requirements)
4. [License Types Reference](#license-types-reference)
5. [License Management Process](#license-management-process)

---

## License Inventory Template

### Documentation Standard
All third-party dependencies must be documented in a structured inventory. The following template defines the minimum information that must be recorded for each dependency.

### License Inventory Entry Template

```
## Dependency Name: [name]
- **Version**: [version number]
- **License Type**: [SPDX license identifier]
- **License URL**: [URL to full license text]
- **Source URL**: [repository or download URL]
- **Vendor/Owner**: [author or organization]
- **Usage**: [how the dependency is used in the project]
- **Attribution Required**: [Yes/No]
- **Attribution Text**: [exact attribution text required by license]
- **Obligations**: [summary of license obligations]
- **Internal Contact**: [responsible engineer or legal contact]
- **Review Date**: [last compliance review date]
- **Expiration/Renewal**: [if applicable]
```

### Sample Completed Entry

```
## Dependency Name: React
- **Version**: 18.3.1
- **License Type**: MIT
- **License URL**: https://github.com/facebook/react/blob/main/LICENSE
- **Source URL**: https://github.com/facebook/react
- **Vendor/Owner**: Meta Platforms, Inc.
- **Usage**: UI component library for web application frontend
- **Attribution Required**: Yes
- **Attribution Text**: "Copyright (c) Meta Platforms, Inc. and affiliates. Permission is hereby granted, free of charge..."
- **Obligations**: Include copyright notice and permission notice in distributions
- **Internal Contact**: engineering@company.com
- **Review Date**: 2025-01-15
- **Expiration/Renewal**: N/A (perpetual open source license)
```

### Inventory Management
- Maintain inventory as a structured file (JSON, YAML, or spreadsheet) alongside this document.
- Inventory must be version-controlled in the project repository.
- Review inventory for new dependencies during code review.
- Full inventory audit quarterly.

### Minimum Required Fields Checklist
- [ ] Dependency name and version.
- [ ] License type (SPDX identifier).
- [ ] License URL.
- [ ] Source URL.
- [ ] Vendor/owner.
- [ ] Usage description.
- [ ] Attribution requirements.
- [ ] License obligations summary.

---

## Open Source Compliance

### Compliance Principles
1. **Identify**: All open source components must be identified and cataloged.
2. **Review**: License terms must be reviewed before integration.
3. **Track**: Dependencies and their licenses must be continuously tracked.
4. **Comply**: All license obligations must be fulfilled (attribution, source code distribution, notices).
5. **Audit**: Regular audits ensure ongoing compliance.

### Open Source Classification

| Category | Characteristics | Examples |
|----------|----------------|----------|
| **Permissive** | Low restrictions, require attribution only | MIT, Apache 2.0, BSD, ISC |
| **Weak Copyleft** | Modified files must be open source; linking exempt | LGPL, MPL, EPL |
| **Strong Copyleft** | Derivative works must be open source under same license | GPL, AGPL |
| **Proprietary Freeware** | Free to use but no source code access | Various free SDKs |
| **Creative Commons** | Applies to documentation and assets | CC BY, CC BY-SA, CC0 |

### Compliance Workflow

#### Discovery Phase
1. Developer identifies need for third-party component.
2. Developer checks if component is already in approved license inventory.
3. If new, submit component for legal review.

#### Review Phase
4. Legal/compliance reviews the license terms.
5. Evaluate compatibility with project license.
6. Identify obligations (attribution, notice, source code distribution).
7. Document any restrictions (e.g., cannot be used in commercial products).

#### Approval Phase
8. Approved — added to inventory with documented obligations.
9. Conditionally approved — specific use restrictions apply.
10. Rejected — alternative component must be found.

#### Integration Phase
11. Component added to build system with license metadata.
12. Automated license checking integrated into CI/CD pipeline.
13. License notice file updated if required.

#### Distribution Phase
14. License notices included in distribution package.
15. Source code made available for copyleft components.
16. Attribution documentation included in app or documentation.

### Dependency Scanning
- Use automated dependency scanning tools (e.g., FOSSA, Snyk, WhiteSource, Dependabot).
- Scan frequency: Every pull request and weekly full scan.
- Block CI/CD pipeline for high-risk license issues.
- Generate compliance reports for audits.

### Prohibited Licenses
The following licenses are generally prohibited for use in proprietary software:
- **AGPL v3**: Strong network copyleft, may force entire application to be open source.
- **GPL v3**: Strong copyleft, derivative works must be GPL-licensed.
- **Do not use** any component with a license that:
  - Requires open-sourcing the entire project.
  - Restricts commercial use.
  - Requires royalty payments.
  - Is not listed as a known open source license.

### License Compatibility Matrix
| Project License | MIT | Apache 2.0 | BSD | LGPL | GPL | AGPL |
|-----------------|-----|-----------|-----|------|-----|------|
| MIT | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Apache 2.0 | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| GPL v3 | ✓ | ✓ (with patent notice) | ✓ | ✓ | ✓ | ✗ |
| Proprietary | ✓ | ✓ | ✓ | ✓ (if LGPL allows) | ✗ | ✗ |

---

## Attribution Requirements

### General Principles
- Provide credit to the original authors of open source components.
- Include required copyright notices exactly as specified.
- Do not modify or remove existing copyright notices in source files.
- Include all third-party notices in a consolidated NOTICE file.

### Where to Include Attribution

#### Mobile Applications
- **In-app**: Settings > Licenses or About > Legal Notices.
- **Distribution**: Include NOTICE file within the app bundle.

#### Web Applications
- **In-app**: Footer link or About page linking to legal notices.
- **Client-side code**: Comments in minified/bundled output where feasible.

#### Desktop Applications
- **In-app**: Help > About > Acknowledgments or Legal.
- **Installer**: Include license acknowledgments in installation process.

#### SDKs and Libraries
- Include NOTICE file in the distribution package.
- Document attribution requirements in README.

### NOTICE File Template
```
Third-Party Notices

This application includes third-party components licensed under the following open source licenses:

========================================================================================
[MIT License]
========================================================================================
The following components are licensed under the MIT License:

1. Component Name v1.0.0
   Copyright (c) [Year] [Author]
   Source: [URL]
   License: [Full MIT license text or reference]

========================================================================================
[Apache License 2.0]
========================================================================================
The following components are licensed under the Apache License 2.0:

1. Component Name v2.0.0
   Copyright [Year] [Author]
   Source: [URL]
   License: [Full Apache 2.0 license text or reference]

========================================================================================
END THIRD-PARTY NOTICES
```

### Specific License Attribution Requirements

| License | Attribution Requirement |
|---------|------------------------|
| **MIT** | Include copyright notice and permission notice in all copies or substantial portions |
| **Apache 2.0** | Include NOTICE file, retain copyright notice, document changes |
| **BSD 2-Clause** | Include copyright notice, list of conditions, and disclaimer |
| **BSD 3-Clause** | Same as BSD 2 + no endorsement clause |
| **LGPL** | Include license text, allow user to modify and reverse engineer |
| **MPL 2.0** | Include license text, cover modified files |
| **ISC** | Include copyright notice and permission notice |

### Common Attribution Text Formats

#### MIT License
```
MIT License

Copyright (c) [year] [copyright holder]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

#### Apache 2.0 (Required Notice)
```
Copyright [yyyy] [name of copyright owner]

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

---

## License Types Reference

### Permissive Licenses

#### MIT License
- **SPDX**: MIT
- **Obligations**: Include copyright and permission notice.
- **Compatibility**: Compatible with nearly all licenses.
- **Patent provisions**: None.
- **Copyleft**: No.
- **Commercial use**: Allowed.

#### Apache License 2.0
- **SPDX**: Apache-2.0
- **Obligations**: Include NOTICE file, retain copyright, document modifications.
- **Compatibility**: Compatible with GPL v3.
- **Patent provisions**: Express patent grant.
- **Copyleft**: No.
- **Commercial use**: Allowed.

#### BSD Licenses
| Variant | SPDX | Obligations |
|---------|------|-------------|
| BSD 2-Clause | BSD-2-Clause | Include copyright, conditions, disclaimer |
| BSD 3-Clause | BSD-3-Clause | Same + no endorsement clause |
| BSD 4-Clause | BSD-4-Clause | Same + advertising clause (rare, GPL-incompatible) |

#### ISC License
- **SPDX**: ISC
- **Obligations**: Include copyright and permission notice.
- **Compatibility**: Similar to MIT, GPL-compatible.

#### Unlicense / CC0
- **SPDX**: Unlicense / CC0-1.0
- **Obligations**: None (public domain dedication).
- **Note**: Seek legal advice — public domain dedication may not be recognized in all jurisdictions.

### Weak Copyleft Licenses

#### GNU LGPL v2.1 / v3
- **SPDX**: LGPL-2.1-only / LGPL-3.0-only
- **Obligations**:
  - License text must accompany distribution.
  - User must be able to modify the library (source code access).
  - Modifications to the library itself must be under LGPL.
  - Dynamic linking may allow proprietary code; static linking triggers copyleft.
- **Compatibility**: Compatible with GPL (any version).
- **Commercial use**: Allowed.

#### Mozilla Public License 2.0
- **SPDX**: MPL-2.0
- **Obligations**:
  - Modified files must be under MPL.
  - Larger work (non-modifications) can use other licenses.
  - Source code for MPL files must be made available.
- **Compatibility**: Compatible with GPL v2+, Apache 2.0, BSD.
- **Copyleft**: File-level only.
- **Commercial use**: Allowed.

#### Eclipse Public License 2.0
- **SPDX**: EPL-2.0
- **Obligations**:
  - Modified files must be under EPL.
  - Source code must be made available.
  - May include a secondary license for GPL compatibility.
- **Compatibility**: Compatible with GPL v3 (with secondary license option).

### Strong Copyleft Licenses

#### GNU GPL v2 / v3
- **SPDX**: GPL-2.0-only / GPL-3.0-only
- **Obligations**:
  - Complete corresponding source code must be made available.
  - Derivative works must be under GPL.
  - v3 includes patent protection and anti-Tivoization provisions.
- **Compatibility**: Only with compatible licenses.
- **Commercial use**: Allowed, but distribution triggers copyleft.

#### GNU AGPL v3
- **SPDX**: AGPL-3.0-only
- **Obligations**:
  - Same as GPL v3.
  - **Network use counts as distribution** — running modified AGPL software on a network (SaaS) requires source code disclosure.
- **Compatibility**: Only with AGPL or GPL v3 (no version upgrade).
- **Commercial use**: Allowed, but network use triggers copyleft.

### Other Common Licenses

#### Creative Commons (for documentation and assets)
| License | Use | Obligations |
|---------|-----|-------------|
| CC0 | Public domain | None |
| CC BY | Free use with attribution | Include attribution |
| CC BY-SA | Free use with attribution, share-alike | Include attribution, derivative works under same license |
| CC BY-NC | Free use with attribution, non-commercial only | Cannot use in commercial products |
| CC BY-ND | Free use with attribution, no derivatives | Cannot modify |

#### SIL Open Font License 1.1
- **SPDX**: OFL-1.1
- **Obligations**: Include license text, no selling font alone, rename if modified.

#### JSON License
- **SPDX**: JSON
- **Note**: Includes "the software shall not be used for evil" clause. May not be considered open source by some definitions.

#### BSL (Business Source License)
- **SPDX**: BSL-1.0
- **Note**: Changes to open source license after a specified period (Change License). Not fully open source during the BSL period.

---

## License Management Process

### Onboarding New Dependencies
1. **Developer identifies** need for a new dependency.
2. **Developer checks** existing license inventory for approval status.
3. **If new**, developer submits dependency review request with:
   - Component name and version.
   - Source URL.
   - License type.
   - Usage description.
4. **Compliance team reviews** within 5 business days.
5. **Result**: Approved, Conditional, or Rejected.
6. **Dependency added** to inventory with compliance documentation.
7. **CI/CD integration**: License checker rule added.

### Automated License Checking
- Integrate license checking tools into CI/CD pipeline.
- Check every pull request for new or modified dependencies.
- Fail builds for dependencies with prohibited licenses.
- Generate warnings for dependencies with conditional licenses.
- Maintain a list of approved, conditional, and prohibited licenses.

### Regular Audits

| Frequency | Activity | Responsible |
|-----------|----------|-------------|
| Per commit | Automated dependency scan | CI/CD system |
| Per sprint | Review new dependencies | Engineering lead |
| Monthly | Update license inventory | Compliance team |
| Quarterly | Full license audit | Compliance + Engineering |
| Annually | External audit | Internal audit or external counsel |

### Audit Process
1. Scan all dependencies using automated tools.
2. Compare results against license inventory.
3. Identify discrepancies (missing dependencies, wrong license types).
4. Review each discrepancy for compliance.
5. Remediate any compliance gaps (update notices, replace components).
6. Document audit findings and remediation.
7. Report to management.

### License Policy Violations

| Severity | Definition | Action |
|----------|------------|--------|
| **Critical** | Use of GPL/AGPL in proprietary code | Immediate removal, legal review, root cause analysis |
| **High** | Use of restricted-license component | Replacement within 30 days, engineering review |
| **Medium** | Missing attribution notice | Add notice at next release, track in compliance dashboard |
| **Low** | Incomplete or outdated inventory record | Update within 90 days |

### Third-Party Vendor Due Diligence
When using third-party APIs or services (not just libraries):
- Review vendor's license terms and privacy policy.
- Verify vendor's own third-party compliance.
- Include data processing terms in service agreements.
- Review vendor's security certifications.
- Document vendor's license obligations for your use case.

---

*Last updated: 2025*
*Review cycle: Quarterly*
*Owner: Compliance Team*
