# Redline Recruiter ICP Cleaner - N8N Workflow

## Overview

This N8N workflow is a conversion of the Make.com "Redline Recruiter ICP Cleaner" automation blueprint. It filters leads from Google Sheets, analyzes them using AI to determine if they're recruiter decision-makers, validates emails, and adds qualified leads to Instantly.ai campaigns.

## Workflow Logic

### Flow Diagram

```
Google Sheets Filter
        ↓
Exa AI Content Fetch
        ↓
OpenAI ICP Classification
        ↓
    IF True Fit?
    ├─ YES → Company Normalizer (OpenAI)
    │         ↓
    │    Email Verifier
    │         ↓
    │    IF Valid Email?
    │    ├─ YES → Add to Instantly.ai → Update Sheet (with campaign)
    │    └─ NO  → Update Sheet (no campaign)
    │
    └─ NO  → Update Sheet (reasoning only)
```

### Key Steps

1. **Filter Google Sheets Rows**: Finds rows where:
   - Column AG (Status) is empty
   - Column D (email) exists
   - Column I (company website) exists
   - Column W (fit) is empty

2. **Exa AI Content Fetch**: Retrieves website content for company analysis

3. **QC ICP Fit Classification**: Uses GPT-4o-mini to determine:
   - Is this a third-party recruiter? (`is_middleman`)
   - Is this person a decision-maker? (`is_decision_maker`)
   - Recruitment niche (industry they recruit for)
   - Ideal client profile (ICP)

4. **Router Logic**:
   - **IF True Fit** (is_middleman=true AND is_decision_maker=true):
     - Normalize company name and generate subject line
     - Verify email with LeadMagic
     - **IF Valid Email**: Add to Instantly.ai campaign + update sheet
     - **ELSE**: Update sheet without campaign

   - **IF Not A Fit**: Update sheet with reasoning only

## Setup Instructions

### Prerequisites

You need active accounts and API credentials for:
- ✅ Google Sheets (OAuth2)
- ✅ OpenAI API
- ✅ Exa AI API
- ✅ LeadMagic API
- ✅ Instantly.ai API

### Step 1: Import Workflow

1. Open N8N
2. Click **Workflows** → **Import from File**
3. Select `redline-recruiter-icp-cleaner.json`

### Step 2: Configure Credentials

Replace placeholder credential IDs with your actual credentials:

#### Google Sheets OAuth2
- Node: "Filter Google Sheets Rows"
- Type: `googleSheetsOAuth2Api`
- Setup: Follow N8N's Google OAuth2 flow

#### OpenAI API
- Nodes: "QC ICP Fit - Redline Recruiters", "Company Name Normalizer"
- Type: `openAiApi`
- Required: API Key from https://platform.openai.com/api-keys

#### Exa AI API
- Node: "Exa AI - Get Website Content"
- Type: Custom HTTP Header Auth
- Header: `x-api-key: YOUR_EXA_API_KEY`
- Get key from: https://exa.ai/

#### LeadMagic API
- Node: "Email Verifier"
- Type: Custom HTTP Header Auth
- **IMPORTANT**: The current API key `0d98d6f54a09045f887264696c3a8ed4` is hardcoded
- Replace with your own key in the node's header parameters

#### Instantly.ai API
- Node: "Instantly - Add Lead"
- Type: Custom credential (create new)
- Get key from: https://app.instantly.ai/app/settings/integrations

### Step 3: Update Spreadsheet Configuration

The workflow currently targets:
- **Spreadsheet ID**: `176d3pUIzMeVIRYZK6nosZosmGtFMLDDcQG2wTZsjhrc`
- **Sheet Name**: "Process and Upload Main"

To change:
1. Open each Google Sheets node
2. Update the `documentId` parameter
3. Update the `sheetName` parameter

### Step 4: Update Campaign ID

In the "Instantly - Add Lead" node:
- Current campaign: `6a2d8d26-a94e-493b-ac73-6f1ef9e6fa52`
- Update in JSON body: `campaign_id` field

### Step 5: Test the Workflow

1. Click **Execute Workflow** (test run)
2. Check each node's output
3. Verify Google Sheet updates correctly
4. Confirm leads appear in Instantly.ai

### Step 6: Activate

1. Set execution mode (Manual trigger, Webhook, or Schedule)
2. Click **Active** toggle to enable

## Column Mappings

The workflow reads/writes these Google Sheet columns:

### Input Columns (Read)
| Column | Label | Description |
|--------|-------|-------------|
| A | name | Full name |
| B | first name | First name |
| C | last name | Last name |
| D | email | Email address |
| H | company name | Company name |
| I | company website | Company website URL |
| J | domain | Domain |
| F | title | Job title |
| G | headline | LinkedIn headline |
| AL | num employees | Employee count |

### Output Columns (Write)
| Column | Label | Description |
|--------|-------|-------------|
| S | Company name normalized | Cleaned company name |
| T | decision maker | TRUE/FALSE |
| U | niche | Recruitment niche |
| V | icp | Ideal client profile |
| W | fit | is_middleman (TRUE/FALSE) |
| X | summary | AI reasoning |
| Y | subject line | Generated subject line |
| AB | Date Added | Date processed |
| AC | Campaign ID | Instantly campaign ID |
| AG | Status | Email validation status |

## Differences from Make.com Version

### ✅ Maintained
- Exact same workflow logic
- Same AI prompts
- Same filtering conditions
- Same API integrations

### ⚠️ Important Notes

1. **Exa AI Integration**: N8N doesn't have a native Exa node, so it uses HTTP Request
2. **Row Number Matching**: N8N uses different row matching - verify the `matchingColumns` setting
3. **Date Format**: Uses N8N's `$now.toFormat('MM-dd-yyyy')` instead of Make's `formatDate()`
4. **Expression Syntax**: Converted from Make's `{{}}` to N8N's `={{ }}`

### 🔧 Recommended Enhancements

1. **Add Error Handling**:
   - Add Error Trigger nodes
   - Set retry logic for API failures
   - Add Slack/email notifications for failures

2. **Add Logging**:
   - Log processed rows to separate sheet
   - Track API usage/costs
   - Monitor success/failure rates

3. **Optimize Performance**:
   - Batch processing (process multiple rows at once)
   - Add rate limiting for APIs
   - Cache website content to reduce Exa calls

4. **Add Data Validation**:
   - Check email format before validation
   - Validate website URLs before Exa call
   - Add data quality checks

## Troubleshooting

### Issue: Google Sheets "Row Number" not found
**Solution**: Update the `matchingColumns` in Update Sheet nodes to use the actual unique identifier column (likely `__ROW_NUMBER__` or similar)

### Issue: Exa AI returns 401 Unauthorized
**Solution**: Verify your Exa API key is correct in the HTTP Request header

### Issue: OpenAI returns non-JSON response
**Solution**: Check that `responseFormat: "json_object"` is set in OpenAI node options

### Issue: Instantly.ai lead not added
**Solution**:
- Verify campaign ID exists
- Check if lead already exists (skip_if_in_workspace: true)
- Ensure all required fields are populated

### Issue: Email validation fails
**Solution**: Replace the hardcoded LeadMagic API key with your own

## Cost Estimates (Per Lead)

- **OpenAI GPT-4o-mini**: ~$0.001 (2 calls)
- **Exa AI**: ~$0.001 per content fetch
- **LeadMagic**: ~$0.002 per email validation
- **Instantly.ai**: Included in subscription
- **Total**: ~$0.004 per lead processed

## Support

For issues specific to:
- **N8N platform**: https://docs.n8n.io/
- **This workflow**: Create an issue in this repo
- **API integrations**: Contact respective service providers

## License

This workflow is provided as-is for automation purposes.
