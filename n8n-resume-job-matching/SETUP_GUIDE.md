# Setup Guide: Resume-to-Job Matching & Outreach System

Complete setup instructions for deploying the n8n workflow.

---

## Prerequisites

### Required Accounts & API Keys

1. **Google Cloud Platform**
   - Enable Google Sheets API
   - Enable Google Drive API
   - Create Service Account with JSON credentials
   - Share Google Sheet and Drive folder with service account email

2. **OpenAI**
   - API key with GPT-4o access
   - Recommended models: `gpt-4o` (resume parsing, outreach), `gpt-4o-mini` (qualification, scoring)

3. **Apify**
   - Account with LinkedIn Jobs Scraper actor
   - Actor ID: `[You need to find and configure LinkedIn scraper]`
   - Recommended: https://apify.com/actors/linkedin-jobs-scraper

4. **LeadMagic**
   - API key for ICPs and Email Finder
   - Documentation: https://docs.leadmagic.io

5. **Instantly.ai**
   - API key
   - Campaign ID (create a campaign first)
   - Documentation: https://instantly.ai/app/api

6. **HeyReach**
   - API key
   - Campaign ID (create a LinkedIn campaign first)
   - Documentation: https://heyreach.io/docs

7. **Slack** (for notifications)
   - Webhook URL or Bot Token
   - Channel ID

8. **Email/SMTP** (for notifications)
   - SMTP credentials or email service API

---

## Step 1: Google Sheets Setup

1. **Create New Google Sheet**
   ```
   Name: Resume Job Matching - [Campaign Name]
   ```

2. **Create 5 Tabs:**
   - Campaign Config
   - URLs
   - Jobs Master
   - Outreach Log
   - Rejections

3. **Add Column Headers** (see `GOOGLE_SHEETS_STRUCTURE.md` for exact columns)

4. **Fill Campaign Config (Row 2):**
   ```
   campaign_id: CAMP_001
   campaign_name: John Doe - Senior Accountant
   resume_file_id: [Google Drive file ID from URL]
   resume_file_path: https://drive.google.com/file/d/[FILE_ID]/view
   required_titles: Accountant, Senior Accountant, Financial Analyst
   avoid_titles: Staff Accountant, Junior Accountant
   required_skills: Excel, QuickBooks, Financial Reporting, GAAP
   skills_match_type: partial
   min_years_experience: 5
   required_education: Bachelor's Degree in Accounting
   required_certifications: CPA
   city: New York
   radius_miles: 25
   status: active
   created_date: 2026-01-22
   last_run_date:
   ```

5. **Fill URLs Sheet:**
   Add LinkedIn search URLs (one per row):
   ```
   Example URL:
   https://www.linkedin.com/jobs/search/?keywords=Senior%20Accountant&location=New%20York%2C%20NY&distance=25&f_TPR=r86400

   f_TPR=r86400 means jobs posted in last 24 hours
   ```

6. **Get Sheet ID from URL:**
   ```
   https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
   ```

7. **Share with Service Account:**
   - Share with Editor permissions
   - Service account email: `[your-sa]@[project].iam.gserviceaccount.com`

---

## Step 2: Google Drive Setup

1. **Create Resume Folder**
   ```
   Name: Resumes - [Campaign Name]
   ```

2. **Upload Resume PDF**
   - Must be PDF format
   - Get file ID from URL: `https://drive.google.com/file/d/[FILE_ID]/view`

3. **Share Folder with Service Account**
   - Viewer permissions minimum

---

## Step 3: n8n Environment Variables

Create `.env` file or configure in n8n Settings > Variables:

```bash
# Google
GOOGLE_SHEET_ID=your_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-sa@project.iam.gserviceaccount.com

# OpenAI
OPENAI_API_KEY=sk-...

# Apify
APIFY_API_KEY=apify_api_...
APIFY_LINKEDIN_SCRAPER_ID=actor_id_here

# LeadMagic
LEADMAGIC_API_KEY=lm_...

# Instantly.ai
INSTANTLY_API_KEY=...
INSTANTLY_CAMPAIGN_ID=...

# HeyReach
HEYREACH_API_KEY=...
HEYREACH_CAMPAIGN_ID=...

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SLACK_CHANNEL=#recruitment-alerts

# Email Notifications
NOTIFICATION_EMAIL_FROM=noreply@yourcompany.com
NOTIFICATION_EMAIL_TO=your@email.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_password
```

---

## Step 4: n8n Credentials Setup

### 1. Google Sheets API
- Type: Google Sheets OAuth2 API
- Upload Service Account JSON
- Test connection

### 2. Google Drive API
- Type: Google Drive OAuth2 API
- Use same Service Account JSON
- Test connection

### 3. OpenAI API
- Type: OpenAI API
- API Key: From OpenAI dashboard
- Organization (optional)

### 4. Apify API
- Type: Apify API
- API Token: From Apify account settings

### 5. LeadMagic API (Custom HTTP Header)
- Type: Header Auth
- Name: `Authorization`
- Value: `Bearer YOUR_LEADMAGIC_API_KEY`

### 6. Instantly.ai API (Custom)
- Type: Generic Credential
- Configure in HTTP Request nodes directly

### 7. HeyReach API (Custom)
- Type: Generic Credential
- Configure in HTTP Request nodes directly

### 8. Slack API
- Type: Slack OAuth2 API
- Connect workspace
- Select channel

### 9. SMTP (Email)
- Type: SMTP
- Host, Port, User, Password from your email provider

---

## Step 5: Import Workflow

1. **Open n8n**
   ```
   http://localhost:5678 (or your n8n instance)
   ```

2. **Import Workflow**
   - Click "+" → Import from File
   - Select `workflow-resume-job-matching.json`
   - Or paste JSON directly

3. **Configure Credentials**
   - Click each node with red warning icon
   - Select appropriate credential
   - Test connections

4. **Verify Environment Variables**
   - Settings → Variables
   - Ensure all variables are set correctly

---

## Step 6: LinkedIn Search URL Configuration

### How to Create LinkedIn Search URLs:

1. **Go to LinkedIn Jobs:**
   ```
   https://www.linkedin.com/jobs/
   ```

2. **Search with Filters:**
   - Keywords: `Senior Accountant`
   - Location: `New York, NY`
   - Distance: `25 miles`
   - Date Posted: `Past 24 hours`

3. **Copy URL from Browser:**
   ```
   https://www.linkedin.com/jobs/search/?keywords=Senior%20Accountant&location=New%20York%2C%20NY&distance=25&f_TPR=r86400
   ```

4. **URL Parameters:**
   - `keywords`: Job title
   - `location`: City, State
   - `distance`: Radius in miles (10, 25, 50, 100)
   - `f_TPR`: Time filter
     - `r86400` = Past 24 hours
     - `r604800` = Past week
     - `r2592000` = Past month

5. **Add to URLs Sheet:**
   - Paste into `url` column
   - Add descriptive name
   - Set status to `active`

---

## Step 7: Apify LinkedIn Scraper Configuration

### Recommended Actor:
```
apify/linkedin-jobs-scraper
```

### Required Input Fields:
```json
{
  "searchUrl": "[LinkedIn search URL]",
  "maxItems": 1000,
  "scrapeJobDetails": true
}
```

### Finding Your Actor ID:
1. Go to Apify Console
2. Navigate to Actors
3. Select LinkedIn Jobs Scraper
4. Copy Actor ID from URL: `https://console.apify.com/actors/[ACTOR_ID]`

---

## Step 8: Testing the Workflow

### Manual Test Run:

1. **Disable Schedule Trigger**
   - Open workflow
   - Click "Schedule Trigger" node
   - Disable it temporarily

2. **Add Manual Trigger**
   - Add "Manual Trigger" node
   - Connect to "Read Campaign Config"

3. **Execute Test**
   - Click "Execute Workflow"
   - Monitor each node execution
   - Check for errors

4. **Verify Outputs:**
   - ✅ Resume parsed correctly
   - ✅ Jobs scraped from LinkedIn
   - ✅ Jobs qualified
   - ✅ Match scores calculated
   - ✅ Decision makers found
   - ✅ Outreach messages generated
   - ✅ Data logged to Google Sheets
   - ✅ Notifications sent

### Check Google Sheets:
- Jobs Master: New rows added
- Outreach Log: Outreach recorded
- Rejections: No Fits logged

---

## Step 9: Enable Daily Schedule

1. **Remove Manual Trigger**
   - Delete test manual trigger node

2. **Enable Schedule Trigger**
   - Click "Schedule Trigger" node
   - Set to active
   - Verify cron: `0 6 * * *` (6 AM daily)

3. **Activate Workflow**
   - Toggle "Active" switch at top
   - Workflow will now run automatically at 6 AM daily

---

## Step 10: Instantly.ai Campaign Setup

### Create Campaign:

1. **Go to Instantly.ai Dashboard**
   - Create new campaign
   - Name: `Resume Matching - [Campaign Name]`

2. **Configure Campaign:**
   - Type: Cold email
   - Sender: Your email account
   - Enable email validation

3. **Email Template Variables:**
   Your workflow sends:
   - `{first_name}`
   - `{last_name}`
   - `{company_name}`
   - `{job_title}`
   - `{match_score}`
   - `{subject}` (AI-generated)
   - `{message}` (AI-generated)

4. **Get Campaign ID:**
   - URL: `https://app.instantly.ai/app/campaigns/[CAMPAIGN_ID]`
   - Add to environment variables

---

## Step 11: HeyReach Campaign Setup

### Create LinkedIn Campaign:

1. **Go to HeyReach Dashboard**
   - Create new campaign
   - Type: Connection + Message

2. **Configure Sequence:**
   - Step 1: Send connection request (optional)
   - Step 2: Send message with custom variables

3. **Message Template:**
   ```
   Hi {{first_name}},

   {{custom_message}}

   Best regards,
   [Your Name]
   ```

4. **Get Campaign ID:**
   - Copy from campaign settings
   - Add to environment variables

---

## Step 12: Monitoring & Maintenance

### Daily Checks:

1. **Slack Notifications**
   - Review daily summary
   - Check match counts

2. **Google Sheets Review**
   - Outreach Log: Verify sends
   - Rejections: Tune scoring if needed
   - Jobs Master: Monitor deduplication

### Weekly Review:

1. **Performance Metrics:**
   - Hard Fits / Soft Fits ratio
   - Rejection reasons
   - Decision maker discovery rate
   - Email deliverability

2. **Scoring Adjustments:**
   - If too many rejections → lower threshold
   - If too many low-quality matches → raise threshold
   - Adjust title variations in form

### Monthly Maintenance:

1. **Update LinkedIn URLs**
   - Refresh search URLs if LinkedIn changes
   - Add new search variations

2. **Resume Updates**
   - Upload updated resume if candidate profile changes
   - Re-run workflow for backfill

---

## Troubleshooting

### Issue: No jobs scraped
- **Check:** LinkedIn URL is valid and active
- **Check:** Apify scraper is working (test manually in Apify console)
- **Fix:** Update URL with fresh LinkedIn search

### Issue: Resume not parsing
- **Check:** Resume is PDF format
- **Check:** Google Drive file ID is correct
- **Check:** Service account has access
- **Fix:** Re-upload resume, verify sharing

### Issue: All jobs rejected
- **Check:** Campaign Config requirements are not too strict
- **Check:** Scoring thresholds in "Calculate Match Score" node
- **Fix:** Adjust required_titles, skills_match_type to 'partial'

### Issue: No decision makers found
- **Check:** LeadMagic API key is valid
- **Check:** Company names are correct
- **Fix:** Add fallback roles in LeadMagic query

### Issue: Outreach not sending
- **Check:** Instantly.ai / HeyReach campaign IDs are correct
- **Check:** API keys are valid
- **Fix:** Test API endpoints manually with Postman

### Issue: Duplicate outreach
- **Check:** Jobs Master deduplication logic
- **Check:** `job_id` uniqueness
- **Fix:** Clear Jobs Master sheet and re-run (careful!)

---

## Advanced Configuration

### Custom Scoring Weights:

Edit `Calculate Match Score` node JavaScript:

```javascript
// Current weights:
// Title: 30 points
// Experience: 30 points
// Education: 30 points
// Skills: 7 points
// Certifications: 3 points

// To adjust, change the score values:
breakdown.title = { score: 35, ... }; // Increase title weight
breakdown.skills = { score: 10, ... }; // Increase skills weight
// etc.
```

### Add More Qualification Checks:

Edit `Qualify Job with AI` node prompt:

```
Additional rejection criteria:
- Reject contract/temporary roles
- Reject remote-only if candidate prefers office
- Reject if salary range is mentioned and below threshold
```

### Multi-URL Support:

Already built-in! Just add more rows to URLs sheet.

### Add More Outreach Channels:

Duplicate outreach nodes and add:
- SMS via Twilio
- WhatsApp via Twilio
- Direct mail via Lob

---

## Cost Estimates (Monthly)

| Service | Usage | Estimated Cost |
|---------|-------|----------------|
| OpenAI (GPT-4o) | 1000 resumes + outreach | $30-50 |
| OpenAI (GPT-4o-mini) | Job qualification | $5-10 |
| Apify | 10,000 jobs scraped | $50-100 |
| LeadMagic | 500 enrichments | $50-100 |
| Instantly.ai | 500 emails | $30-100 |
| HeyReach | 200 LinkedIn messages | $50-100 |
| **Total** | | **$215-460/month** |

Optimize costs:
- Use `gpt-4o-mini` for all non-critical tasks
- Batch API requests where possible
- Cache resume parsing results
- Limit job scraping to specific hours

---

## Security Best Practices

1. **Never commit API keys to git**
   - Use environment variables only
   - Add `.env` to `.gitignore`

2. **Rotate API keys quarterly**

3. **Monitor API usage**
   - Set alerts for unusual activity
   - Review costs weekly

4. **Restrict Google Service Account**
   - Grant minimum required permissions
   - Audit access logs monthly

5. **Secure n8n instance**
   - Use authentication
   - Enable HTTPS
   - Regular backups

---

## Support & Documentation

- **n8n Docs:** https://docs.n8n.io
- **OpenAI API:** https://platform.openai.com/docs
- **Apify Docs:** https://docs.apify.com
- **LeadMagic API:** https://docs.leadmagic.io
- **Instantly.ai API:** https://instantly.ai/app/api
- **HeyReach Docs:** https://heyreach.io/docs

---

## Next Steps

1. ✅ Complete setup following this guide
2. ✅ Run test execution
3. ✅ Review first results in Google Sheets
4. ✅ Tune scoring and qualification logic
5. ✅ Enable daily schedule
6. ✅ Monitor for 1 week
7. ✅ Optimize based on results
8. 🚀 Scale to multiple campaigns by duplicating workflow

---

**Need help?** Review the `TESTING_CHECKLIST.md` for validation steps.
