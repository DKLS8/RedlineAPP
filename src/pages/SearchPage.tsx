import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Upload, Search } from 'lucide-react';
import { sampleCampaignData } from '../data/sampleCampaignData';

interface FormData {
  apolloUrl: string;
  industry: string;
  numberOfLeads: string;
  campaignId: string;
}

interface Campaign {
  campaign_name: string;
  campaign_id: string;
  status: string;
}

export default function SearchPage() {
  const [formData, setFormData] = useState<FormData>({
    apolloUrl: '',
    industry: '',
    numberOfLeads: '',
    campaignId: ''
  });

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load campaigns on component mount
  useEffect(() => {
    // In production, this would be an API call
    const availableCampaigns = sampleCampaignData.campaigns.map(campaign => ({
      campaign_name: campaign.campaign_name,
      campaign_id: campaign.campaign_id,
      status: campaign.status
    }));
    setCampaigns(availableCampaigns);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('apolloUrl', formData.apolloUrl);
      formDataToSend.append('industry', formData.industry);
      formDataToSend.append('numberOfLeads', formData.numberOfLeads || '500');
      if (csvFile) {
        formDataToSend.append('csvFile', csvFile);
      }

      const webhookResponse = await fetch('https://hook.us1.make.com/r4aenepgj45v5ssqozxwrf1ff9pd3364', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        throw new Error(`Failed to trigger automation: ${errorText}`);
      }

      setStatus({
        type: 'success',
        message: 'Successfully triggered automation!'
      });

      setFormData(prev => ({
        ...prev,
        apolloUrl: '',
        numberOfLeads: ''
      }));
      setCsvFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error:', error);
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to process request. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
    } else {
      setStatus({
        type: 'error',
        message: 'Please upload a valid CSV file'
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-8">
          <Send className="h-12 w-12 text-cyan-400 mb-4" />
          <h2 className="text-2xl font-bold text-white">
            Lead Search
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Apollo/LinkedIn Search URL field */}
          <div>
            <label htmlFor="apolloUrl" className="block text-sm font-medium text-gray-200">
              Apollo/Linkedin Search URL
            </label>
            <input
              type="text"
              id="apolloUrl"
              name="apolloUrl"
              value={formData.apolloUrl}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700/50 text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
              placeholder="https://app.apollo.io/..."
            />
          </div>

          {/* Campaign Selection field */}
          <div>
            <label htmlFor="campaignId" className="block text-sm font-medium text-gray-200">
              Select Campaign
            </label>
            <select
              id="campaignId"
              name="campaignId"
              value={formData.campaignId}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700/50 text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
            >
              <option value="">Select a campaign...</option>
              {campaigns.map((campaign) => (
                <option 
                  key={campaign.campaign_id} 
                  value={campaign.campaign_id}
                  className="text-white"
                >
                  {campaign.campaign_name} ({campaign.status})
                </option>
              ))}
            </select>
          </div>

          {/* Campaign Analytics Preview */}
          {formData.campaignId && (
            <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <h3 className="text-sm font-medium text-gray-200 mb-3">Campaign Analytics Preview</h3>
              {campaigns.find(c => c.campaign_id === formData.campaignId) && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between items-center p-2 bg-gray-700/50 rounded">
                    <span className="text-gray-400">Status</span>
                    <span className="text-cyan-400">
                      {campaigns.find(c => c.campaign_id === formData.campaignId)?.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-700/50 rounded">
                    <span className="text-gray-400">Campaign</span>
                    <span className="text-cyan-400">
                      {campaigns.find(c => c.campaign_id === formData.campaignId)?.campaign_name}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Industry field */}
          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-gray-200">
              Industry
            </label>
            <input
              type="text"
              id="industry"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700/50 text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
              placeholder="e.g., Technology"
            />
          </div>

          {/* Number of Leads field */}
          <div>
            <label htmlFor="numberOfLeads" className="block text-sm font-medium text-gray-200">
              Number of Leads
            </label>
            <input
              type="number"
              id="numberOfLeads"
              name="numberOfLeads"
              min="500"
              value={formData.numberOfLeads}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700/50 text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
              placeholder="min. 500"
            />
          </div>

          {/* CSV Upload field */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Upload CSV List (Optional)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md hover:border-cyan-500 transition-colors">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-400">
                  <label
                    htmlFor="csvFile"
                    className="relative cursor-pointer rounded-md font-medium text-cyan-400 hover:text-cyan-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-cyan-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="csvFile"
                      name="csvFile"
                      type="file"
                      accept=".csv"
                      className="sr-only"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-400">
                  CSV file up to 10MB
                </p>
                {csvFile && (
                  <p className="text-sm text-cyan-400">
                    Selected: {csvFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Processing...
              </>
            ) : (
              'Start Lead Automation'
            )}
          </button>
        </form>

        {status.type && (
          <div
            className={`mt-4 p-4 rounded-md ${
              status.type === 'success' ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'
            }`}
          >
            {status.message}
          </div>
        )}
      </div>

      {/* Display sample campaign analytics if campaign ID is provided */}
      {formData.campaignId && (
        <div className="mt-8 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-medium text-gray-200 mb-4">Sample Campaign Analytics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-700 rounded">
              <p className="text-sm text-gray-400">Leads Count</p>
              <p className="text-xl text-cyan-400">1,234</p>
            </div>
            <div className="p-3 bg-gray-700 rounded">
              <p className="text-sm text-gray-400">Contacted Count</p>
              <p className="text-xl text-cyan-400">987</p>
            </div>
            <div className="p-3 bg-gray-700 rounded">
              <p className="text-sm text-gray-400">Reply Rate</p>
              <p className="text-xl text-cyan-400">23.5%</p>
            </div>
            <div className="p-3 bg-gray-700 rounded">
              <p className="text-sm text-gray-400">Opportunities</p>
              <p className="text-xl text-cyan-400">45</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}