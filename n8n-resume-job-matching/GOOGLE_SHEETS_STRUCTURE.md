# Google Sheets Structure for Resume-to-Job Matching System

Create a new Google Sheet with **4 tabs** (sheets). Name it: `Resume Job Matching - [Campaign Name]`

---

## Sheet 1: Campaign Config

**Purpose:** Stores the campaign configuration and search parameters

| Column | Data Type | Example | Notes |
|--------|-----------|---------|-------|
| campaign_id | Text | `CAMP_001` | Unique identifier |
| campaign_name | Text | `John Doe - Senior Accountant` | Descriptive name |
| resume_file_id | Text | `1a2b3c4d5e6f...` | Google Drive file ID |
| resume_file_path | Text | `https://drive.google.com/file/d/...` | Full Drive URL |
| linkedin_search_urls | Text | See below | One URL per row, or JSON array |
| required_titles | Text | `Accountant, Senior Accountant, Financial Analyst` | Comma-separated |
| avoid_titles | Text | `Staff Accountant, Junior Accountant` | Comma-separated |
| required_skills | Text | `Excel, QuickBooks, Financial Reporting` | Comma-separated |
| skills_match_type | Text | `partial` or `all` | Strictness setting |
| min_years_experience | Number | `5` | Minimum years |
| required_education | Text | `Bachelor's Degree in Accounting` | Education requirement |
| required_certifications | Text | `CPA, CFA` | Comma-separated |
| city | Text | `New York` | Search location |
| radius_miles | Number | `25` | Search radius |
| status | Text | `active` or `paused` | Campaign status |
| created_date | Date | `2026-01-22` | Auto-generated |
| last_run_date | Date | `2026-01-22` | Updated each run |

**LinkedIn Search URLs Format:**
- Option 1: Multiple rows in separate "URLs" sheet (recommended)
- Option 2: JSON array in single cell: `["url1", "url2", "url3"]`

---

## Sheet 2: URLs

**Purpose:** Stores LinkedIn search URLs for the campaign (one URL per row)

| Column | Data Type | Example |
|--------|-----------|---------|
| url | Text | `https://www.linkedin.com/jobs/search/?keywords=Senior%20Accountant&location=New%20York&distance=25&f_TPR=r86400` |
| url_name | Text | `Senior Accountant - NYC 25mi` |
| status | Text | `active` |
| last_scraped | Date | `2026-01-22` |
| jobs_found | Number | `47` |

---

## Sheet 3: Jobs Master

**Purpose:** Master log of all scraped jobs (deduplication happens here)

| Column | Data Type | Example | Notes |
|--------|-----------|---------|-------|
| job_id | Text | `linkedin_123456789` | Unique job identifier |
| job_title | Text | `Senior Accountant` | Exact title from posting |
| company_name | Text | `Acme Corp` | Company name |
| location | Text | `New York, NY` | Job location |
| job_url | Text | `https://www.linkedin.com/jobs/view/123456789` | LinkedIn URL |
| posted_date | Date | `2026-01-21` | When job was posted |
| scraped_date | Date | `2026-01-22` | When we scraped it |
| job_description | Text | Full description | Raw text |
| required_skills_extracted | Text | `Excel, QuickBooks, GAAP` | Parsed from description |
| years_experience_required | Number | `5` | Parsed from description |
| education_required | Text | `Bachelor's` | Parsed |
| qualified | Boolean | `TRUE` or `FALSE` | Passed qualification |
| match_score | Number | `82` | Calculated score |
| classification | Text | `Hard Fit` | Hard/Soft/No Fit |
| score_breakdown | Text | JSON | Detailed scoring |
| decision_maker_found | Boolean | `TRUE` | Found contact |
| outreach_attempted | Boolean | `TRUE` | Outreach sent |
| outreach_date | Date | `2026-01-22` | When contacted |
| outreach_channel | Text | `email` or `linkedin` | Channel used |
| rejection_reason | Text | `Title mismatch` | If rejected |

---

## Sheet 4: Outreach Log

**Purpose:** Tracks all outreach attempts

| Column | Data Type | Example |
|--------|-----------|---------|
| outreach_id | Text | `OUT_001` | Unique ID |
| campaign_id | Text | `CAMP_001` | Links to campaign |
| job_id | Text | `linkedin_123456789` | Links to job |
| job_title | Text | `Senior Accountant` | For reference |
| company_name | Text | `Acme Corp` | For reference |
| decision_maker_name | Text | `Jane Smith` | Contact name |
| decision_maker_title | Text | `CFO` | Contact title |
| decision_maker_email | Text | `jane.smith@acme.com` | Email if found |
| linkedin_url | Text | `https://linkedin.com/in/janesmith` | LinkedIn if found |
| outreach_channel | Text | `email` | email or linkedin |
| outreach_message | Text | Full message | Generated copy |
| match_score | Number | `82` | For reference |
| classification | Text | `Hard Fit` | For reference |
| match_highlights | Text | `Title match, 7 years exp, CPA certified` | Key matches |
| sent_date | Date | `2026-01-22` | When sent |
| status | Text | `sent` | sent, replied, no response |

---

## Sheet 5: Rejections

**Purpose:** Logs all rejected jobs with reasons

| Column | Data Type | Example |
|--------|-----------|---------|
| rejection_id | Text | `REJ_001` | Unique ID |
| campaign_id | Text | `CAMP_001` | Links to campaign |
| job_id | Text | `linkedin_123456789` | Job identifier |
| job_title | Text | `Staff Accountant` | Title |
| company_name | Text | `Acme Corp` | Company |
| rejection_reason | Text | `Avoid title match` | Why rejected |
| rejection_stage | Text | `qualification` | Which stage failed |
| match_score | Number | `45` | Score if calculated |
| rejected_date | Date | `2026-01-22` | When rejected |

---

## Initial Setup

1. Create new Google Sheet
2. Rename tabs: `Campaign Config`, `URLs`, `Jobs Master`, `Outreach Log`, `Rejections`
3. Add column headers exactly as shown above
4. Fill in **Campaign Config** row 2 with your campaign data
5. Fill in **URLs** sheet with LinkedIn search URLs
6. Leave other sheets empty (workflow will populate)
7. Share sheet with your n8n Google Service Account
8. Copy the Sheet ID from URL: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`

---

## Tips

- **One sheet per campaign** (person)
- Keep URLs sheet updated with fresh LinkedIn searches
- Monitor Jobs Master for deduplication working correctly
- Check Rejections sheet to tune scoring logic
- Outreach Log is your audit trail
