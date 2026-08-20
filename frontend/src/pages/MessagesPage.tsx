import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Search, Users, Circle, Sparkles, Shield, Lock, CheckCheck, 
  Paperclip, Smile, Phone, Video, MoreVertical, ArrowLeft, Image as ImageIcon, 
  X, Check, Plus, MessageSquare, AlertCircle, Filter, Trash2, Bell, Share2, CornerDownLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Conversation, ChatMessage } from '../types';
import { ImageUpload } from '../components/ImageUpload';
import { api, resolveMediaUrl } from '../services/api';
import { getSocket } from '../services/socket';
import { WebRTCCallPanel } from '../components/WebRTCCallPanel';

// Initial Mock Conversations
const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_1',
    participantName: 'David Kim',
    participantAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    participantRole: 'Staff AI Architect @ DeepMind Hub',
    participantStatus: 'online',
    lastMessage: 'Let me know when you can test the hybrid RAG retrieval pipeline!',
    lastMessageTime: '10:45 AM',
    unreadCount: 1,
  },
  {
    id: 'conv_2',
    participantName: 'Sarah Chen',
    participantAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    participantRole: 'Senior PyTorch & ML Engineer',
    participantStatus: 'online',
    lastMessage: 'Shared the benchmark weights in the AI & Machine Learning community.',
    lastMessageTime: 'Yesterday',
    unreadCount: 2,
  },
  {
    id: 'conv_3',
    participantName: 'Marcus Vance',
    participantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    participantRole: 'Principal Product Designer',
    participantStatus: 'away',
    lastMessage: 'Figma components updated with dark/light SaaS tokens.',
    lastMessageTime: '2 days ago',
    unreadCount: 0,
  },
  {
    id: 'conv_4',
    participantName: 'Elena Rostova',
    participantAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    participantRole: 'Full Stack & WebSockets Specialist',
    participantStatus: 'offline',
    lastMessage: 'The Redis Pub/Sub layer is handling 50k concurrent connection spikes smoothly.',
    lastMessageTime: '3 days ago',
    unreadCount: 0,
  },
  {
    id: 'conv_5',
    participantName: 'Jordan Lee',
    participantAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    participantRole: 'Design Systems Lead',
    participantStatus: 'online',
    lastMessage: 'Reviewed the accessibility contrast ratios for the new messaging bubbles.',
    lastMessageTime: 'May 14',
    unreadCount: 0,
  },
];

// Initial Messages Map
const INITIAL_MESSAGES_MAP: Record<string, ChatMessage[]> = {
  conv_1: [
    {
      id: 'm1_1',
      conversationId: 'conv_1',
      sender: 'professional',
      senderName: 'David Kim',
      senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      text: 'Hey Alex! Loved your post on vector embedding retrieval speeds. We are benchmarking Qdrant vs PgVector for our startup.',
      timestamp: '10:40 AM',
      status: 'read',
    },
    {
      id: 'm1_2',
      conversationId: 'conv_1',
      sender: 'you',
      senderName: 'You',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      text: 'Hey David! Thanks! Qdrant handles multi-vector payloads very well at sub-100ms latency.',
      timestamp: '10:42 AM',
      status: 'read',
    },
    {
      id: 'm1_3',
      conversationId: 'conv_1',
      sender: 'professional',
      senderName: 'David Kim',
      senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      text: 'Awesome! Let me know when you can test the hybrid RAG retrieval pipeline!',
      timestamp: '10:45 AM',
      status: 'read',
    },
  ],
  conv_2: [
    {
      id: 'm2_1',
      conversationId: 'conv_2',
      sender: 'professional',
      senderName: 'Sarah Chen',
      senderAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
      text: 'Hey Alex! Are you open to collaborating on the open-source Llama 3 fine-tuning evaluation notebook?',
      timestamp: 'Yesterday, 3:15 PM',
      status: 'read',
    },
    {
      id: 'm2_2',
      conversationId: 'conv_2',
      sender: 'professional',
      senderName: 'Sarah Chen',
      senderAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
      text: 'Shared the benchmark weights in the AI & Machine Learning community.',
      timestamp: 'Yesterday, 3:18 PM',
      status: 'delivered',
    },
  ],
  conv_3: [
    {
      id: 'm3_1',
      conversationId: 'conv_3',
      sender: 'you',
      senderName: 'You',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      text: 'Hey Marcus, could you check the layout spacing for the sidebar navigation?',
      timestamp: '2 days ago',
      status: 'read',
    },
    {
      id: 'm3_2',
      conversationId: 'conv_3',
      sender: 'professional',
      senderName: 'Marcus Vance',
      senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      text: 'Figma components updated with dark/light SaaS tokens.',
      timestamp: '2 days ago',
      status: 'read',
    },
  ],
  conv_4: [
    {
      id: 'm4_1',
      conversationId: 'conv_4',
      sender: 'professional',
      senderName: 'Elena Rostova',
      senderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
      text: 'The Redis Pub/Sub layer is handling 50k concurrent connection spikes smoothly.',
      timestamp: '3 days ago',
      status: 'read',
    },
  ],
  conv_5: [
    {
      id: 'm5_1',
      conversationId: 'conv_5',
      sender: 'professional',
      senderName: 'Jordan Lee',
      senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      text: 'Reviewed the accessibility contrast ratios for the new messaging bubbles.',
      timestamp: 'May 14',
      status: 'read',
    },
  ],
};

// Available community members to start new conversations with
const COMMUNITY_MEMBERS = [
  {
    name: 'Aria Montgomery',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    role: 'Distributed Systems & Go Architect',
    status: 'online' as const,
  },
  {
    name: 'Kenji Sato',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
    role: 'Cloud Native & Kubernetes Lead',
    status: 'online' as const,
  },
  {
    name: 'Lucas Dupont',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
    role: 'React Native & iOS Engineer',
    status: 'offline' as const,
  },
  {
    name: 'Chloe Bennett',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    role: 'Web3 & Rust Security Auditor',
    status: 'online' as const,
  },
];

const EMOJI_LIST = ['😊', '🚀', '👍', '💡', '🔥', '❤️', '🎉', '💻', '⚡', '🤖', '🙌', '🎯'];

interface PeerCandidate {
  id: string;
  name: string;
  avatar: string;
  role: string;
  status: 'online' | 'offline';
}

interface CallSession {
  conversationId: string;
  callType: 'voice' | 'video';
  participant: { id: string; name: string; avatar?: string };
  incomingCall?: { callId: string; conversationId: string; callType: 'voice' | 'video'; caller: { id: string; name: string; avatar?: string } };
}

export const MessagesPage: React.FC = () => {
  const { user, isGuest, isFreeMember, setIsCheckoutOpen } = useAuth();

  // State Management
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'online'>('all');
  const [peerCandidates, setPeerCandidates] = useState<PeerCandidate[]>([]);
  
  // UI Helpers
  const [isTyping, setIsTyping] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<{ url: string; file: File; name: string } | null>(null);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);
  const [callSession, setCallSession] = useState<CallSession | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Active Selected Conversation
  const activeConv = conversations.find((c) => c.id === activeConvId);
  const currentMessages = activeConvId ? (messagesMap[activeConvId] || []) : [];

  const mapConversation = (conversation: any): Conversation => {
    const participant = (conversation.participants || [])
      .map((item: any) => item.user)
      .find((participantUser: any) => participantUser?.id !== user.id) || conversation.participants?.[0]?.user;
    const lastMessage = conversation.messages?.[0];

    return {
      id: conversation.id,
      participantId: participant?.id,
      participantName: conversation.isGroup ? conversation.name || 'Group conversation' : participant?.name || 'NicheLink member',
      participantAvatar: resolveMediaUrl(participant?.avatar) || '',
      participantRole: participant?.username ? `@${participant.username}` : 'NicheLink member',
      participantStatus: participant?.isOnline ? 'online' : 'offline',
      lastMessage: lastMessage?.content || 'No messages yet',
      lastMessageTime: lastMessage?.createdAt ? new Date(lastMessage.createdAt).toLocaleString() : '',
      unreadCount: conversation.unreadCount || 0,
    };
  };

  const mapMessage = (message: any): ChatMessage => ({
    id: message.id,
    conversationId: message.conversationId,
    sender: message.senderId === user.id ? 'you' : 'professional',
    senderName: message.sender?.name || (message.senderId === user.id ? user.name : 'NicheLink member'),
    senderAvatar: resolveMediaUrl(message.sender?.avatar) || '',
    text: message.content || '',
    timestamp: message.createdAt ? new Date(message.createdAt).toLocaleString() : '',
    status: 'delivered',
    attachmentUrl: resolveMediaUrl(message.attachments?.[0]?.url),
    attachmentName: message.attachments?.[0]?.fileName,
    attachmentType: message.attachments?.[0]?.fileType?.startsWith('image/') ? 'image' : 'file',
  });

  useEffect(() => {
    const loadConversations = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await api.get<{ success: boolean; items: any[] }>('/conversations?limit=100');
        const mapped = (response.items || []).map(mapConversation);
        setConversations(mapped);
        setActiveConvId((current) => current || mapped[0]?.id || null);
      } catch (err: any) {
        setErrorMessage(api.getFriendlyMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    if (!isGuest) loadConversations();
  }, [isGuest, user.id]);

  useEffect(() => {
    const loadPeerCandidates = async () => {
      if (isGuest) return;
      try {
        const response = await api.get<{ success: boolean; items: any[] }>('/search?q=a&type=users&limit=50');
        setPeerCandidates((response.items || [])
          .filter((candidate) => candidate.id !== user.id)
          .map((candidate) => ({
            id: candidate.id,
            name: candidate.name,
            avatar: resolveMediaUrl(candidate.avatar) || '',
            role: candidate.username ? `@${candidate.username}` : 'NicheLink member',
            status: candidate.isOnline ? 'online' : 'offline',
          })));
      } catch (err: any) {
        setErrorMessage(api.getFriendlyMessage(err));
      }
    };

    loadPeerCandidates();
  }, [isGuest, user.id]);

  useEffect(() => {
    if (!activeConvId) return;

    const loadMessages = async () => {
      try {
        const response = await api.get<{ success: boolean; items: any[] }>(`/conversations/${activeConvId}/messages?limit=100`);
        setMessagesMap((previous) => ({ ...previous, [activeConvId]: (response.items || []).map(mapMessage) }));
        await api.post(`/messages/${activeConvId}/read`);
      } catch (err: any) {
        setErrorMessage(api.getFriendlyMessage(err));
      }
    };

    loadMessages();
  }, [activeConvId, user.id]);

  // Subscribe to backend-emitted events while REST remains the persistence path.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    const onMessage = (message: any) => {
      if (!message?.id || !message.conversationId) return;
      const mappedMessage = mapMessage(message);
      setMessagesMap((previous) => {
        const current = previous[message.conversationId] || [];
        if (current.some((item) => item.id === mappedMessage.id)) return previous;
        return { ...previous, [message.conversationId]: [...current, mappedMessage] };
      });
      setConversations((previous) => previous.map((conversation) => {
        if (conversation.id !== message.conversationId) return conversation;
        const isIncoming = message.senderId !== user.id;
        return {
          ...conversation,
          lastMessage: message.content || (message.attachments?.length ? 'Attachment' : ''),
          lastMessageTime: message.createdAt ? new Date(message.createdAt).toLocaleString() : conversation.lastMessageTime,
          unreadCount: isIncoming && activeConvId !== message.conversationId
            ? conversation.unreadCount + 1
            : conversation.unreadCount,
        };
      }));
    };

    const onTyping = (payload: any) => {
      if (payload?.conversationId === activeConvId && payload.userId !== user.id) setIsTyping(true);
    };
    const onStopTyping = (payload: any) => {
      if (payload?.conversationId === activeConvId && payload.userId !== user.id) setIsTyping(false);
    };
    const onPresence = (payload: any, status: 'online' | 'offline') => {
      if (!payload?.userId) return;
      setConversations((previous) => previous.map((conversation) => (
        conversation.participantId === payload.userId
          ? { ...conversation, participantStatus: status }
          : conversation
      )));
      setPeerCandidates((previous) => previous.map((candidate) => (
        candidate.id === payload.userId ? { ...candidate, status } : candidate
      )));
    };
    const onOnline = (payload: any) => onPresence(payload, 'online');
    const onOffline = (payload: any) => onPresence(payload, 'offline');
    const onConversationCreate = (conversation: any) => {
      if (!conversation?.id) return;
      const mapped = mapConversation(conversation);
      setConversations((previous) => [mapped, ...previous.filter((item) => item.id !== mapped.id)]);
    };
    const onConversationUpdate = (conversation: any) => {
      if (!conversation?.id) return;
      setConversations((previous) => previous.map((item) => item.id === conversation.id ? mapConversation(conversation) : item));
    };
    const onIncomingCall = (payload: any) => {
      if (!payload?.callId || !payload.conversationId || !payload.caller?.id) return;
      setCallSession({
        conversationId: payload.conversationId,
        callType: payload.callType === 'video' ? 'video' : 'voice',
        participant: payload.caller,
        incomingCall: payload,
      });
    };

    socket.on('message:new', onMessage);
    socket.on('message:typing', onTyping);
    socket.on('message:stopTyping', onStopTyping);
    socket.on('user:online', onOnline);
    socket.on('user:offline', onOffline);
    socket.on('conversation:create', onConversationCreate);
    socket.on('conversation:update', onConversationUpdate);
    socket.on('call:incoming', onIncomingCall);

    return () => {
      socket.off('message:new', onMessage);
      socket.off('message:typing', onTyping);
      socket.off('message:stopTyping', onStopTyping);
      socket.off('user:online', onOnline);
      socket.off('user:offline', onOffline);
      socket.off('conversation:create', onConversationCreate);
      socket.off('conversation:update', onConversationUpdate);
      socket.off('call:incoming', onIncomingCall);
    };
  }, [activeConvId, user.id]);

  // Scroll to bottom of message feed
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [currentMessages, isTyping, activeConvId]);

  // Click outside to close emoji picker
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setIsEmojiPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // When opening a conversation, automatically clear unread count
  const handleSelectConversation = (convId: string) => {
    setActiveConvId(convId);
    getSocket()?.emit('message:seen', { conversationId: convId });
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
    );
  };

  // =========================================================================
  // MOCK SOCKET.IO ARCHITECTURE HOOKS
  // (In production, replace mockSendMessage with socket.emit('send_message', ...))
  // =========================================================================

  const sendMessage = async (convId: string, text: string, attachment?: { url: string; name: string }) => {
    setErrorMessage(null);
    const response = await api.post<{ success: boolean; message: any }>('/messages', {
      conversationId: convId,
      content: text.trim(),
      attachments: attachment ? [{ url: attachment.url, fileName: attachment.name, fileType: 'image/jpeg' }] : [],
    });
    const newMessage = mapMessage(response.message);
    setMessagesMap((previous) => ({ ...previous, [convId]: [...(previous[convId] || []), newMessage] }));
    setConversations((previous) => previous.map((conversation) => conversation.id === convId
      ? { ...conversation, lastMessage: newMessage.text || 'Attachment', lastMessageTime: newMessage.timestamp }
      : conversation));
  };

  // Submit Handler
  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !pendingAttachment) || !activeConvId || isGuest) return;

    sendMessage(
      activeConvId,
      inputText,
      pendingAttachment ? { url: pendingAttachment.url, name: pendingAttachment.name } : undefined
    ).then(() => {
      setInputText('');
      setPendingAttachment(null);
      setIsEmojiPickerOpen(false);
    }).catch((err: any) => setErrorMessage(api.getFriendlyMessage(err)));
  };

  // Start new conversation from modal
  const handleStartNewConversation = async (member: PeerCandidate) => {
    setErrorMessage(null);
    try {
      const response = await api.post<{ success: boolean; conversation: any }>('/conversations', {
        isGroup: false,
        targetUserId: member.id,
      });
      if (!response.conversation?.id) {
        throw new Error('Conversation creation returned no persisted conversation.');
      }

      const mappedConversation = mapConversation(response.conversation);
      setConversations((previous) => [
        mappedConversation,
        ...previous.filter((conversation) => conversation.id !== mappedConversation.id),
      ]);
      setActiveConvId(mappedConversation.id);
      setIsNewChatModalOpen(false);
    } catch (err: any) {
      setErrorMessage(api.getFriendlyMessage(err));
    }
  };

  // Filtered Conversations
  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      c.participantName.toLowerCase().includes(search.toLowerCase()) ||
      c.participantRole.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'unread') return c.unreadCount > 0;
    if (filterTab === 'online') return c.participantStatus === 'online';
    return true;
  });

  const totalUnreadCount = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50/50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Direct Messaging Hub</span>
              </span>
              <span className="flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
                Real-Time Ready
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Private Conversations
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            {isFreeMember && (
              <div className="hidden lg:flex items-center space-x-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-xs text-amber-900 font-medium">
                <span>Free Tier: 3 DMs/day</span>
                <button
                  onClick={() => setIsCheckoutOpen(true)}
                  className="font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  Upgrade to Pro
                </button>
              </div>
            )}

            <button
              onClick={() => setIsNewChatModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Message</span>
            </button>
          </div>
        </div>

        {/* Messaging Main Container */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[640px] max-h-[780px] h-[calc(100vh-220px)]">
          
          {/* ========================================================= */}
          {/* LEFT SIDEBAR: Conversations List                          */}
          {/* ========================================================= */}
          <div
            className={`md:col-span-4 lg:col-span-4 border-r border-slate-100 flex flex-col bg-slate-50/40 ${
              activeConvId ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Search & Filter Header */}
            <div className="p-4 border-b border-slate-100 space-y-3 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search conversations & peers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9.5 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setFilterTab('all')}
                  className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                    filterTab === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  All ({conversations.length})
                </button>
                <button
                  onClick={() => setFilterTab('unread')}
                  className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer relative ${
                    filterTab === 'unread'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span>Unread</span>
                  {totalUnreadCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 bg-indigo-600 text-white rounded-full text-[10px]">
                      {totalUnreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setFilterTab('online')}
                  className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                    filterTab === 'online'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Online
                </button>
              </div>
            </div>

            {/* Conversations List Scrollable */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conv) => {
                  const isActive = conv.id === activeConvId;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className={`w-full p-4 text-left transition-all flex items-start space-x-3.5 cursor-pointer relative ${
                        isActive
                          ? 'bg-indigo-50/90 border-l-4 border-indigo-600'
                          : 'hover:bg-slate-100/70 bg-transparent'
                      }`}
                    >
                      {/* Avatar with Status Indicator */}
                      <div className="relative shrink-0">
                        <img
                          src={conv.participantAvatar}
                          alt={conv.participantName}
                          className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shadow-xs"
                        />
                        <span
                          className={`w-3.5 h-3.5 rounded-full border-2 border-white absolute -bottom-0.5 -right-0.5 ${
                            conv.participantStatus === 'online'
                              ? 'bg-emerald-500'
                              : conv.participantStatus === 'away'
                              ? 'bg-amber-400'
                              : 'bg-slate-300'
                          }`}
                          title={`Status: ${conv.participantStatus}`}
                        />
                      </div>

                      {/* Info & Last Message */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {conv.participantName}
                          </h4>
                          <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                            {conv.lastMessageTime}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5 font-normal">
                          {conv.participantRole}
                        </p>
                        <p className={`text-xs truncate mt-1 ${
                          conv.unreadCount > 0 ? 'font-bold text-slate-900' : 'text-slate-600 font-normal'
                        }`}>
                          {conv.lastMessage}
                        </p>
                      </div>

                      {/* Unread Badge */}
                      {conv.unreadCount > 0 && (
                        <div className="shrink-0 self-center">
                          <span className="w-5 h-5 bg-indigo-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-xs">
                            {conv.unreadCount}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })
              ) : (
                /* Empty Conversations State */
                <div className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">No conversations found</h4>
                  <p className="text-xs text-slate-500 max-w-[200px] mx-auto">
                    {search ? 'No peers match your search query.' : 'Start a new direct message with a peer.'}
                  </p>
                  {search ? (
                    <button
                      onClick={() => setSearch('')}
                      className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
                    >
                      Clear search
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsNewChatModalOpen(true)}
                      className="px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                    >
                      Start a chat
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT CHAT PANEL                                          */}
          {/* ========================================================= */}
          <div
            className={`md:col-span-8 lg:col-span-8 flex flex-col bg-white ${
              !activeConvId ? 'hidden md:flex' : 'flex'
            }`}
          >
            {activeConv ? (
              <>
                {/* Active Conversation Top Bar */}
                <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
                  <div className="flex items-center space-x-3">
                    {/* Mobile Back Button */}
                    <button
                      onClick={() => setActiveConvId(null)}
                      className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 cursor-pointer"
                      title="Back to conversations"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="relative shrink-0">
                      <img
                        src={activeConv.participantAvatar}
                        alt={activeConv.participantName}
                        className="w-10 h-10 rounded-2xl object-cover border border-slate-200 shadow-xs"
                      />
                      <span
                        className={`w-3 h-3 rounded-full border-2 border-white absolute -bottom-0.5 -right-0.5 ${
                          activeConv.participantStatus === 'online'
                            ? 'bg-emerald-500'
                            : activeConv.participantStatus === 'away'
                            ? 'bg-amber-400'
                            : 'bg-slate-300'
                        }`}
                      />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                        <span>{activeConv.participantName}</span>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                          Peer
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                        <span>{activeConv.participantRole}</span>
                        <span>•</span>
                        <span className="text-emerald-600 font-semibold">
                          {activeConv.participantStatus === 'online'
                            ? 'Active now'
                            : activeConv.participantStatus === 'away'
                            ? 'Away'
                            : 'Offline'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div className="flex items-center space-x-1 sm:space-x-2 text-slate-500">
                    <button
                      onClick={() => activeConv.participantId && setCallSession({ conversationId: activeConv.id, callType: 'voice', participant: { id: activeConv.participantId, name: activeConv.participantName, avatar: activeConv.participantAvatar } })}
                      className="p-2 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl transition-colors cursor-pointer"
                      title="Start voice call"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => activeConv.participantId && setCallSession({ conversationId: activeConv.id, callType: 'video', participant: { id: activeConv.participantId, name: activeConv.participantName, avatar: activeConv.participantAvatar } })}
                      className="p-2 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl transition-colors cursor-pointer"
                      title="Start video meeting"
                    >
                      <Video className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Message History Feed */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/20">
                  {/* Encryption Notice Badge */}
                  <div className="flex justify-center">
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-medium border border-slate-200">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>End-to-end encrypted session with {activeConv.participantName}</span>
                    </div>
                  </div>

                  {currentMessages.map((msg) => {
                    const isYou = msg.sender === 'you';
                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end space-x-2.5 ${isYou ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isYou && (
                          <img
                            src={msg.senderAvatar || activeConv.participantAvatar}
                            alt={msg.senderName}
                            className="w-7 h-7 rounded-xl object-cover border border-slate-200 mb-1 shrink-0"
                          />
                        )}

                        <div
                          className={`max-w-[85%] sm:max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed space-y-1.5 shadow-xs ${
                            isYou
                              ? 'bg-slate-900 text-white rounded-br-none'
                              : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-none'
                          }`}
                        >
                          {/* Attached Image if any */}
                          {msg.attachmentUrl && (
                            <div
                              onClick={() => setPreviewImageModal(msg.attachmentUrl!)}
                              className="rounded-xl overflow-hidden border border-slate-700/40 bg-slate-950 cursor-pointer group relative mb-2"
                            >
                              <img
                                src={msg.attachmentUrl}
                                alt={msg.attachmentName || 'Attachment'}
                                className="w-full max-h-56 object-cover object-center group-hover:scale-102 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="px-2.5 py-1 bg-black/70 text-white text-[10px] rounded-lg font-bold">
                                  Click to view
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Message Text */}
                          {msg.text && <p className="whitespace-pre-line">{msg.text}</p>}

                          {/* Timestamp & Status Indicator */}
                          <div
                            className={`flex items-center justify-end space-x-1 text-[10px] font-medium pt-0.5 ${
                              isYou ? 'text-slate-400' : 'text-slate-400'
                            }`}
                          >
                            <span>{msg.timestamp}</span>
                            {isYou && (
                              <CheckCheck
                                className={`w-3.5 h-3.5 ${
                                  msg.status === 'read' ? 'text-indigo-400' : 'text-slate-400'
                                }`}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex items-center space-x-2 text-xs text-slate-500 italic py-1 animate-in fade-in">
                      <img
                        src={activeConv.participantAvatar}
                        alt="Peer"
                        className="w-6 h-6 rounded-lg object-cover"
                      />
                      <div className="flex items-center space-x-1 px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-xs">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                      <span className="text-[11px] text-slate-400">{activeConv.participantName} is typing...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Pending Attachment Preview Bar */}
                {pendingAttachment && (
                  <div className="px-4 py-2 bg-indigo-50/80 border-t border-indigo-100 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 truncate">
                      <img
                        src={pendingAttachment.url}
                        alt="Preview"
                        className="w-8 h-8 rounded-lg object-cover border border-indigo-200"
                      />
                      <span className="font-semibold text-indigo-900 truncate">
                        Attached: {pendingAttachment.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingAttachment(null)}
                      className="text-rose-600 hover:text-rose-800 font-bold p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Chat Input Form */}
                <form
                  onSubmit={handleSend}
                  className="p-3 sm:p-4 border-t border-slate-100 bg-white relative space-y-2"
                >
                  {/* Quick Emoji Popover */}
                  {isEmojiPickerOpen && (
                    <div
                      ref={emojiPickerRef}
                      className="absolute bottom-full left-4 mb-2 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 z-30 flex flex-wrap gap-2 max-w-[280px] animate-in fade-in zoom-in-95"
                    >
                      {EMOJI_LIST.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setInputText((prev) => prev + emoji);
                            setIsEmojiPickerOpen(false);
                          }}
                          className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-lg transition-transform hover:scale-125 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    {/* Attachment Button */}
                    <button
                      type="button"
                      onClick={() => setIsAttachModalOpen(true)}
                      className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
                      title="Attach Image"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    {/* Emoji Button */}
                    <button
                      type="button"
                      onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                      className={`p-2.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
                        isEmojiPickerOpen
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                      title="Insert emoji"
                    >
                      <Smile className="w-4 h-4" />
                    </button>

                    {/* Input Field */}
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        setInputText(nextValue);
                        const socket = getSocket();
                        if (!socket || !activeConvId) return;
                        if (nextValue.trim()) {
                          socket.emit('message:typing', { conversationId: activeConvId });
                        } else {
                          socket.emit('message:stopTyping', { conversationId: activeConvId });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder={
                        isGuest
                          ? 'Guests cannot send messages. Switch roles in RBAC banner.'
                          : `Type a message to ${activeConv.participantName}...`
                      }
                      disabled={isGuest}
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-100"
                    />

                    {/* Send Button */}
                    <button
                      type="submit"
                      disabled={(!inputText.trim() && !pendingAttachment) || isGuest}
                      className="px-4 sm:px-5 py-2.5 bg-slate-900 hover:bg-indigo-600 disabled:opacity-40 disabled:hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Send</span>
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* Empty Chat Panel State (No Conversation Selected on Desktop) */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-slate-50/30">
                <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="text-base font-bold text-slate-900">Select a Conversation</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Choose an existing conversation from the list on the left or initiate a new peer discussion.
                  </p>
                </div>
                <button
                  onClick={() => setIsNewChatModalOpen(true)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Start New Conversation</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ========================================================= */}
      {/* MODAL 1: New Direct Message Peer Selector                */}
      {/* ========================================================= */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Start Direct Message</h3>
              </div>
              <button
                onClick={() => setIsNewChatModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Select a fellow community member or peer to start an encrypted direct messaging thread:
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {peerCandidates.map((member) => (
                <button
                  key={member.name}
                  onClick={() => handleStartNewConversation(member)}
                  className="w-full p-3 rounded-2xl border border-slate-200/80 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition-all flex items-center space-x-3 cursor-pointer group"
                >
                  <div className="relative">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                    />
                    <span
                      className={`w-3 h-3 rounded-full border-2 border-white absolute -bottom-0.5 -right-0.5 ${
                        member.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {member.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">{member.role}</p>
                  </div>
                  <span className="text-xs text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    Chat →
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsNewChatModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: Attach Media / Image Upload                      */}
      {/* ========================================================= */}
      {isAttachModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Attach Media to Message</h3>
              </div>
              <button
                onClick={() => setIsAttachModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ImageUpload
              onImageSelected={(file, previewUrl) => {
                setPendingAttachment({
                  url: previewUrl,
                  file,
                  name: file.name,
                });
              }}
              onRemove={() => setPendingAttachment(null)}
              label="Select Image Attachment"
              category="MESSAGE"
              aspectRatio="wide"
              maxSize={5 * 1024 * 1024}
            />

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setPendingAttachment(null);
                  setIsAttachModalOpen(false);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setIsAttachModalOpen(false)}
                disabled={!pendingAttachment}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Attach & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: Image Fullscreen Preview                         */}
      {/* ========================================================= */}
      {previewImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImageModal(null)}
        >
          <div className="relative max-w-3xl w-full max-h-[85vh] flex items-center justify-center">
            <img
              src={previewImageModal}
              alt="Fullscreen Preview"
              className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl border border-white/10"
            />
            <button
              onClick={() => setPreviewImageModal(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 p-2 cursor-pointer font-bold flex items-center space-x-1"
            >
              <X className="w-6 h-6" />
              <span>Close</span>
            </button>
          </div>
        </div>
      )}

      {callSession && (
        <WebRTCCallPanel
          conversationId={callSession.conversationId}
          participant={callSession.participant}
          callType={callSession.callType}
          incomingCall={callSession.incomingCall}
          onClose={() => setCallSession(null)}
        />
      )}

    </div>
  );
};
