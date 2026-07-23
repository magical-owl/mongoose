# Data Retention Policy

## Table of Contents
1. [Purpose and Scope](#purpose-and-scope)
2. [Retention Periods by Data Type](#retention-periods-by-data-type)
3. [User Deletion Requests](#user-deletion-requests)
4. [Data Anonymization Processes](#data-anonymization-processes)
5. [Backup Retention](#backup-retention)
6. [Legal Hold Procedures](#legal-hold-procedures)
7. [Audit Trails](#audit-trails)

---

## Purpose and Scope

### Purpose
This Data Retention Policy defines the periods for which different categories of data are retained, the processes for secure deletion, and the procedures for handling user deletion requests. The policy ensures compliance with GDPR, CCPA, Philippines Data Privacy Act, and other applicable regulations.

### Scope
This policy applies to:
- All production, staging, and development environments.
- All databases, file systems, backups, and logs.
- All third-party services processing data on behalf of the organization.
- All employees, contractors, and agents with access to data.

### Principles
- **Data minimization**: Collect only what is necessary, retain only as long as needed.
- **Purpose limitation**: Retain data only for the purpose for which it was collected.
- **Accountability**: Document retention periods and deletion processes.
- **Security**: Ensure secure deletion and anonymization.

---

## Retention Periods by Data Type

### User Account Data

| Data Type | Retention Period | Rationale |
|-----------|-----------------|-----------|
| Account profile (name, email, username) | Duration of account + 30 days after deletion | Account functionality and legal obligation |
| Password hashes | Duration of account + 90 days after deletion | Security audit trail |
| Authentication logs | 12 months | Security monitoring and incident investigation |
| Account status (active, suspended, banned) | Duration of account + 3 years after closure | Legal and compliance |
| Email verification records | Duration of account + 1 year | Anti-abuse verification |

### Personal Information

| Data Type | Retention Period | Rationale |
|-----------|-----------------|-----------|
| Contact information (address, phone) | Duration of account + 90 days | Service delivery |
| Date of birth | Duration of account + 90 days | Age verification |
| Government IDs (if collected) | 30 days after verification | Identity verification only |
| Biometric data | Not collected/stored | N/A |

### Usage and Analytics Data

| Data Type | Retention Period | Rationale |
|-----------|-----------------|-----------|
| App usage analytics (aggregated) | 24 months | Product improvement |
| Crash reports | 90 days | Bug fixing |
| Performance metrics (anonymized) | 36 months | Trend analysis |
| Feature interaction logs | 12 months | UX optimization |
| Session recordings | 90 days | Debugging |

### Transaction and Financial Data

| Data Type | Retention Period | Rationale |
|-----------|-----------------|-----------|
| Payment transaction records | 7 years | Tax and legal obligations |
| Invoice records | 7 years | Tax and accounting |
| Refund records | 7 years | Financial auditing |
| Subscription history | Duration of account + 3 years | Customer service |
| Billing contact information | 7 years after last transaction | Legal requirement |

### Communications

| Data Type | Retention Period | Rationale |
|-----------|-----------------|-----------|
| Customer support tickets | 3 years after resolution | Quality assurance and dispute resolution |
| Email correspondence | 2 years | Service improvement |
| In-app chat messages | Duration of account + 90 days | User history |
| Push notification logs | 90 days | Delivery verification |
| SMS/OTP records | 30 days | Security verification |

### Content Data

| Data Type | Retention Period | Rationale |
|-----------|-----------------|-----------|
| User-generated content (active) | Duration of account | Core service |
| Drafts/unpublished content | 30 days after creation | User convenience |
| Deleted content | 30 days (recovery window) | Accidental deletion protection |
| Uploaded media (photos, videos) | Duration of account | Core service |
| Shared content metadata | Duration of account | Service functionality |

### Technical Logs

| Data Type | Retention Period | Rationale |
|-----------|-----------------|-----------|
| Server access logs | 12 months | Security monitoring |
| Database query logs | 90 days | Performance optimization |
| API request logs | 6 months | Debugging and rate limiting |
| Security event logs | 24 months | Compliance and investigation |
| Network flow logs | 90 days | Anomaly detection |
| Admin action logs | 36 months | Audit trail |

### Marketing Data

| Data Type | Retention Period | Rationale |
|-----------|-----------------|-----------|
| Marketing email opt-in/out records | Duration of consent | Compliance |
| Campaign interaction data | 24 months | Campaign analysis |
| Cookie consent records | 12 months after last consent update | Compliance |
| Behavioral profiling data | 12 months | Personalization |
| Third-party marketing data | 30 days after import | Limited use |

---

## User Deletion Requests

### Right to Deletion (Right to Erasure / Right to be Forgotten)

Users have the right to request deletion of their personal data under:
- GDPR Article 17 (Right to erasure)
- CCPA Section 1798.105 (Right to delete)
- Philippines Data Privacy Act Section 16 (Rights of data subject)

### Deletion Request Workflow

| Step | Description | Responsible | Timeline |
|------|-------------|-------------|----------|
| 1 | Receive deletion request | Support team | Within 24 hours |
| 2 | Verify identity | Support team | Within 48 hours |
| 3 | Acknowledge request | Automated system | Within 72 hours |
| 4 | Identify data scope | Engineering | Within 5 business days |
| 5 | Execute deletion | Engineering | Within 30 days (GDPR) / 45 days (CCPA) |
| 6 | Confirm with user | Support team | Within 5 business days of completion |
| 7 | Document compliance | Compliance team | Within 10 business days of completion |

### Exceptions to Deletion
Data may be retained despite a deletion request when necessary for:
- Compliance with legal obligations (e.g., tax records, 7 years).
- Establishment, exercise, or defense of legal claims.
- Completion of a transaction or service delivery.
- Public health or safety reasons.
- Archiving purposes in the public interest.

### Technical Deletion Process
1. **Soft delete**: Mark account as deleted; disable access immediately.
2. **Grace period**: 30-day recovery window for accidental deletion.
3. **Hard delete**: Permanently remove data from production databases.
4. **Cache invalidation**: Clear CDN and application caches.
5. **Backup purging**: Remove from backups within 90 days or next backup rotation.
6. **Third-party notification**: Notify data processors to delete data.
7. **Verification**: Confirm deletion via automated scripts.

### Deletion Confirmation
- Provide user with confirmation of deletion.
- Include list of data types that were deleted.
- Include list of data retained (if any) with legal basis.
- Provide contact for further inquiries.

---

## Data Anonymization Processes

### Anonymization vs. Pseudonymization

| Technique | Description | Re-identification Risk | Regulatory Status |
|-----------|-------------|----------------------|-------------------|
| **Anonymization** | Irreversible removal of all identifying information | Very low | Not personal data |
| **Pseudonymization** | Replace identifiers with artificial identifiers | Moderate | Still personal data (GDPR) |

### Anonymization Techniques

1. **Data Masking**
   - Replace sensitive values with realistic but fake data.
   - Preserve data format and structure for testing.
   - Example: "john.doe@email.com" → "a1b2c3d4@anonymized.com"

2. **Aggregation**
   - Combine individual records into statistical groupings.
   - Minimum group size of 5 individuals.
   - Suppress cells with counts below threshold.

3. **k-Anonymity**
   - Ensure each record is indistinguishable from at least k-1 other records.
   - Minimum k value: 5 for publishable data.
   - Apply generalization (e.g., age ranges) and suppression.

4. **Differential Privacy**
   - Add calibrated noise to query results.
   - Epsilon parameter: ε ≤ 1.0 for sensitive data.
   - Used for analytics and ML training datasets.

5. **Tokenization**
   - Replace sensitive data with non-sensitive tokens.
   - Tokens are reversible only with secured mapping table.
   - Used for payment data and PII.

### Anonymization Process Workflow
1. **Data identification**: Catalog all fields requiring anonymization.
2. **Technique selection**: Determine appropriate technique per data type.
3. **Apply transformation**: Execute anonymization algorithms.
4. **Validation**: Verify no re-identification possible.
5. **Testing**: Attempt re-identification to validate effectiveness.
6. **Documentation**: Record method, parameters, and validation results.
7. **Approval**: Compliance team sign-off before release.

### Use Cases
- **Analytics datasets**: Anonymize before use in product analytics.
- **ML training data**: Anonymize before model training.
- **Testing/QA**: Anonymize production data for test environments.
- **Data sharing**: Anonymize before sharing with third parties.
- **Public research**: Apply k-anonymity and differential privacy.

---

## Backup Retention

### Backup Schedules

| Backup Type | Frequency | Retention | Storage |
|-------------|-----------|-----------|---------|
| Transaction log backups | Every 5 minutes | 7 days | Hot storage |
| Incremental backups | Daily | 30 days | Hot storage |
| Full backups | Weekly | 90 days | Warm storage |
| Monthly backups | Monthly | 12 months | Cold storage |
| Yearly snapshots | Yearly | 7 years | Archive storage |

### Data Categories in Backups

| Backup Type | Production DB | User Files | Config | Logs |
|-------------|---------------|------------|--------|------|
| Full backup | Yes | Yes | Yes | No |
| Incremental | Yes (changes) | Yes (changes) | No | No |
| Transaction log | Yes | No | No | No |
| Configuration backup | No | No | Yes | No |

### Encryption Requirements
- All backups must be encrypted at rest (AES-256).
- Backup encryption keys stored separately from backup data.
- Key rotation: Every 12 months.
- Backups in transit must use TLS 1.2+.

### Deletion of Backups Containing Deleted User Data
- When a user deletion request is processed, affected backups must be flagged.
- Hard delete from backups at the next applicable rotation cycle.
- Maximum time until deletion from backups: 90 days.
- Maintain a deletion log for audit purposes.

### Backup Testing
- Restore testing: Quarterly for full backups.
- Integrity verification: Weekly for all backups.
- Disaster recovery drill: Annually.
- Document all test results.

---

## Legal Hold Procedures

### When Legal Hold Applies
Legal hold (litigation hold) suspends normal data retention and deletion processes when:
- A legal dispute is reasonably anticipated.
- A regulatory investigation is in progress.
- A government agency has issued a preservation request.
- A data subject has filed a legal claim.

### Initiation Process

| Step | Description | Responsible |
|------|-------------|-------------|
| 1 | Legal hold notice received | Legal counsel |
| 2 | Identify custodians and data scope | Legal + IT |
| 3 | Issue legal hold notification | Legal counsel |
| 4 | Implement technical preservation | IT/Engineering |
| 5 | Acknowledge receipt by custodians | All parties |
| 6 | Periodic reminders (every 90 days) | Legal counsel |

### Technical Implementation
1. **Database preservation**: Snapshot relevant data at hold initiation.
2. **Backup preservation**: Exclude affected data from deletion rotations.
3. **Log preservation**: Archive relevant logs separately.
4. **Access control**: Restrict access to preserved data to authorized personnel only.
5. **Monitoring**: Track access to preserved data.

### Legal Hold Data Handling
- Preserved data must be stored securely with restricted access.
- Data must be preserved in its original format.
- Metadata (creation date, modification date, access logs) must be preserved.
- Encryption keys must be preserved for the hold duration.

### Release of Legal Hold
1. Legal counsel determines hold is no longer necessary.
2. Written release notice issued to all custodians.
3. Technical preservation measures are removed.
4. Data returns to normal retention/deletion schedule.
5. Retention of hold documentation: 5 years after release.

### Documentation
- Legal hold notice and release records.
- List of custodians and data types preserved.
- Technical implementation details.
- Access logs for preserved data.
- Periodic hold review records.

---

## Audit Trails

### Audit Log Requirements

| Event Type | Logged Data | Retention | Access Restriction |
|------------|-------------|-----------|-------------------|
| User authentication | User ID, timestamp, IP, device | 12 months | Security team only |
| Data access | User ID, resource, action, timestamp | 24 months | Security team only |
| Data modification | User ID, record ID, old value, new value | 24 months | Security + Audit |
| Data deletion | User ID, record ID, deletion method | 36 months | Security + Audit |
| Admin actions | Admin ID, action, target, timestamp | 36 months | Security + Audit |
| Permission changes | Changed by, user affected, old/new role | 36 months | Security + Audit |
| Data exports | User ID, exported data scope, timestamp | 24 months | Security + Audit |
| Deletion requests | Request ID, user ID, status, resolution | 36 months | Compliance + Audit |

### Audit Trail Characteristics
- **Immutable**: Logs cannot be modified or deleted (append-only).
- **Tamper-evident**: Cryptographic integrity verification (SHA-256 hashing).
- **Time-synced**: All timestamps from NTP-synchronized sources.
- **Complete**: No gaps in event logging sequences.
- **Searchable**: Indexed for efficient querying.

### Audit Log Storage
- Primary storage: Dedicated secure database (separate from application DB).
- Retention storage: Compressed archive after primary period.
- Backup: Encrypted and stored with other backups.
- Access: Log access requires approval and is itself logged.

### Audit Log Review
| Frequency | Review Type | Responsible |
|-----------|-------------|-------------|
| Daily | Automated anomaly detection | Security team |
| Weekly | Manual review of critical events | Security lead |
| Monthly | Compliance review | Compliance team |
| Quarterly | Audit trail integrity verification | Internal audit |
| Annually | External audit of audit systems | External auditor |

### Compliance Mapping
| Requirement | Audit Trail Evidence |
|-------------|---------------------|
| GDPR Art. 5(2) | Accountability — demonstrate processing activities |
| GDPR Art. 30 | Records of processing activities |
| CCPA | Consumer request tracking |
| Philippines DPA | Data breach detection and notification |
| SOX | Financial data access and modification logs |
| PCI DSS | Access to cardholder data environments |

---

*Last updated: 2025*
*Review cycle: Quarterly*
*Owner: Compliance Team*
