import React, { useEffect, useMemo, useState } from 'react';
import { Hash, LogIn, LogOut, MessageCircle, RefreshCw, Send, Users } from 'lucide-react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';

interface Community { id: string; name: string; visibility: string; }
interface Channel { id: string; name: string; slug: string; communityId: string; conversation?: { id: string }; }
interface ChatMessage { id: string; conversationId?: string; content: string; createdAt: string; sender?: { id: string; name: string; username?: string }; senderId: string; isEdited?: boolean; }

export const CommunityChatPage: React.FC = () => {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeCommunityId, setActiveCommunityId] = useState('');
  const [activeChannelId, setActiveChannelId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [composer, setComposer] = useState('');
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(Boolean(getSocket()?.connected));

  const activeCommunity = communities.find((community) => community.id === activeCommunityId);
  const activeChannel = channels.find((channel) => channel.id === activeChannelId);

  const loadCommunities = async () => {
    const response = await api.get<{ communities?: Community[]; items?: Community[] }>('/communities');
    const available = response.communities || response.items || [];
    setCommunities(available);
    setActiveCommunityId((current) => current || available[0]?.id || '');
  };

  const loadChannels = async (communityId: string) => {
    if (!communityId) return;
    const response = await api.get<{ channels: Channel[]; isMember: boolean }>(`/community-chat/communities/${communityId}/channels`);
    setChannels(response.channels || []);
    setIsMember(response.isMember);
    setActiveChannelId((current) => response.channels.some((channel) => channel.id === current) ? current : response.channels[0]?.id || '');
  };

  const loadMessages = async (channelId: string) => {
    if (!channelId || !isMember) { setMessages([]); return; }
    setLoadingMessages(true);
    try {
      const response = await api.get<{ items: ChatMessage[] }>(`/community-chat/channels/${channelId}/messages?limit=100`);
      setMessages(response.items || []);
    } catch (err: any) { setError(api.getFriendlyMessage(err)); }
    finally { setLoadingMessages(false); }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null);
      try { await loadCommunities(); } catch (err: any) { setError(api.getFriendlyMessage(err)); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  useEffect(() => {
    if (!activeCommunityId) return;
    loadChannels(activeCommunityId).catch((err) => setError(api.getFriendlyMessage(err)));
  }, [activeCommunityId]);

  useEffect(() => {
    loadMessages(activeChannelId).catch((err) => setError(api.getFriendlyMessage(err)));
  }, [activeChannelId, isMember]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;
    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);
    const onMessage = (payload: any) => {
      if (payload?.channelId !== activeChannelId || !payload.message?.id) return;
      setMessages((current) => current.some((message) => message.id === payload.message.id) ? current : [...current, payload.message]);
    };
    const onMessageEdit = (message: ChatMessage) => {
      if (message?.conversationId && activeChannelId && message.conversationId !== channels.find((channel) => channel.id === activeChannelId)?.conversation?.id) return;
      setMessages((current) => current.map((item) => item.id === message?.id ? { ...item, ...message } : item));
    };
    const onMessageDelete = (message: ChatMessage) => {
      if (!message?.id) return;
      setMessages((current) => current.map((item) => item.id === message.id ? { ...item, ...message } : item));
    };
    const onTyping = (payload: any) => {
      if (payload?.channelId === activeChannelId && payload.userId !== user.id) {
        setTypingUser(payload.username || 'Someone');
        window.setTimeout(() => setTypingUser(null), 2500);
      }
    };
    const onStopTyping = (payload: any) => { if (payload?.channelId === activeChannelId) setTypingUser(null); };
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('community:message:new', onMessage);
    socket.on('message:edit', onMessageEdit);
    socket.on('message:delete', onMessageDelete);
    socket.on('community:typing', onTyping);
    socket.on('community:stopTyping', onStopTyping);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('community:message:new', onMessage);
      socket.off('message:edit', onMessageEdit);
      socket.off('message:delete', onMessageDelete);
      socket.off('community:typing', onTyping);
      socket.off('community:stopTyping', onStopTyping);
    };
  }, [activeChannelId, user.id]);

  const join = async () => {
    if (!activeChannelId) return;
    try {
      await api.post(`/community-chat/channels/${activeChannelId}/join`);
      setIsMember(true);
      await loadMessages(activeChannelId);
    } catch (err: any) { setError(api.getFriendlyMessage(err)); }
  };

  const leave = async () => {
    if (!activeChannelId) return;
    try {
      await api.delete(`/community-chat/channels/${activeChannelId}/leave`);
      setIsMember(false); setMessages([]);
    } catch (err: any) { setError(api.getFriendlyMessage(err)); }
  };

  const send = (event: React.FormEvent) => {
    event.preventDefault();
    const socket = getSocket();
    if (!socket || !activeChannelId || !composer.trim()) return;
    socket.emit('community:message:send', { channelId: activeChannelId, content: composer.trim() }, (response: { success: boolean; error?: string }) => {
      if (!response?.success) setError(response?.error || 'Unable to send community message.');
    });
    socket.emit('community:stopTyping', { channelId: activeChannelId });
    setComposer('');
  };

  const totalMessages = useMemo(() => messages.length, [messages.length]);

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Shared rooms</p><h1 className="text-3xl font-extrabold text-slate-900">Community Chat</h1><p className="text-sm text-slate-500 mt-1">Join focused channels without mixing them with private conversations.</p></div><span className={`inline-flex items-center gap-2 text-xs font-bold ${socketConnected ? 'text-emerald-600' : 'text-amber-600'}`}><span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />{socketConnected ? 'Connected' : 'Reconnecting'}</span></header>
        {error && <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</div>}
        {loading ? <div className="bg-white border border-slate-200 rounded-2xl p-10 text-sm text-slate-500">Loading communities...</div> : <div className="grid grid-cols-1 md:grid-cols-[15rem_14rem_1fr] min-h-[34rem] bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <aside className="border-b md:border-b-0 md:border-r border-slate-200 p-3"><div className="flex items-center gap-2 px-2 py-2 text-xs font-bold uppercase tracking-wider text-slate-400"><Users className="w-4 h-4" />Communities</div>{communities.map((community) => <button key={community.id} onClick={() => setActiveCommunityId(community.id)} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold ${community.id === activeCommunityId ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>{community.name}</button>)}</aside>
          <aside className="border-b md:border-b-0 md:border-r border-slate-200 p-3"><div className="flex items-center justify-between px-2 py-2"><span className="text-xs font-bold uppercase tracking-wider text-slate-400">Channels</span><button onClick={() => loadChannels(activeCommunityId).catch((err) => setError(api.getFriendlyMessage(err)))} title="Refresh channels" className="p-1 text-slate-400 hover:text-slate-700"><RefreshCw className="w-3.5 h-3.5" /></button></div>{channels.map((channel) => <button key={channel.id} onClick={() => setActiveChannelId(channel.id)} className={`w-full flex items-center gap-2 text-left px-3 py-2.5 rounded-lg text-sm font-semibold ${channel.id === activeChannelId ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}><Hash className="w-4 h-4 text-slate-400" />{channel.name}</button>)}</aside>
          <main className="flex flex-col min-w-0"><div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between"><div><h2 className="font-bold text-slate-900 flex items-center gap-1"><Hash className="w-4 h-4 text-indigo-500" />{activeChannel?.name || 'Select a channel'}</h2><p className="text-xs text-slate-500">{activeCommunity?.name || 'Community'} · {totalMessages} messages</p></div>{activeChannel && (isMember ? <button onClick={leave} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600"><LogOut className="w-4 h-4" />Leave</button> : <button onClick={join} className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold"><LogIn className="w-4 h-4" />Join channel</button>)}</div>{!isMember ? <div className="flex-1 flex flex-col items-center justify-center p-8 text-center"><MessageCircle className="w-10 h-10 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-700">Join this channel to participate</p><p className="text-xs text-slate-500 mt-1">Messages are available only to community members.</p></div> : <><div className="flex-1 p-5 overflow-y-auto space-y-4">{loadingMessages ? <p className="text-sm text-slate-500">Loading messages...</p> : messages.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-center"><MessageCircle className="w-8 h-8 text-slate-300" /><p className="mt-2 text-sm font-semibold text-slate-600">No messages yet</p></div> : messages.map((message) => <div key={message.id} className="flex gap-3"><div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">{(message.sender?.name || '?').slice(0, 1).toUpperCase()}</div><div><div className="flex items-baseline gap-2"><span className="text-sm font-bold text-slate-900">{message.sender?.name || 'Member'}</span><time className="text-[10px] text-slate-400">{new Date(message.createdAt).toLocaleString()}</time>{message.isEdited && <span className="text-[10px] text-slate-400">edited</span>}</div><p className="text-sm text-slate-700 whitespace-pre-wrap">{message.content}</p></div></div>)}{typingUser && <p className="text-xs text-slate-400 italic">{typingUser} is typing...</p>}</div><form onSubmit={send} className="p-4 border-t border-slate-100 flex gap-2"><input value={composer} onChange={(event) => { setComposer(event.target.value); const socket = getSocket(); if (socket && activeChannelId) socket.emit(event.target.value.trim() ? 'community:typing' : 'community:stopTyping', { channelId: activeChannelId }); }} placeholder={`Message #${activeChannel?.name || 'channel'}`} className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500" /><button type="submit" disabled={!composer.trim() || !socketConnected} className="px-4 py-2.5 bg-slate-900 text-white rounded-xl disabled:opacity-40"><Send className="w-4 h-4" /></button></form></>}</main>
        </div>}
      </div>
    </div>
  );
};