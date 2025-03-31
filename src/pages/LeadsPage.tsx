import { useState, useEffect } from 'react';
import { Search, Loader2, ChevronRight, ChevronLeft, X, Globe, Linkedin, RefreshCw } from 'lucide-react';

interface LeadData {
  [key: string]: any;
}

interface ExpandedCell {
  rowIndex: number;
  colIndex: number;
  content: string;
  header: string;
}

const SPREADSHEET_ID = '1wdmTDR3dfT0YvHSJ45VDKrA2M92QRsld1a8Og-IqIaI';
const API_KEY = 'AIzaSyAvyhbdZcVQEdgaNIRB3h2OS5jlmDQVT9Q';

export default function LeadsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LeadData[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheets, setSheets] = useState<any[]>([]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [expandedCell, setExpandedCell] = useState<{
    rowIndex: number;
    columnKey: string;
    content: string;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLeadData = async (query: string = '') => {
    setIsLoading(true);
    setError(null);
    setSearchResults([]);

    try {
      // First, get the sheet metadata
      const metadataResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?key=${API_KEY}`
      );

      if (!metadataResponse.ok) {
        throw new Error('Failed to fetch spreadsheet metadata');
      }

      const metadata = await metadataResponse.json();
      const firstSheet = metadata.sheets[0];
      
      if (!firstSheet) {
        throw new Error('No sheets found in the spreadsheet');
      }

      const sheetId = firstSheet.properties.sheetId;
      
      // Update column widths
      const updateRequest = {
        requests: [{
          updateDimensionProperties: {
            range: {
              sheetId: sheetId,
              dimension: 'COLUMNS',
              startIndex: 0,
              endIndex: 100 // Adjust based on your maximum number of columns
            },
            properties: {
              pixelSize: 80
            },
            fields: 'pixelSize'
          }
        }]
      };

      // Make the update request
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateRequest)
        }
      );

      // Now fetch the data using the correct sheet name
      const sheetTitle = firstSheet.properties.title;
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetTitle)}?key=${API_KEY}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Google Sheets API Error:', errorData);
        throw new Error(errorData.error?.message || `Failed to fetch data: ${response.status}`);
      }

      const data = await response.json();
      const rows = data.values || [];

      if (rows.length < 2) {
        setError('No data found in the sheet.');
        return;
      }

      // Get headers from first row
      const headers = rows[0].map((header: string) => header.trim());
      setHeaders(headers);

      // Process data rows (skip header)
      const leads = rows.slice(1).map((row: any[]) => {
        const lead: LeadData = {};
        headers.forEach((header, index) => {
          lead[header] = row[index] || '';
        });
        return lead;
      });

      // Filter results if there's a search query
      const filteredResults = query
        ? leads.filter(lead => {
            const searchLower = query.toLowerCase();
            return Object.values(lead).some(value => 
              String(value).toLowerCase().includes(searchLower)
            );
          })
        : leads;

      setSearchResults(filteredResults);

      if (filteredResults.length === 0 && query) {
        setError('No leads found matching your search criteria.');
      }
    } catch (err) {
      console.error('Error fetching lead data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch lead data. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeadData();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchLeadData(searchQuery);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLeadData(searchQuery);
  };

  const handleScroll = (direction: 'left' | 'right') => {
    const container = document.querySelector('.table-scroll-container');
    if (container) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      container.scrollLeft += scrollAmount;
      setScrollPosition(container.scrollLeft + scrollAmount);
    }
  };

  const handleCellDoubleClick = (content: string, rowIndex: number, columnKey: string) => {
    if (expandedCell && expandedCell.rowIndex === rowIndex && expandedCell.columnKey === columnKey) {
      setExpandedCell(null);
    } else {
      setExpandedCell({ rowIndex, columnKey, content });
    }
  };

  const isUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  const renderUrlCell = (content: string, header: string) => {
    if (!isUrl(content)) return null;

    const isLinkedIn = content.toLowerCase().includes('linkedin.com');
    const isWebsite = !isLinkedIn && (
      header.toLowerCase().includes('website') ||
      header.toLowerCase().includes('company url') ||
      content.match(/^https?:\/\/[^\/]*\/?$/)
    );

    return (
      <div className="flex items-center gap-2">
        {isLinkedIn ? (
          <>
            <Linkedin className="h-4 w-4 text-cyan-400" />
            <a
              href={content}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300"
              onClick={(e) => e.stopPropagation()}
            >
              {content}
            </a>
          </>
        ) : isWebsite ? (
          <>
            <Globe className="h-4 w-4 text-cyan-400" />
            <a
              href={content}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300"
              onClick={(e) => e.stopPropagation()}
            >
              {content}
            </a>
          </>
        ) : (
          <a
            href={content}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300"
            onClick={(e) => e.stopPropagation()}
          >
            {content}
          </a>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <div className="mt-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto mb-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="ml-4 p-2 rounded-md bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh data"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {!isLoading && !error && searchResults.length > 0 && (
          <div className="max-w-2xl mx-auto mb-4">
            <p className="text-gray-400">
              Total Leads: <span className="text-white font-medium">{searchResults.length}</span>
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center items-center mt-4">
            <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-900/50 text-red-200 rounded-md">
            {error}
          </div>
        )}

        {!isLoading && !error && searchResults.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full bg-gray-800 rounded-lg table-fixed">
              <thead>
                <tr>
                  {headers.map((header) => (
                    <th
                      key={header}
                      className="h-[30px] w-[80px] px-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider sticky top-0 bg-gray-800 z-10"
                      style={{ minWidth: '80px', maxWidth: '80px' }}
                    >
                      <div className="truncate" title={header}>
                        {header}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {searchResults.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t border-gray-700">
                    {headers.map((header) => (
                      <td
                        key={header}
                        className="h-[30px] w-[80px] px-2 text-sm text-gray-300 relative cursor-pointer"
                        style={{ 
                          minWidth: '80px', 
                          maxWidth: '80px',
                          minHeight: '30px',
                          maxHeight: '30px'
                        }}
                        onDoubleClick={() => handleCellDoubleClick(row[header], rowIndex, header)}
                      >
                        <div 
                          className="truncate"
                          title={row[header]}
                          style={{
                            width: '72px', // 80px - 8px (2px padding on each side)
                            lineHeight: '30px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {row[header]}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {expandedCell && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setExpandedCell(null)}
          >
            <div 
              className="bg-gray-800 rounded-lg p-4 max-w-[90vw] max-h-[90vh] w-[800px] m-4 relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium text-gray-200">
                  {headers[headers.indexOf(expandedCell.columnKey)]}
                </h3>
                <button
                  onClick={() => setExpandedCell(null)}
                  className="text-gray-400 hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(90vh-120px)] prose prose-invert">
                <pre className="whitespace-pre-wrap break-words text-sm text-gray-300 p-4 bg-gray-900 rounded">
                  {expandedCell.content}
                </pre>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && searchResults.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            {searchQuery ? 'No leads found matching your search criteria.' : 'Loading leads...'}
          </div>
        )}
      </div>
    </div>
  );
}