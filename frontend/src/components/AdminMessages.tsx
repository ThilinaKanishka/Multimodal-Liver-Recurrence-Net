import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, User, MessageSquare, ShieldAlert, CircleUser, Search, Paperclip, Smile, Check, CheckCheck, Clock, ShieldCheck, Ticket, Plus, X, Mail } from 'lucide-react';

const analyzeTone = (text: string) => {
  if (!text || text.length < 3) return null;
  const lower = text.toLowerCase();
  
  const professionalWords = ['please', 'kindly', 'thank you', 'appreciate', 'sorry', 'apologize', 'regards', 'assist', 'help', 'sure', 'yes'];
  const negativeWords = ['bad', 'terrible', 'worst', 'hate', 'fail', 'broken', 'not working', 'stupid', 'urgent', 'asap', 'immediately', 'issue', 'error'];
  const positiveWords = ['good', 'great', 'awesome', 'fixed', 'resolved', 'working', 'perfect', 'thanks', 'excellent'];
  
  let profCount = 0; let negCount = 0; let posCount = 0;
  
  professionalWords.forEach(w => { if (lower.includes(w)) profCount++; });
  negativeWords.forEach(w => { if (lower.includes(w)) negCount++; });
  positiveWords.forEach(w => { if (lower.includes(w)) posCount++; });
  
  if (negCount > posCount && negCount > profCount) return { tone: 'Urgent / Negative', color: 'text-red-500 bg-red-500/10 border-red-500/20', icon: '🚨' };
  if (posCount > negCount) return { tone: 'Positive / Resolved', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', icon: '✅' };
  if (profCount > 0) return { tone: 'Professional', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', icon: '👔' };
  
  return { tone: 'Neutral', color: 'text-slate-500 bg-slate-500/10 border-slate-500/20', icon: '💬' };
};

const getSuggestion = (text: string) => {
  if (!text.trim()) return null;
  const lower = text.toLowerCase();
  if (lower.endsWith('thank ')) return 'you for your patience.';
  if (lower.endsWith('please ')) return 'let me know if you need anything else.';
  if (lower.endsWith('we will ')) return 'look into this immediately.';
  if (lower.endsWith('i am ')) return 'working on a fix right now.';
  if (lower.endsWith('can you ')) return 'provide more details?';
  return null;
};

export const AdminMessages = ({ theme }: { theme: 'DARK' | 'LIGHT' }) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sendViaEmail, setSendViaEmail] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'TICKET' | 'EMAIL'>('TICKET');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatMode, setNewChatMode] = useState<'CHAT' | 'EMAIL'>('CHAT');
  const [activeDoctors, setActiveDoctors] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const adminId = "ST-ADMIN";

  const getTicketId = (uid: string) => {
    if (!uid) return "TCK-0000";
    const numMatch = uid.match(/\d+/);
    if (numMatch) return `TCK-${numMatch[0]}`;
    return `TCK-${uid.substring(0, 4).toUpperCase()}`;
  };

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
      const res = await axios.get(`http://127.0.0.1:8000/api/messages/conversation/${adminId}/${activeChat}/${sidebarTab}`);
      setMessages(res.data.messages);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(() => {
      fetchConversations();
      if (activeChat) fetchMessages();
    }, 3000);
    return () => clearInterval(interval);
  }, [activeChat, sidebarTab]);

  useEffect(() => {
    if (activeChat) {
      setLoading(true);
      fetchMessages();
    }
  }, [activeChat, sidebarTab]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchActiveDoctors = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/v1/admin/doctor-stats');
      setActiveDoctors(res.data.filter((d: any) => d.status !== 'Revoked'));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (showNewChatModal) {
      fetchActiveDoctors();
    }
  }, [showNewChatModal]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    try {
      const msgData = {
        sender_id: adminId,
        receiver_id: activeChat,
        content: newMessage,
        send_via_email: sidebarTab === 'EMAIL' ? true : sendViaEmail,
        thread_type: sidebarTab
      };
      setNewMessage("");
      if (sidebarTab !== 'EMAIL') {
        setSendViaEmail(false);
      }
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
  const filteredConversations = conversations.filter(c => {
    const matchesSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.user_id.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (sidebarTab === 'TICKET') return matchesSearch && c.is_ticket;
    return matchesSearch && !c.is_ticket;
  });

  return (
    <div className="flex-1 flex flex-col min-h-[600px] h-[calc(100vh-180px)] overflow-hidden animate-in fade-in duration-500">
      <div className={`flex items-center gap-4 mb-6 border-b pb-5 flex-shrink-0 ${theme === 'DARK' ? 'border-slate-800' : 'border-gray-200'}`}>
        <div className={`p-3 rounded border shadow-sm ${theme === 'DARK' ? 'bg-[#131524] border-[#1a1c2c] text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
          <ShieldCheck className="w-7 h-7" />
        </div>
        <div>
          <h1 className={`text-2xl font-bold tracking-wide uppercase ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-800'}`}>IT Command Center</h1>
          <p className={`text-sm flex items-center gap-2 mt-1 ${theme === 'DARK' ? 'text-slate-400' : 'text-slate-500'}`}>
            <Clock className="w-3.5 h-3.5" /> Level 2 Helpdesk & Ticketing Console
          </p>
        </div>
      </div>

      <div className={`flex-1 border rounded-lg shadow-xl flex overflow-hidden relative ${theme === 'DARK' ? 'bg-[#1a1c2c] border-[#131524]' : 'bg-white border-gray-200'}`}>
        {/* Sidebar: Conversation List */}
        <div className={`w-80 border-r flex flex-col z-10 ${theme === 'DARK' ? 'bg-[#131524] border-[#1a1c2c]' : 'bg-slate-50 border-gray-200'}`}>
          <div className={`p-4 border-b flex flex-col gap-3 ${theme === 'DARK' ? 'border-[#1a1c2c]' : 'border-gray-200'}`}>
            <div className="flex gap-2 w-full">
              <button 
                onClick={() => { setNewChatMode('CHAT'); setShowNewChatModal(true); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-bold uppercase tracking-wider rounded border transition-colors shadow-sm ${theme === 'DARK' ? 'bg-[#1a1c2c] border-[#2a364a] text-slate-300 hover:text-white hover:border-indigo-500 hover:bg-[#1a1c2c]/80' : 'bg-white border-gray-300 text-slate-600 hover:text-indigo-700 hover:border-indigo-300 hover:bg-slate-50'}`}
              >
                <Plus className="w-3.5 h-3.5" /> New Chat
              </button>
              <button 
                onClick={() => { setNewChatMode('EMAIL'); setShowNewChatModal(true); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-bold uppercase tracking-wider rounded border transition-colors shadow-sm ${theme === 'DARK' ? 'bg-[#1a1c2c] border-[#2a364a] text-slate-300 hover:text-white hover:border-indigo-500 hover:bg-[#1a1c2c]/80' : 'bg-white border-gray-300 text-slate-600 hover:text-indigo-700 hover:border-indigo-300 hover:bg-slate-50'}`}
              >
                <Mail className="w-3.5 h-3.5" /> New Email
              </button>
            </div>
            <div className="relative group w-full">
              <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${theme === 'DARK' ? 'text-slate-500 group-focus-within:text-indigo-400' : 'text-slate-400 group-focus-within:text-indigo-600'}`} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Staff ID or Name..." 
                className={`w-full border rounded px-10 py-2.5 text-sm focus:outline-none transition-all shadow-inner ${
                  theme === 'DARK' 
                    ? 'bg-[#0f111a] border-[#1a1c2c] text-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-600' 
                    : 'bg-white border-gray-300 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-400'
                }`} 
              />
            </div>
          </div>
          <div className={`flex text-[10px] font-bold font-mono border-b ${theme === 'DARK' ? 'border-[#1a1c2c]' : 'border-gray-200'}`}>
            <button 
              onClick={() => { setSidebarTab('TICKET'); setActiveChat(null); }}
              className={`flex-1 py-2 text-center transition-colors uppercase tracking-widest ${sidebarTab === 'TICKET' ? (theme === 'DARK' ? 'bg-indigo-500/20 text-indigo-400 border-b-2 border-indigo-500' : 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600') : (theme === 'DARK' ? 'text-slate-500 hover:text-slate-300 hover:bg-[#1a1c2c]/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50')}`}
            >
              Support Tickets
            </button>
            <button 
              onClick={() => { setSidebarTab('EMAIL'); setActiveChat(null); }}
              className={`flex-1 py-2 text-center transition-colors uppercase tracking-widest flex items-center justify-center gap-1.5 ${sidebarTab === 'EMAIL' ? (theme === 'DARK' ? 'bg-indigo-500/20 text-indigo-400 border-b-2 border-indigo-500' : 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600') : (theme === 'DARK' ? 'text-slate-500 hover:text-slate-300 hover:bg-[#1a1c2c]/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50')}`}
            >
              Direct Emails
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-70">
                <div className={`w-16 h-16 rounded mb-3 flex items-center justify-center ${theme === 'DARK' ? 'bg-[#1a1c2c]' : 'bg-slate-100'}`}>
                  {sidebarTab === 'TICKET' ? (
                    <Ticket className={`w-6 h-6 ${theme === 'DARK' ? 'text-slate-500' : 'text-slate-400'}`} />
                  ) : (
                    <Mail className={`w-6 h-6 ${theme === 'DARK' ? 'text-slate-500' : 'text-slate-400'}`} />
                  )}
                </div>
                <p className={`text-sm font-medium ${theme === 'DARK' ? 'text-slate-400' : 'text-slate-500'}`}>
                  {sidebarTab === 'TICKET' ? 'No active tickets' : 'No direct emails'}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv, i) => {
                const isUnread = conv.unread_count > 0;
                return (
                  <div 
                    key={conv.user_id || i}
                    onClick={() => setActiveChat(conv.user_id)}
                    className={`p-4 border-b cursor-pointer transition-all relative overflow-hidden group ${
                      theme === 'DARK' 
                        ? `border-[#1a1c2c] hover:bg-[#1a1c2c]/80 ${activeChat === conv.user_id ? 'bg-[#1a1c2c]' : ''}`
                        : `border-gray-200 hover:bg-indigo-50/50 ${activeChat === conv.user_id ? 'bg-indigo-50' : ''}`
                    }`}
                  >
                    {activeChat === conv.user_id && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                    )}
                    <div className="flex justify-between items-start mb-1.5">
                      <h3 className={`font-bold text-sm truncate flex items-center gap-2 ${theme === 'DARK' ? 'text-slate-200 group-hover:text-white' : 'text-slate-800 group-hover:text-indigo-900'}`}>
                        {conv.name || conv.user_id} <span className="text-[10px] font-mono text-slate-500">({conv.user_id})</span>
                      </h3>
                      {isUnread ? (
                        <span className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest">Open</span>
                      ) : (
                        <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest">Resolved</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-[10px] font-bold font-mono ${theme === 'DARK' ? 'text-slate-400' : 'text-slate-500'}`}>{getTicketId(conv.user_id)}</span>
                      {conv.unread_count > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 rounded shadow-sm">{conv.unread_count} new</span>
                      )}
                    </div>
                    <div className="flex justify-between items-end">
                      {(() => {
                        let text = conv.last_message || "";
                        if (text.startsWith("[TICKET_META]")) {
                          try {
                            const endIdx = text.indexOf("[/TICKET_META]");
                            if (endIdx > -1) text = text.substring(endIdx + 14).trim();
                          } catch(e) {}
                        } else {
                          const match = text.match(/^\[(.*?)\] - (.*?)\n\n([\s\S]*)$/);
                          if (match) text = match[3];
                        }
                        return (
                          <p className={`text-xs truncate pr-2 max-w-[150px] ${
                            conv.unread_count > 0 
                              ? (theme === 'DARK' ? 'text-slate-300 font-medium' : 'text-slate-700 font-medium')
                              : (theme === 'DARK' ? 'text-slate-500' : 'text-slate-500')
                          }`}>{text}</p>
                        );
                      })()}
                      <p className={`text-[9.5px] whitespace-nowrap font-medium ${theme === 'DARK' ? 'text-slate-600' : 'text-slate-400'}`}>
                        {new Date(conv.last_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        {activeChat ? (
          <div className={`flex-1 flex flex-col relative z-0 ${theme === 'DARK' ? 'bg-[#1a1c2c]' : 'bg-slate-50'}`}>
            
            {/* Chat Header */}
            <div className={`border-b p-4 flex items-center justify-between z-10 shadow-sm ${theme === 'DARK' ? 'bg-[#131524] border-[#1a1c2c]' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded border flex items-center justify-center shadow-sm ${theme === 'DARK' ? 'bg-[#1a1c2c] border-[#2a364a]' : 'bg-slate-100 border-slate-200'}`}>
                  {sidebarTab === 'TICKET' ? (
                    <Ticket className={`w-5 h-5 ${theme === 'DARK' ? 'text-indigo-400' : 'text-indigo-500'}`} />
                  ) : (
                    <Mail className={`w-5 h-5 ${theme === 'DARK' ? 'text-indigo-400' : 'text-indigo-500'}`} />
                  )}
                </div>
                <div>
                  {sidebarTab === 'TICKET' ? (
                    <h3 className={`text-base font-bold tracking-wide ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-800'}`}>Ticket #{getTicketId(activeChat)}: {activeUser?.name || 'Staff Member'}</h3>
                  ) : (
                    <h3 className={`text-base font-bold tracking-wide flex items-center gap-2 ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-800'}`}>
                      Email Thread: {activeUser?.name || 'Staff Member'}
                    </h3>
                  )}
                  <p className={`text-xs font-medium flex items-center gap-1.5 mt-0.5 ${theme === 'DARK' ? 'text-slate-400' : 'text-slate-500'}`}>
                    ID: {activeChat} <span className="opacity-50">|</span> {activeUser?.level || 'Clinical Staff'}
                    {activeUser?.is_logged_in && (
                      <span className="ml-2 text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className={`flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar ${theme === 'DARK' ? 'bg-[#1a1c2c]' : 'bg-slate-50'}`}>
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className={`flex items-center gap-3 px-6 py-3 rounded border shadow-md ${theme === 'DARK' ? 'bg-[#131524] border-[#1a1c2c]' : 'bg-white border-gray-200'}`}>
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className={`text-sm font-medium ${theme === 'DARK' ? 'text-slate-400' : 'text-slate-600'}`}>Loading ticket history...</span>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 opacity-70 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className={`w-24 h-24 rounded flex items-center justify-center shadow-lg border ${theme === 'DARK' ? 'bg-[#131524] border-[#1a1c2c]' : 'bg-white border-gray-200'}`}>
                    <Ticket className={`w-10 h-10 ${theme === 'DARK' ? 'text-slate-500' : 'text-slate-300'}`} />
                  </div>
                  <div className="text-center">
                    <h4 className={`text-lg font-bold mb-1 ${theme === 'DARK' ? 'text-slate-300' : 'text-slate-600'}`}>No ticket history</h4>
                    <p className={`text-xs max-w-xs ${theme === 'DARK' ? 'text-slate-500' : 'text-slate-400'}`}>Waiting for staff input.</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMine = msg.sender_id === adminId;
                  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  // Group messages
                  const isFirst = i === 0 || messages[i-1].sender_id !== msg.sender_id;
                  
                  let parsedMeta: any = null;
                  let textContent = msg.content;
                  
                  if (msg.content.startsWith("[TICKET_META]")) {
                    try {
                      const endIdx = msg.content.indexOf("[/TICKET_META]");
                      if (endIdx > -1) {
                        const jsonStr = msg.content.substring(13, endIdx);
                        parsedMeta = JSON.parse(jsonStr);
                        textContent = msg.content.substring(endIdx + 14).trim();
                      }
                    } catch(e) {}
                  } else {
                    const match = msg.content.match(/^\[(.*?)\] - (.*?)\n\n([\s\S]*)$/);
                    if (match) {
                      parsedMeta = { category: match[1], subCategory: match[2] };
                      textContent = match[3];
                    }
                  }
                  
                  const priorityColors: Record<string, string> = {
                    "Low": "text-slate-500 bg-slate-500/10 border-slate-500/20",
                    "Medium": "text-amber-500 bg-amber-500/10 border-amber-500/20",
                    "High": "text-orange-500 bg-orange-500/10 border-orange-500/20",
                    "Critical": "text-red-500 bg-red-500/10 border-red-500/20"
                  };
                  
                  return (
                    <div key={msg.id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${isFirst ? 'mt-6' : 'mt-2'}`}>
                      <div className={`group relative max-w-[85%] md:max-w-[75%] px-5 py-4 shadow-sm transition-all ${
                        isMine 
                          ? (theme === 'DARK' ? 'bg-[#1a1d27] text-slate-200 rounded-lg rounded-tr-sm border border-[#2a364a]' : 'bg-indigo-600 text-white rounded-lg rounded-tr-sm border border-indigo-700 shadow-sm')
                          : theme === 'DARK'
                            ? 'bg-[#131524] text-slate-200 rounded-lg rounded-tl-sm border border-[#2a364a]'
                            : 'bg-white text-slate-800 rounded-lg rounded-tl-sm border border-gray-200 shadow-sm'
                      }`}>
                        {parsedMeta && (
                          <div className={`text-[11px] font-bold mb-3 pb-3 border-b flex flex-wrap items-center gap-x-3 gap-y-2 ${isMine ? 'border-indigo-400/30' : (theme === 'DARK' ? 'border-[#2a364a]' : 'border-gray-200')}`}>
                             <div className="flex items-center gap-2">
                               <span className={`px-2 py-0.5 rounded ${isMine ? 'bg-indigo-500/30 text-indigo-100' : (theme === 'DARK' ? 'bg-[#2a364a] text-slate-300' : 'bg-gray-100 text-slate-600')}`}>{parsedMeta.category}</span>
                               <span className={isMine ? "text-indigo-300/50" : "text-slate-400"}>/</span>
                               <span className={isMine ? "text-indigo-100" : (theme === 'DARK' ? 'text-slate-300' : 'text-slate-600')}>{parsedMeta.subCategory}</span>
                             </div>
                             
                             {parsedMeta.priority && (
                               <>
                                 <span className={isMine ? "text-blue-300/50 hidden sm:inline" : "text-slate-400 hidden sm:inline"}>•</span>
                                 <span className={`px-2 py-0.5 rounded border ${isMine ? 'bg-[#0f172a]/40 border-[#1e293b]/50 text-amber-200' : priorityColors[parsedMeta.priority] || 'text-slate-500 bg-slate-100'}`}>
                                   {parsedMeta.priority} Priority
                                 </span>
                               </>
                             )}
                             
                             {parsedMeta.impactedSystem && (
                               <>
                                 <span className={isMine ? "text-indigo-300/50 hidden sm:inline" : "text-slate-400 hidden sm:inline"}>•</span>
                                 <span className={isMine ? "text-indigo-100" : (theme === 'DARK' ? 'text-slate-400' : 'text-slate-500')}>System: {parsedMeta.impactedSystem}</span>
                               </>
                             )}
                             
                             {parsedMeta.patientRef && (
                               <>
                                 <span className={isMine ? "text-indigo-300/50 hidden sm:inline" : "text-slate-400 hidden sm:inline"}>•</span>
                                 <span className={`px-2 py-0.5 rounded ${isMine ? 'bg-indigo-500/30 text-indigo-100' : (theme === 'DARK' ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border border-indigo-200')}`}>
                                   Ref: {parsedMeta.patientRef}
                                 </span>
                               </>
                             )}
                          </div>
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{textContent}</p>
                        <div className={`text-[10px] mt-1.5 flex items-center gap-1.5 ${isMine ? (theme === 'DARK' ? 'text-slate-400' : 'text-indigo-200') + ' justify-end' : (theme === 'DARK' ? 'text-slate-400' : 'text-slate-400')}`}>
                          {msg.sent_via_email && (
                            <span className={`flex items-center gap-1 mr-2 px-1.5 py-0.5 rounded ${isMine ? (theme === 'DARK' ? 'bg-[#2a364a] text-slate-300' : 'bg-indigo-500 text-indigo-100') : (theme === 'DARK' ? 'bg-[#2a364a] text-slate-300' : 'bg-slate-200 text-slate-600')}`} title="Dispatched via Email">
                              <Mail className="w-2.5 h-2.5" /> Sent via Email
                            </span>
                          )}
                          {time}
                          {isMine && (
                            <span className="ml-0.5">
                              {msg.is_read ? (
                                <CheckCheck className={`w-3.5 h-3.5 ${theme === 'DARK' ? 'text-emerald-400' : 'text-sky-300'}`} />
                              ) : (
                                <Check className={`w-3.5 h-3.5 ${theme === 'DARK' ? 'text-slate-500' : 'text-indigo-300/70'}`} />
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
            <div className={`border-t p-4 z-10 ${theme === 'DARK' ? 'bg-[#131524] border-[#1a1c2c]' : 'bg-white border-gray-200'}`}>
              <form onSubmit={handleSend} className="flex flex-col gap-3 max-w-5xl mx-auto">
                <div className="flex items-end gap-3">
                  <button type="button" className={`p-3 rounded transition-colors flex-shrink-0 border border-transparent ${theme === 'DARK' ? 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1c2c] hover:border-[#2a364a]' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 hover:border-gray-300'}`}>
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      spellCheck="true"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                         const suggestion = getSuggestion(newMessage);
                         if (e.key === 'Tab' && suggestion) {
                           e.preventDefault();
                           setNewMessage(newMessage + suggestion);
                         }
                      }}
                      placeholder={sidebarTab === 'EMAIL' ? "Write direct email message..." : "Add response to ticket..."}
                      className={`w-full border rounded px-5 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner ${
                        theme === 'DARK' 
                          ? 'bg-[#0f111a] border-[#2a364a] text-slate-200 placeholder-slate-600'
                          : 'bg-slate-50 border-gray-300 text-slate-800 placeholder-slate-400'
                      }`}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className={`px-6 py-3 rounded font-bold flex items-center justify-center transition-all border shadow-sm ${
                      theme === 'DARK'
                        ? 'bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-700 text-white border-indigo-600 hover:border-indigo-500'
                        : 'bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-300 text-white border-indigo-700 hover:border-indigo-800'
                    }`}
                  >
                    Reply <Send className="w-4 h-4 ml-2" />
                  </button>
                </div>
                
                <div className="flex items-center gap-3 pl-14">
                  {analyzeTone(newMessage) && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${analyzeTone(newMessage)?.color} shadow-sm transition-all animate-in fade-in zoom-in-95 duration-200`}>
                      {analyzeTone(newMessage)?.icon} Tone: {analyzeTone(newMessage)?.tone}
                    </span>
                  )}
                  {getSuggestion(newMessage) && (
                    <button type="button" onClick={() => setNewMessage(newMessage + getSuggestion(newMessage))} className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded hover:bg-indigo-500/20 transition-all flex items-center gap-1 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                      ✨ Suggestion: {getSuggestion(newMessage)} (Press Tab)
                    </button>
                  )}
                </div>
                
                {/* Send via Email Checkbox */}
                {sidebarTab !== 'EMAIL' && (
                  <div className="flex items-center gap-2 pl-14">
                    <input 
                      type="checkbox" 
                      id="sendEmail" 
                      checked={sendViaEmail}
                      onChange={(e) => setSendViaEmail(e.target.checked)}
                      className={`w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 ${theme === 'DARK' ? 'bg-[#0f111a] border-[#2a364a]' : ''}`}
                    />
                    <label htmlFor="sendEmail" className={`text-xs font-medium cursor-pointer ${theme === 'DARK' ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-800'}`}>
                      Also send a copy via Email
                    </label>
                  </div>
                )}
              </form>
            </div>
          </div>
        ) : (
          <div className={`flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500 ${theme === 'DARK' ? 'bg-[#1a1c2c] text-slate-600' : 'bg-slate-50 text-slate-400'}`}>
            <div className={`w-32 h-32 rounded mb-6 flex items-center justify-center shadow-2xl border ${theme === 'DARK' ? 'bg-[#131524] border-[#1a1c2c]' : 'bg-white border-gray-100'}`}>
              <ShieldCheck className={`w-14 h-14 ${theme === 'DARK' ? 'text-slate-700' : 'text-slate-300'}`} />
            </div>
            <h2 className={`text-xl font-bold mb-2 ${theme === 'DARK' ? 'text-slate-300' : 'text-slate-600'}`}>L2 Ticketing Console</h2>
            <p className={`text-sm max-w-sm text-center ${theme === 'DARK' ? 'text-slate-500' : 'text-slate-500'}`}>Select a ticket from the queue to view details and provide assistance to clinical staff.</p>
          </div>
        )}
      </div>


      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className={`w-full max-w-lg border rounded-lg shadow-2xl flex flex-col max-h-[80vh] ${theme === 'DARK' ? 'bg-[#131524] border-[#2a364a]' : 'bg-white border-gray-200'}`}>
            <div className={`p-4 border-b flex justify-between items-center ${theme === 'DARK' ? 'bg-[#0f111a] border-[#2a364a]' : 'bg-gray-50 border-gray-200'}`}>
              <h3 className={`font-bold text-lg flex items-center gap-2 ${theme === 'DARK' ? 'text-slate-200' : 'text-slate-800'}`}>
                {newChatMode === 'EMAIL' ? (
                  <><Mail className="w-5 h-5 text-indigo-500" /> Compose Direct Email</>
                ) : (
                  <><MessageSquare className="w-5 h-5 text-indigo-500" /> Start New Chat</>
                )}
              </h3>
              <button onClick={() => setShowNewChatModal(false)} className={`p-1.5 rounded transition-colors ${theme === 'DARK' ? 'text-slate-400 hover:bg-[#1a1c2c] hover:text-white' : 'text-slate-500 hover:bg-gray-200 hover:text-slate-800'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className={`p-4 overflow-y-auto custom-scrollbar flex-1 ${theme === 'DARK' ? 'bg-[#131524]' : 'bg-white'}`}>
              {activeDoctors.length === 0 ? (
                <p className="text-center text-slate-500 py-10">No doctors available.</p>
              ) : (
                <div className="space-y-2.5">
                  {activeDoctors.map(doc => (
                    <div 
                      key={doc.id}
                      onClick={() => {
                        setActiveChat(doc.id);
                        if (newChatMode === 'EMAIL') {
                          setSendViaEmail(true);
                          setSidebarTab('EMAIL');
                        } else {
                          setSendViaEmail(false);
                          setSidebarTab('TICKET'); // Or keep it as is
                        }
                        setShowNewChatModal(false);
                      }}
                      className={`p-3.5 border rounded cursor-pointer transition-colors flex items-center justify-between shadow-sm ${
                        theme === 'DARK' 
                          ? 'border-[#2a364a] hover:border-indigo-500 bg-[#0f111a] hover:bg-[#1a1c2c]' 
                          : 'border-gray-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50'
                      }`}
                    >
                      <div>
                        <p className={`font-bold text-sm ${theme === 'DARK' ? 'text-slate-200' : 'text-slate-800'}`}>{doc.name}</p>
                        <p className={`text-xs mt-0.5 ${theme === 'DARK' ? 'text-slate-500' : 'text-slate-500'}`}>{doc.id} • {doc.dept}</p>
                      </div>
                      {newChatMode !== 'EMAIL' && (
                        doc.is_logged_in ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1.5 shadow-sm">
                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active Now
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-500/10 text-slate-500 border border-slate-500/20 px-2 py-0.5 rounded shadow-sm">
                             Offline
                          </span>
                        )
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
