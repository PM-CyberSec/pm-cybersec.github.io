## Full Report

### Investigation Timeline

| Phase | Activity | Evidence collected |
|---|---|---|
| 1. Baseline | Captured 24 hours of normal authentication and Kerberos traffic | Event IDs 4624, 4768, 4769, 4776 |
| 2. Enumeration | Mapped users, groups, and SPN accounts with BloodHound | Attack-path graph, shortest path to Domain Admin |
| 3. Kerberoasting | Requested RC4 service tickets for SPN accounts with Impacket and Rubeus | Event ID 4769 on the domain controller |
| 4. Cracking | Cracked extracted tickets offline with Hashcat | Recovered plaintext for a weak service account |
| 5. Pass-the-Hash | Replayed the NTLM hash against an SMB share | Event ID 4624 (Type 3, NTLM) and 4776 on the DC |
| 6. Detection | Authored and tuned Sigma, Splunk, and Wazuh rules | Rule hits replayed against captured logs |

### Detection Engineering

#### Kerberoasting — Event ID 4769

Kerberoasting requests a Kerberos service ticket (TGS) for an account with a registered service principal name, then cracks the ticket offline. The request is legitimate protocol traffic, so detection depends on context: the encryption type, ticket options, account, and request volume.

- **Primary signal:** Event ID **4769** (`A Kerberos service ticket was requested`) on the domain controller.
- **Supporting fields:** `TicketEncryptionType = 0x17` (RC4), `Status = 0x0`, and a `ServiceName` that is not a machine account (`$`) or `krbtgt`.
- **Correlation:** Several distinct service names requested by one account within a short window is a stronger signal than a single event.
- **Tuning:** Modern environments may still use RC4 for legacy applications; baseline which accounts and services legitimately request RC4 before alerting.

#### Pass-the-Hash — Event IDs 4624 and 4776

Pass-the-Hash authenticates with a captured NTLM hash instead of a plaintext password. The network logon itself can look normal, so correlate the logon type, authentication package, and credential validation on the domain controller.

- **Primary signal:** Event ID **4624** with `LogonType = 3` (network) and `AuthenticationPackageName = NTLM`.
- **Supporting signal:** Event ID **4776** (`The computer attempted to validate the credentials for an account`) on the domain controller.
- **Context:** NTLM network logons from workstations that normally use Kerberos, or from unusual source hosts, are high-value alerts.
- **Tuning:** Track NTLM usage per host and exclude known legacy systems and vulnerability scanners.

### MITRE ATT&CK Mapping

| Technique | ID | Description |
|---|---|---|
| Pass the Hash | T1550.002 | Use captured NTLM hashes for authentication |
| Kerberoasting | T1558.003 | Request RC4 TGS tickets for offline cracking |
| Remote Services: SMB / Windows Admin Shares | T1021.002 | Lateral movement over SMB |

### Detection Rules

Published rule files: [Sigma (Kerberoasting)](https://github.com/PM-CyberSec/pm-cybersec.github.io/blob/main/detections/kerberoasting-sigma.yml) · [Splunk (Kerberoasting)](https://github.com/PM-CyberSec/pm-cybersec.github.io/blob/main/detections/kerberoasting-splunk.spl) · [Wazuh (Kerberoasting)](https://github.com/PM-CyberSec/pm-cybersec.github.io/blob/main/detections/kerberoasting-wazuh.xml) · [Sigma (Pass-the-Hash)](https://github.com/PM-CyberSec/pm-cybersec.github.io/blob/main/detections/pass-the-hash-sigma.yml)

#### Kerberoasting — Sigma

```yaml
title: Potential Kerberoasting - RC4 Service Ticket Request
id: 3f1b8c52-7d0e-4a6f-9b21-5e8a4c7d1a90
status: experimental
description: Detects Kerberos service ticket requests using RC4 encryption for non-machine, non-krbtgt services.
logsource:
  product: windows
  service: security
detection:
  selection:
    EventID: 4769
    TicketEncryptionType: '0x17'
    Status: '0x0'
  filter_machine_accounts:
    ServiceName|endswith: '$'
  filter_krbtgt:
    ServiceName: 'krbtgt'
  condition: selection and not 1 of filter_*
falsepositives:
  - Legacy applications that still require RC4
level: medium
tags:
  - attack.credential_access
  - attack.t1558.003
```

#### Kerberoasting — Splunk

```spl
index=wineventlog source="WinEventLog:Security" EventCode=4769
  Ticket_Encryption_Type=0x17 Service_Name!="*$" Service_Name!="krbtgt"
| bin _time span=10m
| stats dc(Service_Name) AS distinct_spns, count BY _time, Account_Name, Client_Address
| where distinct_spns > 5
```

The threshold of 5 distinct SPNs per account in 10 minutes is a starting point; tune it against the lab baseline.

#### Kerberoasting — Wazuh

```xml
<group name="windows,kerberos,attack,">
  <rule id="100100" level="10">
    <if_group>windows</if_group>
    <field name="win.system.eventID">^4769$</field>
    <field name="win.eventdata.ticketEncryptionType">^0x17$</field>
    <field name="win.eventdata.status">^0x0$</field>
    <field name="win.eventdata.serviceName" negate="yes">\$$|krbtgt</field>
    <description>Possible Kerberoasting: RC4 service ticket requested</description>
    <mitre>
      <id>T1558.003</id>
    </mitre>
  </rule>
</group>
```

Place the rule in `/var/ossec/etc/rules/local_rules.xml` and validate with `wazuh-logtest` before restarting the manager.

#### Pass-the-Hash — Sigma

```yaml
title: Potential Pass-the-Hash - NTLM Network Logon
id: b7a94e10-2c3d-4f58-8a16-9d0e6b4f2c71
status: experimental
description: Detects network logons authenticated via NTLM with a zero key length, a pattern common to replayed hashes.
logsource:
  product: windows
  service: security
detection:
  selection:
    EventID: 4624
    LogonType: 3
    LogonProcessName: 'NtLmSsp'
    AuthenticationPackageName: 'NTLM'
    KeyLength: 0
  filter_anonymous:
    TargetUserName: 'ANONYMOUS LOGON'
  filter_machine:
    TargetUserName|endswith: '$'
  condition: selection and not 1 of filter_*
falsepositives:
  - Legitimate NTLM use by older systems and some admin tools
level: medium
tags:
  - attack.lateral_movement
  - attack.t1550.002
```

This rule is noisy on its own. Pair it with context such as a user logging on from a workstation they never normally use, or one account appearing on many hosts in a short time.

### Rule Validation

- Replayed the captured logs against each rule to confirm the true positives fired only on the simulated attack window.
- Used the 24-hour baseline to measure false positives; RC4 requests for machine accounts and known legacy services were filtered.
- Documented thresholds for the Splunk correlation search (more than 10 requests or more than 5 distinct services per account/IP in 10 minutes) and flagged them for review rather than automatic blocking.
- Limitations: results come from an isolated lab with a small user population; production thresholds should be tuned against a longer baseline.

### Tools Used

- **BloodHound**: AD enumeration and attack-path visualization
- **Wireshark**: Network traffic capture and analysis
- **Impacket**: Kerberoasting and Pass-the-Hash execution
- **Rubeus**: Kerberos interaction and ticket manipulation
- **Hashcat**: Offline ticket cracking

### Outcome

Built an AD security monitoring checklist covering:

- Detection rules for lateral movement indicators in Sigma, Splunk, and Wazuh
- Log sources and event IDs to monitor for each technique
- Alert thresholds for abnormal authentication patterns
- Validation notes and tuning guidance for production deployment
