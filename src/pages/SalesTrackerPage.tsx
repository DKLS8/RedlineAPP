import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Loader2, RefreshCw, Building2, Mail, Search, Edit2, Notebook as Robot, Link, Check, Clock } from 'lucide-react';
import { Switch } from '@headlessui/react';
import { fetchConversations, sendMessage } from '../lib/api';

interface Conversation {
  id: string;
  dateReplied: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  reply: string;
  campaign_id: string; 
  subject: string;
  ai_suggestion: string;
  ea_account: string;
  reply_to_uuid: string;
  auto_reply: string;
  stage: Stage;
  rowNumber: number;
  campaign_name?: string;
  hasAutoReplied?: boolean;
}

type Stage = 'New Reply' | 'Follow up' | 'Responded';

const stageColors = {
  'New Reply': 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  'Follow up': 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  'Responded': 'bg-green-500/20 text-green-300 border border-green-500/30'
};

const StageIndicator = ({ stage }: { stage: Stage }) => {
  return (
    <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${stageColors[stage]}`}>
      {stage}
    </div>
  );
};

export default function SalesTrackerPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [sentTimestamp, setSentTimestamp] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadConversations = async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      const conversationsData = await fetchConversations();
      
      const conversationsWithAutoReplyStatus = conversationsData.map((conv: Conversation) => ({
        ...conv,
        hasAutoReplied: false
      }));
      
      setConversations(conversationsWithAutoReplyStatus);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError(error instanceof Error ? error.message : 'Failed to load conversations');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (autoReplyEnabled) {
      conversations.forEach(async (conv) => {
        if (!conv.hasAutoReplied && conv.ai_suggestion && conv.stage !== 'Responded') {
          await handleSendReply(conv.ai_suggestion, conv);
        }
      });
    }
  }, [autoReplyEnabled, conversations]);

  useEffect(() => {
    const savedAutoReply = localStorage.getItem('autoReplyEnabled');
    if (savedAutoReply !== null) {
      setAutoReplyEnabled(savedAutoReply === 'true');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('autoReplyEnabled', autoReplyEnabled.toString());
  }, [autoReplyEnabled]);

  useEffect(() => {
    if (selectedConversation) {
      setReplyContent(selectedConversation.ai_suggestion || '');
    } else {
      setReplyContent('');
    }
  }, [selectedConversation]);

  const handleStageChange = (conversation: Conversation, newStage: Stage) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversation.id ? { ...conv, stage: newStage } : conv
      )
    );
    if (selectedConversation?.id === conversation.id) {
      setSelectedConversation({ ...conversation, stage: newStage });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredConversations = conversations
    .filter(conv => {
      if (!searchQuery) return true;
      const searchLower = searchQuery.toLowerCase();
      return (
        conv.firstName.toLowerCase().includes(searchLower) ||
        conv.lastName.toLowerCase().includes(searchLower) ||
        conv.email.toLowerCase().includes(searchLower) ||
        conv.company.toLowerCase().includes(searchLower) ||
        conv.reply.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => new Date(b.dateReplied).getTime() - new Date(a.dateReplied).getTime());

  const handleSendReply = async (content?: string, conversation?: Conversation) => {
    const targetConversation = conversation || selectedConversation;
    if (!targetConversation || !(content || replyContent.trim())) return;
    
    setIsLoading(true);
    setError(null);
    setSentTimestamp(null);

    const now = new Date();
    const payload = {
      subject: targetConversation.subject,
      ea_account: targetConversation.ea_account,
      reply_to_uuid: targetConversation.reply_to_uuid,
      email: targetConversation.email,
      first_name: targetConversation.firstName,
      last_name: targetConversation.lastName,
      company: targetConversation.company,
      row_number: targetConversation.rowNumber,
      timestamp: now.toISOString()
    };
    
    try {
      await sendMessage(content || replyContent, payload);

      setSentTimestamp(now.toISOString());
      
      // Update conversation status and mark as auto-replied
      setConversations(prev => prev.map(conv => 
        conv.id === targetConversation.id 
          ? { ...conv, stage: 'Responded' as Stage, hasAutoReplied: true, ai_suggestion: '' }
          : conv
      ));

      if (targetConversation.id === selectedConversation?.id) {
        setSelectedConversation(prev => prev ? {
          ...prev,
          stage: 'Responded' as Stage,
          hasAutoReplied: true,
          ai_suggestion: ''
        } : null);
      }

      if (!content) { // Only clear if it's a manual reply
        setReplyContent('');
      }

    } catch (error) {
      console.error('Error sending reply:', error);
      setError(error instanceof Error ? error.message : 'Failed to send reply');
      setSentTimestamp(null);
    } finally {
      setIsLoading(false);
    }
  };

  const insertLink = () => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = replyContent;
    const linkMarkdown = `[${linkText || linkUrl}](${linkUrl})`;
    
    setReplyContent(
      text.substring(0, start) + 
      linkMarkdown +
      text.substring(end)
    );

    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Sales Tracker</h1>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 flex-1 sm:flex-none">
            <Robot className={`h-5 w-5 ${autoReplyEnabled ? 'text-cyan-400' : 'text-gray-400'}`} />
            <Switch
              checked={autoReplyEnabled}
              onChange={setAutoReplyEnabled}
              className={`${
                autoReplyEnabled ? 'bg-cyan-600' : 'bg-gray-700'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2`}
            >
              <span className="sr-only">Enable auto-reply</span>
              <span
                className={`${
                  autoReplyEnabled ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
            <span className="text-sm text-gray-400">Auto-reply</span>
          </div>
          <button
            onClick={loadConversations}
            disabled={isRefreshing}
            className="p-2 rounded-md bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh conversations"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/50 text-red-200 rounded-lg">
          {error}
        </div>
      )}

      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      <div className="mt-8 flex flex-col lg:flex-row gap-4 lg:gap-6">
        <div className="w-full lg:w-1/3 bg-white/10 backdrop-blur-lg rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-white">Replies</h2>
          </div>

          <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-320px)] lg:max-h-[calc(100vh-200px)]">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-2 rounded-lg cursor-pointer transition-colors ${
                  selectedConversation?.id === conversation.id
                    ? 'bg-cyan-600/20 border border-cyan-500/50'
                    : 'bg-gray-800/50 hover:bg-gray-700/50'
                }`}
                onClick={() => setSelectedConversation(conversation)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {conversation.firstName.charAt(0)}
                          {conversation.lastName.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-white text-sm">
                        {conversation.firstName} {conversation.lastName}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {formatDate(conversation.dateReplied)}
                      </p>
                    </div>
                  </div>
                  <StageIndicator stage={conversation.stage} />
                </div>
                <div className="mt-2 text-sm text-gray-400 line-clamp-2">
                  {conversation.reply}
                </div>
              </div>
            ))}

            {filteredConversations.length === 0 && !isRefreshing && (
              <div className="text-center py-8 text-gray-400">
                No replies found
              </div>
            )}

            {isRefreshing && filteredConversations.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Loading replies...
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 bg-white/10 backdrop-blur-lg rounded-lg p-4">
          {selectedConversation ? (
            <div className="h-full flex flex-col">
              <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg sm:text-xl font-semibold text-white">
                          {selectedConversation.firstName} {selectedConversation.lastName}
                        </h2>
                        <span className="text-gray-400">
                          &lt;{selectedConversation.email}&gt;
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Building2 className="h-4 w-4" />
                          <span>{selectedConversation.company}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-sm text-gray-400">
                        <span className="font-medium">Campaign ID: </span>
                        {selectedConversation.campaign_id}
                      </div>
                      <div className="text-sm text-gray-400">
                        <span className="font-medium">Reply UUID: </span>
                        {selectedConversation.reply_to_uuid}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Clock className="h-4 w-4" />
                        <span>{selectedConversation.dateReplied}</span>
                      </div>
                    </div>
                  </div>
                  <StageIndicator stage={selectedConversation.stage} />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-[calc(100vh-400px)]">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Subject:</h3>
                  <p className="text-sm text-white">
                    {selectedConversation.subject}
                  </p>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Message:</h3>
                  <p className="text-sm text-white whitespace-pre-wrap">
                    {selectedConversation.reply}
                  </p>
                </div>
              </div>

              <div className="mt-auto">
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-start">
                    <div className="flex-1 relative">
                      <textarea
                        ref={textareaRef}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        rows={6}
                        className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 resize-none"
                      />
                      <button
                        onClick={() => setShowLinkModal(true)}
                        className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-white bg-gray-700/50 rounded-md"
                        title="Insert link"
                      >
                        <Link className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleSendReply()}
                      disabled={isLoading || !replyContent.trim()}
                      className="h-fit px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          <span className="hidden sm:inline">Send</span>
                        </>
                      )}
                    </button>
                  </div>
                  {sentTimestamp && (
                    <div className="flex items-center gap-2 text-sm text-green-400">
                      <Check className="h-4 w-4" />
                      <span>Sent at {formatDate(sentTimestamp)}</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-400">
                    Press {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} + Enter to send
                  </p>
                </div>
              </div>

              {showLinkModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                    <h3 className="text-lg font-medium text-white mb-4">Insert Link</h3>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="url" className="block text-sm font-medium text-gray-300">
                          URL
                        </label>
                        <input
                          type="url"
                          id="url"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700/50 text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                          placeholder="https://example.com"
                        />
                      </div>
                      <div>
                        <label htmlFor="text" className="block text-sm font-medium text-gray-300">
                          Link Text (optional)
                        </label>
                        <input
                          type="text"
                          id="text"
                          value={linkText}
                          onChange={(e) => setLinkText(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700/50 text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                          placeholder="Click here"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setShowLinkModal(false)}
                          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={insertLink}
                          disabled={!linkUrl}
                          className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Insert
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                <p>Select a conversation to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}