# Google Play Store Compliance Guide

## Table of Contents
1. [Developer Program Policies](#developer-program-policies)
2. [Content Ratings](#content-ratings)
3. [Target API Level Requirements](#target-api-level-requirements)
4. [Store Listing Requirements](#store-listing-requirements)
5. [Screenshot Specifications](#screenshot-specifications)
6. [Review Process](#review-process)
7. [Common Rejection Reasons](#common-rejection-reasons)
8. [Pre-Launch Report](#pre-launch-report)

---

## Developer Program Policies

### Core Policies
- **Deceptive Behavior**: Apps must not misrepresent their functionality, purpose, or origin. Do not impersonate other apps or organizations.
- **Malware**: Zero tolerance for malware, spyware, or any code that compromises user security.
- **User Data**: Must provide privacy disclosure for all data collection, sharing, and usage.
- **Ad Fraud**: Prohibited from generating fraudulent ad interactions or clicks.
- **Store Listing**: Metadata must accurately represent the app's core functionality.

### Restricted Content
- **Sexual Content**: No sexually explicit material. Moderate sexual content (e.g., artistic nudity) may be allowed with appropriate rating.
- **Hate Speech**: Prohibited content promoting violence or inciting hatred against protected groups.
- **Violence**: Graphic violence, gratuitous violence, or violence against vulnerable groups is prohibited.
- **Illegal Activities**: Apps facilitating illegal activities are strictly prohibited.
- **Gambling**: Requires licensing, age restrictions, and geographic limitations.

### Enforcement
- Policy violations may result in app suspension, account termination, or developer ban.
- Appeals process available through Google Play Console.
- Repeated violations escalate penalties.

---

## Content Ratings

### Rating Questionnaire
Google uses the International Age Rating Coalition (IARC) system. Developers must complete a rating questionnaire covering:

1. **User Interaction** (e.g., sharing location, social media integration)
2. **Digital Purchases** (in-app purchases, subscriptions)
3. **Sexual Content and Nudity**
4. **Violence** (cartoon, fantasy, realistic)
5. **Profanity and Crude Humor**
6. **Alcohol, Tobacco, and Drugs**
7. **Gambling and Contests**
8. **Horror and Fear Themes**
9. **Mature/Suggestive Themes**

### Rating Levels
| Rating | Age | Description |
|--------|-----|-------------|
| 3+ | All ages | No objectionable content |
| 7+ | 7+ | Mild violence, scary themes |
| 12+ | 12+ | Moderate violence, suggestive themes |
| 16+ | 16+ | Realistic violence, sexual content |
| 18+ | 18+ | Extreme violence, gambling |

### Unrated Apps
- Apps without a completed rating questionnaire are treated as "Unrated" and may be restricted or removed.
- Ratings must be updated when app content changes significantly.

---

## Target API Level Requirements

### Current Requirements (2024-2025)
- **New apps**: Must target API level 34+ (Android 14).
- **App updates**: Must target API level 34+ within 30 days of the release of a new major API level requirement.
- **Wear OS apps**: Must target API level 30+.

### Timeline Compliance
- Google announces target API level requirements at least one year in advance.
- Failure to comply results in inability to publish updates.
- Existing apps not meeting requirements will be removed from the store.

### Best Practices
- Target the latest stable API level within 6 months of release.
- Test against new API behavior changes using developer options.
- Use Play Console's "API level targeting" dashboard to track compliance.

---

## Store Listing Requirements

### Required Fields
- **App Name**: 30 characters max, must match app functionality.
- **Short Description**: 80 characters max, concise value proposition.
- **Full Description**: 4000 characters max, detailed feature explanation.
- **Category**: Must select the most appropriate category.
- **Tags**: Up to 5 tags (for games only).

### Graphics Assets
- **App Icon**: 512x512px, 32-bit PNG with alpha.
- **Feature Graphic**: 1024x500px, JPG or 24-bit PNG.
- **Screenshots**: 2-8 screenshots per device type.
- **Promo Video** (optional): YouTube URL, max 2:30 minutes.

### Privacy and Security
- **Privacy Policy**: Required if app handles user data. Must be publicly accessible via a valid URL.
- **Data Safety Section**: Must complete the Data Safety form in Play Console detailing data collection and sharing practices.

### Additional Requirements
- **Contact Information**: Developer email must be valid and monitored.
- **Content Rating**: Must be completed before publishing.
- **Target Audience**: Must specify age range and whether the app is designed for children (COPPA compliance).

---

## Screenshot Specifications

### Phone Screenshots
| Specification | Requirement |
|---------------|-------------|
| Dimensions | Min: 320px, Max: 3840px on longest side |
| Aspect Ratio | Must be between 16:9 and 9:16 |
| Format | 24-bit PNG or JPG |
| Color Space | sRGB |
| Quantity | Minimum 2, maximum 8 |

### Tablet Screenshots
| Specification | Requirement |
|---------------|-------------|
| Dimensions | Min: 320px, Max: 3840px on longest side |
| Aspect Ratio | Must be between 16:9 and 9:16 |
| Format | 24-bit PNG or JPG |
| Quantity | Minimum 2, maximum 8 |

### Android TV Screenshots
| Specification | Requirement |
|---------------|-------------|
| Dimensions | 1280x720px or 1920x1080px |
| Format | 24-bit PNG or JPG |
| Quantity | Minimum 2, maximum 8 |

### Wear OS Screenshots
| Specification | Requirement |
|---------------|-------------|
| Dimensions | 384x384px, 400x400px, or 480x480px |
| Format | 24-bit PNG or JPG |
| Quantity | Minimum 2, maximum 8 |

### Best Practices
- Do not include device frames or bezels.
- Text must be legible at thumbnail size.
- Avoid using screenshots that show content not available in the app.
- Use the top 3 screenshots to showcase core features.
- Localize screenshots for each target market.

---

## Review Process

### Submission Workflow
1. **Pre-submission checks**: Automated validation of APK/AAB, metadata, and assets.
2. **Automated review**: Static analysis for malware, policy compliance, and technical issues.
3. **Manual review**: Human review for policy compliance (random or triggered by flags).
4. **Decision**: Published, rejected, or suspended.

### Review Timelines
- **Standard review**: Typically 1-3 business days.
- **Expedited review**: Available for critical updates (not guaranteed).
- **Re-review**: Triggered by policy updates or user complaints.

### Appeals Process
1. Submit appeal through Play Console within 30 days of rejection/suspension.
2. Provide detailed explanation of how the issue has been resolved.
3. Google reviews and responds within 5-7 business days.
4. Final decision is communicated via email and Play Console.

### Tips for Smooth Review
- Ensure privacy policy URL is accessible and matches app functionality.
- Test app thoroughly before submission.
- Respond to review feedback promptly.
- Maintain accurate and up-to-date store listing.

---

## Common Rejection Reasons

### Top Rejection Categories

1. **Policy Violations**
   - Insufficient privacy policy disclosure.
   - Deceptive or misleading app metadata.
   - Unapproved gambling or financial services.
   - Violation of intellectual property rights.

2. **Technical Issues**
   - App crashes on launch or during core functionality.
   - Poor performance on low-end devices.
   - Incompatibility with target API level.
   - Broken deep links or deeplink handling.

3. **Content Issues**
   - Inappropriate content for the assigned rating.
   - User-generated content without moderation.
   - Excessive or misleading ads.
   - Unauthorized use of copyrighted material.

4. **Metadata Issues**
   - App name too long or misleading.
   - Screenshots not representative of app functionality.
   - Missing or incomplete Data Safety section.
   - Invalid or inaccessible privacy policy URL.

5. **Permissions Issues**
   - Requesting permissions without justification.
   - Using SMS/Call Log permissions without core functionality.
   - Overly broad location access requests.

### Prevention Strategies
- Review Google Play Developer Policy Center before each submission.
- Use the Play Console's policy compliance checker.
- Conduct internal policy review for major updates.
- Maintain a changelog of policy-relevant app changes.

---

## Pre-Launch Report

### Overview
Google Play's pre-launch report provides automated testing results for your app before public release. Available through Play Console.

### Testing Coverage
- **Device coverage**: Tests run on a range of real devices across manufacturers and OS versions.
- **Android versions**: Tests cover the latest Android versions and commonly used older versions.
- **Languages**: Automated UI testing for supported languages.

### Report Contents

1. **Crashes and ANRs**
   - Stack traces for all crashes.
   - Application Not Responding (ANR) occurrences.
   - Device and OS version breakdown.

2. **Performance Issues**
   - Slow rendering (jank) detection.
   - Excessive battery usage.
   - Memory leaks and high memory usage.
   - Network usage patterns.

3. **Accessibility Improvements**
   - Missing content descriptions.
   - Insufficient touch target sizes.
   - Low contrast text.
   - Missing accessibility labels.

4. **Security Vulnerabilities**
   - SSL/TLS configuration issues.
   - Insecure data storage.
   - WebView vulnerabilities.
   - Unsafe intent handling.

5. **Compatibility Issues**
   - Feature detection failures.
   - Screen size compatibility problems.
   - API level compatibility warnings.

### Using Pre-Launch Reports
- Run pre-launch report at least 2 weeks before planned release.
- Address all crashes and ANRs before production release.
- Prioritize fixes based on severity and affected user percentage.
- Re-run report after addressing critical issues.
- Integrate pre-launch testing into CI/CD pipeline.

### Limitations
- Not a substitute for manual testing.
- May not cover all device configurations.
- Test scenarios are automated and may not reflect real-world usage patterns.
- Results may vary between pre-launch and production environments.

---

*Last updated: 2025*
*Review cycle: Quarterly*
*Owner: Compliance Team*
