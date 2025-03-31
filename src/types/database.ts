export interface Conversation {
  id: string;
  dateReplied: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  reply: string;
  replyTime?: string;
  replySentiment?: string;
  campaign_id: string;
  subject: string;
  response?: string;
  responseTime?: string;
  ea_account?: string;
  reply_to_uuid?: string;
  ai_suggestion?: string;
  stage: 'New Reply' | 'Follow up' | 'Responded';
  rowNumber: number;
  hasAutoReplied?: boolean;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender: 'lead' | 'sales';
  content: string;
  created_at: string;
}