// ==============================================
// N8N CODE NODE: Check if Company Already Exists
// ==============================================
// Place this node AFTER "Loop Over Items1" (the loop over Apify results)
// This checks if the current company exists in the master list

// Get the current company name from the Apify scraper result
const currentCompany = $input.first().json.companyName;

// Get ALL items from the master Google Sheet (read once at the start)
// IMPORTANT: Replace the node name below with YOUR actual Google Sheets node name
const masterList = $('Google Sheets - Read Master List ONCE').all();

// Log for debugging (optional - remove in production)
console.log('Checking company:', currentCompany);
console.log('Master list has', masterList.length, 'companies');

// Check if the current company already exists in the master list
// This does a case-insensitive comparison
const companyExists = masterList.some(item => {
  // Get the company name from the master list
  // ADJUST THIS if your Google Sheet column has a different name
  const masterCompanyName = item.json.companyName
    || item.json['Company Name']
    || item.json['companyName']
    || '';

  // Compare (case-insensitive, trimmed)
  return masterCompanyName.toLowerCase().trim() === currentCompany.toLowerCase().trim();
});

// Decision logic
if (companyExists) {
  // Company already in master list - SKIP IT
  console.log('❌ Company already exists - skipping:', currentCompany);
  return []; // Return empty array = skip this item
}

// Company is NEW - let it continue to next node
console.log('✅ New company - proceeding:', currentCompany);
return [$input.first().json]; // Pass the full Apify data through


// ==============================================
// ALTERNATIVE: More Detailed Logging Version
// ==============================================
// Uncomment the code below if you want more detailed debugging

/*
const currentCompany = $input.first().json.companyName;
const masterList = $('Google Sheets - Read Master List ONCE').all();

// Build a list of all company names in master list for debugging
const masterCompanyNames = masterList.map(item =>
  item.json.companyName || item.json['Company Name'] || 'NO NAME'
);

console.log('==========================================');
console.log('Current company:', currentCompany);
console.log('Master list size:', masterList.length);
console.log('First 5 companies in master:', masterCompanyNames.slice(0, 5));

const companyExists = masterList.some(item => {
  const masterCompanyName = item.json.companyName || item.json['Company Name'] || '';
  const match = masterCompanyName.toLowerCase().trim() === currentCompany.toLowerCase().trim();

  if (match) {
    console.log('🔍 MATCH FOUND:', masterCompanyName, '===', currentCompany);
  }

  return match;
});

if (companyExists) {
  console.log('❌ RESULT: Company exists - SKIPPING');
  console.log('==========================================');
  return [];
}

console.log('✅ RESULT: New company - CONTINUING');
console.log('==========================================');
return [$input.first().json];
*/
