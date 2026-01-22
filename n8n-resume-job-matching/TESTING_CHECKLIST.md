# Testing Checklist: Resume-to-Job Matching System

Use this checklist to validate your workflow is working correctly before enabling daily automation.

---

## Pre-Flight Checks

### Environment Setup
- [ ] All environment variables configured in n8n
- [ ] All API keys tested and valid
- [ ] Google Service Account has access to Sheet and Drive
- [ ] Google Sheets created with all 5 tabs
- [ ] Campaign Config filled in (row 2)
- [ ] URLs sheet has at least 1 LinkedIn search URL
- [ ] Resume PDF uploaded to Google Drive
- [ ] Resume file ID added to Campaign Config

### Credentials
- [ ] Google Sheets API credential configured
- [ ] Google Drive API credential configured
- [ ] OpenAI API credential configured
- [ ] Apify API credential configured
- [ ] LeadMagic API configured (HTTP Header Auth)
- [ ] Instantly.ai campaign ID valid
- [ ] HeyReach campaign ID valid
- [ ] Slack webhook/token configured
- [ ] SMTP email credentials configured

---

## Test Execution #1: Resume Processing

### Goal: Verify resume parsing works

1. **Disable These Nodes (temporarily):**
   - [ ] All nodes after "Store Resume Data"

2. **Execute Workflow:**
   - [ ] Click "Execute Workflow"

3. **Verify Outputs:**

   **Node: Download Resume PDF**
   - [ ] ✅ PDF downloaded successfully
   - [ ] Binary data visible in output

   **Node: Extract Text from PDF**
   - [ ] ✅ Text extracted from PDF
   - [ ] Text is readable and complete

   **Node: Parse Resume with OpenAI**
   - [ ] ✅ OpenAI returned response
   - [ ] Response is valid JSON

   **Node: Store Resume Data**
   - [ ] ✅ Resume data structured correctly:
     ```json
     {
       "resume": {
         "current_title": "string",
         "all_titles": ["array"],
         "total_years_experience": number,
         "skills": ["array"],
         "certifications": ["array"],
         "education": [{"level": "string", "field": "string"}],
         "industries": ["array"],
         "work_history": [{"title": "string", ...}]
       },
       "campaign": { ...config }
     }
     ```

   **Manual Validation:**
   - [ ] Current title matches resume
   - [ ] Years of experience calculated correctly
   - [ ] Skills list is comprehensive
   - [ ] Certifications extracted (if any)
   - [ ] Education parsed correctly

### ❌ If Failed:
- **No PDF downloaded:** Check Google Drive file ID and service account access
- **Text extraction failed:** Verify PDF is not password-protected or corrupted
- **OpenAI error:** Check API key, quota, and model availability
- **Incorrect parsing:** Adjust OpenAI prompt in "Parse Resume" node

---

## Test Execution #2: Job Scraping

### Goal: Verify LinkedIn scraping works

1. **Enable Nodes:**
   - [ ] Loop Over URLs
   - [ ] Scrape LinkedIn Jobs (Apify)
   - [ ] Transform Job Data
   - [ ] Disable nodes after "Transform Job Data"

2. **Execute Workflow:**
   - [ ] Click "Execute Workflow"

3. **Verify Outputs:**

   **Node: Read LinkedIn URLs**
   - [ ] ✅ URLs sheet read successfully
   - [ ] At least 1 URL returned
   - [ ] URL is valid LinkedIn jobs search URL

   **Node: Loop Over URLs**
   - [ ] ✅ Loop initiated for each URL

   **Node: Scrape LinkedIn Jobs (Apify)**
   - [ ] ✅ Apify actor executed successfully
   - [ ] Jobs returned (check count)
   - [ ] Job objects have required fields:
     - job_id, title, companyName, location, description, jobUrl

   **Node: Transform Job Data**
   - [ ] ✅ Jobs transformed to standard format
   - [ ] Each job has:
     ```json
     {
       "job_id": "linkedin_123456",
       "job_title": "Senior Accountant",
       "company_name": "Acme Corp",
       "location": "New York, NY",
       "job_url": "https://...",
       "posted_date": "2026-01-21",
       "scraped_date": "2026-01-22",
       "job_description": "Full description..."
     }
     ```

   **Manual Validation:**
   - [ ] At least 10 jobs scraped
   - [ ] Job titles match search query
   - [ ] Job descriptions are complete (not truncated)
   - [ ] Job URLs are clickable and valid

### ❌ If Failed:
- **No jobs scraped:** Check LinkedIn URL is valid, Apify actor ID correct
- **Apify timeout:** Increase timeout in Apify node settings
- **Missing fields:** Check Apify actor output format, adjust transform code
- **Wrong jobs:** Verify LinkedIn search URL filters (location, keywords)

---

## Test Execution #3: Job Qualification & Scoring

### Goal: Verify AI qualification and match scoring

1. **Enable Nodes:**
   - [ ] All nodes up to "Merge Match Reasoning"
   - [ ] Disable nodes after "Merge Match Reasoning"

2. **Execute Workflow:**
   - [ ] Click "Execute Workflow"

3. **Verify Outputs:**

   **Node: Qualify Job with AI**
   - [ ] ✅ OpenAI qualification response received
   - [ ] Response includes:
     ```json
     {
       "is_qualified": true/false,
       "is_accounting_finance": true/false,
       "has_valid_description": true/false,
       "extracted_requirements": {
         "years_experience": number,
         "skills": ["array"],
         "education": "string",
         "certifications": ["array"]
       },
       "rejection_reason": "string or null"
     }
     ```

   **Node: Filter: Only Qualified Jobs**
   - [ ] ✅ Non-qualified jobs filtered out
   - [ ] Only accounting/finance jobs remain

   **Node: Check If Already Contacted**
   - [ ] ✅ Deduplication check executed
   - [ ] Jobs Master sheet read successfully
   - [ ] New jobs flagged with `should_skip: false`

   **Node: Calculate Match Score**
   - [ ] ✅ Match score calculated for each job
   - [ ] Score between 0-100
   - [ ] Score breakdown includes:
     ```json
     {
       "title": {"score": 0-30, "reason": "..."},
       "experience": {"score": 0-30, "resume_years": X, "required": Y},
       "education": {"score": 0-30, "reason": "..."},
       "skills": {"score": 0-7, "matched": [], "required": []},
       "certifications": {"score": 0-3, "matched": [], "required": []}
     }
     ```
   - [ ] Classification assigned: Hard Fit / Soft Fit / No Fit

   **Node: Generate Match Reasoning (AI)**
   - [ ] ✅ AI-generated reasoning received
   - [ ] Reasoning is coherent and explains match

   **Manual Validation:**
   - [ ] Hard Fits (75-100) are genuinely strong matches
   - [ ] Soft Fits (50-74) are reasonable matches
   - [ ] No Fits (<50) are correctly rejected
   - [ ] Title matches scored appropriately
   - [ ] Avoid titles correctly rejected (0 points)

### ❌ If Failed:
- **All jobs rejected:** Lower scoring threshold or adjust required_titles
- **Low scores for good matches:** Review scoring weights in Calculate Match Score node
- **Avoid titles not working:** Check Campaign Config avoid_titles spelling
- **Skills not matching:** Check skills_match_type (partial vs all)

---

## Test Execution #4: Decision Maker Discovery

### Goal: Verify contact enrichment works

1. **Enable Nodes:**
   - [ ] Find Decision Maker (LeadMagic)
   - [ ] Process Lead Data
   - [ ] Disable nodes after "Process Lead Data"

2. **Select 2-3 Hard Fits for Testing:**
   - [ ] Filter results to only Hard Fits
   - [ ] Execute workflow

3. **Verify Outputs:**

   **Node: Find Decision Maker (LeadMagic)**
   - [ ] ✅ LeadMagic API call successful
   - [ ] Response includes:
     ```json
     {
       "name": "Jane Smith",
       "title": "CFO",
       "email": "jane@company.com",
       "email_verification": {
         "status": "valid",
         "is_catchall": false
       },
       "linkedin_url": "https://linkedin.com/in/janesmith",
       "phone": "+1234567890"
     }
     ```

   **Node: Process Lead Data**
   - [ ] ✅ Lead data processed correctly
   - [ ] Email validation checked
   - [ ] Outreach channel assigned:
     - `email` if valid email
     - `linkedin` if no email or catch-all

   **Manual Validation:**
   - [ ] Decision maker name looks real (not generic)
   - [ ] Email domain matches company
   - [ ] LinkedIn URL is valid (click to verify)
   - [ ] Title is appropriate (CFO, Controller, Finance Manager)

### ❌ If Failed:
- **LeadMagic returns no results:** Check API key, company name spelling
- **Email always catch-all:** Normal for some companies, LinkedIn fallback works
- **Wrong decision maker:** Adjust role parameter in LeadMagic query
- **API rate limit:** Wait and retry, or reduce test batch size

---

## Test Execution #5: Outreach Generation

### Goal: Verify AI message generation

1. **Enable Nodes:**
   - [ ] Generate Outreach Message (AI)
   - [ ] Merge Outreach Message
   - [ ] Route: Email or LinkedIn?
   - [ ] Disable actual send nodes (Instantly, HeyReach)

2. **Execute Workflow:**
   - [ ] Click "Execute Workflow"

3. **Verify Outputs:**

   **Node: Generate Outreach Message (AI)**
   - [ ] ✅ OpenAI message generation successful
   - [ ] Response includes:
     ```json
     {
       "subject": "Email subject line",
       "message": "Full personalized message body...",
       "match_highlights": ["highlight 1", "highlight 2", "highlight 3"]
     }
     ```

   **Node: Route: Email or LinkedIn?**
   - [ ] ✅ Routing logic works:
     - Valid email → Email path
     - No email → LinkedIn path

   **Manual Validation:**
   - [ ] Subject line is compelling and relevant
   - [ ] Message mentions specific job requirements
   - [ ] Message highlights candidate's matching qualifications
   - [ ] Tone is professional and concise
   - [ ] Call-to-action is clear
   - [ ] No hallucinated information
   - [ ] Length is 150-200 words

   **Quality Check (read 3-5 messages):**
   - [ ] Messages are personalized (not generic)
   - [ ] Job title mentioned correctly
   - [ ] Company name used correctly
   - [ ] Match highlights are accurate
   - [ ] No spelling/grammar errors

### ❌ If Failed:
- **Generic messages:** Adjust OpenAI prompt to be more specific
- **Wrong information:** Check data passed to OpenAI (job data, resume data)
- **Too long:** Add word limit to prompt
- **No match highlights:** Ensure score_breakdown is included in prompt

---

## Test Execution #6: Outreach Sending (CAREFUL!)

### ⚠️ WARNING: This will send real outreach messages!

**Before proceeding:**
- [ ] Set up test campaigns in Instantly.ai and HeyReach
- [ ] Use test email addresses (your own or team)
- [ ] Verify messages from previous test look good
- [ ] Limit test to 2-3 jobs maximum

1. **Enable Nodes:**
   - [ ] Send Email via Instantly.ai
   - [ ] Send LinkedIn via HeyReach

2. **Execute Workflow (LIMITED BATCH):**
   - [ ] Add filter before outreach: limit to 2 jobs
   - [ ] Click "Execute Workflow"

3. **Verify Outputs:**

   **Node: Send Email via Instantly.ai**
   - [ ] ✅ API call successful
   - [ ] Response confirms lead added to campaign
   - [ ] No API errors

   **Node: Send LinkedIn via HeyReach**
   - [ ] ✅ API call successful
   - [ ] Response confirms lead added to campaign
   - [ ] No API errors

   **External Validation:**
   - [ ] Check Instantly.ai dashboard: Lead appears
   - [ ] Check HeyReach dashboard: Lead appears
   - [ ] Receive test email (if using test address)
   - [ ] Email content looks correct
   - [ ] LinkedIn message queued correctly

### ❌ If Failed:
- **Instantly.ai error:** Check campaign ID, API key, lead format
- **HeyReach error:** Check campaign ID, API key, LinkedIn URL format
- **Email not received:** Check spam folder, verify Instantly campaign is active
- **Wrong message sent:** PAUSE campaigns immediately, fix message generation

---

## Test Execution #7: Data Logging

### Goal: Verify Google Sheets logging works

1. **Enable All Nodes:**
   - [ ] Update Jobs Master
   - [ ] Log Outreach
   - [ ] Log Rejections to Sheet

2. **Execute Full Workflow (limited to 5 jobs):**
   - [ ] Click "Execute Workflow"

3. **Verify Google Sheets:**

   **Jobs Master Sheet:**
   - [ ] ✅ New rows added for each job
   - [ ] All columns populated correctly:
     - job_id, job_title, company_name, location
     - job_url, posted_date, scraped_date
     - job_description, required_skills_extracted
     - years_experience_required, education_required
     - qualified, match_score, classification
     - score_breakdown (JSON), decision_maker_found
     - outreach_attempted, outreach_date, outreach_channel

   **Outreach Log Sheet:**
   - [ ] ✅ New rows added for each outreach
   - [ ] All columns populated:
     - outreach_id, campaign_id, job_id
     - job_title, company_name
     - decision_maker_name, decision_maker_title
     - decision_maker_email, linkedin_url
     - outreach_channel, outreach_message
     - match_score, classification, match_highlights
     - sent_date, status

   **Rejections Sheet:**
   - [ ] ✅ Rejected jobs logged
   - [ ] Rejection reasons populated
   - [ ] Match scores shown for context

   **Manual Validation:**
   - [ ] No duplicate job_ids in Jobs Master
   - [ ] Outreach Log matches actual sent messages
   - [ ] Rejection reasons make sense
   - [ ] All dates formatted correctly

### ❌ If Failed:
- **Columns misaligned:** Check Google Sheets column headers match exactly
- **Missing data:** Check column mapping in Append nodes
- **Duplicate rows:** Clear sheet and re-run, check deduplication logic
- **JSON errors:** Verify score_breakdown is valid JSON

---

## Test Execution #8: Notifications

### Goal: Verify Slack and email notifications work

1. **Enable All Nodes:**
   - [ ] Prepare Summary Report
   - [ ] Send Slack Notification
   - [ ] Send Email Notification

2. **Execute Full Workflow:**
   - [ ] Click "Execute Workflow"

3. **Verify Outputs:**

   **Node: Prepare Summary Report**
   - [ ] ✅ Summary data aggregated correctly:
     ```json
     {
       "execution_date": "ISO date",
       "total_jobs_scraped": 47,
       "qualified_jobs": 32,
       "new_jobs": 28,
       "hard_fits": 8,
       "soft_fits": 12,
       "rejections": 12,
       "outreach_sent": 20,
       "emails_sent": 15,
       "linkedin_sent": 5,
       "top_matches": [{...}, {...}]
     }
     ```

   **Slack Notification:**
   - [ ] ✅ Message received in Slack channel
   - [ ] Formatting looks good (emoji, bold, bullets)
   - [ ] All metrics displayed correctly
   - [ ] Top 5 matches listed

   **Email Notification:**
   - [ ] ✅ Email received
   - [ ] Subject line clear
   - [ ] HTML formatting rendered correctly
   - [ ] All sections present
   - [ ] Google Sheets link clickable

   **Manual Validation:**
   - [ ] Numbers make sense (qualified < scraped, etc.)
   - [ ] Top matches are actually top scores
   - [ ] Notification is actionable

### ❌ If Failed:
- **Slack error:** Check webhook URL or bot token, channel permissions
- **Email not received:** Check SMTP credentials, spam folder
- **Wrong numbers:** Check summary aggregation logic in Prepare Summary node
- **Formatting broken:** Check Slack markdown syntax, HTML in email

---

## Test Execution #9: Full End-to-End Test

### Goal: Run complete workflow start to finish

**Setup:**
- [ ] Clear Google Sheets (keep headers)
- [ ] Enable ALL nodes
- [ ] Disable schedule trigger (use manual trigger)
- [ ] Set test limit: 10 jobs max

**Execute:**
- [ ] Click "Execute Workflow"
- [ ] Monitor execution in real-time
- [ ] Note execution time

**Verify:**
- [ ] ✅ No errors in any node
- [ ] ✅ Execution completed successfully
- [ ] ✅ Google Sheets populated
- [ ] ✅ Outreach sent (limited batch)
- [ ] ✅ Notifications received

**Performance:**
- [ ] Total execution time: ______ minutes
- [ ] Jobs scraped: ______
- [ ] Hard Fits found: ______
- [ ] Outreach sent: ______

**Quality Check:**
- [ ] Review 5 outreach messages manually
- [ ] All messages are high quality
- [ ] No errors or hallucinations
- [ ] Match scores are accurate

---

## Test Execution #10: Schedule Trigger Test

### Goal: Verify automated daily execution

**Setup:**
- [ ] Enable Schedule Trigger node
- [ ] Set cron to run in 5 minutes: `[current time + 5min]`
- [ ] Activate workflow

**Wait:**
- [ ] Wait for scheduled execution
- [ ] Monitor n8n executions list

**Verify:**
- [ ] ✅ Workflow executed automatically at scheduled time
- [ ] ✅ Execution completed successfully
- [ ] ✅ Notifications received

**Reset:**
- [ ] Set cron back to 6 AM daily: `0 6 * * *`
- [ ] Confirm schedule is correct

---

## Pre-Production Checklist

Before enabling for production use:

### Configuration
- [ ] All API keys are production keys (not test)
- [ ] Instantly.ai campaign is production campaign
- [ ] HeyReach campaign is production campaign
- [ ] Slack channel is correct
- [ ] Email recipient is correct

### Data Quality
- [ ] Resume is current and accurate
- [ ] Campaign Config requirements are tuned
- [ ] LinkedIn URLs are optimized
- [ ] Scoring thresholds validated

### Monitoring
- [ ] Slack notifications enabled
- [ ] Email notifications enabled
- [ ] Error alerting configured (n8n)
- [ ] Calendar reminder to review weekly

### Safety
- [ ] Outreach daily limit set (if desired)
- [ ] Deduplication working correctly
- [ ] API rate limits understood
- [ ] Budget alerts configured for APIs

### Documentation
- [ ] Team trained on workflow
- [ ] Troubleshooting guide accessible
- [ ] Escalation process defined

---

## Production Launch

**Day 1:**
- [ ] Enable daily schedule at 6 AM
- [ ] Monitor first execution closely
- [ ] Review results in Google Sheets
- [ ] Validate outreach quality

**Week 1:**
- [ ] Daily review of Slack summaries
- [ ] Mid-week deep dive into Google Sheets
- [ ] Tune scoring if needed
- [ ] Track response rates

**Month 1:**
- [ ] Weekly performance review
- [ ] Optimize based on data
- [ ] Adjust search URLs
- [ ] Refine outreach messaging

---

## Success Metrics

Track these KPIs weekly:

- **Scraping:**
  - Jobs scraped per day
  - Qualification rate (qualified / scraped)

- **Matching:**
  - Hard Fits per day
  - Soft Fits per day
  - Average match score

- **Outreach:**
  - Outreach sent per day
  - Email vs LinkedIn ratio
  - Decision maker discovery rate

- **Quality:**
  - Outreach reply rate (track manually)
  - False positive rate (bad matches)
  - False negative rate (missed opportunities)

---

## Continuous Improvement

**Monthly tuning:**
1. Analyze rejection reasons
2. Adjust scoring weights if needed
3. Update required_titles based on results
4. Refresh LinkedIn search URLs
5. A/B test outreach messaging
6. Review API costs vs results

**Quarterly review:**
1. Update resume if candidate profile changes
2. Audit all API keys and rotate
3. Review security and access controls
4. Optimize workflow nodes for performance
5. Update documentation with learnings

---

## ✅ Testing Complete!

If all tests pass, you're ready for production deployment.

**Final Sign-Off:**
- [ ] All 10 test executions passed
- [ ] Pre-production checklist completed
- [ ] Workflow activated with daily schedule
- [ ] Team notified and trained
- [ ] First production run monitored

**Date Deployed:** _______________
**Deployed By:** _______________

---

**Questions or issues?** Review SETUP_GUIDE.md or consult n8n documentation.
