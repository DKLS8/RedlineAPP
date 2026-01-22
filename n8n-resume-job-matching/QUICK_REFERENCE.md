# Quick Reference Guide

**One-page reference for Resume-to-Job Matching System**

---

## 📁 File Guide

| File | When to Use |
|------|-------------|
| **README.md** | 📖 First read - system overview |
| **IMPLEMENTATION_SUMMARY.md** | 📊 Project summary & deployment checklist |
| **SETUP_GUIDE.md** | 🔧 Step-by-step setup instructions |
| **TESTING_CHECKLIST.md** | ✅ Test validation (do before going live) |
| **GOOGLE_SHEETS_STRUCTURE.md** | 📊 Sheet templates & column definitions |
| **workflow-resume-job-matching.json** | 🔄 Import this into n8n |
| **.env.template** | 🔐 Copy to .env, fill in API keys |

---

## ⚡ 5-Minute Setup Path

1. **Google Sheets:** Create sheet → 5 tabs → add headers → fill Campaign Config
2. **APIs:** Get keys for OpenAI, Apify, LeadMagic, Instantly, HeyReach
3. **n8n:** Import workflow → add credentials → set env vars
4. **Test:** Run Test #1 (resume) → Test #6 (full flow)
5. **Deploy:** Enable schedule → activate workflow

---

## 🎯 Core Workflow Flow

```
Resume PDF
  → Parse (OpenAI)
  → Scrape Jobs (LinkedIn/Apify)
  → Qualify (AI filter)
  → Score (0-100 points)
  → Find Contact (LeadMagic)
  → Generate Message (AI)
  → Send (Email/LinkedIn)
  → Log (Google Sheets)
  → Notify (Slack/Email)
```

---

## 📊 Scoring Cheat Sheet

| Dimension | Points | Key Logic |
|-----------|--------|-----------|
| Title | 30 | Exact=30, Close=25, Avoid=0 |
| Experience | 30 | Must meet minimum |
| Education | 30 | Binary: meets or doesn't |
| Skills | 7 | Partial or all required |
| Certifications | 3 | Proportional match |

**Classifications:**
- 75-100 = 🔥 Hard Fit
- 50-74 = ✅ Soft Fit
- <50 = ❌ No Fit

---

## 🔑 Required API Keys

1. **OpenAI** → https://platform.openai.com/api-keys
2. **Apify** → https://console.apify.com/account/integrations
3. **LeadMagic** → https://app.leadmagic.io/settings/api
4. **Instantly.ai** → https://app.instantly.ai/app/settings/integrations
5. **HeyReach** → https://app.heyreach.io/settings/api
6. **Slack** → https://api.slack.com/messaging/webhooks
7. **Google Cloud** → Service Account JSON

---

## 📋 Google Sheets Template

**5 Required Tabs:**

1. **Campaign Config** - Search criteria & requirements
2. **URLs** - LinkedIn search URLs (1 per row)
3. **Jobs Master** - All scraped jobs (auto-populated)
4. **Outreach Log** - Sent messages (auto-populated)
5. **Rejections** - No Fits (auto-populated)

**Only fill in:** Campaign Config (row 2) + URLs (all rows)

---

## 🧪 Testing Order

1. Resume Processing ✓
2. Job Scraping ✓
3. Job Qualification & Scoring ✓
4. Decision Maker Discovery ✓
5. Outreach Generation ✓
6. Outreach Sending (CAREFUL!) ⚠️
7. Data Logging ✓
8. Notifications ✓
9. Full End-to-End ✓
10. Schedule Trigger ✓

**Time:** 2-3 hours total

---

## 🚨 Common Errors

| Error | Fix |
|-------|-----|
| No jobs scraped | Check LinkedIn URL, Apify quota |
| All jobs rejected | Lower scoring threshold in Campaign Config |
| Resume parse fail | Verify PDF format, OpenAI quota |
| Duplicate outreach | Clear Jobs Master, check dedup logic |
| Email not sending | Verify Instantly campaign ID |

---

## 💰 Cost Summary

**Per Campaign (1,000 jobs/month):**
- OpenAI: $40-60
- Apify: $50-100
- LeadMagic: $20-50
- Instantly.ai: $30-50
- HeyReach: $25-50
- **Total: $165-310/month**

**Cost per outreach: ~$8-15**

---

## 🔄 Daily Operations

**Automated (6 AM):**
- Workflow runs automatically
- Scrapes jobs, scores, sends outreach
- Logs to Google Sheets
- Sends Slack + email summary

**Manual (5 min/day):**
- Review Slack summary
- Check top matches in Google Sheets

**Weekly (15 min):**
- Analyze rejection reasons
- Tune scoring if needed
- Update LinkedIn URLs

---

## 🎛️ Key Customization Points

**Campaign Config (Google Sheets):**
- `required_titles` - Jobs to match
- `avoid_titles` - Jobs to reject
- `skills_match_type` - partial or all
- `min_years_experience` - Minimum threshold

**Scoring Logic (n8n node):**
- Adjust weights (title, exp, education)
- Change thresholds (75/50)

**Outreach Message (n8n node):**
- Edit AI prompt
- Change tone/length/style

---

## 🔐 Environment Variables

**Must Set:**
```bash
GOOGLE_SHEET_ID=...
OPENAI_API_KEY=sk-...
APIFY_API_KEY=apify_api_...
APIFY_LINKEDIN_SCRAPER_ID=...
LEADMAGIC_API_KEY=lm_...
INSTANTLY_API_KEY=...
INSTANTLY_CAMPAIGN_ID=...
HEYREACH_API_KEY=...
HEYREACH_CAMPAIGN_ID=...
SLACK_CHANNEL=#recruitment
NOTIFICATION_EMAIL_TO=...
```

---

## 📧 Outreach Channels

**Priority 1: Email (Instantly.ai)**
- Used when valid email found
- Not catch-all
- Verified by LeadMagic

**Priority 2: LinkedIn (HeyReach)**
- Fallback when no email
- Queues message in campaign
- Manual connection request needed

---

## 🎯 Success Metrics

**Daily:**
- Jobs scraped: 30-50
- Hard Fits: 3-8
- Outreach sent: 10-20

**Weekly:**
- ~100 messages sent
- ~20-30 Hard Fits identified

**Quality:**
- Decision maker discovery: 80%+
- Outreach personalized: 100%
- Match score accuracy: Manual validation

---

## 🛠️ Troubleshooting Quick Links

- **Resume issues** → TESTING_CHECKLIST.md Test #1
- **Scraping issues** → TESTING_CHECKLIST.md Test #2
- **Scoring issues** → TESTING_CHECKLIST.md Test #3
- **Outreach issues** → TESTING_CHECKLIST.md Test #6
- **Setup issues** → SETUP_GUIDE.md Troubleshooting section

---

## 📱 Support Resources

- n8n Docs: https://docs.n8n.io
- OpenAI API: https://platform.openai.com/docs
- Apify: https://docs.apify.com
- LeadMagic: https://docs.leadmagic.io

---

## ✅ Pre-Launch Checklist

- [ ] Google Sheets created (5 tabs)
- [ ] Campaign Config filled in
- [ ] LinkedIn URLs added
- [ ] Resume uploaded to Drive
- [ ] All API keys obtained
- [ ] .env configured
- [ ] Workflow imported to n8n
- [ ] All credentials configured
- [ ] Tests 1-10 passed
- [ ] Schedule set to 6 AM
- [ ] Workflow activated

---

## 🚀 Launch Day

1. **Morning:** Verify workflow activated
2. **6 AM:** Workflow runs automatically
3. **6:30 AM:** Check Slack for summary
4. **Review:** Google Sheets for results
5. **Validate:** Sample 3-5 outreach messages
6. **Monitor:** Check for any errors

---

## 📞 Quick Help

**Question:** Where do I start?
**Answer:** Read README.md, then SETUP_GUIDE.md

**Question:** Workflow imported, now what?
**Answer:** Follow TESTING_CHECKLIST.md step-by-step

**Question:** How do I customize scoring?
**Answer:** Edit "Calculate Match Score" node JavaScript

**Question:** Outreach messages too generic?
**Answer:** Edit "Generate Outreach Message" prompt

**Question:** Want to add more job sources?
**Answer:** Add URLs to Google Sheets "URLs" tab

**Question:** How do I scale to multiple candidates?
**Answer:** Duplicate workflow, create new Google Sheet per campaign

---

## 🎓 Skill Requirements

**To Deploy (No Coding):**
- Copy/paste into n8n ✓
- Fill out Google Sheets ✓
- Get API keys ✓

**To Customize (Basic Coding):**
- JavaScript for scoring logic
- Prompt engineering for AI
- Understanding of HTTP requests

---

**This is your one-page reference. For deep dives, see the full documentation.**

**Last Updated:** January 22, 2026
