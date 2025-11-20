# RedlineAPP

## LinkedIn Job Scraper Workflows

This repository contains N8N workflows for scraping and processing LinkedIn job postings.

### Workflow Architecture

The system consists of two parts that work together:

#### Part 1: Apify Scraper Starter (`n8n-workflow-part1-apify-scraper.json`)

This workflow initiates the job scraping process:

1. **Filter Rows** - Queries Google Sheets for rows where DatasetID (column D) is empty
2. **Run LinkedIn Jobs Scraper** - Executes the Apify actor (curious_coder/linkedin-jobs-scraper) with:
   - Synchronous execution (waits for completion)
   - Timeout: 3600 seconds (1 hour)
   - Max items: 2000 jobs
   - Retry on failure: 3 attempts with 60-second intervals
3. **Wait 5 Seconds** - Brief delay for system stability
4. **Set Variables** - Stores Apify run metadata (Dataset ID, Run ID, Actor ID, Status)
5. **Update Row** - Writes the Dataset ID back to the Google Sheet
6. **Trigger Part 2** - Sends webhook to start the data processing workflow

#### Part 2: Data Processing (`n8n-workflow-part2-data-processing.json`)

This workflow processes the scraped job data:

1. **Webhook Trigger** - Receives dataset information from Part 1
2. **Get Dataset Items** - Retrieves all jobs from the Apify dataset
3. **Wait 5 Seconds** - System stability delay
4. **Split Out** - Splits the job array into individual items for processing
5. **Check if Job Exists** - Queries Supabase to avoid duplicate processing
6. **Filter New Jobs** - Only processes jobs not already in the database
7. **Add Jobs to Supabase** - Inserts new job records into the database
8. **Update Counts** - Updates the Google Sheet with processed job counts

### Configuration Requirements

#### Credentials Needed

1. **Google Sheets OAuth2** - For reading/updating the spreadsheet
2. **Apify API** - For running the scraper actor
3. **Supabase** - For job data storage

#### Google Sheet Structure

The workflow expects a sheet with these columns:
- Column A: URL (LinkedIn search URL)
- Column B: Keyword
- Column C: State
- Column D: DatasetID (populated by the workflow)
- Column E: # Scraped
- Column F: # Processed

#### Webhook Configuration

Part 1 triggers Part 2 via webhook at:
```
https://hook.us1.make.com/qjlfndmga73sk5tup4v8df3986mi8hap
```

You'll need to update this URL to point to your N8N webhook endpoint for Part 2.

### Installation

1. Import both JSON files into your N8N instance
2. Configure all required credentials
3. Update the webhook URL in Part 1 to point to your Part 2 workflow
4. Update the Google Sheet ID and sheet name if different
5. Configure the Apify actor ID if using a different scraper

### Usage

The workflow can be triggered:
- Manually in N8N
- Via schedule/cron
- Through an external trigger

Once started, Part 1 will automatically:
1. Find all rows needing scraping
2. Run the scraper for each row
3. Trigger Part 2 to process the results
4. Update tracking information in Google Sheets