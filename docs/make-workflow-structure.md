# Make.com Workflow Structure for Company URL Scraping

## Overview
This workflow scrapes multiple URLs using Apify, checks if companies exist in a master sheet, and adds new ones while avoiding duplicates.

## Workflow Modules

### 1. **Google Sheets - Read URL List**
- **Action**: Search Rows
- **Spreadsheet ID**: Your spreadsheet ID
- **Sheet Name**: "URLs to Scrape" (or your sheet name)
- **Columns**: A-B (URL, Status)
- **Filter**: Status = "Pending" (optional)

**Output**: Array of URLs to process

---

### 2. **Loop Over URLs (Array Aggregator Setup)**
- **Module**: Iterator
- **Array**: Output from step 1 (URLs list)

**This starts the OUTER loop** - processes one URL at a time

---

### 3. **Apify - Run Actor**
- **Action**: Run Actor and Wait for Finish
- **Actor ID**: Your Apify scraper actor ID
- **Input**:
  ```json
  {
    "startUrls": [
      {
        "url": "{{2.url}}"
      }
    ],
    "maxResults": 100
  }
  ```
- **Wait for completion**: Yes (important!)

**Output**: Apify dataset with scraped companies

---

### 4. **Apify - Get Dataset Items**
- **Action**: Get Dataset Items
- **Dataset ID**: {{3.defaultDatasetId}}
- **Format**: JSON

**Output**: Array of company records

---

### 5. **Loop Over Companies (Inner Iterator)**
- **Module**: Iterator
- **Array**: Output from step 4 (company records)

**This starts the INNER loop** - processes one company at a time

---

### 6. **Google Sheets - Read Master List (FRESH READ)**
⚠️ **CRITICAL**: This must be INSIDE the company loop!

- **Action**: Search Rows
- **Spreadsheet ID**: Your master spreadsheet ID
- **Sheet Name**: "Master List"
- **Columns**: A-Z (all relevant columns)
- **Filter**: None (read all rows)

**Purpose**: Gets fresh data each iteration to catch newly added companies

**Output**: Current state of master list

---

### 7. **Array Aggregator - Check Company Exists**
- **Module**: Tools → Contains
- **Source array**: {{6.values}}
- **Value to find**: {{5.companyName}} (or domain/ID)
- **Search in**: Column with company identifier

**Alternative**: Use Filter module with condition:
```
{{6.companyName}} not equals {{5.companyName}}
```

**Output**: Boolean (exists or not)

---

### 8. **Router - Branch Based on Existence**
- **Module**: Router (creates multiple paths)

#### **Route 1: Company NOT in Master** (Filter: {{7.result}} = false)

##### 8A. **Google Sheets - Add Row**
- **Action**: Add a Row
- **Spreadsheet ID**: Your master spreadsheet ID
- **Sheet Name**: "Master List"
- **Values**:
  - Column A: {{5.companyName}}
  - Column B: {{5.domain}}
  - Column C: {{5.employees}}
  - Column D: {{5.industry}}
  - Column E: {{now}} (timestamp)
  - Column F: {{2.url}} (source URL)

##### 8B. **OpenAI - QC ICP Fit** (Optional)
- **Module**: OpenAI → Create a Completion
- **Prompt**: "Analyze if this company fits our ICP: {{5.companyName}}..."
- **Model**: gpt-4o-mini

##### 8C. **Filter - Less Than 500 Employees** (Optional)
- **Module**: Filter
- **Condition**: {{5.employees}} < 500

#### **Route 2: Company Already Exists** (Filter: {{7.result}} = true)
- **Action**: Ignore or log
- Could add to a "Duplicates" sheet for tracking

---

### 9. **End Inner Loop**
After router, the inner loop automatically continues to next company

---

### 10. **Update URL Status (Optional)**
Place AFTER inner loop completes (use Aggregator to detect loop end)

- **Module**: Google Sheets - Update a Row
- **Spreadsheet ID**: URLs spreadsheet
- **Sheet Name**: "URLs to Scrape"
- **Row**: {{2.rowNumber}}
- **Values**:
  - Status: "Completed"
  - Processed Date: {{now}}
  - Companies Found: {{count of companies added}}

---

### 11. **End Outer Loop**
Automatically moves to next URL

---

## Important Make.com Settings

### Error Handling
- **Enable "Sequential Processing"** on both iterators to prevent race conditions
- **Add error handlers** on Apify modules (scraping can fail)
- **Set max retries** to 3 for Google Sheets operations

### Data Store Alternative (Optional)
Instead of re-reading sheets every time, use Make Data Store:
1. Read master list once at start
2. Store in Data Store
3. Check against Data Store in loop
4. Update Data Store when adding company
5. Write back to Sheet at end

### Performance Optimization
- **Batch operations**: If adding many companies, use "Bulk Update" instead of individual adds
- **Rate limits**: Add "Sleep" modules (1-2 seconds) between Sheets operations
- **Apify credits**: Monitor actor run costs

---

## Testing Strategy

### Phase 1: Test with 1 URL
1. Create test URLs sheet with 1 URL
2. Run workflow manually
3. Verify companies are detected and added

### Phase 2: Test Duplicate Detection
1. Run same URL twice
2. Verify no duplicates are added
3. Check that fresh reads work correctly

### Phase 3: Test Multiple URLs
1. Add 3-5 URLs
2. Verify all are processed sequentially
3. Check status updates

### Phase 4: Production
1. Enable scheduling (hourly/daily)
2. Monitor error rates
3. Set up notifications for failures

---

## Alternative Structure: Batch Processing

If you have many URLs and want better performance:

```
1. Read ALL URLs at once
2. Batch URLs into groups of 10
3. Loop over batches:
   - Run 10 Apify scrapers in parallel (using parallel processing)
   - Aggregate all results
   - Loop over companies
   - Check and add as above
```

This is more complex but faster for large volumes.

---

## Data Flow Visualization

```
┌─────────────────────────────────────────────────────────────┐
│ START                                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ Read URLs Sheet        │
        │ (Pending URLs)         │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ OUTER LOOP: URLs       │◄──────────┐
        └────────┬───────────────┘           │
                 │                            │
                 ▼                            │
        ┌────────────────────────┐           │
        │ Apify: Scrape URL      │           │
        └────────┬───────────────┘           │
                 │                            │
                 ▼                            │
        ┌────────────────────────┐           │
        │ Get Apify Results      │           │
        └────────┬───────────────┘           │
                 │                            │
                 ▼                            │
        ┌────────────────────────┐           │
        │ INNER LOOP: Companies  │◄──────┐   │
        └────────┬───────────────┘       │   │
                 │                        │   │
                 ▼                        │   │
        ┌────────────────────────┐       │   │
        │ Read Master Sheet      │       │   │
        │ (FRESH READ)          │       │   │
        └────────┬───────────────┘       │   │
                 │                        │   │
                 ▼                        │   │
        ┌────────────────────────┐       │   │
        │ Check if Company       │       │   │
        │ Exists in Master       │       │   │
        └────────┬───────────────┘       │   │
                 │                        │   │
         ┌───────┴────────┐              │   │
         │                │              │   │
         ▼                ▼              │   │
    ┌────────┐      ┌──────────┐        │   │
    │ Exists │      │ New      │        │   │
    │ (Skip) │      │ Company  │        │   │
    └────────┘      └────┬─────┘        │   │
                         │              │   │
                         ▼              │   │
                    ┌──────────┐        │   │
                    │ Add to   │        │   │
                    │ Master   │        │   │
                    └────┬─────┘        │   │
                         │              │   │
                         ▼              │   │
                    ┌──────────┐        │   │
                    │ Optional:│        │   │
                    │ QC Check │        │   │
                    └────┬─────┘        │   │
                         │              │   │
                         └──────────────┘   │
                         │                  │
                         ▼                  │
                    END INNER LOOP          │
                         │                  │
                         ▼                  │
                    ┌──────────┐            │
                    │ Mark URL │            │
                    │ Complete │            │
                    └────┬─────┘            │
                         │                  │
                         └──────────────────┘
                         │
                         ▼
                    END OUTER LOOP
                         │
                         ▼
                    ┌──────────┐
                    │ COMPLETE │
                    └──────────┘
```

---

## Common Pitfalls to Avoid

1. **Reading Master Sheet Outside Inner Loop**
   - ❌ Wrong: Read once before loop
   - ✅ Correct: Read fresh data each company iteration

2. **Not Waiting for Apify to Complete**
   - ❌ Wrong: Trigger and continue
   - ✅ Correct: Use "Run Actor and Wait for Finish"

3. **Case Sensitivity in Company Matching**
   - Use lowercase comparison: `lower({{A}}) = lower({{B}})`

4. **Not Handling Apify Failures**
   - Add error handlers with fallback logic
   - Log failed URLs for manual review

5. **Google Sheets Rate Limits**
   - Respect 100 requests per 100 seconds limit
   - Add delays if processing > 100 companies

6. **Duplicate Detection Field**
   - Use domain (not company name) for better accuracy
   - Clean/normalize domains: remove "www.", "http://", etc.

---

## Monitoring & Maintenance

### Key Metrics to Track
- URLs processed per run
- Companies found per URL
- Duplicates detected
- Apify costs per run
- Error rate

### Setup Notifications
- Email on workflow failure
- Daily summary of companies added
- Alert if no new companies found (potential scraper issue)

### Regular Reviews
- Check for false duplicates (name variations)
- Review QC/ICP fit accuracy
- Monitor Apify scraper performance
- Update URL list regularly

---

## Next Steps

1. **Create Your Sheets Structure**
   ```
   Sheet 1: "URLs to Scrape"
   - Column A: URL
   - Column B: Status (Pending/Processing/Completed)
   - Column C: Last Processed
   - Column D: Companies Found

   Sheet 2: "Master List"
   - Column A: Company Name
   - Column B: Domain
   - Column C: Employees
   - Column D: Industry
   - Column E: Added Date
   - Column F: Source URL
   - Column G: ICP Fit Score
   ```

2. **Set Up Apify Actor**
   - Choose appropriate scraper (LinkedIn, Apollo, etc.)
   - Test with sample URLs
   - Document expected output format

3. **Build Workflow in Make.com**
   - Follow structure above
   - Test each module individually
   - Connect step by step

4. **Test & Iterate**
   - Start with 1-2 URLs
   - Verify duplicate detection
   - Expand to full URL list

---

## Questions to Consider

- How many URLs will you process per run?
- How many companies per URL on average?
- Do you want real-time processing or batch/scheduled?
- What's your Apify budget/usage limit?
- Should failed URLs retry automatically?
- Do you need to track WHO added each company?
