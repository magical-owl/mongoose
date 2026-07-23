# CCPA/CPRA Compliance Documentation

## Table of Contents
1. [Overview of CCPA/CPRA](#overview-of-ccpacpra)
2. [Consumer Rights](#consumer-rights)
3. [Business Purposes](#business-purposes)
4. [Service Provider Agreements](#service-provider-agreements)
5. [Privacy Policy Requirements](#privacy-policy-requirements)
6. [Minor Data Handling](#minor-data-handling)
7. [Enforcement and Penalties](#enforcement-and-penalties)

---

## Overview of CCPA/CPRA

### California Consumer Privacy Act (CCPA) — Effective January 1, 2020
The CCPA gives California residents enhanced rights over their personal information. Amended and strengthened by the California Privacy Rights Act (CPRA), effective January 1, 2023.

### CPRA Amendments
- Established the California Privacy Protection Agency (CPPA) for enforcement.
- Created a new category of **Sensitive Personal Information**.
- Expanded consumer rights (correction, opt-out of sharing for cross-context behavioral advertising).
- Introduced **contractor** classification alongside service providers.
- Mandated risk assessments and cybersecurity audits.

### Key Definitions
- **Consumer**: A natural person who is a California resident.
- **Personal Information**: Information that identifies, relates to, describes, is reasonably capable of being associated with, or could reasonably be linked, directly or indirectly, with a particular consumer or household.
- **Sensitive Personal Information**: Social Security number, precise geolocation, racial/ethnic origin, religion, health data, sex life/orientation, genetic data, account credentials, contents of communications.
- **Business**: Entity that collects consumers' personal information, determines processing purposes, does business in California, and meets one or more thresholds.
- **Service Provider**: Entity processing data on behalf of a business under a written agreement.
- **Contractor**: Entity to whom a business discloses personal information for a business purpose under a written contract.
- **Third Party**: Entity that is not the business, consumer, service provider, or contractor.
- **Sale**: Selling, renting, releasing, disclosing, disseminating, making available, transferring, or communicating personal information for monetary or other valuable consideration.
- **Share**: Sharing personal information for cross-context behavioral advertising.

### Thresholds for Business Obligations
A business must comply if it meets any of the following:
1. Gross annual revenue over $25 million.
2. Buys, sells, or shares personal information of 100,000+ California consumers or households.
3. Derives 50%+ of annual revenue from selling or sharing consumers' personal information.

---

## Consumer Rights

### Right to Know (CCPA Section 1798.110)
Consumers have the right to request that a business disclose what personal information it has collected, used, shared, or sold about them.

**Categories of information to disclose**:
- Categories of personal information collected.
- Categories of sources.
- Business or commercial purpose for collection, sale, or sharing.
- Categories of third parties with whom information is shared or sold.
- Specific pieces of personal information collected.

**Response requirements**:
- **Timeline**: Within 45 days (extendable to 90 days with notice).
- **Format**: Readily useable format (typically JSON or CSV).
- **Frequency**: At most twice in a 12-month period.
- **Verification**: Must verify identity before responding.
- **Cost**: Free (unless requests are manifestly unfounded or excessive).

### Right to Delete (CCPA Section 1798.105)
- Consumers have the right to request deletion of personal information collected.
- Business must delete from its records and direct service providers/contractors to delete.

**Exceptions** (business may retain if necessary for):
1. Complete a transaction or provide a requested service.
2. Detect and prevent security incidents.
3. Debug/repair functionality errors.
4. Exercise free speech rights.
5. Comply with legal obligations.
6. Internal uses compatible with consumer expectations.
7. Legal claims.
8. Scientific/historical research (with safeguards).

### Right to Opt-Out of Sale/Sharing (CCPA Section 1798.120)
- Consumers have the right to opt out of the sale or sharing of their personal information.
- Businesses must provide a **"Do Not Sell or Share My Personal Information"** link on their website homepage.
- Opt-out must be honored for at least 12 months before asking for re-opt-in.
- **Global Privacy Control (GPC)** signals must be treated as valid opt-out requests.

### Right to Correct (CPRA Section 1798.106)
- Consumers have the right to request correction of inaccurate personal information.
- Business must consider the nature of the information and purposes of processing.
- Must respond within 45 days (extendable to 90).

### Right to Limit Use of Sensitive Personal Information (CPRA Section 1798.121)
- Consumers have the right to limit the use and disclosure of sensitive personal information to:
  - Performing services or providing goods reasonably expected by the consumer.
  - Ensuring security and integrity.
  - Short-term transient use.
  - Servicing accounts.
  - Quality and safety improvement.
- Businesses must provide a **"Limit the Use of My Sensitive Personal Information"** link.

### Right to Non-Discrimination (CCPA Section 1798.125)
- **Prohibited**: Denying goods/services, charging different prices or rates, providing different quality, suggesting different treatment to consumers who exercise CCPA rights.
- **Permitted**: Offering financial incentives (loyalty programs, price differences) related to collection of personal information, if:
  - Value is reasonably related to the value of consumer's data.
  - Consumer gives prior opt-in consent.
  - Terms are clearly disclosed.
  - Consumer can withdraw at any time.

### Right of Access for Authorized Agents
- Consumers may designate an authorized agent to exercise rights on their behalf.
- Business may require: written authorization, identity verification of consumer, and direct confirmation from consumer.

### Right to Opt-Out of Automated Decision-Making (CPRA — 2025)
Effective January 1, 2025:
- Consumers have the right to opt out of automated decision-making technology (profiling) if it produces legal or similarly significant effects.
- Businesses must provide a **"Do Not Use My Automated Decision-Making Technology"** link.

---

## Business Purposes

### Authorized Business Purposes (CCPA 1798.140(d))
Business purposes are defined as using personal information for operational purposes reasonably expected by the consumer. These include:

1. **Auditing**: Auditing compliance with specifications and other standards.
2. **Security**: Detecting and protecting against security incidents, fraud, and illegal activity.
3. **Debugging**: Debugging and repairing system errors.
4. **Short-term transient use**: Non-personalized advertising shown as part of a current interaction.
5. **Service provision**: Performing services on behalf of the business (maintaining accounts, customer service, processing transactions, fulfilling orders, verifications).
6. **Quality improvement**: Internal research for technological development and improvement.
7. **Quality assurance**: Verifying or maintaining the quality or safety of services or devices.

### Collection and Use Limitations
- Personal information may not be collected for purposes incompatible with disclosed business purposes.
- Additional consent required for new purposes not disclosed at collection.
- Retention of personal information must be reasonably necessary for the disclosed business purpose.

### Selling and Sharing Prohibitions
Business purposes do NOT include:
- Selling personal information (requires opt-out).
- Sharing personal information for cross-context behavioral advertising (requires opt-out).
- Using personal information for purposes not disclosed at collection.

---

## Service Provider Agreements

### Who is a Service Provider?
An entity that:
- Processes personal information on behalf of a business.
- Receives consumer personal information under a written contract.
- Is prohibited from retaining, using, or disclosing the information for any purpose other than performing services specified in the contract.

### Contractual Requirements (CCPA Section 1798.140(v))
The contract between business and service provider must:

1. **Prohibit service provider from**:
   - Selling or sharing personal information.
   - Retaining, using, or disclosing personal information outside of the direct business relationship.
   - Combining personal information from the business with other data sources (except as necessary for performance).

2. **Specify**:
   - The business purpose(s) for processing.
   - That the service provider may only process for specified purposes.
   - That the service provider must comply with applicable CCPA obligations.

3. **Include**:
   - Right of business to take reasonable steps to ensure compliance.
   - Obligation of service provider to notify business if it can no longer comply.
   - Right of business to stop unauthorized processing upon notice.
   - Indemnification for violations.

### Service Provider vs. Contractor vs. Third Party
| Classification | Contract Required | Direct Obligations | Liability |
|---------------|------------------|-------------------|-----------|
| **Service Provider** | Yes | Limited (per contract) | Contractual to business |
| **Contractor** | Yes | Limited (per contract) | Contractual to business |
| **Third Party** | Not required | Full CCPA compliance | Independent liability |

### Contractual Obligations for Third Parties
If a business discloses personal information to a third party (for a business purpose):
- Contract must limit processing to specified purposes.
- Contract must prohibit unauthorized sale/sharing.
- Third party becomes independently liable for CCPA violations.

---

## Privacy Policy Requirements

### Required Disclosures (CCPA Section 1798.130)
The privacy policy must include:

1. **Collection**:
   - Categories of personal information collected in the preceding 12 months.
   - Categories of sources from which information was collected.

2. **Business Purposes**:
   - Business or commercial purposes for collection, sale, or sharing.
   - Business or commercial purpose for each category.

3. **Disclosure**:
   - Categories of third parties with whom information was shared or sold.
   - For each category of personal information, whether it was:
     - Disclosed for a business purpose.
     - Sold or shared.

4. **Consumer Rights**:
   - Description of consumer rights (know, delete, correct, opt-out, non-discrimination, limit use of sensitive PI).
   - How to exercise each right (links, phone numbers, email).
   - Designated methods for submitting requests.
   - Instructions for authorized agents.

5. **Opt-Out Links**:
   - **"Do Not Sell or Share My Personal Information"** link.
   - **"Limit the Use of My Sensitive Personal Information"** link (if applicable).

6. **Metrics** (if business buys, sells, or shares PI of 10M+ consumers annually):
   - Total number of rights requests received, complied with (in whole or in part), and denied.
   - Median number of days to respond.

### Notice at Collection
Must be provided **at or before** the point of collection, including:
- Categories of personal information collected.
- Purposes for each category.
- Whether information is sold or shared.
- Link to full privacy policy.

### Notice of Financial Incentive
If offering financial incentives for collection of personal information:
- Clear disclosure of material terms.
- Opt-in consent mechanism.
- Right to withdraw.

### Updates to Privacy Policy
- Must be updated at least once every 12 months.
- Changes must be communicated to consumers.
- Privacy policy must include:
  - Date of last update.
  - Version number.

### Sample Privacy Policy Structure
```
## California Privacy Rights
### Categories of Personal Information Collected
[List all categories collected in preceding 12 months]

### Sources of Personal Information
[List categories of sources]

### Business Purposes for Collection, Sale, or Sharing
[List each purpose]

### Categories of Third Parties
[List with whom information is shared or sold]

### Your California Privacy Rights
- Right to Know
- Right to Delete
- Right to Correct
- Right to Opt-Out of Sale/Sharing
- Right to Limit Use of Sensitive Personal Information
- Right to Non-Discrimination

### How to Exercise Your Rights
[Methods and contact information]

### Authorized Agents
[Requirements for authorized agent requests]

### Contact for CCPA Inquiries
[Email, phone, mailing address]

### Updates to This Notice
[Last updated date]
```

---

## Minor Data Handling

### Minors Under 16
- **Minors under 13**: Affirmative authorization (opt-in) required from a parent or guardian.
- **Minors aged 13-15**: Affirmative authorization (opt-in) required from the minor.
- No sale or sharing of personal information of minors without opt-in consent.

### Opt-In vs. Opt-Out
| Age Group | Sale/Sharing of Personal Information |
|-----------|--------------------------------------|
| Under 13 | Opt-in by parent/guardian required |
| 13-15 | Opt-in by minor required |
| 16 and older | Opt-out applies (no opt-in required) |

### Additional Protections for Minors
- Right to delete information posted (Eraser Law — California Business and Professions Code 22580-22582).
- Minors can request removal of content or information posted on a website or online service.
- Request must be responded to within 30 days.
- Cannot be required to waive rights.

### Age Verification
- Businesses must establish reasonable methods for age verification.
- Consider: age-gating, identity verification, or self-certification.
- Must document age verification process.
- Cannot disproportionately burden minors exercising their rights.

### Marketing to Minors
- Prohibited from selling or sharing minors' personal information without opt-in consent.
- Targeted advertising to known minors has additional restrictions.
- Behavioral advertising based on minor's data requires parental consent (under 13).

---

## Enforcement and Penalties

### Enforcement Agencies
- **California Privacy Protection Agency (CPPA)**: Primary enforcement (established by CPRA).
- **California Attorney General**: Concurrent enforcement authority.

### Civil Penalties
| Violation | Penalty | Per |
|-----------|---------|-----|
| Intentional violation (after notice and cure) | $2,500 | Per violation |
| Intentional violation involving minors | $7,500 | Per violation |
| Data breach (failure to maintain reasonable security) | $100-$750 | Per consumer per incident |

### Private Right of Action (Data Breach Only)
Consumers may sue for data breaches involving:
- **Non-encrypted or non-redacted** personal information.
- Categories: name + SSN, driver's license, account number, medical information, health insurance information, biometric data, email + password.

**Damages**:
- Statutory damages: $100-$750 per consumer per incident.
- Actual damages (if greater).
- Injunctive/declaratory relief.
- Attorney fees and costs.

**Notice and Cure Period**:
- 30 days to cure violation (CCPA originally; CPRA removed cure period for many violations).
- CPRA: Right to cure only at CPPA's discretion.

### Factors for Determining Penalties
1. Likelihood or extent of harm to consumers.
2. Number of consumers affected.
3. Severity and duration of violation.
4. Intent or willfulness.
5. History of prior violations.
6. Whether business cooperated with enforcement.

---

*Last updated: 2025*
*Review cycle: Quarterly*
*Owner: Compliance Team*
