# Portfolio Audit: Code and Content Fixes

Fixes for pm-cybersec.github.io/portfolio-site, excluding page titles and section headings (covered in the separate titles report). Your stack isn't visible from the fetched pages, so the front-end snippets are written for React with `react-helmet-async` and for plain HTML. Adapt them to your setup.

## Priority order

1. Correct the technical errors in the AD investigation (Event ID, ATT&CK IDs).
2. Publish real detection rules (Sigma, Wazuh, Splunk).
3. Fix per-page canonical and Open Graph tags.
4. Remove the visible placeholder and fix the typo.
5. Header accessibility, heading semantics, and the duplicate H1.
6. Add a CV link and structured data.

## 1. Technical corrections in the AD investigation

These are content errors a SOC interviewer would notice.

| Where | Current | Fix |
| --- | --- | --- |
| Kerberoasting detection line | `TGS-4624 events` | **Event ID 4769** (Kerberos service ticket requested) |
| Kerberoasting ATT&CK ID | `T1558` | **T1558.003** (Steal or Forge Kerberos Tickets: Kerberoasting) |
| Remote Services row | `T1021.002`, "SMB/WinRM" | T1021.002 is SMB/Windows Admin Shares only. WinRM is **T1021.006** |
| Pass-the-Hash source events | NTLM "anomalies" in DC logs | Be specific: **4624** with LogonType 3 and NTLM, plus 4776 on the DC |

Suggested replacement text for the Kerberoasting finding:

```text
Detection: Alert on Event ID 4769 where Ticket Encryption Type is 0x17 (RC4),
the service is not a machine account or krbtgt, and a single account requests
tickets for many distinct SPNs in a short window.
```

Suggested replacement for the ATT&CK table:

```markdown
| Technique        | ID         | Description                                   |
| ---------------- | ---------- | --------------------------------------------- |
| Pass the Hash    | T1550.002  | Use captured NTLM hashes for authentication   |
| Kerberoasting    | T1558.003  | Request TGS tickets for offline cracking      |
| SMB/Admin Shares | T1021.002  | Lateral movement via SMB                      |
| WinRM            | T1021.006  | Lateral movement via Windows Remote Management|
```

If WinRM was not actually used in your lab, drop that row instead of adding it.

## 2. Detection rules to publish

The page says you built detection rules and SIEM queries but shows none. Add these as code blocks on the page and as files in a public repo (for example `detections/` with one file per technique). Test each in your lab before publishing, and note the lab results next to it.

### 2.1 Kerberoasting: Sigma

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

### 2.2 Kerberoasting: Splunk (volume threshold)

```spl
index=wineventlog source="WinEventLog:Security" EventCode=4769
  Ticket_Encryption_Type=0x17 Service_Name!="*$" Service_Name!="krbtgt"
| bin _time span=10m
| stats dc(Service_Name) AS distinct_spns, count BY _time, Account_Name, Client_Address
| where distinct_spns > 5
```

The threshold of 5 is a starting point. Tune it against your lab baseline and say so on the page.

### 2.3 Kerberoasting: Wazuh rule

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

Place it in `/var/ossec/etc/rules/local_rules.xml` and validate with `wazuh-logtest` before restarting the manager. Field names depend on your decoder, so confirm them against a real alert.

### 2.4 Pass-the-Hash: Sigma

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

## 3. Per-page canonical and Open Graph tags

Currently every subpage declares the homepage as its canonical URL and `og:url`. Fix with a single reusable component so the values are derived from the page path.

### 3.1 React with react-helmet-async

```jsx
// components/SEO.jsx
import { Helmet } from 'react-helmet-async';

const SITE = 'https://pm-cybersec.github.io/portfolio-site';
const DEFAULT_IMAGE = `${SITE}/og/default.png`;

export default function SEO({ title, description, path = '/', image = DEFAULT_IMAGE }) {
  const url = `${SITE}${path.endsWith('/') ? path : path + '/'}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
  );
}
```

Usage on a project page:

```jsx
<SEO
  title="CyberNest SOAR"
  description="Open-source SOAR platform integrating SIEM, EDR, and NDR telemetry."
  path="/projects/cybernest-soar"
  image={`${SITE}/og/cybernest-soar.png`}
/>
```

### 3.2 Plain HTML

```html
<link rel="canonical" href="https://pm-cybersec.github.io/portfolio-site/projects/cybernest-soar/">
<meta property="og:url" content="https://pm-cybersec.github.io/portfolio-site/projects/cybernest-soar/">
<meta property="og:image" content="https://pm-cybersec.github.io/portfolio-site/og/cybernest-soar.png">
```

### 3.3 Rules

- Use absolute URLs and lowercase `pm-cybersec` everywhere, matching the URL actually served.
- Keep the trailing slash consistent with how GitHub Pages serves each route.
- Make `og:image` about 1200×630 px.
- Tags must be in the HTML the server sends. LinkedIn and most social crawlers do not run JavaScript. Check with View Page Source, and prerender if they are missing.

### 3.4 Verify

```bash
curl -s https://pm-cybersec.github.io/portfolio-site/projects/cybernest-soar/ | grep -iE 'canonical|og:url|og:image'
```

Also test a subpage in the LinkedIn Post Inspector and in Google Search Console URL Inspection (compare user-declared and Google-selected canonical).

## 4. Placeholder and typo

**Hide the empty "Building Process" section** on CyberNest until it has content:

```jsx
{project.process?.length > 0 && (
  <section>
    <h2>Building Process</h2>
    {/* render steps */}
  </section>
)}
```

**Typo:** change `analyszed` to `analyzed` in the CyberNest metrics.

**Unexplained metrics:** add a caption under "219K events analyzed, 350 alerts generated, 90% accuracy" stating the dataset, what accuracy measures, and the baseline. If you can't explain them, remove them.

## 5. Header accessibility and semantics

The header currently renders raw URLs as link text and shows a stray "SOC" label. Use readable labels and accessible names:

```html
<a href="https://github.com/PM-CyberSec" aria-label="GitHub profile" rel="noopener">GitHub</a>
<a href="https://linkedin.com/in/paulamaged" aria-label="LinkedIn profile" rel="noopener">LinkedIn</a>
```

If the links are icon-only, keep the visible text off but retain `aria-label`.

**Eyebrow labels versus real headings.** The small labels (APPROACH, PROFILE, TOOLKIT) should not be the headings. Keep the meaningful text as the heading:

```html
<p class="eyebrow">TOOLKIT</p>
<h2>Technical Stack</h2>
```

**Hero subtitle.** "CYBERSECURITY STUDENT" should be a paragraph, not a heading, so it doesn't compete with section headings:

```html
<h1>Paula Maged</h1>
<p class="hero-role">Cybersecurity Student</p>
```

**Duplicate H1 on investigation pages.** The Full Report tab repeats the page title as a second top-level heading. Demote it:

```html
<!-- before -->
<h1>Active Directory Lateral Movement Investigation</h1>
<!-- after -->
<h2>Full Report</h2>
```

## 6. CV link and structured data

**CV button in the hero** (place the PDF at `/portfolio-site/Paula-Maged-CV.pdf`):

```html
<a class="btn" href="/portfolio-site/Paula-Maged-CV.pdf" download>Download CV</a>
```

**Person structured data** (optional, helps search engines connect your profiles). Add once in the home page head:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Paula Maged",
  "jobTitle": "Cybersecurity Student",
  "url": "https://pm-cybersec.github.io/portfolio-site/",
  "sameAs": [
    "https://github.com/PM-CyberSec",
    "https://linkedin.com/in/paulamaged"
  ],
  "alumniOf": "El Sewedy University of Technology (SUTech)"
}
</script>
```

## 7. Checklist

- [ ] Event ID 4769 and T1558.003 corrected on the AD page
- [ ] T1021.002 / T1021.006 description fixed
- [ ] Sigma, Wazuh, and Splunk rules added and tested in the lab
- [ ] Rules published in a public repo and linked from the investigation
- [ ] Per-page canonical and `og:url` in the served HTML
- [ ] Per-page or default branded `og:image`
- [ ] Lowercase URL casing consistent
- [ ] Empty Building Process section hidden
- [ ] Typo fixed and metrics explained
- [ ] Header links have readable labels and `aria-label`s
- [ ] Eyebrow text is a `<p>`, real heading is the `<h2>`
- [ ] One H1 per page
- [ ] CV PDF linked in the hero
