# N8N Workflow Fix - Company Deduplication Issue

## Problem Summary

Your workflow needed to:
1. Read 150 URLs from Google Sheets (rows with empty DatasetID)
2. Scrape each URL with Apify to get company data
3. **For EACH company found, check if it already exists in the master list (2,891+ rows)**
4. If company exists → SKIP it
5. If company is NEW → Continue processing (filter, analyze, append to master list)

## The Issue with Your Original Workflow

The original workflow had these problems:

### 1. **Master List Was Never Read**
- You had a "Merge - Bring in Master List" node, but there was **no Google Sheets node reading the master list**
- The code was trying to access `$input.last().json` expecting the master list, but it wasn't there

### 2. **Wrong Merge Structure**
- The merge was happening INSIDE the loop for each Apify result
- But the master list data wasn't being passed through properly

### 3. **Loop Logic Was Confusing**
- You had nested loops (Loop Over Items2 and Loop Over Items3) that were hard to follow
- The flow wasn't clear about when to check duplicates

## The Fix - How the Corrected Workflow Works

### **Step 1: Read Master List ONCE at the Beginning**
```
When clicking 'Execute workflow'
  ↓
  ├─→ Google Sheets - Read Master List ONCE (reads ALL 2,891+ companies)
  └─→ Google Sheets - Filter Rows (reads 150 URLs to scrape)
```

**Key Point:** The master list is read ONCE at the start and stored in n8n's execution memory. This is much more efficient than reading it 150+ times.

### **Step 2: Merge the Two Sheets**
```
Merge - Combine Master List + URLs
  ├─ Input 1: Master list (all companies)
  └─ Input 2: URLs to scrape (150 rows)
```

This creates a merged dataset that has both pieces of data available.

### **Step 3: Loop Through Each URL (150 times)**
```
Loop Over Items - URLs (150 items)
  ↓
  Run an Actor and get dataset (Apify scraper)
  ↓
  Loop Over Items - Companies from Apify (for each company found)
```

### **Step 4: For Each Company, Check if It Exists**
```
Code - Check if Company Already Exists
```

**This is the KEY node.** Here's what it does:

```javascript
// Get current company from Apify
const currentCompanyName = $input.item.json.companyName;

// Access the master list that was read at the beginning
const masterListData = $('Google Sheets - Read Master List ONCE').all();

// Check if company exists in master list
let companyExists = false;
companyExists = masterListData.some(item => {
  const masterCompanyName = item.json.companyName;
  return masterCompanyName.toLowerCase().trim() === currentCompanyName.toLowerCase().trim();
});

// If NEW company → pass it through
// If EXISTS → return empty array (skip it)
if (!companyExists) {
  return { json: { ...currentItem, _companyIsNew: true } };
} else {
  return []; // SKIP
}
```

**How it works:**
- Uses `$('Google Sheets - Read Master List ONCE').all()` to access the master list data from the first node
- Compares current company name (case-insensitive, trimmed) against ALL companies in master list
- If match found → returns empty array (n8n skips this item)
- If no match → passes the company through for processing

### **Step 5: Continue Processing New Companies**
```
IF - Filter Less Than 500 Employees
  ↓ (TRUE branch only)
OpenAI - QC ICP Fit Analysis
  ↓
Google Sheets - Append to Master List
  ↓ (loops back)
Loop Over Items - Companies from Apify (next company)
```

Only NEW companies that pass all filters get added to the master list.

## What You Need to Update

In the corrected workflow JSON, you need to update these values:

### 1. **Master List Sheet ID and Name**

Find this node:
```json
"name": "Google Sheets - Read Master List ONCE"
```

Update these fields:
- `documentId.value`: Your Google Sheet ID for the MASTER LIST
- `sheetName.value`: The sheet name/ID where companies are stored
- `sheetName.cachedResultName`: The human-readable sheet name

### 2. **Append Node Configuration**

Find this node:
```json
"name": "Google Sheets - Append to Master List"
```

Update:
- `documentId.value`: Same as master list sheet ID
- `sheetName.value`: Same as master list sheet name
- `columns.value`: Map the fields you want to save (adjust column names as needed)

### 3. **URL Sheet (Already Configured)**

The "Google Sheets - Filter Rows (Empty DatasetID)" node already has your sheet ID:
- Document ID: `1wEcwHhN2n0x9ZvCEwPBwCjsd0r5io--nAyUdPzyCpTg`
- Sheet ID: `426052000`

Just verify this is correct.

## How Data Flows

```
START: Trigger
  ↓
READ: Master List (2,891 rows) + URLs (150 rows)
  ↓
MERGE: Both datasets combined
  ↓
LOOP 1: For each URL (150 iterations)
  ↓
SCRAPE: Apify gets companies from URL
  ↓
LOOP 2: For each company found in Apify result
  ↓
CHECK: Is this company in master list?
  ├─ YES → SKIP (return empty array)
  └─ NO → Continue ↓
       ↓
FILTER: Less than 500 employees?
  ├─ NO → SKIP
  └─ YES → Continue ↓
       ↓
ANALYZE: OpenAI ICP analysis
  ↓
APPEND: Add to master list (now 2,892 rows)
  ↓
LOOP BACK: Next company from Apify
  ↓
LOOP BACK: Next URL
  ↓
END: All done
```

## Key Advantages of This Approach

1. **Efficient:** Master list is read ONCE, not 150+ times
2. **Accurate:** Every company is checked against the full master list
3. **Real-time:** As companies are added, the master list grows
4. **Clear:** Easy to understand the flow of data

## Testing the Workflow

1. Import the corrected JSON into n8n
2. Update the Google Sheets node IDs (master list sheet)
3. Test with a small batch first (limit URLs to 5-10)
4. Check:
   - Are duplicates being skipped?
   - Are new companies being added to master list?
   - Is the count increasing correctly?

## Alternative: Using Workflow Static Data

If you want even better performance, you could:
1. Use n8n's "Set" node to store the master list in workflow static data
2. Reference it from any node using `$workflow.staticData.masterList`
3. This keeps the data in memory without needing to reference the original node

Let me know if you need help implementing this alternative approach!
