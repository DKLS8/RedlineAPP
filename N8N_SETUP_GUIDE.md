# N8N Campaign Analytics Setup Guide

## Overview
This workflow migrates your Make.com Campaign Analytics workflow to n8n. It fetches Instantly.ai campaign analytics for the last 7 days, including email copy (subject and body) for each step and variant, and writes everything to Google Sheets.

## What This Workflow Does

1. **Fetches Step & Variant Analytics** - Gets performance metrics (sent, replies, etc.) for each step and variant from Instantly.ai API
2. **Writes Analytics to Google Sheets** - Adds new rows with the analytics data
3. **Fetches Campaign Details** - Gets the campaign structure including all sequences, steps, and variants
4. **Extracts Email Copy** - Pulls the subject line and body copy for each variant
5. **Updates Google Sheets** - Adds the email copy to the corresponding rows

## Prerequisites

### 1. n8n Installation
- Self-hosted n8n instance OR n8n Cloud account
- Access to n8n workflow editor

### 2. Instantly.ai API Key
- Your API key: `NGQ1MTJhMDQtNjliNy00MDMwLWE0MWMtMGQ3NmYyN2EyY2I5OnJ2aUVyQXdRUG9abg==`
- API documentation: https://developer.instantly.ai/

### 3. Google Sheets Access
- Google account with access to your analytics spreadsheet
- Spreadsheet ID: `1DN7BweGYYi-RfvZ9eRB7cQtb8JGDzGMZ_0E5_zvsdNo`
- Sheet name: `Campaign Analytics`

## Setup Instructions

### Step 1: Import the Workflow

1. Open your n8n instance
2. Click on **"Workflows"** in the left sidebar
3. Click **"Import from File"** or **"Add Workflow"** → **"Import from File"**
4. Select the `n8n-campaign-analytics-workflow.json` file
5. The workflow will be imported with all nodes configured

### Step 2: Configure Instantly.ai API Credentials

1. In the workflow, click on the **"Get Step & Variant Analytics"** node
2. Under **"Credential for Header Auth"**, click **"Create New Credential"**
3. Select **"Header Auth"** credential type
4. Configure as follows:
   - **Name**: `Instantly API`
   - **Header Name**: `Authorization`
   - **Header Value**: `Bearer NGQ1MTJhMDQtNjliNy00MDMwLWE0MWMtMGQ3NmYyN2EyY2I5OnJ2aUVyQXdRUG9abg==`
5. Click **"Create"**
6. Apply the same credential to the **"Get Campaign Details"** node

### Step 3: Configure Google Sheets Credentials

1. Click on the **"Add Analytics to Google Sheets"** node
2. Under **"Credential to connect with"**, click **"Create New Credential"**
3. Select **"Google Sheets OAuth2 API"**
4. Follow the OAuth2 authentication flow:
   - Click **"Sign in with Google"**
   - Select your Google account
   - Grant permissions to n8n
5. Click **"Create"**
6. Apply the same credential to:
   - **"Read Google Sheets Rows"** node
   - **"Update Sheet with Copy"** node

### Step 4: Update Campaign Configuration

In the **"Set API & Date Variables"** node, update these values:

```javascript
{
  "API_KEY": "YOUR_INSTANTLY_API_KEY",  // Already set
  "campaign_id": "YOUR_CAMPAIGN_ID",     // Update this
  "campaign_name": "YOUR_CAMPAIGN_NAME", // Update this
  "start_date": "={{ $now.minus({ days: 7 }).toFormat('MM-dd-yyyy') }}", // Last 7 days
  "end_date": "={{ $now.toFormat('MM-dd-yyyy') }}" // Today
}
```

**How to find your Campaign ID and Name:**
1. Go to Instantly.ai dashboard
2. Open your campaign
3. The Campaign ID is in the URL: `https://app.instantly.ai/app/campaigns/YOUR-CAMPAIGN-ID`
4. The Campaign Name is displayed at the top of the campaign page

### Step 5: Configure Your Google Sheet

Your Google Sheet should have these column headers (in row 1):

| Date | Campaign Name | Campaign ID | Campaign Status | Step | Variant | Sent | Replies | Subject | Body |
|------|---------------|-------------|-----------------|------|---------|------|---------|---------|------|

**Column Descriptions:**
- **Date**: The date the analytics were pulled
- **Campaign Name**: Name of your Instantly campaign
- **Campaign ID**: Unique ID of your campaign
- **Campaign Status**: Campaign status (1 = active)
- **Step**: Email sequence step number (0-indexed)
- **Variant**: Variant number within the step (0-indexed)
- **Sent**: Number of emails sent
- **Replies**: Number of replies received
- **Subject**: Email subject line
- **Body**: Email body (converted from HTML to plain text)

### Step 6: Test the Workflow

1. Click **"Execute Workflow"** at the bottom right
2. Check each node's output by clicking on it
3. Verify data is being written to your Google Sheet
4. Check that:
   - Analytics data is added as new rows
   - Subject and Body columns are populated correctly
   - HTML is converted to plain text properly

## Workflow Node Descriptions

### 1. Set API & Date Variables
- **Type**: Set node
- **Purpose**: Configures API key, campaign details, and date range
- **Date Logic**:
  - Start date: 7 days ago
  - End date: Today
  - Format: MM-DD-YYYY

### 2. Get Step & Variant Analytics
- **Type**: HTTP Request node
- **API Endpoint**: `GET /api/v2/campaigns/analytics/steps`
- **Purpose**: Fetches performance analytics for each step/variant combination
- **Returns**: Array of analytics objects with step, variant, sent, replies, etc.

### 3. Split Step Analytics Array
- **Type**: Split Out node
- **Purpose**: Converts the analytics array into individual items for processing
- **Output**: One item per step/variant combination

### 4. Add Analytics to Google Sheets
- **Type**: Google Sheets node (Append)
- **Purpose**: Adds new rows with analytics data
- **Columns Written**: Date, Campaign Name, Campaign ID, Status, Step, Variant, Sent, Replies

### 5. Get Campaign Details
- **Type**: HTTP Request node
- **API Endpoint**: `GET /api/v2/campaigns`
- **Purpose**: Fetches full campaign structure including sequences and variants
- **Returns**: Campaign object with all email copy

### 6. Extract Campaign Sequence
- **Type**: Code node (JavaScript)
- **Purpose**: Parses the campaign response and extracts the sequence structure
- **Output**: Structured sequence data with steps and variants

### 7. Read Google Sheets Rows
- **Type**: Google Sheets node (Read)
- **Purpose**: Reads all existing rows from the sheet to update with email copy
- **Output**: All rows with their current data

### 8. Extract Subject & Body Copy
- **Type**: Code node (JavaScript)
- **Purpose**:
  - Matches each sheet row to its corresponding step/variant in the campaign
  - Extracts the subject and body copy
  - Converts HTML body to plain text
- **HTML Conversion**: Removes tags, converts `<br>` and `<div>` to newlines

### 9. Update Sheet with Copy
- **Type**: Google Sheets node (Update)
- **Purpose**: Updates existing rows with Subject and Body columns
- **Matching**: Uses Step, Variant, and Campaign ID to find correct rows

## Scheduling the Workflow

To run this workflow automatically every day:

### Option 1: Add a Schedule Trigger

1. Click **"Add first step"** at the top of the workflow
2. Select **"Schedule Trigger"**
3. Configure:
   - **Trigger Interval**: Days
   - **Days Between Triggers**: 1
   - **Trigger at Hour**: Choose your preferred time (e.g., 9 AM)
   - **Trigger at Minute**: 0
4. Connect the Schedule Trigger to **"Set API & Date Variables"**

### Option 2: Use a Cron Expression

1. Add a **"Cron"** node instead
2. Set the cron expression: `0 9 * * *` (runs daily at 9 AM)
3. Connect to **"Set API & Date Variables"**

### Option 3: Use n8n Cloud Schedule

If using n8n Cloud:
1. Save and activate the workflow
2. Go to workflow settings
3. Enable **"Active"** toggle
4. The schedule trigger will run automatically

## Customization Options

### Change Date Range

Modify the **"Set API & Date Variables"** node:

```javascript
// Last 30 days instead of 7
"start_date": "={{ $now.minus({ days: 30 }).toFormat('MM-dd-yyyy') }}"

// Last month
"start_date": "={{ $now.minus({ months: 1 }).startOf('month').toFormat('MM-dd-yyyy') }}"
"end_date": "={{ $now.minus({ months: 1 }).endOf('month').toFormat('MM-dd-yyyy') }}"

// This week
"start_date": "={{ $now.startOf('week').toFormat('MM-dd-yyyy') }}"
"end_date": "={{ $now.toFormat('MM-dd-yyyy') }}"
```

### Track Multiple Campaigns

To track multiple campaigns in a single workflow:

1. **Option A**: Duplicate the workflow for each campaign
   - Clone the workflow
   - Update campaign_id and campaign_name in variables
   - Use different schedule times to avoid conflicts

2. **Option B**: Modify workflow to loop through campaigns
   - Replace **"Set API & Date Variables"** with a list of campaigns
   - Add a **"Split Out"** node to process each campaign
   - This is more advanced but more efficient

### Add More Metrics

The Instantly API returns additional metrics you can add:

- `opened` - Number of opens
- `unique_opened` - Unique opens
- `clicks` - Number of clicks
- `unique_clicks` - Unique clicks
- `unique_replies` - Unique reply count

Update the **"Add Analytics to Google Sheets"** node to include these:

```javascript
"Opened": "={{ $json.opened }}",
"Unique Opened": "={{ $json.unique_opened }}",
"Clicks": "={{ $json.clicks }}",
"Unique Clicks": "={{ $json.unique_clicks }}"
```

And add corresponding columns to your Google Sheet.

### Improve HTML to Text Conversion

The current HTML conversion is basic. For better results, you can:

1. Install the `html-to-text` npm package in your n8n instance
2. Update the **"Extract Subject & Body Copy"** node:

```javascript
const { htmlToText } = require('html-to-text');

const plainTextBody = htmlToText(body, {
  wordwrap: false,
  preserveNewlines: true
});
```

## Troubleshooting

### Error: "Unauthorized" or "403"
- **Cause**: Invalid Instantly API key
- **Fix**: Verify your API key in the Header Auth credential

### Error: "Campaign not found"
- **Cause**: Invalid campaign_id or campaign_name
- **Fix**: Check the campaign ID/name in Instantly.ai dashboard

### Error: Google Sheets permission denied
- **Cause**: n8n doesn't have access to the spreadsheet
- **Fix**:
  1. Open the Google Sheet
  2. Click "Share"
  3. Add your n8n Google account
  4. Grant "Editor" permissions

### No data returned from API
- **Cause**: No analytics data for the selected date range
- **Fix**:
  1. Check if campaign was active during the date range
  2. Try a wider date range
  3. Verify campaign has sent emails

### Subject/Body columns are empty
- **Cause**: Sequence extraction failed or step/variant numbers don't match
- **Fix**:
  1. Check the **"Extract Campaign Sequence"** node output
  2. Verify the sequence has steps and variants
  3. Ensure Step and Variant numbers in sheet match campaign structure (0-indexed)

### Duplicate rows in Google Sheets
- **Cause**: Workflow ran multiple times for same date
- **Fix**:
  1. Add a filter to check if data for today already exists
  2. Use "Update" instead of "Append" operation
  3. Clear duplicate rows manually

## Differences from Make.com Workflow

### Architecture Changes

| Make.com | n8n | Notes |
|----------|-----|-------|
| Router module | Multiple connections from one node | n8n executes branches in parallel |
| Iterator module | Split Out node | n8n has built-in array splitting |
| Set Variables | Set node | Similar functionality |
| Get Variable | Expression `$('NodeName').item.json.field` | n8n references other nodes directly |
| HTML to Text | Code node with JavaScript | Custom implementation |

### Execution Flow

**Make.com**: Uses routes that execute sequentially based on filters
**n8n**: Executes all connected nodes automatically, use IF nodes for conditional logic

### Data References

**Make.com**: `{{12.sequence.steps}}`
**n8n**: `{{ $('Extract Campaign Sequence').item.json.sequence.steps }}`

## Support and Resources

### n8n Documentation
- Official Docs: https://docs.n8n.io/
- Community Forum: https://community.n8n.io/
- YouTube Tutorials: https://www.youtube.com/c/n8n-io

### Instantly API
- API Documentation: https://developer.instantly.ai/
- Support: https://instantly.ai/support

### Additional Help
- n8n Discord: https://discord.gg/n8n
- n8n Community: https://community.n8n.io/

## Next Steps

1. ✅ Import the workflow
2. ✅ Configure API credentials
3. ✅ Set up Google Sheets connection
4. ✅ Update campaign variables
5. ✅ Test the workflow
6. ✅ Add a schedule trigger
7. ✅ Activate the workflow
8. 📊 Monitor your analytics!

---

**Last Updated**: November 2025
**Workflow Version**: 1.0
**n8n Compatibility**: v1.0+
