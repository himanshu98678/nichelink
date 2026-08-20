import React, { useState } from 'react';
import { sampleChatMessages } from '../data/mockData';
import { MessageSquare, Send, Sparkles, ShieldCheck, UserCheck, Users, CheckCheck } from 'lucide-react';

export const MessagingPreview: React.FC = () => {
  const [activeChannel, setActiveChannel] = useState<'professional' | 'community'>('professional');
  const [messages, setMessages] = useState(sampleChatMessages);
  const [inputText, setInputText] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      id: Date.now().toString(),
      sender: 'you' as const,
      senderName: 'You (Alex Rivera)',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      text: inputText,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  const filteredMessages = messages.filter((m) => {
    if (activeChannel === 'professional') {
      return m.sender === 'you' || m.sender === 'professional';
    }
    return m.sender === 'community' || m.sender === 'you';
  });

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text Explanation */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Direct Messaging Flow</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Connect directly with people who share your interests and goals.
            </h2>

            <p className="text-base text-gray-600 leading-relaxed">
              Skip cold LinkedIn connection requests that get ignored. Message verified professionals directly or participate in real-time community chat rooms focused on your exact tech stack.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start space-x-3.5">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Direct 1-on-1 Chats</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Reach out directly to engineers, designers, and hiring managers.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Community Channels</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Participate in live group channels for instant peer help and workshops.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Chat UI Mockup */}
          <div className="lg:col-span-7">
            <div className="bg-gray-900 rounded-3xl border border-gray-800 shadow-2xl overflow-hidden">
              {/* Chat Header */}
              <div className="p-4 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={
                        activeChannel === 'professional'
                          ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
                          : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'
                      }
                      alt="Avatar"
                      className="w-10 h-10 rounded-full object-cover border border-gray-700"
                    />
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full absolute bottom-0 right-0 ring-2 ring-gray-950" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center">
                      {activeChannel === 'professional' ? 'David Kim' : 'AI & Machine Learning Hub'}
                      <ShieldCheck className="w-4 h-4 ml-1.5 text-indigo-400" />
                    </h4>
                    <span className="text-[11px] text-gray-400">
                      {activeChannel === 'professional' ? 'Staff AI Architect @ DeepMind' : '42 Members Online Now'}
                    </span>
                  </div>
                </div>

                {/* Channel Switcher */}
                <div className="flex items-center bg-gray-900 p-1 rounded-xl border border-gray-800 text-xs">
                  <button
                    onClick={() => setActiveChannel('professional')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      activeChannel === 'professional'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    1-on-1 Chat
                  </button>
                  <button
                    onClick={() => setActiveChannel('community')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      activeChannel === 'community'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Community
                  </button>
                </div>
              </div>

              {/* Chat Message Window */}
              <div className="p-6 bg-gray-900 min-h-[280px] max-h-[360px] overflow-y-auto space-y-4">
                {filteredMessages.map((msg) => {
                  const isYou = msg.sender === 'you';
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start space-x-3 ${isYou ? 'flex-row-reverse space-x-reverse' : ''}`}
                    >
                      <img
                        src={msg.senderAvatar}
                        alt={msg.senderName}
                        className="w-8 h-8 rounded-full object-cover border border-gray-700 shrink-0"
                      />
                      <div className={`max-w-[80%] ${isYou ? 'text-right' : 'text-left'}`}>
                        <div className="flex items-center space-x-2 text-[10px] text-gray-400 mb-1">
                          <span className="font-semibold text-gray-300">{msg.senderName}</span>
                          <span>•</span>
                          <span>{msg.timestamp}</span>
                        </div>
                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isYou
                              ? 'bg-indigo-600 text-white rounded-tr-none'
                              : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-none'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input Form */}
              <form onSubmit={handleSendMessage} className="p-4 bg-gray-950 border-t border-gray-800 flex items-center space-x-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Type a message to ${activeChannel === 'professional' ? 'David' : 'the community'}...`}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-500 rounded-xl focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all cursor-pointer shrink-0 shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
