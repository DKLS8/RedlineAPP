# N8N Workflow Fix - Checking Company Duplicates

## The Problem

Your workflow needs to:
1. Loop over URLs and scrape companies with Apify
2. Check if each scraped company already exists in the master Google Sheet
3. Skip companies that already exist
4. Only send NEW companies (not in master list) to the OpenAI module

**Current Issue:**
- Filtering Google Sheets = 0 results = workflow stops
- Not filtering = 2,891 items flood downstream modules

## The Solution

**Read the master list ONCE at the beginning, then use a Code node to check each company**

### New Workflow Structure

```
1. Google Sheets - Read Master List ONCE (no filter, read all 2,891 items)
   ↓
2. Loop Over Items (URLs)
   ↓
3. Run Apify Scraper
   ↓
4. Loop Over Items1 (each Apify result)
   ↓
5. Code Node - Check if Company Exists in Master List
   ↓
6. Filter - Less Than 500 Employees
   ↓
7. OpenAI - QC ICP Fit Analysis
   ↓
8. Loop back to step 4
```

## Implementation Steps

### Step 1: Add Google Sheets Node at the Start

**Position:** Before "Loop Over Items" (the first loop)

**Settings:**
- Operation: Read
- Document ID: Your master sheet ID
- Sheet Name: "Accountant" Results 10-14-2025
- **IMPORTANT:** No filters - read ALL rows

**Node Name:** `Google Sheets - Read Master List ONCE`

**Connection:** Output → "Loop Over Items" input

---

### Step 2: Add Code Node After Loop Over Items1

**Position:** Between "Loop Over Items1" and "Filter - Less Than 500 Employees"

**Node Name:** `Code - Check if Company Exists`

**Code:**

```javascript
// Get the current company from Apify scraper result
const currentCompany = $input.first().json.companyName;

// Access ALL items from the master list (read once at the start)
const masterList = $('Google Sheets - Read Master List ONCE').all();

// Check if current company already exists in master list
const companyExists = masterList.some(item => {
  const masterCompanyName = item.json.companyName || item.json['Company Name'] || '';
  return masterCompanyName.toLowerCase().trim() === currentCompany.toLowerCase().trim();
});

// If company already exists, return empty array (skip it)
if (companyExists) {
  return [];
}

// If company does NOT exist, pass it through
return [$input.first().json];
```

**What this does:**
- Gets the current Apify company name
- Accesses the master list data from the node at the start (using `$('NodeName').all()`)
- Checks if company name exists (case-insensitive comparison)
- Returns empty array if exists (stops the flow for this item)
- Returns the data if NOT exists (continues to next node)

---

### Step 3: Update Connections

**Old connections:**
```
Loop Over Items1 → Google Sheets - Check Master List → Filter
```

**New connections:**
```
Loop Over Items1 → Code - Check if Company Exists → Filter → OpenAI
```

**Remove the old "Google Sheets - Check Master List" node** that was inside the loop.

---

### Step 4: Update Filter Node

In your "Filter - Less Than 500 Employees" node, **REMOVE** this condition:

```javascript
{
  "value1": "={{ $('Run an Actor and get dataset').item.json.companyName }}",
  "operation": "notEqual",
  "value2": "={{ $json.companyName }}"
}
```

This condition is no longer needed because the Code node already handles duplicate checking.

**Keep only:**
- Employee count < 500
- Company name ≠ "A hiring company"
- Employment type = "Full-time"

---

## Why This Works

1. **Efficiency:** Master list is read ONCE (not 2,891 times)
2. **No stopping:** Code node returns empty array instead of 0 items
3. **One at a time:** Only new companies pass through to OpenAI
4. **Proper comparison:** Case-insensitive name matching

---

## Alternative: Using n8n's Built-in IF Node

If you prefer not to use code, you can use an IF node with this expression:

**Node:** IF - Check Company Not in Master List

**Condition:**
```javascript
{{ !$('Google Sheets - Read Master List ONCE').all().some(item => {
  const masterName = item.json.companyName || item.json['Company Name'] || '';
  return masterName.toLowerCase().trim() === $json.companyName.toLowerCase().trim();
}) }}
```

**True branch:** Continue to Filter
**False branch:** End (skip this company)

---

## Testing

1. Test with a company you KNOW is in the master list
   - Should be filtered out by the Code node
   - Should NOT reach OpenAI

2. Test with a NEW company not in the master list
   - Should pass through the Code node
   - Should reach OpenAI (if <500 employees)

---

## Troubleshooting

**Issue:** Code node errors with "Cannot read property 'companyName'"

**Fix:** Update the column name reference in the code:
```javascript
const masterCompanyName = item.json['Your Actual Column Name'];
```

Check your Google Sheet column header and use the exact name.

---

**Issue:** All companies are being skipped

**Fix:** Add logging to the Code node:
```javascript
// Add at the top
console.log('Current company:', currentCompany);
console.log('Master list count:', masterList.length);
console.log('Company exists:', companyExists);
```

Check the n8n execution logs to see what's happening.

---

## Updated Workflow JSON

The complete workflow JSON is saved in `n8n-workflow-fixed.json`

Import this into n8n or manually update your existing workflow following the steps above.
