# Make.com to N8N Migration Guide
## Redline Recruiter ICP Cleaner Workflow

### Overview
This document explains the migration of the "Redline Recruiter ICP Cleaner - Recruiter W/ Active Listing" workflow from Make.com to N8N.

### Workflow Purpose
This workflow identifies and enriches decision-makers at recruiting firms who are actively hiring. It:
1. Filters Google Sheets for recruiters with active job listings
2. Enriches company and LinkedIn data via Exa AI
3. Uses AI to determine if they're decision-makers at recruiting firms
4. Normalizes company names, job titles, and person names
5. Finds verified email addresses
6. Adds qualified leads to Instantly.ai campaign
7. Updates Google Sheets with all enriched data

---

## Pre-Migration Checklist

### Required Services & Credentials
You'll need active accounts and API keys for:

- ✅ **Google Sheets** - OAuth2 credentials
- ✅ **Exa AI** - API key (for web scraping/enrichment)
- ✅ **OpenAI** - API key (for GPT-4o-mini)
- ✅ **LeadMagic** - API key (for email finding)
- ✅ **Instantly.ai** - API key (for lead management)

---

## Migration Steps

### Step 1: Import Workflow to N8N

1. Open your N8N instance
2. Go to **Workflows** → **Import from File**
3. Select `n8n-workflow-recruiter-icp-cleaner.json`
4. The workflow will be imported with placeholder credentials

### Step 2: Configure Credentials

You need to set up the following credentials in N8N:

#### 1. Google Sheets OAuth2 API
- Node: `Google Sheets - Filter Rows`, `Google Sheets - Update Valid`, `Google Sheets - Update Invalid`, `Google Sheets - Update Not Fit`
- Type: `OAuth2`
- Steps:
  1. Go to N8N **Credentials** → **Create New**
  2. Select **Google Sheets OAuth2 API**
  3. Follow Google OAuth flow
  4. Save credential ID and update all Google Sheets nodes

#### 2. OpenAI API
- Nodes: `OpenAI - QC ICP Fit`, `OpenAI - Company Name Normalizer`, `OpenAI - Subject Line`, `OpenAI - Normalize Name`
- Type: `API Key`
- Configuration:
  ```
  API Key: YOUR_OPENAI_API_KEY
  Organization ID: (optional)
  ```

#### 3. Exa AI API (Custom HTTP Auth)
- Nodes: `Exa AI - Company Website`, `Exa AI - LinkedIn Profile`
- Type: `Header Auth`
- Configuration:
  ```
  Name: X-API-Key
  Value: YOUR_EXA_API_KEY
  ```

#### 4. LeadMagic API (Custom HTTP Auth)
- Node: `HTTP - Email Finder`
- Type: Already configured in node headers
- Update the API key in node parameters:
  ```
  X-API-Key: YOUR_LEADMAGIC_API_KEY
  ```

#### 5. Instantly.ai API
- Node: `Instantly - Create Lead`
- Type: No credential needed - uses API key in request body
- Update in node parameters:
  ```
  api_key: YOUR_INSTANTLY_API_KEY
  campaign_id: YOUR_CAMPAIGN_ID
  ```

---

### Step 3: Update Specific Configuration Values

#### Google Sheets Configuration
1. **Spreadsheet ID**: `1PNEVqUFcPLoWbbkP9BwJ4arIKlrP8ZO0SknKAYMQThU`
   - Verify this is the correct spreadsheet
   - Sheet name: `Sheet1`

2. **Filter Conditions** (in `Google Sheets - Filter Rows` node):
   - Column W (email status): not exist
   - Column S (jobPosterName): exists
   - Column AJ (decision Maker): not exist

#### Instantly.ai Configuration
Update the campaign ID in the `Instantly - Create Lead` node:
```
campaign_id: "5f78c538-f946-4335-bd7c-e0c68dc8fed0"
```
(Or replace with your actual campaign ID)

#### LeadMagic API Key
Update in `HTTP - Email Finder` node headers:
```
X-API-Key: "0d98d6f54a09045f887264696c3a8ed4"
```
(Replace with your actual API key)

---

## Key Differences: Make.com vs N8N

### 1. **Routers → IF Nodes**
Make.com uses "Router" modules with filters. N8N uses "IF" nodes with conditions.

**Make.com:**
```
Router → Route 1 [filter: is_middleman=true AND is_decision_maker=true]
      → Route 2 [fallback]
```

**N8N:**
```
IF Node → True output (condition met)
       → False output (condition not met)
```

### 2. **Error Handling**
Make.com has built-in error handlers. N8N requires explicit configuration.

**Configuration in N8N:**
- In `Exa AI - Company Website` node: Set **Continue on Fail** = `true`
- This prevents the workflow from stopping if website scraping fails

### 3. **Data Mapping Syntax**

**Make.com:**
```
{{50.`2`}}  (module 50, field index 2)
```

**N8N:**
```
{{ $('Google Sheets - Filter Rows').item.json.companyName }}
```

### 4. **Array/Loop Processing**
Both platforms auto-loop over arrays, but N8N makes it more explicit in the UI.

### 5. **Date Formatting**

**Make.com:**
```
{{formatDate(now; "MM-DD-YYYY")}}
```

**N8N:**
```
{{ $now.format('MM-DD-YYYY') }}
```

---

## Workflow Node Mapping

| Make.com Module | N8N Node | Type |
|-----------------|----------|------|
| Google Sheets Filter Rows (50) | Google Sheets - Filter Rows | Google Sheets |
| Exa AI List Content (91) | Exa AI - Company Website | HTTP Request |
| Exa AI List Content (64) | Exa AI - LinkedIn Profile | HTTP Request |
| OpenAI QC ICP Fit (69) | OpenAI - QC ICP Fit | OpenAI |
| Router (73) | IF - True Fit | IF |
| OpenAI Normalizer (84) | OpenAI - Company Name Normalizer | OpenAI |
| OpenAI Subject Line (70) | OpenAI - Subject Line | OpenAI |
| OpenAI Name Parser (83) | OpenAI - Normalize Name | OpenAI |
| HTTP Email Finder (65) | HTTP - Email Finder | HTTP Request |
| Router (76) | IF - Valid Email | IF |
| Instantly Create Lead (71) | Instantly - Create Lead | HTTP Request |
| Google Sheets Update (89) | Google Sheets - Update Valid | Google Sheets |
| Google Sheets Update (88) | Google Sheets - Update Invalid | Google Sheets |
| Google Sheets Update (72) | Google Sheets - Update Not Fit | Google Sheets |

---

## Testing the Workflow

### Step 1: Test with Single Row
1. In the `Google Sheets - Filter Rows` node, add a limit:
   ```
   Options → Limit: 1
   ```
2. Execute the workflow manually
3. Check each node's output to verify data flow

### Step 2: Verify Each Branch

**Test "True Fit" Branch:**
- Ensure `is_middleman = true` AND `is_decision_maker = true`
- Verify email is found
- Check lead is added to Instantly
- Verify Google Sheet is updated

**Test "Not Fit" Branch:**
- Ensure `is_middleman = false` OR `is_decision_maker = false`
- Verify Google Sheet is updated with reason

**Test "Invalid Email" Branch:**
- Simulate invalid email response
- Verify Google Sheet is updated with error message

### Step 3: Full Production Test
1. Remove the limit from Google Sheets node
2. Run workflow on 5-10 rows
3. Monitor execution time and API costs
4. Verify all Google Sheets updates

---

## Cost Optimization

### OpenAI API Costs
The workflow makes **4 OpenAI API calls per lead**:
1. QC ICP Fit (gpt-4o-mini, ~1080 tokens)
2. Company Name Normalizer (gpt-4o-mini, ~256 tokens)
3. Subject Line (gpt-4o-mini, ~256 tokens)
4. Normalize Name (gpt-4o-mini, ~1080 tokens)

**Estimated cost per lead**: ~$0.002-0.004 (based on GPT-4o-mini pricing)

**Optimization tips:**
- Use batch processing to reduce API overhead
- Cache results for duplicate companies/people
- Consider using GPT-3.5-turbo for simpler tasks (name normalization)

### Exa AI Costs
- 2 API calls per lead (company website + LinkedIn profile)
- Check Exa AI pricing for current rates

### LeadMagic Costs
- 1 email finder call per qualified lead
- Typically charged per valid email found

---

## Troubleshooting

### Common Issues

#### 1. **Google Sheets: "Unable to find row"**
**Cause**: The filter returned no results
**Solution**:
- Check filter conditions match your data
- Verify column letters are correct (W, S, AJ)

#### 2. **Exa AI: "Invalid URL"**
**Cause**: Website or LinkedIn URL is malformed
**Solution**:
- Enable "Continue on Fail" in Exa nodes
- Add IF condition to check URL exists before calling Exa

#### 3. **OpenAI: "Invalid JSON response"**
**Cause**: AI didn't return properly formatted JSON
**Solution**:
- Increase temperature to 0 for more deterministic output
- Add explicit JSON validation after OpenAI nodes
- Use "Try-Catch" in N8N for error handling

#### 4. **LeadMagic: "Rate limit exceeded"**
**Cause**: Too many requests in short time
**Solution**:
- Add "Wait" node between iterations (e.g., 1-2 seconds)
- Implement batch processing with delays

#### 5. **Instantly: "Lead already exists"**
**Cause**: Email already in campaign/workspace
**Solution**:
- This is expected behavior with skip flags enabled
- Monitor response to track skipped vs added leads

---

## Advanced Enhancements (Post-Migration)

### 1. Add Webhook Trigger
Replace manual execution with automated trigger:
- Set up N8N webhook trigger
- Connect to Google Sheets onChange event
- Auto-process new rows when added

### 2. Add Retry Logic
Implement exponential backoff for API failures:
- Use N8N's "Execute Workflow" node
- Add retry counter variable
- Implement delay between retries

### 3. Add Monitoring & Alerts
- Use N8N's "Send Email" node to alert on errors
- Log all executions to a separate Google Sheet
- Track success/failure rates

### 4. Parallel Processing
N8N supports parallel execution:
- Use "Split In Batches" node
- Process multiple leads simultaneously
- Respect API rate limits

---

## Support & Resources

### N8N Documentation
- [N8N Nodes Library](https://docs.n8n.io/integrations/builtin/app-nodes/)
- [Expression Syntax](https://docs.n8n.io/code-examples/expressions/)
- [Error Handling](https://docs.n8n.io/workflows/error-handling/)

### API Documentation
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Exa AI Docs](https://docs.exa.ai/)
- [LeadMagic Docs](https://docs.leadmagic.io/)
- [Instantly API Docs](https://developer.instantly.ai/)

### Community Support
- [N8N Community Forum](https://community.n8n.io/)
- [N8N Discord](https://discord.gg/n8n)

---

## Maintenance Schedule

### Daily
- Monitor workflow execution logs
- Check for API errors
- Verify Google Sheets updates

### Weekly
- Review lead quality in Instantly
- Analyze AI classification accuracy
- Optimize prompts if needed

### Monthly
- Review API costs vs budget
- Update filters based on results
- Refine ICP criteria in prompts

---

## Questions?

If you encounter issues during migration:
1. Check N8N execution logs for detailed error messages
2. Verify all credentials are properly configured
3. Test each node individually before running full workflow
4. Consult N8N community forums for platform-specific issues

Good luck with your migration! 🚀
