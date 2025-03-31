import { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, Users, Mail, Plus, X, Loader2, RefreshCw } from 'lucide-react';
import { fetchCampaignAnalytics } from '../lib/instantly';

interface CampaignStats {
  id: string;
  name: string;
  status: string;
  stats: {
    sequence_started: number;
    emails_sent: {
      count: number;
      total: number;
      percentage: number;
    };
    reply_rate: {
      count: number;
      total: number;
      percentage: number;
    };
    positive_reply_rate: {
      count: number;
      total: number;
      percentage: number;
    };
    opportunities: {
      count: number;
      value: number;
    };
    converted: {
      count: number;
      total_sent: number;
      percentage: number;
    };
  };
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'Draft': return 0;
    case 'Active': return 1;
    case 'Paused': return 2;
    case 'Completed': return 3;
    case 'Running Subsequences': return 4;
    case 'Account Suspended': return -99;
    case 'Accounts Unhealthy': return -1;
    case 'Bounce Protect': return -2;
    default: return -1; // Assuming Unknown
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Draft': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    case 'Active': return 'bg-green-500/20 text-green-300 border-green-500/30';
    case 'Paused': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    case 'Completed': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'Running Subsequences': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    case 'Account Suspended': return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'Accounts Unhealthy': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    case 'Bounce Protect': return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
    default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  }
};

export default function CampaignsPage() {
  const [newCampaignId, setNewCampaignId] = useState('');
  const [campaigns, setCampaigns] = useState<CampaignStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadCampaignAnalytics = async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const campaignData = await fetchCampaignAnalytics();
      
      const campaignStats: CampaignStats[] = campaignData.map((campaign: any) => ({
        id: campaign.campaign_id,
        name: campaign.campaign_name,
        status: campaign.status || 'Unknown',
        stats: {
          sequence_started: campaign.stats.sequence_started || 0,
          emails_sent: {
            count: campaign.stats.emails_sent?.count || 0,
            total: campaign.stats.emails_sent?.total || 0,
            percentage: campaign.stats.emails_sent?.percentage || 0
          },
          reply_rate: {
            count: campaign.stats.reply_rate?.count || 0,
            total: campaign.stats.reply_rate?.total || 0,
            percentage: campaign.stats.reply_rate?.percentage || 0
          },
          positive_reply_rate: {
            count: campaign.stats.positive_reply_rate?.count || 0,
            total: campaign.stats.positive_reply_rate?.total || 0,
            percentage: campaign.stats.positive_reply_rate?.percentage || 0
          },
          opportunities: {
            count: campaign.stats.opportunities?.count || 0,
            value: campaign.stats.opportunities?.value || 0
          },
          converted: {
            count: campaign.stats.converted?.count || 0,
            total_sent: campaign.stats.converted?.total_sent || 0,
            percentage: campaign.stats.converted?.percentage || 0
          }
        }
      }));

      setCampaigns(campaignStats);
      
      // Update localStorage for SearchPage
      const campaignIds = campaignStats.map(c => c.id);
      localStorage.setItem('savedCampaignIds', JSON.stringify(campaignIds));
    } catch (error) {
      console.error('Error loading campaign analytics:', error);
      setError(error instanceof Error ? error.message : 'Failed to load campaign analytics');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadCampaignAnalytics();
  }, []);

  const handleAddCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignId || campaigns.some(c => c.id === newCampaignId)) return;

    const newCampaign: CampaignStats = {
      id: newCampaignId,
      name: `Campaign ${newCampaignId}`,
      status: 'Unknown',
      stats: {
        sequence_started: 0,
        emails_sent: {
          count: 0,
          total: 0,
          percentage: 0
        },
        reply_rate: {
          count: 0,
          total: 0,
          percentage: 0
        },
        positive_reply_rate: {
          count: 0,
          total: 0,
          percentage: 0
        },
        opportunities: {
          count: 0,
          value: 0
        },
        converted: {
          count: 0,
          total_sent: 0,
          percentage: 0
        }
      }
    };

    setCampaigns(prev => [...prev, newCampaign]);
    setNewCampaignId('');
    
    // Update localStorage for SearchPage
    const campaignIds = [...campaigns, newCampaign].map(c => c.id);
    localStorage.setItem('savedCampaignIds', JSON.stringify(campaignIds));
  };

  const handleRemoveCampaign = (campaignId: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== campaignId));
    
    // Update localStorage for SearchPage
    const campaignIds = campaigns.filter(c => c.id !== campaignId).map(c => c.id);
    localStorage.setItem('savedCampaignIds', JSON.stringify(campaignIds));
  };

  const getTotalStats = () => {
    const totalLeads = campaigns.reduce((acc, c) => acc + (c.stats.sequence_started || 0), 0);
    const totalReplies = campaigns.reduce((acc, c) => acc + c.stats.reply_rate.count, 0);
    const totalPositiveReplies = campaigns.reduce((acc, c) => acc + c.stats.positive_reply_rate.count, 0);
    const totalOpportunities = campaigns.reduce((acc, c) => acc + (c.stats.opportunities?.count || 0), 0);
    const totalOpportunityValue = campaigns.reduce((acc, c) => acc + (c.stats.opportunities?.value || 0), 0);

    return {
      replyRate: totalLeads > 0 ? Math.round((totalReplies / totalLeads) * 100) : 0,
      positiveReplyRate: totalReplies > 0 ? Math.round((totalPositiveReplies / totalReplies) * 100) : 0,
      opportunities: totalOpportunities,
      opportunityValue: totalOpportunityValue,
    };
  };

  const totalStats = getTotalStats();
  const overallStats = [
    { name: 'Reply Rate', value: `${totalStats.replyRate}%`, icon: Mail },
    { name: 'Positive Reply Rate', value: `${totalStats.positiveReplyRate}%`, icon: TrendingUp },
    { name: 'Opportunities', value: totalStats.opportunities, icon: Users },
    { name: 'Opportunity Value', value: `$${totalStats.opportunityValue.toLocaleString()}`, icon: BarChart2 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Add New Campaign Form */}
      <div className="mb-8">
        <form onSubmit={handleAddCampaign} className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={newCampaignId}
              onChange={(e) => setNewCampaignId(e.target.value)}
              placeholder="Enter campaign ID"
              className="w-full px-4 py-2 rounded-md border border-gray-600 bg-gray-700/50 text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Campaign
          </button>
          <button
            onClick={() => loadCampaignAnalytics()}
            disabled={isRefreshing}
            className="p-2 rounded-md bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh analytics"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </form>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-900/50 text-red-200 rounded-lg">
          {error}
        </div>
      )}

      {/* Overall Stats */}
      <h2 className="text-xl font-semibold text-white mb-4">Overall Performance</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {overallStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white/10 backdrop-blur-lg overflow-hidden rounded-lg shadow"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-400 truncate">
                        {stat.name}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-white">
                          {stat.value}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Individual Campaign Stats */}
      <h2 className="text-xl font-semibold text-white mb-4">Campaign Details</h2>
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
          </div>
        ) : campaigns.length > 0 ? (
          campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white/10 backdrop-blur-lg rounded-lg shadow overflow-hidden">
              {/* Campaign Header */}
              <div className="bg-gray-800/50 px-6 py-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white">
                      {campaign.name}
                    </h3>
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-gray-400">
                        ID: {campaign.id}
                      </p>
                      <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveCampaign(campaign.id)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Campaign Stats */}
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <Mail className="h-5 w-5 text-cyan-400" />
                      <span className="text-lg font-semibold text-white">
                        {campaign.stats.reply_rate.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">Reply Rate</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {campaign.stats.reply_rate.count} / {campaign.stats.sequence_started}
                    </p>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <TrendingUp className="h-5 w-5 text-cyan-400" />
                      <span className="text-lg font-semibold text-white">
                        {campaign.stats.positive_reply_rate.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">Positive Reply Rate</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {campaign.stats.positive_reply_rate.count} / {campaign.stats.reply_rate.count}
                    </p>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <Users className="h-5 w-5 text-cyan-400" />
                      <span className="text-lg font-semibold text-white">
                        {campaign.stats.opportunities.count}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">Opportunities</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Value: ${(campaign.stats.opportunities.value || 0).toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <BarChart2 className="h-5 w-5 text-cyan-400" />
                      <span className="text-lg font-semibold text-white">
                        {campaign.stats.converted.count}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">Converted</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Total Sent: {campaign.stats.emails_sent.total}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div className="text-gray-400">
                    <span className="block">Sequence Started</span>
                    <span className="text-white">{campaign.stats.sequence_started || 0}</span>
                  </div>
                  <div className="text-gray-400">
                    <span className="block">Bounced</span>
                    <span className="text-white">{campaign.stats.converted.count - campaign.stats.converted.total_sent}</span>
                  </div>
                  <div className="text-gray-400">
                    <span className="block">Unsubscribed</span>
                    <span className="text-white">{campaign.stats.converted.total_sent}</span>
                  </div>
                  <div className="text-gray-400">
                    <span className="block">New Leads</span>
                    <span className="text-white">{campaign.stats.converted.count}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-400">
            No campaigns added yet. Add a campaign ID to get started.
          </div>
        )}
      </div>
    </div>
  );
}