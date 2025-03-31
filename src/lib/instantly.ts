import axios from 'axios';
import { sampleCampaignData } from '../data/sampleCampaignData';

const INSTANTLY_API_KEY = 'OTBhMjYxMDktNTE2Yy00NTg2LTk5ZTEtYmEzNWE1MWJjOGU0Omt3ZG1QbUlDc0lKYQ==';
const INSTANTLY_API_URL = 'https://api.instantly.ai/api/v2/campaigns/analytics';

interface InstantlyCampaignResponse {
  campaign_id: string;
  name: string;
  status: number;
  created_at: string;
  updated_at: string;
  stats: {
    leads_count: number;
    contacted_count: number;
    reply_count: number;
    positive_reply_count: number;
    bounced_count: number;
    unsubscribed_count: number;
    completed_count: number;
    emails_sent_count: number;
    new_leads_contacted: number;
  };
  metrics: {
    sequence_started: number;
    reply_rate: number;
    positive_reply_rate: number;
    opportunities: number;
    opportunity_value: number;
  };
}

export async function fetchCampaignAnalytics(): Promise<InstantlyCampaignResponse[]> {
  try {
    const API_KEY = 'OTBhMjYxMDktNTE2Yy00NTg2LTk5ZTEtYmEzNWE1MWJjOGU0Omt3ZG1QbUlDc0lKYQ==';
    
    const response = await axios({
      method: 'get',
      url: 'https://api.instantly.ai/api/v2/campaigns/analytics',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      params: {
        exclude_total_leads_count: true
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching campaign analytics:', error);
    // Return sample data when API fails
    return sampleCampaignData.campaigns;
  }
}

export async function fetchCampaignDetails(campaignId: string): Promise<InstantlyCampaignResponse> {
  try {
    const response = await axios.get(`${INSTANTLY_API_URL}/campaigns/${campaignId}`, {
      headers: {
        'Authorization': `Bearer ${INSTANTLY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status !== 200) {
      throw new Error('Failed to fetch campaign details');
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching campaign details:', error);
    throw error;
  }
}