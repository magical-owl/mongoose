# Privacy Policy Framework — Mongoose Codename

This document serves as the privacy policy framework for the app currently codenamed Mongoose. The release name, support domain, and company contact details must be finalized before App Store submission. It covers required disclosures under applicable privacy laws including GDPR, CCPA/CPRA, and Apple's App Store guidelines.

---

## 1. Data Collection Disclosure

### 1.1 Information You Provide

| Data Category              | Examples                                         | Purpose                                      | Legal Basis (GDPR)         |
|----------------------------|--------------------------------------------------|----------------------------------------------|----------------------------|
| Journal Entries            | Text content, tags, reflections, stickers, timestamps | Core offline diary functionality        | Consent (Art. 6.1a)        |
| User Preferences           | Theme, display settings, language, app lock preference | Personalization                         | Legitimate Interest (Art. 6.1f) |
| Local Backup Data          | User-selected encrypted backup files             | User-controlled export and restore           | Consent (Art. 6.1a)        |
| In-App Purchase History    | Purchase status, product identifier, transaction date | Billing and restore purchases           | Legal Obligation (Art. 6.1c) |

### 1.2 Information Collected Automatically

| Data Category              | Examples                                         | Purpose                                      |
|----------------------------|--------------------------------------------------|----------------------------------------------|
| Device Information         | OS version, device model                         | Native billing, diagnostics if enabled       |
| Crash Reports              | Stack traces, memory state                       | Bug fixing and stability, if crash reporting is enabled |

### 1.3 Information from Third Parties

- **Apple App Store / Google Play billing**: We do **not** receive full payment card details. Transaction tokens and receipt data are used for billing validation and purchase restoration.

---

## 2. Data Usage

We use collected data exclusively for the following purposes:

| Purpose                       | Data Used                                    | Retention Period                  |
|-------------------------------|----------------------------------------------|-----------------------------------|
| Provide and maintain service  | Journal entries, reflections, stickers, preferences | Until user deletion       |
| Personalize app experience    | Preferences                                  | Until user deletion               |
| Customer support              | User-provided support details only           | 90 days after ticket resolution   |
| Comply with legal obligations | Transaction history, IP logs                 | Per applicable statutory periods  |

We do **not** use journal entry content for:
- Advertising targeting
- Machine learning training (outside of optional, user-requested features)
- Selling to third parties

---

## 3. Third-Party Sharing

We share data only with essential service providers who are contractually bound to process data solely on our behalf and in compliance with this policy.

| Third-Party Service           | Data Shared                                 | Purpose                                   | Location of Data    |
|-------------------------------|---------------------------------------------|-------------------------------------------|---------------------|
| Apple (App Store Connect)     | Purchase receipts, device identifier        | In-app purchase validation and restore    | United States       |
| Google (Play Console)         | Purchase receipts, device identifier        | In-app purchase validation and restore    | United States       |
| Crash reporting provider, if enabled | Crash traces, device model, OS version | Error tracking and stability monitoring | United States / EU  |

### Data Processing Addendum (DPA)

We sign DPAs with applicable sub-processors. Replace this placeholder with the release support/privacy email before submission.

---

## 4. User Rights

### 4.1 GDPR (EU/EEA Users)

| Right                          | Description                                                               | How to Exercise                          |
|--------------------------------|---------------------------------------------------------------------------|------------------------------------------|
| Right to Access                | Obtain a copy of your local diary data                                    | Settings → Export Data                   |
| Right to Rectification         | Correct inaccurate or incomplete data                                     | Edit the entry directly                  |
| Right to Erasure               | Request deletion of your data ("right to be forgotten")                   | Settings → Reset App                     |
| Right to Restrict Processing   | Limit how we process your data in certain circumstances                   | Contact release privacy email            |
| Right to Data Portability      | Receive your data in a structured, machine-readable format                | Settings → Export Data                   |
| Right to Object                | Object to processing based on legitimate interests or direct marketing    | Settings → Notification Preferences      |
| Rights re: Automated Decisions | Not be subject to decisions based solely on automated processing          | Contact release privacy email            |

### 4.2 CCPA/CPRA (California Residents)

| Right                          | Description                                                               | How to Exercise                          |
|--------------------------------|---------------------------------------------------------------------------|------------------------------------------|
| Right to Know                  | Categories and specific pieces of personal information collected          | Privacy policy (this document) + request |
| Right to Delete                | Request deletion of personal information                                  | Settings → Delete Account                |
| Right to Opt-Out of Sale       | We do **not** sell personal information                                   | Not applicable (no sale)                 |
| Right to Non-Discrimination    | No penalty for exercising CCPA rights                                     | Guaranteed                               |
| Right to Correct               | Correct inaccurate personal information                                   | Settings → Edit Profile                  |
| Right to Limit Use of Sensitive PI | We do not use sensitive PI for purposes beyond those authorized        | Guaranteed                               |

### 4.3 Exercising Your Rights

- **In-app**: Settings → Data & Storage / Reset App
- **Email**: [release privacy email required] (response within 30 days)
- **Verification**: We may require identity verification before processing requests.

---

## 5. Data Retention

| Data Type                      | Retention Period                               | Deletion Mechanism                          |
|--------------------------------|------------------------------------------------|---------------------------------------------|
| Journal entries                | Until user deletion                            | Permanently erased from local encrypted storage |
| Preferences                    | Until user deletion                            | Permanently erased from local storage       |
| Crash reports (individual), if enabled | 90 days                               | Deleted                                     |
| Transaction records            | 7 years (statutory requirement)                | Archived, then deleted                      |
| Email subscription preferences | Until unsubscription or account deletion       | Removed from mailing list                   |
| Backup copies                  | 30 days after primary deletion                 | Overwritten in rotation cycle               |

**Local Data Deletion**: When a user resets the app, local diary data and preferences are deleted from the device. User-created export or backup files outside the app remain under the user's control and must be deleted by the user from their chosen storage location.

---

## 6. Security Measures

### 6.1 Technical Safeguards

| Measure                        | Implementation                                                             |
|--------------------------------|----------------------------------------------------------------------------|
| Encryption in Transit          | TLS 1.2+ for billing, store, or support traffic where applicable           |
| Encryption at Rest             | Sensitive diary data stored locally through the app's secure storage layer |
| Application Lock               | Optional biometric app lock via device biometrics                          |
| Logging & Monitoring           | Access logs retained for 90 days; anomaly detection alerts                 |
| Penetration Testing            | Annual third-party penetration tests                                       |
| Tokenization                   | Payment data tokenized by Apple/Google; no raw card data stored            |

### 6.2 Organizational Safeguards

- All employees and contractors sign confidentiality agreements.
- Access to production data is on a strict need-to-know basis.
- Regular security awareness training for all team members.
- Incident response plan documented and rehearsed quarterly.

### 6.3 Data Breach Notification

In the event of a data breach:
1. We will notify affected users within 72 hours of discovery.
2. Notification will include the nature of the breach, data affected, and recommended actions.
3. We will report to relevant supervisory authorities in accordance with applicable law.

---

## 7. International Data Transfers

- Primary diary storage is local on the user's device.
- Store billing and crash-reporting providers, if enabled, may process data in their listed regions.
- Replace regional support details before release if backend sync or remote services are added.

---

## 8. Cookies and Tracking Technologies

| Type              | Purpose                        | Duration     | Opt-Out Mechanism                |
|-------------------|--------------------------------|--------------|----------------------------------|
| Essential         | Session management, CSRF token | Session      | Necessary; cannot disable        |
| Preference        | Theme, language settings       | 1 year       | Settings → Privacy               |
| Analytics         | Feature usage, crash tracking  | 13 months    | Settings → Privacy → Disable Analytics |
| Advertising       | None (we do not show ads)      | N/A          | N/A                              |

**Do Not Track (DNT)**: We do not respond to DNT signals. We do not track users across third-party websites.

---

## 9. Children's Privacy

- The app currently codenamed Mongoose is not directed at children under 13 (or 16 in the EU).
- We do not knowingly collect personal information from children.
- If we become aware of a child's data collected without parental consent, we will delete it immediately.
- To report a concern: [release privacy/support email required]

---

## 10. Changes to This Policy

- Material changes will be communicated via email and in-app notification at least 30 days before the effective date.
- Minor changes (grammar, formatting, clarifications) take effect immediately.
- Previous versions of this policy are available upon request.

---

## 11. Contact Information

| Purpose                     | Contact                                     | Response Time        |
|-----------------------------|---------------------------------------------|----------------------|
| Privacy Inquiries           | [release privacy email required]            | Within 30 days       |
| Data Protection Officer     | [release DPO email, if applicable]          | Within 14 days       |
| Legal / DPA Requests        | [release legal email required]              | Within 30 days       |
| Report a Concern            | [release support email required]            | Within 72 hours      |

**Mailing Address**:  
[Release Privacy Team]  
[Company Address — Insert Here]

**Supervisory Authority (GDPR)**:  
If you are unsatisfied with our response, you have the right to lodge a complaint with your local data protection authority.

---

## Appendix A: Data Subject Access Request (DSAR) Process

### A.1 Receiving a DSAR

1. User submits request via in-app export or the release privacy email.
2. Automated acknowledgment sent within 24 hours.
3. Identity verification performed (email confirmation, account ownership proof).
4. Request logged and assigned to Privacy Team.

### A.2 Fulfillment

- **Timeline**: Within 30 calendar days (extendable by 60 days for complex requests).
- **Format**: Machine-readable (JSON) or human-readable (PDF) per user's choice.
- **Scope**: All personal data as defined by Art. 4(1) GDPR.

### A.3 Exceptions

We may refuse or charge a reasonable fee for:
- Manifestly unfounded or excessive requests (Art. 12(5) GDPR).
- Requests that infringe on the rights of others.
- Requests for data we are legally required to retain.

---

## Appendix B: Subprocessor List

| Subprocessor         | Service Provided            | Location          | DPA Signed |
|----------------------|-----------------------------|-------------------|------------|
| Apple                | App Store billing           | United States     | Yes        |
| Google               | Play billing                | United States     | Yes        |
| Crash reporting provider, if enabled | Crash and error reporting | United States / EU | Required before release |
| Google Cloud         | Analytics, Firebase (opt.)  | United States     | Yes        |
| Stripe               | Payment processing (future) | United States     | Yes        |
| Mailchimp / Resend   | Transactional emails        | United States     | Yes        |

*Last updated: 2025-01-27*
