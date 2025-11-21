# N8N Candidate Routing Workflow

## Overview

This n8n workflow converts the Make.com candidate routing logic to n8n. It processes analyzed candidates and routes them based on:
1. Whether they passed the AI scoring (`pass` = true/false)
2. Whether they already exist in PCRecruiter CRM (`pcr_candidate_id` exists or not)

## Workflow Logic

### Route 1: Not A Fit
**Condition:** `ai_analysis.pass` ≠ "true"

Candidates who didn't pass the hiring criteria are still added/updated in the CRM for future reference.

- **If NEW** (no `pcr_candidate_id`): Create new candidate in PCRecruiter
- **If EXISTS**: Update existing candidate in PCRecruiter

### Route 2: Fit and Not in PCR
**Condition:** `ai_analysis.pass` = "true" AND no `pcr_candidate_id`

These are qualified new candidates who should be added to the active search.

**Sequence:**
1. Add candidate to PCRecruiter → Returns `CandidateId`
2. Add candidate to Rollup List (search-specific list)
3. Add candidate row to Google Sheets (tracking sheet)
4. Send to verification webhook

### Route 3: Fit and In PCR
**Condition:** `ai_analysis.pass` = "true" AND `pcr_candidate_id` exists

These are qualified candidates who are already in the system and need to be updated.

**Sequence:**
1. Update candidate in PCRecruiter
2. Add candidate to Rollup List (search-specific list)
3. Add candidate row to Google Sheets (tracking sheet)
4. Send to verification webhook

## Input Data Structure

The workflow expects incoming data with this structure:

```json
{
  "id": "datastore_id",
  "first_name": "John",
  "last_name": "Doe",
  "name": "John Doe",
  "title": "Senior Manager",
  "organization_name": "Acme Corp",
  "organization_domain": "acme.com",
  "email": "john.doe@acme.com",
  "personal_email": "john@gmail.com",
  "pcr_email": "john.doe@acme.com",
  "pcr_home": "555-1234",
  "pcr_mobile": "555-5678",
  "city": "San Francisco",
  "state": "CA",
  "linkedin_url": "https://linkedin.com/in/johndoe",
  "headline": "Experienced Senior Manager",
  "pcr_candidate_id": "12345",
  "pcr_session_id": "session_token_here",
  "pcr_last_synced": "2025-11-20",
  "google_sheet_id": "1QJjHCfSu1AsHs2cb-LAtYF-WtA2ANIxsb89AQWDB97k",
  "search_name": "Harker - Asst Mngr",
  "rollup_list": "rollup_list_id",
  "ai_analysis": {
    "pass": "true",
    "final_score": "85",
    "education_ok": "true",
    "meets_min_experience": "true",
    "needs_verification": "false",
    "verification_reasons_csv": "",
    "ai_summary": "Experienced manager with strong background...",
    "degree_type_latest": "Bachelor's",
    "degree_school_latest": "Stanford University",
    "graduation_year_latest": "2010",
    "licenses_and_certifications_csv": "PMP, Six Sigma",
    "company_1_name": "Acme Corp",
    "company_1_title": "Senior Manager",
    "company_1_start_date": "2020-01",
    "company_1_end_date": "Present",
    "company_1_specialties_csv": "Project Management, Operations",
    "company_1_history": "2020-01 to Present",
    "company_2_name": "Previous Corp",
    "company_2_title": "Manager",
    "company_2_start_date": "2015-06",
    "company_2_end_date": "2020-01",
    "company_2_specialties_csv": "Team Leadership",
    "company_2_history": "2015-06 to 2020-01",
    "company_3_name": "Startup Inc",
    "company_3_title": "Team Lead",
    "company_3_start_date": "2010-03",
    "company_3_end_date": "2015-06",
    "company_3_specialties_csv": "Process Improvement",
    "company_3_history": "2010-03 to 2015-06",
    "company_specialties_csv": "All specialties combined",
    "licenses_csv": "PMP, Six Sigma"
  }
}
```

## Setup Instructions

### 1. Import Workflow
1. Open n8n
2. Go to **Workflows** → **Import from File**
3. Select `n8n_candidate_routing_workflow.json`

### 2. Configure Credentials

#### PCRecruiter API
- The workflow uses HTTP Header Auth
- Header: `Authorization`
- Value: `Bearer {{ $json.pcr_session_id }}`
- The session ID should be passed in the input data

#### Google Sheets
1. Create OAuth2 credentials for Google Sheets
2. Assign to all Google Sheets nodes:
   - "Add to Google Sheets (New)"
   - "Add to Google Sheets (Existing)"

### 3. Configure Dynamic Values

The workflow uses dynamic values from input data:
- **Spreadsheet ID**: `{{ $json.google_sheet_id }}`
- **Sheet Name**: `{{ $json.search_name }}`
- **Rollup List ID**: `{{ $json.rollup_list }}`
- **PCR Session ID**: `{{ $json.pcr_session_id }}`

### 4. Update Webhook URL

The "Send to Verify" nodes use a Make.com webhook. Update this to your n8n webhook:

Current: `https://hook.us2.make.com/xvnpq5eiu7k486slvj1vbk4kwrs52re9`

To use n8n webhook instead:
1. Create a new workflow with a Webhook trigger
2. Copy the webhook URL
3. Replace the URL in both "Send to Verify" nodes

### 5. Adjust Google Sheets Columns

The Google Sheets nodes are configured with specific column mappings. Ensure your sheet has these columns:
- Date
- PCR Internal ID
- Name
- First Name
- Last Name
- Title
- Company
- Time at Company
- City
- State
- Work Email
- PCR Email
- PCR Home #
- PCR Mobile #
- LinkedIn URL
- Headline
- Degree Type
- Grad Year
- Latest School
- Certifications
- Sourced From
- Company 1
- Company 2
- Company 3
- Specialties
- Final Score
- Pass
- Education
- Min Experience
- Needs Verification
- Verification Reasons

## Key Differences from Make.com

### Expression Syntax
- **Make**: `{{4.result.pass}}`
- **n8n**: `={{ $json.ai_analysis.pass }}`

### Date Formatting
- **Make**: `{{formatDate(now; "MM-DD-YYYY")}}`
- **n8n**: `={{ $now.format('MM-DD-YYYY') }}`

### HTTP Requests
- Make uses specialized modules (`http:ActionSendData`)
- n8n uses the generic HTTP Request node with method configuration

### Routing
- Make uses `BasicRouter` with filters on routes
- n8n uses IF nodes for conditional routing

### Data Flow
- Make modules reference other modules by ID (e.g., `{{12.email}}`)
- n8n nodes access data from previous node: `{{ $json.email }}`

## Testing

1. **Test with a "Not Fit" candidate:**
   - Set `ai_analysis.pass` to `"false"`
   - Remove `pcr_candidate_id` or set it
   - Should create/update in PCR only

2. **Test with a "Fit, New" candidate:**
   - Set `ai_analysis.pass` to `"true"`
   - Remove `pcr_candidate_id`
   - Should: Add to PCR → Add to Rollup → Add to Sheets → Send to Verify

3. **Test with a "Fit, Existing" candidate:**
   - Set `ai_analysis.pass` to `"true"`
   - Include `pcr_candidate_id`
   - Should: Update PCR → Add to Rollup → Add to Sheets → Send to Verify

## Troubleshooting

### Authentication Errors
- Verify PCR session token is valid
- Check Google Sheets OAuth credentials are connected

### Data Not Flowing
- Check that input data structure matches expected format
- Verify all field names in expressions match your data

### Google Sheets Errors
- Ensure sheet name exists in the spreadsheet
- Verify columns exist (or set to auto-create)
- Check OAuth scopes include spreadsheet write access

## Notes

- The workflow assumes AI analysis data is nested under `ai_analysis`
- PCRecruiter authentication uses bearer token from input data
- Google Sheets will auto-format dates and numbers based on column settings
- The "Send to Verify" webhook currently points to Make.com - update as needed
