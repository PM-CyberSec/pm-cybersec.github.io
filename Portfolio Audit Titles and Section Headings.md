# Portfolio Audit: Titles and Section Headings

Review of pm-cybersec.github.io/portfolio-site, covering page titles, section headings, and structure. Based on the home page, the CyberNest SOAR project page, and the AD Lateral Movement investigation.

## Summary

The titles and sections are mostly enough for readability, but not yet for search and first impressions. The structure is clean and conventional, which is good. The wording is generic in a few places, and there are a couple of real issues.

## Page titles (`<title>`)

| Page | Current | Verdict |
| --- | --- | --- |
| Home | Paula Maged · Cybersecurity Student | Fine, but misses your focus keywords |
| CyberNest | CyberNest SOAR · Projects | Name only, no descriptor |
| AD investigation | Active Directory Lateral Movement · Investigations | Good |
| Blog post | SOC Lab Env | Too vague and abbreviated |

Titles should say what the page is and who it's by, in about 50-60 characters. Suggested rewrites:

- Home: `Paula Maged · SOC & Blue Team Cybersecurity Student`
- CyberNest: `CyberNest SOAR · Open-Source Security Orchestration Platform`
- AD: `AD Lateral Movement: Kerberoasting & Pass-the-Hash Detection`
- Blog: `Building an Isolated SOC Lab Environment`

The home page title matters most. Someone searching your name will find you regardless, but "SOC" or "Blue Team" in the title helps when a recruiter shares or bookmarks the tab.

## Section headings

Home page sections: How I Approach Security, Security Profile, Technical Stack, Work & Education, Certifications & Learning, Featured Projects, Recent Investigations, Latest Articles, Let's connect. These are clear, but there are some issues.

### What works

- "Featured Projects" and "Recent Investigations" are clear and scannable.
- The CyberNest page's Problem → Approach → Results structure is excellent. It's how a case study should read.
- The AD page follows Scenario → Objective → Environment → Findings → Outcome, which is also strong.

### What to improve

1. **Duplicate H1s on the AD page.** It has "Active Directory Lateral Movement" as the page heading, then "Active Directory Lateral Movement Investigation" again as another top-level heading in the Full Report tab. A page should have one H1. Demote the second to an H2 or remove it.
2. **Overview and Full Report repeat each other.** Summary, objective, environment, findings, tools, and outcome appear twice, nearly word for word. Either make the Full Report add depth (log excerpts, screenshots, rules, timeline) or drop the tab. Right now it signals thin content.
3. **"Work & Education" mixes things.** Your university sits inside the same list as internships. Splitting into "Experience" and "Education" is the format recruiters and ATS-style skimmers expect, and it lets you put the internships first.
4. **"Technical Stack" is a developer term.** For a blue-team profile, "Tools & Technologies" or "Security Toolkit" fits better. Minor.
5. **"How I Approach Security" is just seven words in a row.** It's a nice visual, but a one-line explanation under it ("I treat every alert as a loop: observe, investigate...") would give it substance.
6. **Section order buries your best work.** Visitors scroll through profile, stack, experience, and certifications before reaching projects and investigations. Consider: Hero → Featured Projects → Investigations → Experience → Skills → Certifications → Blog. Most recruiters decide in the first screen or two, and your projects are stronger than your certification list.
7. **"Let's connect" is generic.** Add a specific call to action, for example "Open to SOC analyst and blue team internships. Email me."

## Small things

- Section labels like "APPROACH," "PROFILE," "TOOLKIT" appear as small eyebrow text above each heading. That's a nice design touch, but make sure the real heading (not the eyebrow) is the `<h2>`, so screen readers and search engines read the meaningful one.
- The hero's "CYBERSECURITY STUDENT" is styled like a heading. If it's an `<h2>`, it's competing with your section headings. A `<p>` is more appropriate.
- Placeholder text ("No process steps documented yet") in a heading-level section is worse than no section at all.

## Next steps

- Rewrite titles for all pages using the suggestions above.
- Fix the duplicate H1 and the Overview / Full Report duplication on investigation pages.
- Split Experience and Education, and reorder the home page so projects come first.
- Remove or fill the "No process steps documented yet" placeholder.
