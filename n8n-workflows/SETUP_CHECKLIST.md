# N8N Workflow Setup Checklist

## Pre-Import Checklist

- [ ] N8N instance is running (self-hosted or cloud)
- [ ] You have admin/workflow creation permissions
- [ ] All API accounts are active:
  - [ ] Google account with Google Sheets access
  - [ ] OpenAI account with API credits
  - [ ] Exa.ai account with API key
  - [ ] LeadMagic account with API key
  - [ ] Instantly.ai account with API key

## Import Steps

- [ ] Download `redline-recruiter-icp-cleaner.json`
- [ ] In N8N, navigate to **Workflows**
- [ ] Click **Import from File** or **Import from URL**
- [ ] Select the JSON file
- [ ] Verify all 11 nodes imported successfully

## Credential Configuration

### 1. Google Sheets OAuth2
- [ ] Open "Filter Google Sheets Rows" node
- [ ] Click **Select Credential** → **Create New**
- [ ] Follow Google OAuth2 flow
- [ ] Grant permissions to access Google Sheets
- [ ] Test connection
- [ ] Apply same credential to:
  - [ ] "Update Sheet (Valid Email)" node
  - [ ] "Update Sheet (Invalid Email)" node
  - [ ] "Update Sheet (Not A Fit)" node

### 2. OpenAI API
- [ ] Get API key from https://platform.openai.com/api-keys
- [ ] Open "QC ICP Fit - Redline Recruiters" node
- [ ] Click **Select Credential** → **Create New**
- [ ] Enter API key
- [ ] Test connection
- [ ] Apply same credential to:
  - [ ] "Company Name Normalizer" node

### 3. Exa AI API
- [ ] Get API key from https://exa.ai/
- [ ] Open "Exa AI - Get Website Content" node
- [ ] In **Header Parameters**:
  - [ ] Replace `YOUR_EXA_API_KEY` with actual key
- [ ] Save node

### 4. LeadMagic API
- [ ] Get API key from LeadMagic dashboard
- [ ] Open "Email Verifier" node
- [ ] In **Header Parameters**:
  - [ ] Replace `0d98d6f54a09045f887264696c3a8ed4` with YOUR key
- [ ] Save node

### 5. Instantly.ai API
- [ ] Get API key from https://app.instantly.ai/app/settings/integrations
- [ ] Open "Instantly - Add Lead" node
- [ ] Update the JSON body:
  - [ ] Replace credential placeholder with actual API key
  - [ ] OR create custom credential and reference it
- [ ] Save node

## Configuration Updates

### Update Google Sheet Target
- [ ] Open all Google Sheets nodes
- [ ] Update **Spreadsheet ID** from default to yours:
  - Current: `176d3pUIzMeVIRYZK6nosZosmGtFMLDDcQG2wTZsjhrc`
  - New: `YOUR_SPREADSHEET_ID`
- [ ] Verify **Sheet Name**: "Process and Upload Main" (or update)

### Update Instantly Campaign
- [ ] Open "Instantly - Add Lead" node
- [ ] In JSON body, update:
  - Current: `"campaign_id": "6a2d8d26-a94e-493b-ac73-6f1ef9e6fa52"`
  - New: `"campaign_id": "YOUR_CAMPAIGN_ID"`
- [ ] Save node

### Verify Column Mappings
- [ ] Open your Google Sheet
- [ ] Verify these columns exist:
  - [ ] Column A: name
  - [ ] Column B: first name
  - [ ] Column C: last name
  - [ ] Column D: email
  - [ ] Column H: company name
  - [ ] Column I: company website
  - [ ] Column J: domain
  - [ ] Column F: title
  - [ ] Column G: headline
  - [ ] Column AL: num employees
  - [ ] Column AG: Status (output)
  - [ ] Column W: fit (output)
- [ ] If different, update node mappings accordingly

## Testing

### Test Each Node Individually
- [ ] **Node 1 - Filter Google Sheets**:
  - [ ] Execute node
  - [ ] Verify it returns rows matching filter criteria
  - [ ] Check that email (D) and company website (I) exist

- [ ] **Node 2 - Exa AI Content**:
  - [ ] Execute node with test data
  - [ ] Verify website content is fetched
  - [ ] Check `text` field is populated

- [ ] **Node 3 - QC ICP Fit**:
  - [ ] Execute node
  - [ ] Verify JSON response contains:
    - [ ] `is_middleman` (true/false)
    - [ ] `is_decision_maker` (true/false)
    - [ ] `reasoning` (text)
    - [ ] If true fit: `recruitment_niche`, `ideal_client_profile`

- [ ] **Node 4 - IF True Fit**:
  - [ ] Test with true fit data
  - [ ] Verify it routes to Company Normalizer
  - [ ] Test with not-fit data
  - [ ] Verify it routes to Update Sheet (Not A Fit)

- [ ] **Node 5 - Company Normalizer**:
  - [ ] Execute with test company
  - [ ] Verify returns:
    - [ ] `normalized_company_name`
    - [ ] `subject_line` (all lowercase, max 3 words)

- [ ] **Node 6 - Email Verifier**:
  - [ ] Test with valid email
  - [ ] Verify returns `email_status: "valid"`
  - [ ] Test with invalid email
  - [ ] Verify returns other status

- [ ] **Node 7 - IF Valid Email**:
  - [ ] Test routing logic
  - [ ] Verify valid emails go to Instantly
  - [ ] Verify invalid emails skip to Update Sheet

- [ ] **Node 8 - Instantly Add Lead**:
  - [ ] Execute with test lead
  - [ ] Check Instantly.ai campaign
  - [ ] Verify lead was added
  - [ ] Confirm custom variables populated

- [ ] **Nodes 9-11 - Update Sheet**:
  - [ ] Test each update path
  - [ ] Verify correct columns are updated
  - [ ] Check values are formatted correctly

### Full Workflow Test
- [ ] Prepare test row in Google Sheet:
  - [ ] Has email (column D)
  - [ ] Has company website (column I)
  - [ ] Status (AG) is empty
  - [ ] Fit (W) is empty
- [ ] Execute entire workflow
- [ ] Verify end-to-end:
  - [ ] Row was processed
  - [ ] ICP analysis completed
  - [ ] Email validated
  - [ ] Lead added to Instantly (if valid)
  - [ ] Google Sheet updated with results

## Activation

- [ ] Set execution trigger:
  - [ ] Manual (for on-demand execution)
  - [ ] Webhook (for external triggers)
  - [ ] Schedule (e.g., every hour)
  - [ ] Google Sheets trigger (on new row)
- [ ] Configure error workflow:
  - [ ] Add error trigger
  - [ ] Set up notifications (Slack, email, etc.)
- [ ] Set execution settings:
  - [ ] Save execution data: YES (for debugging)
  - [ ] Timeout: 5 minutes (or adjust based on volume)
- [ ] Toggle **Active** to ON
- [ ] Monitor first few executions

## Monitoring & Optimization

### Week 1: Monitor Closely
- [ ] Check execution history daily
- [ ] Review error logs
- [ ] Verify data quality in Google Sheets
- [ ] Confirm leads in Instantly.ai are correct
- [ ] Track API usage/costs

### Week 2-4: Optimize
- [ ] Identify bottlenecks
- [ ] Optimize slow nodes
- [ ] Adjust AI prompts if needed
- [ ] Fine-tune filtering conditions
- [ ] Add any custom logic

### Ongoing Maintenance
- [ ] Weekly: Review execution metrics
- [ ] Monthly: Audit API costs
- [ ] Quarterly: Review and update AI prompts
- [ ] As needed: Update campaign IDs, sheet structure

## Common Issues & Solutions

### ❌ "Credential not found"
**Solution**: Re-create credential in N8N and select it in the node

### ❌ "Column not found in sheet"
**Solution**: Verify column letters match your actual sheet structure

### ❌ "OpenAI returns plain text instead of JSON"
**Solution**: Ensure `response_format: "json_object"` is set in options

### ❌ "Exa API 429 Too Many Requests"
**Solution**: Add rate limiting or increase delay between executions

### ❌ "Instantly.ai: Lead already exists"
**Solution**: This is expected behavior when `skip_if_in_workspace: true`

### ❌ "Workflow times out"
**Solution**: Reduce batch size or increase timeout in workflow settings

## Support Resources

- **N8N Documentation**: https://docs.n8n.io/
- **N8N Community**: https://community.n8n.io/
- **OpenAI API Docs**: https://platform.openai.com/docs
- **Exa AI Docs**: https://docs.exa.ai/
- **Instantly Docs**: https://help.instantly.ai/

---

**Workflow Status**: ⬜ Not Started | 🟡 In Progress | ✅ Complete

**Completion Date**: _______________

**Notes**:
-
-
-
