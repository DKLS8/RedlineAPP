import { google } from 'googleapis';
import type { Conversation } from '../types/database';

const SPREADSHEET_ID = '1wdmTDR3dfT0YvHSJ45VDKrA2M92QRsld1a8Og-IqIaI';
const SHEET_NAME = 'Sales Tracker';
const API_KEY = 'AIzaSyAvyhbdZcVQEdgaNIRB3h2OS5jlmDQVT9Q';
const WEBHOOK_URL = 'https://hook.us1.make.com/jhm96nb6ijqcey89cqbcwzrucmx63tot';

export async function fetchConversations(): Promise<Conversation[]> {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}!A:O?key=${API_KEY}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Sheets API Error:', errorData);
      throw new Error(errorData.error?.message || `Failed to fetch data: ${response.status}`);
    }

    const data = await response.json();
    const rows = data.values || [];
    
    if (!rows || rows.length < 2) {
      throw new Error('No data found in sheet');
    }

    const conversations = rows.slice(1).map((row: any[], index: number) => {
      if (!row || row.length < 6) return null;

      const [
        dateReplied,      // Column A - Date Replied
        firstName,        // Column B - First Name
        lastName,        // Column C - Last Name
        email,           // Column D - Email
        company,         // Column E - Company
        reply,           // Column F - Reply
        replyTime,       // Column G - Reply Time
        replySentiment,  // Column H - Reply sentiment
        campaignId,      // Column I - Campaign ID
        subjectLine,     // Column J - Subject Line
        response,        // Column K - Response
        responseTime,    // Column L - Response Time
        ea_account,      // Column M - ea_account
        reply_to_uuid,   // Column N - reply_to_uuid
        ai_suggestion    // Column O - suggested response
      ] = row;

      if (!email || !reply) return null;

      const conversation: Conversation = {
        id: `row-${index + 2}`,
        dateReplied: replyTime || dateReplied || new Date().toISOString(),
        firstName: firstName?.trim() || '',
        lastName: lastName?.trim() || '',
        email: email?.trim() || '',
        company: company?.trim() || '',
        reply: reply?.trim() || '',
        replyTime: replyTime?.trim(),
        replySentiment: replySentiment?.trim(),
        campaign_id: campaignId?.trim() || '',
        subject: subjectLine?.trim() || '',
        response: response?.trim(),
        responseTime: responseTime?.trim(),
        ea_account: ea_account?.trim(),
        reply_to_uuid: reply_to_uuid?.trim(),
        ai_suggestion: ai_suggestion?.trim(),
        stage: response ? 'Responded' : 'New Reply',
        rowNumber: index + 2,
        hasAutoReplied: false
      };

      return conversation;
    }).filter(Boolean) as Conversation[];

    return conversations;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
}

export async function sendMessage(content: string, payload: any) {
  try {
    // Format timestamp as "Month DD, YYYY HH:MM AM/PM"
    const now = new Date();
    const formattedTimestamp = now.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Ensure row_number is sent as a number
    const webhookPayload = {
      content,
      subject: payload.subject,
      ea_account: payload.ea_account,
      reply_to_uuid: payload.reply_to_uuid,
      email: payload.email,
      first_name: payload.first_name,
      last_name: payload.last_name,
      company: payload.company || '',
      row_number: Number(payload.row_number), // Convert to number explicitly
      timestamp: formattedTimestamp
    };

    // Log the payload for debugging
    console.log('Sending payload to webhook:', webhookPayload);

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Webhook error response:', errorText);
      throw new Error(`Failed to send message: ${errorText}`);
    }

    // Log the response text for debugging
    const responseText = await response.text();
    console.log('Webhook response:', responseText);

    // Return the response text instead of parsing as JSON
    return responseText;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}