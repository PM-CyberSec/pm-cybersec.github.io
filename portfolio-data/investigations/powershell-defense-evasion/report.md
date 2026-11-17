## Full Report

### Investigation Timeline

| Phase | Activity | Evidence collected |
|---|---|---|
| 1. Baseline | Captured normal PowerShell usage and logging coverage | Event IDs 4104, 4103, 4688 |
| 2. Obfuscation | Ran encoded and obfuscated commands in the lab | Script block text with base64 and string concatenation |
| 3. AMSI bypass | Tested AMSI bypass techniques in a controlled VM | Script block content referencing `amsiInitFailed` / `AmsiUtils` |
| 4. Detection | Validated which log sources captured each technique | Sysmon event data, PowerShell operational logs |
| 5. Tuning | Documented thresholds and exclusions for legitimate admin scripts | Baseline of approved scripts and service accounts |

### Detection Engineering

#### AMSI Bypass (T1562.001)

AMSI bypasses are usually performed in memory, so file-based signatures are unreliable. The durable signal is the script content that attempts to disable or patch AMSI.

- **Primary source:** PowerShell Script Block Logging, Event ID **4104**.
- **Content indicators:** references to `amsiInitFailed`, `AmsiUtils`, `amsiContext`, or patching of `System.Management.Automation`.
- **Supporting source:** Windows Defender operational logs (Event IDs **1116** / **1117**) when the bypass is accompanied by malware detection.
- **Tuning:** Security tooling and some admin scripts reference AMSI legitimately; baseline approved script hashes and signing status.

#### Obfuscated PowerShell (T1059.001)

Obfuscation hides intent in encoded commands, string concatenation, and dynamic invocation. Logging must capture the script content, not only the process name.

- **Primary source:** Script Block Logging, Event ID **4104** (captures the deobfuscated block in many cases).
- **Supporting sources:** Module Logging (Event ID **4103**), process creation (Event ID **4688**), and Sysmon Event ID **1** for the command line.
- **Command-line indicators:** `-EncodedCommand` / `-enc`, `-nop`, `-w hidden`, `-ExecutionPolicy Bypass`, `IEX`, `Invoke-Expression`, `DownloadString`, and `Net.WebClient`.
- **Content indicators:** long base64 blobs, high-entropy strings, and heavy use of `+` concatenation or `-join`.
- **Tuning:** Package managers, deployment tools, and monitoring agents may use encoded commands; exclude known signed binaries and maintain an allowlist of administrative scripts.

### MITRE ATT&CK Mapping

| Technique | ID | Description |
|---|---|---|
| PowerShell | T1059.001 | Command and scripting interpreter |
| Impair Defenses: Disable or Modify Tools | T1562.001 | AMSI bypass and security tool tampering |

### Detection Recommendations

1. Enable PowerShell Script Block Logging (Event ID **4104**) through Group Policy and forward the logs to the SIEM.
2. Enable PowerShell Module Logging (Event ID **4103**) for module-level visibility.
3. Deploy Sysmon with process creation (Event ID 1) and image/command-line logging.
4. Alert on encoded command flags (`-enc`, `-EncodedCommand`), download cradles, and `Invoke-Expression` patterns.
5. Correlate AMSI-related script content with Defender events and process ancestry rather than alerting on a single keyword.
6. Tune against a baseline of approved administrative scripts and service accounts before enabling automatic response.

### Outcome

Created a detection playbook including:

- Sysmon configuration for PowerShell process and script monitoring
- Detection queries for Wazuh and Splunk
- Alert thresholds for suspicious PowerShell activity
- Documentation of each evasion technique and its detection method
- Tuning guidance to reduce noise from legitimate administrative scripts
