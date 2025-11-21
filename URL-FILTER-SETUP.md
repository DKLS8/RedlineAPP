# Adding URL Filtering for Empty Dataset IDs

## Overview

This guide shows you how to add the initial step to your workflow that:
1. Reads URLs from a Google Sheet
2. Filters for URLs that DON'T have a Dataset ID yet (not scraped)
3. Only processes those URLs through Apify

---

## Complete Workflow Flow

```
1. Google Sheets - Read URLs to Scrape
   ↓
2. IF - Filter Empty Dataset ID (only URLs without dataset ID)
   ↓
3. Google Sheets - Read Master List ONCE (for duplicate checking)
   ↓
4. Loop Over Items (loop over filtered URLs)
   ↓
5. Run Apify Scraper
   ↓
6. Loop Over Items1 (loop over each Apify result)
   ↓
7. Code - Check if Company Exists
   ↓
8. Filter - Less Than 500 Employees
   ↓
9. OpenAI - QC ICP Fit Analysis
   ↓
   Loop back to step 6
```

---

## Step-by-Step Setup

### Step 1: Add Google Sheets Node for URLs

**Position:** At the very beginning (before everything)

**Node Name:** `Google Sheets - Read URLs to Scrape`

**Settings:**
- **Operation:** Read
- **Document ID:** Your Google Sheet ID with URLs
- **Sheet Name:** The sheet containing URLs and dataset IDs
- **Range:** Leave empty (read all rows)

**Expected Sheet Structure:**
```
| URL                           | Dataset ID    | Status    |
|-------------------------------|---------------|-----------|
| https://linkedin.com/jobs/... |               | Pending   |
| https://linkedin.com/jobs/... | abc123def456  | Complete  |
| https://linkedin.com/jobs/... |               | Pending   |
```

**Column Names to Use:**
- `URL` - The LinkedIn job search URL to scrape
- `Dataset ID` - The Apify dataset ID (empty if not scraped yet)
- Any other columns you want

---

### Step 2: Add IF Node to Filter Empty Dataset IDs

**Position:** After "Google Sheets - Read URLs to Scrape"

**Node Name:** `IF - Filter Empty Dataset ID`

**Settings:**
- **Condition Type:** String
- **Value 1:** `={{ $json['Dataset ID'] }}`
- **Operation:** `is empty`

**Alternative if your column name is different:**
- If your column is named "DatasetID": `={{ $json.DatasetID }}`
- If your column is named "dataset_id": `={{ $json.dataset_id }}`

**What this does:**
- **TRUE branch:** Dataset ID is empty → URL hasn't been scraped → Continue
- **FALSE branch:** Dataset ID exists → URL already scraped → Skip

**Connect:**
- TRUE output → "Google Sheets - Read Master List ONCE"

---

### Step 3: Update Connections

**Old first node:** "Google Sheets - Read Master List ONCE"

**New flow:**
```
Google Sheets - Read URLs to Scrape
   ↓
IF - Filter Empty Dataset ID (TRUE branch)
   ↓
Google Sheets - Read Master List ONCE
   ↓
... rest of workflow
```

---

## Code Snippet for IF Node

If you prefer to use a Code node instead of the IF node:

```javascript
// Get the current row data
const row = $input.first().json;

// Check if Dataset ID is empty
const datasetID = row['Dataset ID'] || row.DatasetID || row.dataset_id || '';

// If Dataset ID is empty, this URL needs to be scraped
if (datasetID === '' || datasetID === null || datasetID === undefined) {
  // Pass through - URL needs scraping
  return [row];
}

// Dataset ID exists - skip this URL
return [];
```

---

## Alternative: Using Code Node for Complex Filtering

If you need more complex filtering (e.g., only URLs from the last week, or specific statuses):

**Node Name:** `Code - Filter URLs to Process`

```javascript
const rows = $input.all().map(item => item.json);
const filteredRows = [];

for (const row of rows) {
  const datasetID = row['Dataset ID'] || row.DatasetID || '';
  const status = row.Status || '';

  // Filter logic
  const shouldProcess = (
    datasetID === '' &&           // No dataset ID
    status !== 'Complete' &&      // Not already complete
    row.URL &&                    // URL exists
    row.URL.includes('linkedin')  // Is a LinkedIn URL
  );

  if (shouldProcess) {
    filteredRows.push(row);
  }
}

return filteredRows.map(row => ({ json: row }));
```

---

## Testing

### Test Case 1: Empty Dataset ID
**Input:**
```json
{
  "URL": "https://linkedin.com/jobs/...",
  "Dataset ID": "",
  "Status": "Pending"
}
```
**Expected:** Should pass through and be scraped

### Test Case 2: Existing Dataset ID
**Input:**
```json
{
  "URL": "https://linkedin.com/jobs/...",
  "Dataset ID": "abc123def456",
  "Status": "Complete"
}
```
**Expected:** Should be filtered out (not scraped again)

### Test Case 3: Null Dataset ID
**Input:**
```json
{
  "URL": "https://linkedin.com/jobs/...",
  "Dataset ID": null
}
```
**Expected:** Should pass through and be scraped

---

## Common Issues

### Issue: All URLs are being filtered out

**Solution:** Check your column name in the Google Sheet. The column name in the IF node must EXACTLY match.

**Debug:** Add a Code node before the IF to log data:
```javascript
console.log('Row data:', $input.first().json);
console.log('Column names:', Object.keys($input.first().json));
return [$input.first().json];
```

---

### Issue: IF node shows error "Cannot read property"

**Solution:** Your column name doesn't match. Check the exact column name from your Google Sheet.

Common variations:
- `Dataset ID` (with space)
- `DatasetID` (no space)
- `dataset_id` (underscore)

Use this in IF node: `={{ $json['Dataset ID'] }}` (with brackets and quotes for spaces)

---

### Issue: Need to filter by multiple conditions

**Solution:** Use a Code node instead of IF node:

```javascript
const row = $input.first().json;

const datasetID = row['Dataset ID'] || '';
const status = row.Status || '';
const createdDate = new Date(row['Created Date'] || Date.now());
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

// Multiple conditions
if (
  datasetID === '' &&                    // No dataset ID
  status === 'Pending' &&                // Status is pending
  createdDate >= sevenDaysAgo            // Created in last 7 days
) {
  return [row]; // Process this URL
}

return []; // Skip
```

---

## Complete Workflow JSON

The complete workflow with URL filtering is saved in:
- **`n8n-workflow-complete.json`** - Import this into n8n

**Important:** Update these values in the workflow:
1. `YOUR_URL_SHEET_ID` - Replace with your actual Google Sheet ID
2. Sheet name - Update to match your sheet name
3. Column names - Update `'Dataset ID'` if your column has a different name

---

## Next Steps After Setup

1. ✅ Import the workflow or add the two new nodes
2. ✅ Update the Google Sheet ID and column names
3. ✅ Test with a single row that has an empty Dataset ID
4. ✅ Verify the row passes through to the Apify scraper
5. ✅ Run the full workflow
6. ✅ After scraping, update the Google Sheet with the Dataset ID (optional)

---

## Optional: Writing Dataset ID Back to Sheet

After Apify runs, you can write the Dataset ID back to the Google Sheet to mark it as scraped.

**Add after OpenAI node:**

**Node:** Google Sheets - Update Row with Dataset ID

**Settings:**
- Operation: Update
- Document: Your URLs sheet
- Sheet: Your sheet name
- Column to Match On: URL
- Value to Match: `={{ $('Loop Over Items').item.json.URL }}`
- Values to Update:
  - `Dataset ID` = `={{ $('Run an Actor and get dataset').item.json.datasetId }}`
  - `Status` = `Complete`

This will mark the URL as processed so it won't be scraped again next time.
