# Incident Response Plan

## Table of Contents
1. [Purpose and Scope](#purpose-and-scope)
2. [Severity Levels](#severity-levels)
3. [Response Team](#response-team)
4. [Detection Procedures](#detection-procedures)
5. [Containment Strategies](#containment-strategies)
6. [Eradication Steps](#eradication-steps)
7. [Recovery Process](#recovery-process)
8. [Post-Mortem Process](#post-mortem-process)
9. [Communication Plan](#communication-plan)
10. [Regulatory Notification Timeline](#regulatory-notification-timeline)
11. [Plan Maintenance and Testing](#plan-maintenance-and-testing)

---

## Purpose and Scope

### Purpose
This Incident Response Plan (IRP) defines the procedures for detecting, responding to, and recovering from security incidents affecting the organization's information systems, user data, and infrastructure.

### Scope
This plan applies to:
- All production, staging, and development environments.
- All company-managed endpoints, servers, and network devices.
- All third-party services and data processors handling company or user data.
- All employees, contractors, and agents with access to company systems.
- All data classifications (public, internal, confidential, restricted).

### Incident Classification
An **incident** is any event that:
1. Compromises the confidentiality, integrity, or availability of information systems or data.
2. Violates security policies, laws, or regulatory requirements.
3. Indicates attempted or successful unauthorized access.
4. Results in data loss, data exposure, or service disruption.

### Incident vs. Event
- **Event**: Any observable occurrence in a system (may or may not be security-relevant).
- **Incident**: An event that negatively affects information security or violates policy.

---

## Severity Levels

### Severity Classification Matrix

| Severity | Level | Impact | Response Time | Escalation |
|----------|-------|--------|---------------|------------|
| **SEV-1** | Critical | Severe business impact, data breach, system compromise, legal/regulatory implications | Immediate (15 min) | VP/C-suite |
| **SEV-2** | High | Significant impact to a major system or user data, potential data exposure | Within 1 hour | Director/VP |
| **SEV-3** | Medium | Limited impact, isolated systems, no data exposure, minor service degradation | Within 4 hours | Team lead |
| **SEV-4** | Low | Minimal impact, informational, potential issues identified | Within 24 hours | Engineering team |
| **SEV-5** | Informational | No impact, security awareness, routine findings | Next business day | Assigned team |

### SEV-1 — Critical

**Criteria** (any of the following):
- Confirmed data breach involving personal data (any volume).
- Active ransomware or malware outbreak affecting production systems.
- Unauthorized access to production infrastructure (SSO, database, cloud console).
- Service-wide outage affecting all users.
- Payment system compromise.
- Law enforcement or regulatory notification received.

**Response requirements**:
- On-call responder: Immediate.
- Incident commander assigned: Within 15 minutes.
- War room established: Within 30 minutes.
- Initial containment: Within 1 hour.
- Regulatory notification assessment: Within 24 hours.

### SEV-2 — High

**Criteria** (any of the following):
- Suspected data breach (unconfirmed).
- Phishing attack affecting multiple employees.
- Vulnerability exploitation in production (no confirmed data access).
- Degraded service for a significant subset of users.
- Credential compromise of privileged accounts.
- DDoS attack causing service impairment.

**Response requirements**:
- On-call responder: Within 30 minutes.
- Incident commander assigned: Within 1 hour.
- Initial containment: Within 4 hours.
- Investigation initiated: Within 4 hours.

### SEV-3 — Medium

**Criteria** (any of the following):
- Isolated malware infection on a single endpoint.
- Policy violation by employee (non-critical).
- Vulnerability identified (not yet exploited).
- Non-critical service degradation.
- Account lockout or brute force attempt detected.

**Response requirements**:
- Assigned responder: Within 4 hours.
- Investigation: Within 8 hours.
- Remediation: Within 3 business days.

### SEV-4 — Low

**Criteria**:
- Failed login attempts (below threshold).
- Suspicious network scan.
- Spam/phishing reported but contained.
- Minor configuration drift.

**Response requirements**:
- Assigned responder: Within 24 hours.
- Remediation: Within 7 business days.

### SEV-5 — Informational

**Criteria**:
- Security awareness observations.
- Penetration testing findings (low risk).
- Routine security audit items.
- Security tool alerts that are false positives.

**Response requirements**:
- Assigned: Next business day.
- Remediation: Within 30 days (or next sprint).

---

## Response Team

### Incident Response Team Structure

| Role | Responsibility | Primary | Backup |
|------|----------------|---------|--------|
| **Incident Commander (IC)** | Overall coordination, decision-making, stakeholder communication | Security Lead | Engineering Director |
| **Technical Lead** | Technical investigation, containment, eradication | Senior Engineer | DevOps Lead |
| **Communications Lead** | Internal/external communications, regulatory notifications | PR/Communications | Legal Counsel |
| **Legal Counsel** | Legal guidance, regulatory compliance, privilege | General Counsel | External Counsel |
| **Security Analyst** | Log analysis, evidence collection, forensic examination | Security Engineer | SOC Analyst |
| **System Administrator** | System access, configuration changes, backups | DevOps Engineer | IT Manager |
| **Scribe** | Incident timeline, documentation, evidence preservation | Designated team member | Administrative support |

### Team Activation

| Severity | Team Activation | Method |
|----------|----------------|--------|
| SEV-1 | Full team activation | Phone call + incident channel |
| SEV-2 | Core team activation | Incident channel + on-call escalation |
| SEV-3 | Assigned team members | Incident channel |
| SEV-4 | Engineering team | Ticket assignment |
| SEV-5 | Security team | Ticket assignment |

### On-Call Rotation
- Primary on-call: 24/7 coverage via PagerDuty/OpsGenie.
- Escalation path: Primary → Secondary → Security Lead.
- Handoff: Daily at 09:00 local time.
- Weekly rotation schedule published 30 days in advance.

### Communication Channels
| Channel | Purpose | Access |
|---------|---------|--------|
| #incident-response | Real-time incident coordination | Response team only |
| #incident-status | Status updates for wider organization | All employees |
| War room (video call) | Active incident collaboration | Response team |
| Email notification | Formal notification and documentation | Per distribution list |
| Phone bridge | Critical incident voice communication | Response team |

---

## Detection Procedures

### Detection Sources

| Source | Description | Tools / Methods |
|--------|-------------|-----------------|
| **SIEM** | Centralized log analysis, correlation rules | Splunk, ELK, Sentinel, Sumo Logic |
| **IDS/IPS** | Network intrusion detection | Snort, Suricata, AWS GuardDuty |
| **EDR** | Endpoint detection and response | CrowdStrike, SentinelOne, Defender ATP |
| **Vulnerability Scanner** | Automated vulnerability discovery | Qualys, Rapid7, Nessus |
| **Cloud Security Posture** | Cloud configuration monitoring | AWS Config, CSPM tools |
| **User Reports** | Employee-reported suspicious activity | Email, Slack, ticketing system |
| **Automated Alerts** | Threshold-based alerting | Prometheus, Datadog, custom scripts |
| **Threat Intelligence** | External threat feeds | MISP, VirusTotal, ISAC feeds |
| **Penetration Testing** | Manual/professional security testing | Quarterly external, monthly internal |
| **Bug Bounty Program** | External researcher reporting | HackerOne, Bugcrowd |

### Alert Triage Process

1. **Alert received**: Automated or manual.
2. **Initial assessment** (within 15 minutes for automated alerts):
   - Is this a true positive or false positive?
   - What is the potential severity?
   - What systems or data are affected?
3. **Categorization**: Assign incident type and severity.
4. **Prioritization**: Determine response priority.
5. **Assignment**: Assign to appropriate responder.
6. **Escalation** (if needed): Escalate based on severity.

### Incident Types

| Type | Description | Example |
|------|-------------|---------|
| **Data Breach** | Unauthorized access to personal data | Attacker exfiltrates database |
| **Malware / Ransomware** | Malicious software infection | Encrypted file system |
| **Phishing** | Social engineering attack | Credential harvesting email |
| **Account Compromise** | Unauthorized account access | Stolen credentials used to log in |
| **DDoS** | Distributed denial of service | Traffic flood causing outage |
| **Insider Threat** | Employee misuse of access | Data download before resignation |
| **Physical Breach** | Physical access to facilities | Server room unauthorized entry |
| **Zero-Day Exploit** | Previously unknown vulnerability | CVE with no available patch |
| **Policy Violation** | Non-malicious policy breach | Storing data in unauthorized location |
| **Third-Party Breach** | Vendor/partner security incident | Service provider data exposure |

### Detection Escalation Matrix
| Detected By | Initial Action | Escalate To |
|-------------|---------------|-------------|
| Automated tool | Assess alert, create incident ticket | Security analyst |
| User report | Gather initial details, create ticket | Security team |
| Third party | Verify with source, start investigation | Security lead |
| Regulatory body | Legal counsel notification, preserve evidence | Legal + Security lead |

---

## Containment Strategies

### Immediate Containment (First Hour)

#### SEV-1 / SEV-2 Containment Actions

1. **Isolate affected systems**:
   - Disconnect affected servers from network (remove from load balancer, block at firewall).
   - Disable compromised user accounts.
   - Revoke API keys and rotate tokens.
   - Block external access to affected services.

2. **Preserve evidence**:
   - Take forensic images of affected systems (if feasible before isolation).
   - Capture memory dumps.
   - Snapshot affected cloud instances.
   - Preserve logs before they rotate.

3. **Stop the bleeding**:
   - Block attacker IP addresses at the perimeter.
   - Disable compromised authentication methods.
   - Force password resets for affected accounts.
   - Enable additional logging if needed.

### Short-Term Containment (First 4 Hours)

1. **Network containment**:
   - Implement network segmentation to isolate affected zones.
   - Deploy additional firewall rules.
   - Enable DDoS mitigation.

2. **System containment**:
   - Apply emergency patches if vulnerability is known.
   - Disable unnecessary services on affected systems.
   - Restore from clean backup to isolated environment.

3. **Access containment**:
   - Review and revoke excessive permissions.
   - Enable multi-factor authentication (MFA) where not already enabled.
   - Implement temporary access restrictions.

### Containment by Incident Type

| Incident Type | Primary Containment | Secondary Containment |
|---------------|---------------------|----------------------|
| **Data Breach** | Isolate compromised system, block attacker | Rotate credentials, tighten access controls |
| **Ransomware** | Disconnect infected systems from network | Identify patient zero, scan lateral movement |
| **Phishing** | Block phishing domain/email, alert employees | Force password reset for affected users |
| **Account Compromise** | Disable compromised account | Review account activity for abuse |
| **DDoS** | Enable DDoS mitigation, blackhole traffic | Scale infrastructure, engage upstream provider |
| **Insider Threat** | Revoke access, preserve evidence | Interview witness, secure physical assets |

### Containment Decision Framework
When deciding on containment actions, consider:
1. **Impact on users**: Will containment cause service disruption?
2. **Evidence preservation**: Will containment destroy forensic evidence?
3. **Legal considerations**: Are there legal holds or regulatory requirements?
4. **Business continuity**: What is the operational impact of containment?
5. **Speed vs. thoroughness**: Is immediate action needed to prevent further harm?

---

## Eradication Steps

### Root Cause Analysis
1. **Determine how the incident occurred**:
   - Review logs, alerts, and forensic evidence.
   - Identify the initial access vector.
   - Map the attack timeline.
   - Identify all affected systems and data.

2. **Identify all indicators of compromise (IOCs)**:
   - IP addresses, domains, URLs.
   - File hashes, registry keys.
   - Malware signatures.
   - Network artifacts.

3. **Assess the full scope**:
   - Which systems were accessed?
   - What data was viewed, modified, or exfiltrated?
   - How long was the attacker present?
   - Are there any backdoors or persistence mechanisms?

### Eradication Actions

1. **Remove malicious artifacts**:
   - Delete malware, backdoors, and unauthorized accounts.
   - Remove persistence mechanisms (cron jobs, startup items, registry keys).
   - Clean compromised files and databases.

2. **Patch vulnerabilities**:
   - Apply security patches for exploited vulnerabilities.
   - Update software to non-vulnerable versions.
   - Reconfigure misconfigured services.

3. **Rebuild affected systems**:
   - Wipe and rebuild compromised servers from clean images.
   - Restore data from verified clean backups.
   - Verify integrity of restored systems.

4. **Update security controls**:
   - Add detection rules for identified IOCs.
   - Deploy additional monitoring for affected systems.
   - Update firewall rules and access controls.
   - Improve logging and alerting.

### Eradication Verification
- Run vulnerability scanner on affected systems.
- Verify anti-malware scans return clean results.
- Confirm no unauthorized accounts or processes.
- Validate that patches are properly applied.
- Monitor for recurrence of IOCs.

### Eradication by Incident Type

| Incident Type | Primary Eradication | Verification |
|---------------|---------------------|--------------|
| **Data Breach** | Close access vector, remove backdoors | Full audit of system access |
| **Ransomware** | Full system rebuild from clean backup | File integrity checks |
| **Phishing** | Remove phishing infrastructure | Employee awareness training |
| **Account Compromise** | Revoke and reissue credentials | Review account audit logs |
| **Insider Threat** | Remove access, terminate employment | Access review |
| **Malware** | Full system scan, rebuild if persistent | Continuous monitoring |

---

## Recovery Process

### Recovery Phases

#### Phase 1: Validation (Pre-Recovery)
- Confirm eradication is complete.
- Verify backups are clean.
- Test restored systems in isolation.
- Obtain approval from incident commander.
- Document rollback plan.

#### Phase 2: Restoration
- Bring systems back online in priority order:
  1. Authentication and identity systems.
  2. Core application services.
  3. Data storage and databases.
  4. Supporting services (monitoring, logging).
  5. Non-critical systems.
- Restore data from clean backups.
- Apply configuration changes.

#### Phase 3: Monitoring (Post-Recovery)
- **Active monitoring period**: 72 hours minimum for SEV-1/SEV-2.
- Monitor for:
  - Recurrence of IOCs.
  - Unusual system behavior.
  - Access pattern anomalies.
  - Performance degradation.
- Maintain enhanced logging during monitoring period.

#### Phase 4: Normalization
- Return to standard operations.
- Remove temporary access restrictions (if appropriate).
- Disable emergency monitoring (transition to standard).
- Close incident ticket.

### Recovery Approval Gates

| Gate | Criteria | Approver |
|------|----------|----------|
| **G1: Ready to recover** | Eradication verified, system rebuilt, backups confirmed clean | Technical Lead |
| **G2: Recovery in progress** | Systems restored, data verified | Incident Commander |
| **G3: Service live** | User-facing services operational | Product/Engineering Director |
| **G4: Monitoring complete** | 72-hour monitoring period passed, no recurrence | Security Lead |
| **G5: Incident closed** | Post-mortem complete, findings implemented | VP Engineering |

### Rollback Plan
Each recovery step must have a rollback plan:
- **What triggers rollback?** (e.g., service degradation > 10%, data integrity issues)
- **Rollback procedure**: Steps to revert to previous state.
- **Rollback testing**: How to verify rollback was successful.
- **Communication**: Who needs to be notified of rollback.

---

## Post-Mortem Process

### Post-Mortem Objectives
1. Identify root cause and contributing factors.
2. Document what went well and what went wrong.
3. Define corrective actions to prevent recurrence.
4. Improve detection and response capabilities.
5. Share learnings across the organization.

### Post-Mortem Schedule

| Severity | Post-Mortem Timeline | Participants |
|----------|---------------------|--------------|
| SEV-1 | Within 5 business days | Full response team, relevant stakeholders |
| SEV-2 | Within 10 business days | Response team, engineering lead |
| SEV-3 | Within 20 business days | Assigned team |
| SEV-4/5 | As part of sprint retrospective | Engineering team |

### Post-Mortem Template

```
## Post-Mortem: [Incident Title]

**Date**: [Date]
**Incident ID**: [IR-YYYY-NNN]
**Severity**: [SEV-1 to SEV-5]
**Duration**: [Start time] to [End time] ([duration])
**Report Author**: [Name]

### Summary
[Brief description of what happened and impact]

### Timeline
| Time (UTC) | Event |
|------------|-------|
| HH:MM | [Event description] |
| HH:MM | [Event description] |

### Root Cause
[Description of the underlying cause]

### Contributing Factors
- [Factor 1]
- [Factor 2]

### Impact
- **Users affected**: [Number]
- **Data affected**: [Description]
- **Service downtime**: [Duration]
- **Financial impact**: [Estimated cost]

### What Went Well
- [Item 1]
- [Item 2]

### What Went Wrong
- [Item 1]
- [Item 2]

### Corrective Actions
| # | Action | Owner | Due Date | Status |
|---|--------|-------|----------|--------|
| 1 | [Action description] | [Name] | [Date] | [Open/Closed] |
| 2 | [Action description] | [Name] | [Date] | [Open/Closed] |

### Lessons Learned
[Key takeaways for the organization]

### Appendices
- [Link to incident timeline]
- [Link to evidence artifacts]
- [Link to communication log]
```

### Post-Mortem Best Practices
- **Blameless**: Focus on systemic issues, not individual mistakes.
- **Data-driven**: Base findings on evidence, not assumptions.
- **Action-oriented**: Every finding should have a corresponding action item.
- **Measurable**: Action items should have clear success criteria.
- **Tracked**: Action items tracked to completion.
- **Shared**: Learnings communicated across the organization.

### Corrective Action Tracking

| Status | Definition |
|--------|------------|
| Open | Action identified, not yet started |
| In Progress | Work underway |
| Verified | Implementation verified by security team |
| Closed | Action completed and accepted |
| Deferred | Action postponed (requires re-evaluation) |

---

## Communication Plan

### Communication Principles
1. **Timeliness**: Communicate as soon as possible with verified information.
2. **Accuracy**: Only share confirmed facts; avoid speculation.
3. **Consistency**: Single source of truth; coordinate all external messaging.
4. **Compliance**: Meet all regulatory communication requirements.
5. **Empathy**: Acknowledge impact on users and stakeholders.

### Internal Communications

#### Response Team Communications
| Purpose | Channel | Frequency |
|---------|---------|-----------|
| Real-time coordination | #incident-response (Slack) | Continuous |
| Status updates | #incident-status (Slack) | Every 30 minutes (SEV-1/2) |
| Voice coordination | War room phone bridge | As needed |
| Formal updates | Email to response team | At shift change |

#### Executive Communications

| Audience | Trigger | Content | Sender |
|----------|---------|---------|--------|
| VP Engineering | SEV-1/2 declared | Incident summary, impact, response status | Incident Commander |
| CEO/Board | SEV-1, data breach, regulatory impact | Business impact, regulatory risk, media strategy | VP Engineering |
| Legal | Any potential legal/regulatory impact | Incident details, data affected, notification obligations | Incident Commander |
| PR/Communications | Any potential public visibility | Facts to share, media response plan | Incident Commander |

#### Employee Communications

| Message Type | Trigger | Content | Channel |
|-------------|---------|---------|---------|
| Initial alert | SEV-1 declared | Brief acknowledgment, avoid speculation | #general, email |
| Status update | Every 2 hours (SEV-1), every 8 hours (SEV-2) | What happened, current status, user impact | Email |
| All-clear | Incident resolved | Resolution summary, user actions needed (if any) | Email, #general |
| Full report | Post-mortem completed | What happened, why, what we're doing about it | Email, all-hands |

### External Communications

#### User Communications

| Scenario | Timeline | Content | Channel |
|----------|----------|---------|---------|
| Service disruption | Within 30 minutes of detection | Service status, expected resolution time | Status page, in-app notification |
| Data breach (regulatory) | Per regulatory timeline (see Section 10) | As required by law | Email, in-app notification |
| Data breach (proactive) | As soon as verified | What happened, what data, what users should do | Email, blog post |
| Security advisory | After patches available | Vulnerability, risk, recommended actions | Email, blog post |

#### Media Communications
- **Spokesperson**: Single designated spokesperson (PR lead or executive).
- **Press release**: Prepared for SEV-1 incidents with public visibility.
- **Social media**: Pre-approved statements only; no speculation.
- **Inquiries**: All media inquiries directed to PR/Communications.

#### Third-Party Communications

| Party | Trigger | Content | Sender |
|-------|---------|---------|--------|
| Data processors | Breach involving their systems | Incident details, actions needed | Incident Commander |
| Service providers | Service impacting their systems | Incident details, expected impact | Engineering |
| Partners/Integrators | Breach affecting shared data | Incident details, data scope | Legal + Business |
| Insurance | SEV-1 or potential claim | Incident notification | Legal |
| Law enforcement | Criminal activity | Investigation request | Legal + Security |

### Communication Templates

#### Initial SEV-1 Alert (Internal)
```
INCIDENT ALERT: [IR-YYYY-NNN] - [Brief Title]
Severity: SEV-1
Detected: [Timestamp UTC]
Status: Active / Containing / Investigating

Summary: [2-3 sentence description]

Impact: [Affected systems, users, data]

Actions: [What is being done]

Next update: [Time]

Response channel: #incident-response
Incident Commander: [Name]
```

#### User Breach Notification
```
Subject: Important Security Notice Regarding Your [App] Account

Dear [User Name],

[Company] is writing to inform you of a security incident that may affect your account information.

What happened:
[Brief description of the incident]

What information was involved:
[Types of data affected]

What we are doing:
[Steps taken to address the incident]

What you should do:
[Recommended actions for the user]

For more information:
[Contact details, FAQ link]

We apologize for any concern this may cause. Your privacy and security are important to us.

Sincerely,
[Company Name]
```

---

## Regulatory Notification Timeline

### Notification Requirements by Regulation

#### GDPR (Article 33-34)
| Notification | Timeline | To Whom | Trigger |
|-------------|----------|---------|---------|
| Breach notification | Within 72 hours of awareness | Supervisory authority | Personal data breach |
| Data subject notification | Without undue delay | Affected data subjects | High risk to rights/freedoms |
| Documentation | At time of breach | Internal records | All breaches (including non-notifiable) |

#### CCPA/CPRA
| Notification | Timeline | To Whom | Trigger |
|-------------|----------|---------|---------|
| Breach notification | Without undue delay | California residents | Unencrypted personal information |
| AG notification | Same as consumer notice | California Attorney General | Breach of 500+ residents |

#### Philippines Data Privacy Act (RA 10173)
| Notification | Timeline | To Whom | Trigger |
|-------------|----------|---------|---------|
| Breach notification | Within 72 hours of knowledge | National Privacy Commission (NPC) | Personal data breach |
| Data subject notification | Within 72 hours of knowledge | Affected data subjects | Likely to cause substantial harm |

#### Other Notifications

| Regulation | Timeline | To Whom | Trigger |
|------------|----------|---------|---------|
| PCI DSS | Within 24 hours | Acquiring bank, card brands | Cardholder data compromise |
| UK DPA 2018 | Within 72 hours | ICO | Personal data breach |
| LGPD (Brazil) | Within 72 hours | ANPD | Personal data breach |
| PIPEDA (Canada) | As soon as feasible | OPC, affected individuals | Real risk of significant harm |

### Regulatory Notification Decision Matrix

| Question | Yes | No |
|----------|-----|-----|
| Is personal data involved? | Identify regulation(s) | May not require notification |
| Is the data encrypted/rendered unintelligible? | Likely no notification required | Notification required |
| Is there high risk to data subjects? | Notify data subjects | May not need to notify data subjects |
| Are there legal hold/regulatory obligations? | Notify regardless of risk | Follow standard process |
| Was the breach of sensitive data? | Expedite notification | Standard timeline |

### Notification Preparation Checklist

- [ ] Identify all applicable regulations and supervisory authorities.
- [ ] Determine notification timeline for each.
- [ ] Prepare notification content with legal counsel.
- [ ] Identify affected data subjects (contact information).
- [ ] Establish communication channel for notifications.
- [ ] Verify notification delivery (read receipts, delivery confirmation).
- [ ] Prepare FAQ for data subjects.
- [ ] Set up call center or response team for inquiries.
- [ ] Document all notification actions for compliance.

### Notification Content Requirements (General)

| Element | Description |
|---------|-------------|
| Nature of the breach | What happened, when it occurred, when it was discovered |
| Data involved | Categories and approximate number of data subjects and records |
| Contact information | DPO or responsible contact person |
| Likely consequences | Potential impact on data subjects |
| Mitigation measures | Actions taken or proposed to address the breach |
| Recommendations | Steps affected individuals should take |

---

## Plan Maintenance and Testing

### Review Cycle

| Activity | Frequency | Responsible |
|----------|-----------|-------------|
| Plan review | Quarterly | Security Lead |
| Plan update | Semi-annually | Security + Legal |
| Regulatory update | As regulations change | Legal |
| Contact roster update | Monthly | Security Lead |
| Tool integration review | Quarterly | Engineering |

### Testing Schedule

| Exercise Type | Frequency | Scope | Participants |
|---------------|-----------|-------|--------------|
| Tabletop exercise | Quarterly | Discussion-based scenario | Response team |
| Functional drill | Semi-annually | Simulated incident, live tools | Response team + Engineering |
| Full simulation | Annually | End-to-end incident response, including notifications | Full organization |
| Unannounced drill | Annually | Realistic surprise test | Response team |

### Tabletop Exercise Scenarios

1. **Phishing attack** leading to account compromise.
2. **Ransomware** affecting production database.
3. **Cloud account compromise** with data exfiltration.
4. **Insider threat** — employee downloading user data.
5. **Third-party breach** affecting shared infrastructure.
6. **DDoS attack** causing extended service outage.
7. **Physical breach** of data center or office.

### Exercise Evaluation
- Document exercise results and observations.
- Measure: time to detect, time to respond, communication effectiveness.
- Identify gaps in tools, processes, or training.
- Update plan based on findings.
- Track improvement over time.

### Training Requirements

| Role | Training Type | Frequency |
|------|---------------|-----------|
| All employees | Security awareness training | Annually |
| Engineering team | Incident response training | Annually |
| Response team | Incident response drills | Semi-annually |
| Incident Commander | Incident command training | Annually |
| Communications lead | Crisis communication training | Annually |

### Continuous Improvement

| Source of Improvement | Process |
|-----------------------|---------|
| Post-mortem findings | Track corrective actions to closure |
| Exercise results | Update plan, tools, and procedures |
| Industry incidents | Review and adopt relevant lessons |
| New regulations | Update notification and compliance procedures |
| New technology | Integrate new tools and systems |
| Staff changes | Update contact rosters and roles |

---

*Last updated: 2025*
*Review cycle: Quarterly*
*Owner: Security Team*
