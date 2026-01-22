# Resume-to-Job Matching & Outreach System

**Automated n8n workflow for resume-first job matching and recruiter outreach**

Transform candidate sourcing by making the resume the center of the universe. This system enables recruiters to systematically discover, score, and act on job opportunities that are already a strong fit, with minimal manual effort and maximum signal quality.

---

## 🎯 What This Does

Instead of starting from job postings and searching for candidates, this system:

1. **Starts with a candidate resume** (your anchor)
2. **Scrapes matching jobs** from LinkedIn daily (based on your criteria)
3. **Scores each job** against the resume using deterministic logic
4. **Filters by quality** (Hard Fit, Soft Fit, or No Fit)
5. **Finds hiring decision-makers** (CFOs, Controllers, Finance Managers)
6. **Automatically launches outreach** via email (Instantly.ai) or LinkedIn (HeyReach)
7. **Logs everything** to Google Sheets for full audit trail

---

## ✨ Key Features

- ✅ **Resume-first matching** - Inverted workflow puts candidate at center
- ✅ **Deterministic scoring** - Explainable, auditable match logic (0-100 points)
- ✅ **AI-powered qualification** - Filters out irrelevant jobs before scoring
- ✅ **Smart deduplication** - Never contact same decision-maker twice
- ✅ **Dual-channel outreach** - Email preferred, LinkedIn fallback
- ✅ **Personalized messaging** - AI-generated outreach highlighting exact matches
- ✅ **Full automation** - Runs daily at 6 AM, zero manual work
- ✅ **Complete audit trail** - Every decision logged to Google Sheets
- ✅ **Real-time notifications** - Slack + email summaries after each run

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     DAILY WORKFLOW (6 AM)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. RESUME PROCESSING                                           │
│     • Download PDF from Google Drive                            │
│     • Extract text                                              │
│     • Parse with OpenAI (GPT-4o)                                │
│     • Extract: titles, experience, skills, certs, education     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. JOB SCRAPING                                                │
│     • Read LinkedIn search URLs from Google Sheets              │
│     • Scrape jobs via Apify (LinkedIn Jobs Scraper)             │
│     • Scope: radius-based geography, last 24 hours              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. JOB QUALIFICATION (AI)                                      │
│     • OpenAI filters non-accounting/finance roles               │
│     • Validates job description quality                         │
│     • Extracts requirements: years exp, skills, education       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. DEDUPLICATION CHECK                                         │
│     • Query Google Sheets Jobs Master                           │
│     • Skip jobs already contacted                               │
│     • Prevent duplicate outreach                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. MATCH SCORING ENGINE                                        │
│     • Title match: 30 points                                    │
│     • Years experience: 30 points                               │
│     • Education: 30 points                                      │
│     • Skills: 7 points                                          │
│     • Certifications: 3 points                                  │
│     • Classification: 75-100 = Hard, 50-74 = Soft, <50 = No Fit│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. FIT FILTERING                                               │
│     • Keep: Hard Fits + Soft Fits                               │
│     • Reject: No Fits (log to Rejections sheet)                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. DECISION MAKER DISCOVERY                                    │
│     • LeadMagic enrichment (company name + role)                │
│     • Email verification (valid, not catch-all)                 │
│     • Route: Email (if valid) → Instantly.ai                    │
│     •        LinkedIn (fallback) → HeyReach                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  8. OUTREACH GENERATION (AI)                                    │
│     • OpenAI GPT-4o generates personalized message              │
│     • Highlights: job requirements ↔ resume qualifications      │
│     • Format: Subject + body + match highlights                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  9. AUTOMATED OUTREACH                                          │
│     • Email: Instantly.ai API (add lead to campaign)            │
│     • LinkedIn: HeyReach API (queue message)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  10. LOGGING & NOTIFICATIONS                                    │
│     • Update Google Sheets (Jobs Master, Outreach Log)          │
│     • Generate summary report                                   │
│     • Send Slack notification                                   │
│     • Send email summary                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧮 Scoring Methodology

### Match Score Calculation (0-100 points)

| Dimension | Weight | Scoring Logic |
|-----------|--------|---------------|
| **Title Match** | 30 pts | Exact match: 30 pts<br>Close variation: 25 pts<br>Avoid title: 0 pts (auto-reject) |
| **Years Experience** | 30 pts | Proportional scoring based on min requirement<br>Must meet minimum threshold |
| **Education** | 30 pts | Meets requirement: 30 pts<br>Does not meet: 0 pts |
| **Skills** | 7 pts | Partial match: Proportional scoring<br>All required: Must match all for 7 pts |
| **Certifications** | 3 pts | Proportional based on matched vs required |

### Classification Thresholds

- **75-100 points:** 🔥 **Hard Fit** - Excellent match, high priority
- **50-74 points:** ✅ **Soft Fit** - Good match, worth pursuing
- **0-49 points:** ❌ **No Fit** - Rejected, logged for reference

---

## 📁 File Structure

```
n8n-resume-job-matching/
├── README.md                          # This file - overview and quick start
├── SETUP_GUIDE.md                     # Complete setup instructions
├── TESTING_CHECKLIST.md               # Step-by-step testing validation
├── GOOGLE_SHEETS_STRUCTURE.md         # Google Sheets template and columns
├── workflow-resume-job-matching.json  # n8n workflow (import this!)
└── examples/
    ├── sample-campaign-config.csv     # Example campaign configuration
    ├── sample-linkedin-urls.csv       # Example LinkedIn search URLs
    └── sample-outreach-message.txt    # Example generated outreach
```

---

## 🚀 Quick Start

### 1. Prerequisites

Ensure you have:
- [ ] n8n instance (self-hosted or cloud)
- [ ] Google Cloud Platform (Sheets + Drive API enabled)
- [ ] OpenAI API key (GPT-4o access)
- [ ] Apify account (LinkedIn Jobs Scraper)
- [ ] LeadMagic API key
- [ ] Instantly.ai account + campaign
- [ ] HeyReach account + campaign
- [ ] Slack workspace (for notifications)

### 2. Setup Google Sheets

1. Create new Google Sheet: `Resume Job Matching - [Campaign Name]`
2. Add 5 tabs: `Campaign Config`, `URLs`, `Jobs Master`, `Outreach Log`, `Rejections`
3. Follow structure in `GOOGLE_SHEETS_STRUCTURE.md`
4. Fill in Campaign Config with your criteria
5. Add LinkedIn search URLs to URLs tab
6. Share with Google Service Account

### 3. Import Workflow

1. Open n8n
2. Click "+" → "Import from File"
3. Select `workflow-resume-job-matching.json`
4. Configure all credentials
5. Set environment variables (see `SETUP_GUIDE.md`)

### 4. Test Execution

1. Follow `TESTING_CHECKLIST.md` step-by-step
2. Start with Test #1 (Resume Processing)
3. Progressively enable nodes through Test #10
4. Validate all outputs before production

### 5. Enable Daily Automation

1. Verify Schedule Trigger is set to `0 6 * * *` (6 AM daily)
2. Activate workflow
3. Monitor first execution closely
4. Review Slack/email summary

---

## 📋 Configuration Example

### Campaign Config (Google Sheets)

| Field | Example Value |
|-------|---------------|
| campaign_id | `CAMP_001` |
| campaign_name | `John Doe - Senior Accountant NYC` |
| resume_file_id | `1a2b3c4d5e6f...` (from Google Drive) |
| required_titles | `Accountant, Senior Accountant, Financial Analyst` |
| avoid_titles | `Staff Accountant, Junior Accountant` |
| required_skills | `Excel, QuickBooks, Financial Reporting, GAAP` |
| skills_match_type | `partial` or `all` |
| min_years_experience | `5` |
| required_education | `Bachelor's Degree in Accounting` |
| required_certifications | `CPA` |
| city | `New York` |
| radius_miles | `25` |
| status | `active` |

### LinkedIn Search URLs

```
https://www.linkedin.com/jobs/search/?keywords=Senior%20Accountant&location=New%20York%2C%20NY&distance=25&f_TPR=r86400

Parameters:
- keywords: Senior%20Accountant
- location: New%20York%2C%20NY
- distance: 25 (miles)
- f_TPR: r86400 (past 24 hours)
```

---

## 🔧 Customization

### Adjust Scoring Weights

Edit `Calculate Match Score` node JavaScript:

```javascript
// Default weights (total 100 points):
breakdown.title = { score: 30, ... };       // Adjust title importance
breakdown.experience = { score: 30, ... };  // Adjust experience importance
breakdown.education = { score: 30, ... };   // Adjust education importance
breakdown.skills = { score: 7, ... };       // Adjust skills importance
breakdown.certifications = { score: 3, ... }; // Adjust certifications importance
```

### Modify Classification Thresholds

```javascript
// Current thresholds:
if (score >= 75) classification = 'Hard Fit';
else if (score >= 50) classification = 'Soft Fit';
else classification = 'No Fit';

// Adjust to be more/less strict:
if (score >= 80) classification = 'Hard Fit';  // Stricter
else if (score >= 60) classification = 'Soft Fit';
```

### Customize Outreach Messaging

Edit `Generate Outreach Message (AI)` node prompt:

```
Tone: Professional, concise, value-focused
Length: 150-200 words max

Modify to:
- Change tone (casual, formal, urgent)
- Adjust length
- Add/remove sections
- Include specific CTAs
```

---

## 📊 Sample Output

### Daily Summary (Slack)

```
🎯 Resume-to-Job Matching Summary

Campaign: John Doe - Senior Accountant NYC
Date: 2026-01-22

Jobs Processed:
• Total Scraped: 47
• Qualified: 32
• New Jobs: 28

Match Classification:
• 🔥 Hard Fits: 8
• ✅ Soft Fits: 12
• ❌ Rejections: 8

Outreach Sent:
• Total: 20
• 📧 Emails: 15
• 💼 LinkedIn: 5

Top 5 Matches:
• Acme Corp - Senior Accountant (87/100 - Hard Fit)
• TechFinance Inc - Financial Analyst (82/100 - Hard Fit)
• Global Accounting - Staff Accountant (78/100 - Hard Fit)
• Finance Solutions - Senior Accountant (75/100 - Hard Fit)
• Corporate Finance - Accountant (68/100 - Soft Fit)

✅ Workflow completed successfully
```

### Sample Outreach Message

```
Subject: Experienced CPA for Your Senior Accountant Role

Hi Jane,

I saw you're hiring for a Senior Accountant at Acme Corp, and your posting
specifically mentioned requirements for Excel, QuickBooks, and GAAP expertise
with 5+ years of experience.

I have a candidate who's a perfect fit:
• 7 years of accounting experience in corporate finance
• CPA certified with Bachelor's in Accounting
• Expert in Excel, QuickBooks, and GAAP financial reporting
• Proven track record at Fortune 500 companies

This is a strong match (87/100 score based on your requirements).

Mind if I send you their resume? If it looks like a good fit, we can schedule
a brief call to discuss.

Best regards,
[Your Name]
```

---

## 💰 Cost Estimates

Based on 1 campaign processing 1,000 jobs/month:

| Service | Usage | Monthly Cost |
|---------|-------|--------------|
| **OpenAI** | Resume parsing + qualification + outreach | $40-60 |
| **Apify** | 1,000 jobs scraped | $50-100 |
| **LeadMagic** | 200 enrichments | $20-50 |
| **Instantly.ai** | 150 emails | $30-50 |
| **HeyReach** | 50 LinkedIn messages | $25-50 |
| **Total** | | **$165-310/month** |

**Cost optimization tips:**
- Use `gpt-4o-mini` for qualification/scoring (cheaper)
- Batch Apify scrapes (limit maxItems)
- Cache resume parsing (parse once, reuse)
- Set daily outreach limits

---

## 🛠️ Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| No jobs scraped | Invalid LinkedIn URL or Apify error | Verify URL format, check Apify console |
| All jobs rejected | Scoring too strict | Lower thresholds, adjust required_titles |
| Resume not parsing | PDF issues or OpenAI error | Check file format, verify API key |
| No decision makers | LeadMagic rate limit or wrong company | Check API quota, verify company names |
| Duplicate outreach | Deduplication not working | Clear Jobs Master, verify job_id logic |
| Outreach not sending | API credentials invalid | Test Instantly/HeyReach APIs manually |

See `TESTING_CHECKLIST.md` section "❌ If Failed" for detailed troubleshooting.

---

## 📚 Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Complete setup instructions with API configuration
- **[TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)** - 10-step testing validation process
- **[GOOGLE_SHEETS_STRUCTURE.md](GOOGLE_SHEETS_STRUCTURE.md)** - Sheet templates and column definitions

---

## 🔒 Security & Best Practices

1. **API Keys:**
   - Never commit API keys to git
   - Use n8n environment variables
   - Rotate keys quarterly

2. **Google Service Account:**
   - Grant minimum required permissions
   - Audit access logs monthly
   - Use separate account per campaign (optional)

3. **Outreach Safety:**
   - Test campaigns before production
   - Set daily send limits
   - Monitor reply rates and unsubscribes
   - Respect CAN-SPAM and GDPR

4. **Data Privacy:**
   - Secure resume storage
   - Don't log sensitive candidate data
   - Clear old data periodically

---

## 🎓 Learning Resources

- **n8n Documentation:** https://docs.n8n.io
- **OpenAI API Docs:** https://platform.openai.com/docs
- **Apify Platform:** https://docs.apify.com
- **LeadMagic API:** https://docs.leadmagic.io
- **Instantly.ai API:** https://instantly.ai/app/api
- **HeyReach Docs:** https://heyreach.io/docs

---

## 🤝 Support

**Issues or questions?**
1. Check `TROUBLESHOOTING` section above
2. Review `TESTING_CHECKLIST.md` for validation steps
3. Consult `SETUP_GUIDE.md` for configuration details
4. Review n8n execution logs for errors

---

## 📈 Success Metrics to Track

**Weekly KPIs:**
- Jobs scraped per day (target: 30-50)
- Hard Fits per day (target: 5-10)
- Outreach sent per day (target: 10-20)
- Decision maker discovery rate (target: 80%+)

**Monthly KPIs:**
- Outreach reply rate (track in CRM)
- Interview conversion rate
- Placement rate
- Cost per outreach
- Time saved vs manual sourcing

---

## 🚀 Scaling & Next Steps

### One Campaign → Multiple Campaigns

1. Duplicate workflow for each candidate
2. Rename workflow: `Resume Matching - [Name]`
3. Create separate Google Sheet per campaign
4. Update environment variables (unique Sheet IDs)
5. Stagger schedules (avoid API rate limits)

### Advanced Features (Future Enhancements)

- **Multi-resume support:** Loop through folder of resumes
- **ATS integration:** Auto-submit to Greenhouse/Lever
- **Interview scheduling:** Calendar booking for interested candidates
- **Performance tracking:** Reply rate → interview → placement funnel
- **A/B testing:** Test multiple outreach message variants
- **Salary matching:** Filter jobs by salary range

---

## 📝 License

This workflow is provided as-is for internal use. Please review terms of service for all third-party APIs used (OpenAI, Apify, LeadMagic, Instantly.ai, HeyReach).

---

## 🎉 Get Started

Ready to deploy? Follow these steps:

1. ✅ Read this README (you're here!)
2. ✅ Review `GOOGLE_SHEETS_STRUCTURE.md` and create your sheet
3. ✅ Follow `SETUP_GUIDE.md` step-by-step
4. ✅ Import `workflow-resume-job-matching.json` into n8n
5. ✅ Complete all tests in `TESTING_CHECKLIST.md`
6. ✅ Enable daily schedule and activate workflow
7. 🚀 Monitor first run and iterate!

**Questions?** Start with `SETUP_GUIDE.md` → `TESTING_CHECKLIST.md` → Troubleshooting section above.

---

**Built with:** n8n, OpenAI, Apify, LeadMagic, Instantly.ai, HeyReach, Google Workspace

**Last Updated:** January 22, 2026
