# N8N Workflow - LinkedIn Jobs Processor

## Overview

This workflow processes LinkedIn job postings scraped by Apify, analyzes them using OpenAI's GPT-4 for ICP (Ideal Customer Profile) fit, and automatically adds qualified leads to Google Sheets.

## Workflow Flow

1. **Webhook Trigger** - Receives dataset_id from Apify scraper
2. **Apify Fetch** - Retrieves job posting data from dataset
3. **Google Sheets Filter** - Checks if company already exists in master list
4. **Employee Count Filter** - Filters for companies with <500 employees, Full-time roles
5. **OpenAI ICP Analysis** - Analyzes if company is:
   - Direct employer (not recruiter/staffing agency)
   - NOT a CPA/accounting firm
   - Accounting/finance role
   - Does NOT prohibit recruiter contact
   - Classifies industry and sub-niche
6. **Rate Limit Wait** - 5 second delay for API rate limiting
7. **Routing Logic**:
   - **Qualified Leads** → Added to "Accountant Results" sheet
   - **Recruiters** → Added to separate recruiter tracking sheet

## Import Instructions

### 1. Import Workflow to N8N

1. Open your N8N instance
2. Click **Workflows** → **Import**
3. Select the file: `n8n-workflow-linkedin-jobs-processor.json`
4. Click **Import**

### 2. Configure Credentials

You'll need to set up the following credentials in N8N:

#### A. Apify API
- Go to **Credentials** → **Add Credential**
- Select **Apify API**
- Enter your Apify API token
- Name it: `Apify API`

#### B. OpenAI API
- Go to **Credentials** → **Add Credential**
- Select **OpenAI API**
- Enter your OpenAI API key
- Name it: `OpenAI`

#### C. Google Sheets OAuth2
- Go to **Credentials** → **Add Credential**
- Select **Google Sheets OAuth2 API**
- Follow OAuth2 setup flow
- Grant access to Google Sheets
- Name it: `Google Sheets`

### 3. Update Google Sheets IDs

Update the spreadsheet IDs in the workflow nodes:

**Results Sheet** (for qualified leads):
- Node: "Google Sheets - Add Qualified Lead"
- Node: "Google Sheets - Add Lead (No Website)"
- Current ID: `1wEcwHhN2n0x9ZvCEwPBwCjsd0r5io--nAyUdPzyCpTg`
- Sheet Name: `"Accountant" Results 10-14-2025`
- **Replace with your spreadsheet ID**

**Master List Sheet** (for deduplication):
- Node: "Google Sheets - Check Master List"
- Current ID: `1PNEVqUFcPLoWbbkP9BwJ4arIKlrP8ZO0SknKAYMQThU`
- Sheet Name: `Sheet1`
- **Replace with your spreadsheet ID**

**Recruiter Tracking Sheet**:
- Node: "Google Sheets - Add Recruiter"
- Current ID: `1PNEVqUFcPLoWbbkP9BwJ4arIKlrP8ZO0SknKAYMQThU`
- Sheet Name: `Sheet1`
- **Replace with your spreadsheet ID**

### 4. Activate Webhook

1. Click on the "Webhook - Quest LIJOBS" node
2. Copy the production webhook URL
3. Configure your Apify scraper to send data to this URL with payload:
   ```json
   {
     "dataset_id": "your-apify-dataset-id"
   }
   ```

### 5. Activate Workflow

1. Toggle the workflow to **Active**
2. Test with a sample webhook payload

## Key Differences from Make.com

### 1. **Filtering Logic**
   - Make.com uses built-in "Filter" conditions
   - N8N uses "IF" nodes for branching logic
   - Same functionality, different node type

### 2. **Router Nodes**
   - Make.com routers → N8N IF nodes with multiple output branches
   - Each branch connects to different paths

### 3. **OpenAI Integration**
   - Make.com has native OpenAI module
   - N8N uses HTTP Request node to call OpenAI API directly
   - Response parsing requires `JSON.parse()` in expressions

### 4. **Domain Extraction**
   - Make.com uses Regex Parser module
   - N8N uses Code node with JavaScript regex

### 5. **Google Sheets**
   - Make.com uses "Filter Rows" + "Add Row"
   - N8N uses "Append" operation with column mapping
   - You may need to adjust column mappings based on your sheet structure

## Expected Google Sheets Structure

### Results Sheet Columns:
```
A: applicantsCount
B: companyAddress
C: companyName
D: companySlogan
E: companyDescription
F: companyEmployeesCount
G: companyLinkedinUrl
H: companyWebsite
I: domain
J: id
K: link
L: title
M: postedAt
N: location
O: descriptionText
P: employmentType
Q: industries
R: jobFunction
S: jobPosterName
T: jobPosterProfileUrl
U: jobPosterTitle
V: email
W: email status
X: salary
Y: salaryInfo/0
Z: salaryInfo/1
AA: fit
AB: is_direct_employer
AC: is_accounting_finance_role
AD: role_title
AE: industry
AF: sub_niche (subniche)
AG: reason
...
BR: has_contact_instructions
BS: contact_email
```

## Testing

### Test with Sample Data

Send a POST request to your webhook URL:

```bash
curl -X POST https://your-n8n-instance.com/webhook/quest-lijobs-scrape \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_id": "your-test-dataset-id"
  }'
```

### Monitor Execution

1. Go to **Executions** tab in N8N
2. View execution logs for each run
3. Check for errors in individual nodes
4. Verify data is being written to Google Sheets

## Troubleshooting

### Common Issues:

1. **"Cannot read property 'content' of undefined"**
   - OpenAI API call failed
   - Check your API key and rate limits
   - Verify the HTTP Request node configuration

2. **Google Sheets Permission Denied**
   - Re-authenticate Google Sheets OAuth2
   - Verify spreadsheet sharing settings
   - Check spreadsheet IDs are correct

3. **Webhook Not Triggering**
   - Ensure workflow is activated
   - Check webhook URL is correct
   - Verify payload format matches expected structure

4. **Missing Data in Sheets**
   - Check column mappings in Google Sheets nodes
   - Verify your sheet has the correct column headers
   - Review execution logs for data transformation errors

## Rate Limiting

The workflow includes a 5-second wait between OpenAI API calls to avoid rate limits. Adjust this in the "Wait 5 Seconds" node if needed.

## Cost Considerations

- **OpenAI API**: ~$0.001 per job analyzed (GPT-4o-mini)
- **Apify**: Based on your subscription plan
- **Google Sheets API**: Free (within quota limits)
- **N8N**: Self-hosted (free) or cloud (paid plans)

## Maintenance

### Regular Updates:
- Monitor OpenAI token usage
- Clean up old executions in N8N
- Archive processed leads in Google Sheets
- Update ICP criteria in OpenAI system prompt as needed

## Support

For issues specific to:
- **N8N**: https://docs.n8n.io
- **Apify Integration**: https://docs.apify.com
- **OpenAI API**: https://platform.openai.com/docs

## Version History

- **v1.0** (2025-11-20): Initial N8N conversion from Make.com workflow
