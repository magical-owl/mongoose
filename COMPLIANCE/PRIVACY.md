# Privacy Policy Framework — Meadow

This document serves as the privacy policy framework for Meadow. It covers all required disclosures under applicable privacy laws including GDPR, CCPA/CPRA, and Apple's App Store guidelines.

---

## 1. Data Collection Disclosure

### 1.1 Information You Provide

| Data Category              | Examples                                         | Purpose                                      | Legal Basis (GDPR)         |
|----------------------------|--------------------------------------------------|----------------------------------------------|----------------------------|
| Account Information        | Email address, display name, password hash       | Account creation, authentication             | Contract (Art. 6.1b)       |
| Journal Entries            | Text content, tags, timestamps                   | Core app functionality                       | Consent (Art. 6.1a)        |
| User Preferences           | Theme, notification settings, language           | Personalization                              | Legitimate Interest (Art. 6.1f) |
| In-App Purchase History    | Subscription tier, transaction date              | Billing, receipt validation                  | Legal Obligation (Art. 6.1c) |

### 1.2 Information Collected Automatically

| Data Category              | Examples                                         | Purpose                                      |
|----------------------------|--------------------------------------------------|----------------------------------------------|
| Device Information         | OS version, device model, screen resolution      | Crash reporting, performance monitoring      |
| Usage Data                 | Screen views, feature interactions               | Analytics, product improvement               |
| IP Address                 | Anonymized / masked IP                           | Fraud prevention, approximate location       |
| Crash Reports              | Stack traces, memory state                       | Bug fixing, stability                        |

### 1.3 Information from Third Parties

- **Sign in with Apple / Google**: We receive only the email address and name you authorize.
- **Payment Processors (Apple IAP / Stripe)**: We do **not** receive full payment card details. Transaction tokens and receipt data are used for billing validation.

---

## 2. Data Usage

We use collected data exclusively for the following purposes:

| Purpose                       | Data Used                                    | Retention Period                  |
|-------------------------------|----------------------------------------------|-----------------------------------|
| Provide and maintain service  | Account info, journal entries, preferences   | Until account deletion            |
| Improve and personalize app   | Usage data, device info                      | 13 months (aggregated)            |
| Customer support              | Account info, journal entries (with consent) | 90 days after ticket resolution   |
| Send service communications   | Email address                                | Until unsubscribed / deletion     |
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
| Apple (App Store Connect)     | Purchase receipts, device identifier (IFA)  | IAP validation, subscription management   | United States       |
| Google (Play Console)         | Purchase receipts, device identifier        | IAP validation, subscription management   | United States       |
| Sentry / Crashlytics          | Crash traces, device model, OS version      | Error tracking, stability monitoring      | United States / EU  |
| Hosting Provider (e.g., AWS)  | Journal entries (encrypted), account data   | Cloud storage, backend operations         | US / EU (configurable) |
| Email Service Provider        | Email address, subscription status          | Transactional emails, newsletters (opt-in)| US / EU             |

### Data Processing Addendum (DPA)

We sign DPAs with all sub-processors. Copies are available upon request at privacy@meadow.app.

---

## 4. User Rights

### 4.1 GDPR (EU/EEA Users)

| Right                          | Description                                                               | How to Exercise                          |
|--------------------------------|---------------------------------------------------------------------------|------------------------------------------|
| Right to Access                | Obtain a copy of personal data we hold about you                          | Settings → Export Data                   |
| Right to Rectification         | Correct inaccurate or incomplete data                                     | Settings → Edit Profile                  |
| Right to Erasure               | Request deletion of your data ("right to be forgotten")                   | Settings → Delete Account                |
| Right to Restrict Processing   | Limit how we process your data in certain circumstances                   | Contact privacy@meadow.app               |
| Right to Data Portability      | Receive your data in a structured, machine-readable format                | Settings → Export Data                   |
| Right to Object                | Object to processing based on legitimate interests or direct marketing    | Settings → Notification Preferences      |
| Rights re: Automated Decisions | Not be subject to decisions based solely on automated processing          | Contact privacy@meadow.app               |

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

- **In-app**: Settings → Privacy → Data Controls
- **Email**: privacy@meadow.app (response within 30 days)
- **Verification**: We may require identity verification before processing requests.

---

## 5. Data Retention

| Data Type                      | Retention Period                               | Deletion Mechanism                          |
|--------------------------------|------------------------------------------------|---------------------------------------------|
| Account information            | Until account deletion or 12 months of inactivity | Permanently erased from database          |
| Journal entries                | Until account deletion                        | Permanently erased from database            |
| Usage analytics (aggregated)   | 13 months                                      | Anonymized / deleted                        |
| Crash reports (individual)     | 90 days                                        | Deleted                                     |
| Transaction records            | 7 years (statutory requirement)                | Archived, then deleted                      |
| Email subscription preferences | Until unsubscription or account deletion       | Removed from mailing list                   |
| Backup copies                  | 30 days after primary deletion                 | Overwritten in rotation cycle               |

**Account Deletion**: When a user deletes their account:
1. Data is immediately flagged for deletion.
2. Full erasure from the primary database occurs within 24 hours.
3. Backup copies are purged within 30 days.

---

## 6. Security Measures

### 6.1 Technical Safeguards

| Measure                        | Implementation                                                             |
|--------------------------------|----------------------------------------------------------------------------|
| Encryption in Transit          | TLS 1.2+ for all API and web traffic                                       |
| Encryption at Rest             | AES-256 encryption for journal entries and personal data in the database   |
| Application-Level Encryption   | Journal entries encrypted with user-derived key before storage (zero-knowledge, where applicable) |
| Authentication                 | OAuth 2.0 (Sign in with Apple, Google), bcrypt password hashing            |
| Session Management             | JWT with secure HTTP-only cookies; automatic expiry after 30 days inactivity |
| API Security                   | Rate limiting, request validation, authentication on every endpoint        |
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

- Primary data storage: United States (AWS us-east-1)
- EU users: Standard Contractual Clauses (SCCs) are in place with all sub-processors.
- Users may request data residency in EU (Frankfurt) by contacting privacy@meadow.app.

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

- Meadow is not directed at children under 13 (or 16 in the EU).
- We do not knowingly collect personal information from children.
- If we become aware of a child's data collected without parental consent, we will delete it immediately.
- To report a concern: privacy@meadow.app

---

## 10. Changes to This Policy

- Material changes will be communicated via email and in-app notification at least 30 days before the effective date.
- Minor changes (grammar, formatting, clarifications) take effect immediately.
- Previous versions of this policy are available upon request.

---

## 11. Contact Information

| Purpose                     | Contact                                     | Response Time        |
|-----------------------------|---------------------------------------------|----------------------|
| Privacy Inquiries           | privacy@meadow.app                          | Within 30 days       |
| Data Protection Officer     | dpo@meadow.app                              | Within 14 days       |
| Legal / DPA Requests        | legal@meadow.app                            | Within 30 days       |
| Report a Concern            | abuse@meadow.app                            | Within 72 hours      |

**Mailing Address**:  
Meadow Privacy Team  
[Company Address — Insert Here]

**Supervisory Authority (GDPR)**:  
If you are unsatisfied with our response, you have the right to lodge a complaint with your local data protection authority.

---

## Appendix A: Data Subject Access Request (DSAR) Process

### A.1 Receiving a DSAR

1. User submits request via in-app export or email to privacy@meadow.app.
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
| AWS                  | Cloud hosting, database     | United States     | Yes        |
| Sentry               | Crash and error reporting   | United States     | Yes        |
| Google Cloud         | Analytics, Firebase (opt.)  | United States     | Yes        |
| Stripe               | Payment processing (future) | United States     | Yes        |
| Mailchimp / Resend   | Transactional emails        | United States     | Yes        |

*Last updated: 2025-01-27*
