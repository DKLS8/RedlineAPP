# Implementation Checklist - Complete Workflow

## What This Workflow Does

1. ✅ Reads URLs from a Google Sheet
2. ✅ Filters for URLs without Dataset IDs (not scraped yet)
3. ✅ Loops over each URL one at a time
4. ✅ Scrapes companies with Apify
5. ✅ Loops over each company result
6. ✅ Checks if company already exists in master list
7. ✅ Filters for companies <500 employees
8. ✅ Sends ONE company at a time to OpenAI for analysis

---

## Quick Setup Checklist

### Part 1: Initial URL Filtering (NEW)

- [ ] **Add Node 1:** Google Sheets - Read URLs to Scrape
  - [ ] Set Document ID to your URLs sheet
  - [ ] Set Sheet name
  - [ ] Position at -1000, -64

- [ ] **Add Node 2:** IF - Filter Empty Dataset ID
  - [ ] Condition: `={{ $json['Dataset ID'] }}` is empty
  - [ ] Position at -780, -64

- [ ] **Connect:** URLs Sheet → IF node (TRUE branch) → Master List

### Part 2: Duplicate Company Checking (CORE FIX)

- [ ] **Move Node:** Google Sheets - Read Master List ONCE
  - [ ] Should now be at position -560, -64
  - [ ] Reads ALL 2,891 companies (no filter)

- [ ] **Add Node 3:** Code - Check if Company Exists
  - [ ] Position at 320, -32
  - [ ] Paste code from `code-node-snippet.js`
  - [ ] Place AFTER "Loop Over Items1"

- [ ] **Update connections:**
  - [ ] Loop Over Items1 → Code node
  - [ ] Code node → Filter - Less Than 500 Employees

- [ ] **Remove old node:** "Google Sheets - Check Master List" (the one that was inside the loop)

### Part 3: Verify Workflow Flow

- [ ] Workflow starts with: Google Sheets - Read URLs
- [ ] Filters URLs without Dataset ID
- [ ] Reads master list ONCE
- [ ] Loops over filtered URLs
- [ ] Runs Apify for each URL
- [ ] Loops over each Apify result
- [ ] Code checks if company exists
- [ ] Filters for <500 employees
- [ ] Sends to OpenAI one at a time

---

## Critical Settings to Verify

### Google Sheets - Read URLs to Scrape
```json
{
  "documentId": "YOUR_ACTUAL_SHEET_ID",
  "sheetName": "Sheet1 or your actual name",
  "operation": "read"
}
```

### IF - Filter Empty Dataset ID
```javascript
Value 1: ={{ $json['Dataset ID'] }}
Operation: is empty
```
⚠️ **Important:** Replace `'Dataset ID'` with your exact column name

### Code - Check if Company Exists
```javascript
// Make sure this line matches your master list node name:
const masterList = $('Google Sheets - Read Master List ONCE').all();

// Make sure this matches your column name in the master sheet:
const masterCompanyName = item.json.companyName || item.json['Company Name'] || '';
```

---

## Testing Plan

### Test 1: URL with Empty Dataset ID
1. Add a row to your URLs sheet with no Dataset ID
2. Run workflow
3. **Expected:** URL is scraped by Apify

### Test 2: URL with Existing Dataset ID
1. Add a row with a Dataset ID filled in
2. Run workflow
3. **Expected:** URL is skipped (not scraped)

### Test 3: Company Already in Master List
1. Ensure a company name exists in master sheet
2. Scrape a URL that returns that company
3. **Expected:** Company is filtered out by Code node

### Test 4: New Company Not in Master List
1. Scrape a URL that returns a new company
2. **Expected:** Company passes through Code node
3. **Expected:** Reaches OpenAI if <500 employees

### Test 5: Large Company (>500 employees)
1. Scrape a company with >500 employees
2. **Expected:** Filtered out by employee count filter

### Test 6: Full End-to-End
1. Add 3 URLs to your sheet (2 without Dataset ID, 1 with)
2. Run complete workflow
3. **Expected:** Only 2 URLs are processed
4. **Expected:** Only new companies reach OpenAI
5. **Expected:** Companies >500 employees are filtered out

---

## Common Column Name Variations

Your Google Sheet might use different column names. Update the workflow accordingly:

### URL Column
- `URL` → `={{ $json.URL }}`
- `url` → `={{ $json.url }}`
- `Job URL` → `={{ $json['Job URL'] }}`
- `Link` → `={{ $json.Link }}`

### Dataset ID Column
- `Dataset ID` → `={{ $json['Dataset ID'] }}`
- `DatasetID` → `={{ $json.DatasetID }}`
- `dataset_id` → `={{ $json.dataset_id }}`
- `Apify Dataset` → `={{ $json['Apify Dataset'] }}`

### Company Name Column (in master list)
- `companyName` → `item.json.companyName`
- `Company Name` → `item.json['Company Name']`
- `company_name` → `item.json.company_name`
- `Company` → `item.json.Company`

---

## Workflow Files Reference

| File | Purpose |
|------|---------|
| `n8n-workflow-complete.json` | **USE THIS** - Complete workflow with URL filtering |
| `n8n-workflow-fixed.json` | Old version without URL filtering |
| `URL-FILTER-SETUP.md` | Detailed guide for URL filtering setup |
| `SOLUTION-GUIDE.md` | Detailed guide for duplicate checking |
| `QUICK-FIX-SUMMARY.md` | Quick reference for the core fix |
| `code-node-snippet.js` | Code to paste in Code node |
| `IMPLEMENTATION-CHECKLIST.md` | This file - setup checklist |

---

## Visual Workflow Structure

```
START
  ↓
┌─────────────────────────────────────────┐
│ Google Sheets - Read URLs to Scrape     │ ← Read ALL rows
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ IF - Filter Empty Dataset ID            │ ← Only URLs not scraped yet
└─────────────────────────────────────────┘
  ↓ (TRUE branch - no dataset ID)
┌─────────────────────────────────────────┐
│ Google Sheets - Read Master List ONCE   │ ← Read ALL 2,891 companies
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ Loop Over Items                          │ ← Loop over filtered URLs
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ Run an Actor and get dataset            │ ← Apify scrapes 1 URL
└─────────────────────────────────────────┘
  ↓ (returns N companies)
┌─────────────────────────────────────────┐
│ Loop Over Items1                         │ ← Loop over each company
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ Code - Check if Company Exists          │ ← Compare to master list
└─────────────────────────────────────────┘
  ↓ (only if NEW company)
┌─────────────────────────────────────────┐
│ Filter - Less Than 500 Employees        │ ← Check size
└─────────────────────────────────────────┘
  ↓ (only if <500)
┌─────────────────────────────────────────┐
│ OpenAI - QC ICP Fit Analysis            │ ← 1 company at a time
└─────────────────────────────────────────┘
  ↓
  Loop back to Loop Over Items1
```

---

## Success Criteria

After setup, your workflow should:
- ✅ Only process URLs without Dataset IDs
- ✅ Read master list once (not 2,891 times)
- ✅ Skip companies already in master list
- ✅ Filter out companies >500 employees
- ✅ Send ONE company at a time to OpenAI
- ✅ Not stop on zero results
- ✅ Not flood OpenAI with thousands of items

---

## Troubleshooting Quick Reference

| Issue | Check |
|-------|-------|
| All URLs filtered out | Column name in IF node matches your sheet |
| Workflow stops | Code node returns `[]` not nothing |
| All companies pass through | Master list node name in code is correct |
| OpenAI gets flooded | Verify Code node is in the right position |
| Can't find company column | Update column name in Code node |

---

## Next Steps

1. ✅ Import `n8n-workflow-complete.json` OR follow checklist to add nodes
2. ✅ Update Google Sheet IDs
3. ✅ Update column names to match your sheets
4. ✅ Test with 1-2 URLs first
5. ✅ Run full workflow
6. ✅ Monitor execution logs

---

## Need Help?

- **URL Filtering issues** → See `URL-FILTER-SETUP.md`
- **Duplicate checking issues** → See `SOLUTION-GUIDE.md`
- **Quick reference** → See `QUICK-FIX-SUMMARY.md`
- **Code questions** → See `code-node-snippet.js` (fully commented)
