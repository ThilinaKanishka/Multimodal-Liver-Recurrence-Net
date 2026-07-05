import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, User, MessageSquare, ShieldAlert, CircleUser, Search } from 'lucide-react';

export const AdminMessages = ({ theme }: { theme: 'DARK' | 'LIGHT' }) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const adminId = "ST-ADMIN";

  const fetchConversations = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/messages/conversations/${adminId}`);
      setConversations(res.data.conversations);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async () => {
    if (!activeChat) return;
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/messages/conversation/${adminId}/${activeChat}`);
      setMessages(res.data.messages);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // Poll for new messages and conversations
  useEffect(() => {
    fetchConversations();
    const interval = setInterval(() => {
      fetchConversations();
      if (activeChat) fetchMessages();
    }, 3000);
    return () => clearInterval(interval);
  }, [activeChat]);

  // Initial fetch when active chat changes
  useEffect(() => {
    if (activeChat) {
      setLoading(true);
      fetchMessages();
    }
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    try {
      const msgData = {
        sender_id: adminId,
        receiver_id: activeChat,
        content: newMessage
      };
      setNewMessage("");
      // Optimistic update
      setMessages(prev => [...prev, { ...msgData, _id: Date.now().toString(), timestamp: new Date().toISOString(), is_read: false }]);
      
      await axios.post('http://127.0.0.1:8000/api/messages/send', msgData);
      fetchMessages();
      fetchConversations();
    } catch (err) {
      console.error(err);
    }
  };

  const activeUser = conversations.find(c => c.user_id === activeChat);

  return (
    <div className="flex-1 flex flex-col min-h-[600px] h-[calc(100vh-180px)] overflow-hidden">
      <div className="flex items-center gap-3 mb-6 border-b border-gray-700/50 pb-4 flex-shrink-0">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded"><MessageSquare className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl font-bold tracking-wide uppercase">Support Inbox</h1>
          <p className="text-sm opacity-60">Manage communications with Clinical Staff</p>
        </div>
      </div>

      <div className={`flex-1 border rounded-xl shadow-2xl flex overflow-hidden ${theme === 'DARK' ? 'bg-[#131826] border-[#1e293b]' : 'bg-white border-gray-200'}`}>
        {/* Sidebar: Conversation List */}
        <div className={`w-80 border-r flex flex-col ${theme === 'DARK' ? 'bg-[#1a2133] border-[#1e293b]' : 'bg-slate-50 border-gray-200'}`}>
          <div className={`p-4 border-b ${theme === 'DARK' ? 'border-[#1e293b]' : 'border-gray-200'}`}>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="text" placeholder="Search staff..." className={`w-full border rounded px-9 py-2 text-xs focus:outline-none ${theme === 'DARK' ? 'bg-[#0a0e17] border-[#2a364a] text-slate-300' : 'bg-white border-gray-300 text-slate-800'}`} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {conversations.length === 0 ? (
              <div className="text-center text-slate-500 text-xs mt-10 p-4">No conversations yet</div>
            ) : (
              conversations.map((conv, i) => (
                <div 
                  key={conv.user_id || i}
                  onClick={() => setActiveChat(conv.user_id)}
                  className={`p-4 border-b cursor-pointer transition-colors ${
                    theme === 'DARK' 
                      ? `border-[#1e293b] hover:bg-[#2a364a]/50 ${activeChat === conv.user_id ? 'bg-[#2a364a]' : ''}`
                      : `border-gray-200 hover:bg-gray-100 ${activeChat === conv.user_id ? 'bg-gray-200' : ''}`
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-bold text-sm truncate flex items-center gap-2 ${theme === 'DARK' ? 'text-slate-200' : 'text-slate-800'}`}>
                      <CircleUser className="w-4 h-4 text-slate-400" /> {conv.name}
                    </h3>
                    {conv.unread_count > 0 && (
                      <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{conv.unread_count}</span>
                    )}
                  </div>
                  <div className="flex justify-between items-end">
                    <p className="text-xs text-slate-500 truncate pr-2 max-w-[150px]">{conv.last_message}</p>
                    <p className="text-[9px] text-slate-600 whitespace-nowrap">{new Date(conv.last_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        {activeChat ? (
          <div className={`flex-1 flex flex-col relative ${theme === 'DARK' ? 'bg-[#0a0e17]' : 'bg-[#f8fafc]'}`}>
            {/* Chat Header */}
            <div className={`border-b p-4 flex items-center justify-between ${theme === 'DARK' ? 'bg-[#1a2133] border-[#1e293b]' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full border flex items-center justify-center ${theme === 'DARK' ? 'bg-slate-800 border-slate-600' : 'bg-slate-100 border-slate-300'}`}>
                  <User className={`w-5 h-5 ${theme === 'DARK' ? 'text-slate-300' : 'text-slate-500'}`} />
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${theme === 'DARK' ? 'text-slate-200' : 'text-slate-800'}`}>{activeUser?.name || activeChat}</h3>
                  <p className="text-xs text-slate-500 font-mono">ID: {activeChat} | {activeUser?.level}</p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {loading ? (
                <div className="h-full flex items-center justify-center text-slate-500">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3 opacity-50">
                  <MessageSquare className="w-12 h-12" />
                  <p className="text-xs uppercase tracking-widest">No messages yet.</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMine = msg.sender_id === adminId;
                  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={msg.id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl p-4 shadow-md ${
                        isMine 
                          ? 'bg-indigo-600 text-white rounded-br-sm' 
                          : theme === 'DARK'
                            ? 'bg-[#1e293b] text-slate-200 rounded-bl-sm border border-[#2a364a]'
                            : 'bg-white text-slate-800 rounded-bl-sm border border-gray-200'
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <div className={`text-[10px] mt-2 flex items-center gap-1 ${isMine ? 'text-indigo-200 justify-end' : 'text-slate-400'}`}>
                          {time}
                          {isMine && (
                            <span className="ml-1">
                              {msg.is_read ? (
                                <span className="text-emerald-300 font-bold">✓✓</span>
                              ) : (
                                <span className="opacity-70">✓</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className={`border-t p-4 flex gap-3 ${theme === 'DARK' ? 'bg-[#1a2133] border-[#1e293b]' : 'bg-white border-gray-200'}`}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type reply..."
                className={`flex-1 border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all ${
                  theme === 'DARK' 
                    ? 'bg-[#0a0e17] border-[#2a364a] text-slate-200 placeholder-slate-600'
                    : 'bg-slate-50 border-gray-300 text-slate-800 placeholder-slate-400'
                }`}
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg"
              >
                Send <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className={`flex-1 flex flex-col items-center justify-center ${theme === 'DARK' ? 'bg-[#0a0e17] text-slate-600' : 'bg-slate-50 text-slate-400'}`}>
            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-sm uppercase tracking-widest font-bold">Select a conversation</p>
          </div>
        )}
      </div>
    </div>
  );
};
