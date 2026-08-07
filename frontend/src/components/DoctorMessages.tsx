import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, User, MessageSquare, AlertCircle, Paperclip, Check, CheckCheck, Info, Ticket, X, Trash2, Maximize2, Mail, Clock, FileText, Activity, Server, Minimize2 } from 'lucide-react';

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
  if (!text) return null;
  const lower = text.toLowerCase();
  
  const phraseMatches: Record<string, string> = {
    'thank': 'you for reaching out.',
    'thanks': 'for letting us know.',
    'please': 'provide more details.',
    'can you': 'check if the issue persists?',
    'i will': 'look into this immediately.',
    'we are': 'working on a fix right now.',
    'let me': 'know if you need anything else.',
    'sorry': 'for the inconvenience.',
    'issue': 'has been resolved.',
    'it is': 'working now.',
  };
  
  for (const [key, completion] of Object.entries(phraseMatches)) {
    if (lower.endsWith(key + ' ')) return completion;
    if (lower.endsWith(key)) return ' ' + completion;
  }

  const words = lower.split(' ');
  const lastWord = words[words.length - 1];
  
  if (lastWord.length > 2) {
    const wordDictionary = ['immediately', 'professional', 'resolved', 'appreciate', 'apologize', 'inconvenience', 'assistance', 'information', 'password', 'account', 'connection', 'database', 'system'];
    for (const word of wordDictionary) {
      if (word.startsWith(lastWord) && word !== lastWord) {
        return word.slice(lastWord.length);
      }
    }
  }

  return null;
};

const issueCategories = {
  "Technical Issue": ["Workspace Access", "Comparison Tool Error", "UI Glitch", "System Crash", "Other"],
  "Network Issue": ["Server Disconnection", "Slow Loading Times", "Data Sync Failure", "Database Connection", "Other"],
  "Prediction Issue": ["Unexpected AI Result", "Missing Patient Data", "Model Timeout", "Image Upload Failed", "Other"],
  "Other": ["General Inquiry", "Feature Request", "Account Help", "Urgent Support Needed"]
};

export const DoctorMessages = ({ user }: { user: any }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [impactedSystem, setImpactedSystem] = useState("");
  const [patientRef, setPatientRef] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const adminId = "ST-ADMIN";

  const resolveUserId = () => {
    let uid = user?.id || user?._id || user?.staffId;
    if (!uid) {
      const saved = sessionStorage.getItem("hepatoai_current_user");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          uid = parsed.id || parsed._id || parsed.staffId;
        } catch(e) {}
      }
    }
    return uid;
  };

  const getTicketId = () => {
    const uid = resolveUserId();
    if (!uid) return "TCK-PENDING";
    const numMatch = uid.match(/\d+/);
    if (numMatch) return `TCK-${numMatch[0]}`;
    return `TCK-${uid.substring(0, 4).toUpperCase()}`;
  };

  const fetchMessages = async () => {
    try {
      const currentUserId = resolveUserId();
      if (!currentUserId) {
        setLoading(false);
        return;
      }
      const res = await axios.get(`http://127.0.0.1:8000/api/messages/conversation/${currentUserId}/${adminId}/ALL`);
      setMessages(res.data.messages);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUserId = resolveUserId();
    if (!newMessage.trim() || !currentUserId || !category || !subCategory || !priority || !impactedSystem) return;

    try {
      const meta = { category, subCategory, priority, impactedSystem, patientRef };
      const finalContent = `[TICKET_META]${JSON.stringify(meta)}[/TICKET_META]\n${newMessage.trim()}`;
      
      const msgData = {
        sender_id: currentUserId,
        receiver_id: adminId,
        content: finalContent
      };
      setNewMessage("");
      setCategory("");
      setSubCategory("");
      setPriority("");
      setImpactedSystem("");
      setPatientRef("");
      setActiveTab('history');
      // Optimistic update
      setMessages(prev => [...prev, { ...msgData, _id: Date.now().toString(), timestamp: new Date().toISOString(), is_read: false }]);
      
      await axios.post('http://127.0.0.1:8000/api/messages/send', msgData);
      fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (msgId: string) => {
    try {
      setIsDeleting(true);
      await axios.delete(`http://127.0.0.1:8000/api/messages/${msgId}`);
      setMessages(prev => prev.filter(m => m.id !== msgId));
      setSelectedMessage(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleQuickReply = async () => {
    if (!replyText.trim() || !selectedMessage) return;
    const currentUserId = resolveUserId();
    if (!currentUserId) return;

    try {
      setIsReplying(true);
      const msgData = {
        sender_id: currentUserId,
        receiver_id: adminId,
        content: replyText.trim(),
        thread_type: selectedMessage.thread_type || "TICKET"
      };
      
      setReplyText("");
      setSelectedMessage(null);
      setMessages(prev => [...prev, { ...msgData, _id: Date.now().toString(), timestamp: new Date().toISOString(), is_read: false }]);
      
      await axios.post('http://127.0.0.1:8000/api/messages/send', msgData);
      fetchMessages();
    } catch (err) {
      console.error(err);
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <div className="flex-1 p-8 bg-[#0a0f18] text-slate-300 font-sans h-screen flex flex-col overflow-hidden relative z-0 animate-in fade-in duration-500">
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#00e5ff]/5 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#00ff9d]/5 blur-[150px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-5 flex-shrink-0 relative z-10">
        <div className="p-3 bg-[#0f1522]/80 border border-white/10 rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.15)] flex-shrink-0 relative group">
          <div className="absolute inset-0 bg-[#00e5ff] rounded-xl opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-500"></div>
          <Ticket className="w-7 h-7 text-[#00e5ff] drop-shadow-[0_0_8px_rgba(0,229,255,0.8)] relative z-10" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black text-white uppercase tracking-[0.2em] drop-shadow-md">IT Helpdesk & Ticketing</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff9d] animate-pulse shadow-[0_0_5px_#00ff9d]"></span> Enterprise Clinical Systems Support
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6 flex-shrink-0 border-b border-white/10 pb-5 relative z-10">
        <button 
          onClick={() => setActiveTab('create')}
          className={`px-6 py-3 rounded-lg font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-2 border ${
            activeTab === 'create' 
              ? 'bg-[#00e5ff]/10 text-[#00e5ff] border-[#00e5ff]/50 shadow-[0_0_15px_rgba(0,229,255,0.2)]' 
              : 'bg-[#0f1522]/60 text-slate-400 hover:text-white hover:bg-[#00e5ff]/5 hover:border-[#00e5ff]/30 border-white/10 backdrop-blur-xl'
          }`}
        >
          <Ticket className="w-4 h-4" /> Create New Ticket
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 rounded-lg font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-2 border ${
            activeTab === 'history' 
              ? 'bg-[#00ff9d]/10 text-[#00ff9d] border-[#00ff9d]/50 shadow-[0_0_15px_rgba(0,255,157,0.2)]' 
              : 'bg-[#0f1522]/60 text-slate-400 hover:text-white hover:bg-[#00ff9d]/5 hover:border-[#00ff9d]/30 border-white/10 backdrop-blur-xl'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Ticket History
          {messages.length > 0 && (
            <span className={`ml-2 px-2 py-0.5 rounded-md text-[9px] font-black ${activeTab === 'history' ? 'bg-[#00ff9d]/20 border border-[#00ff9d]/30' : 'bg-black/40 border border-white/10'}`}>
              {messages.length}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 bg-[#0f1522]/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden relative z-10">
        {activeTab === 'history' && (
          <>
            {/* Ticketing Header */}
            <div className="bg-black/40 border-b border-white/10 p-5 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#0f1522]/80 border border-white/10 flex items-center justify-center shadow-inner">
                  <Ticket className="w-5 h-5 text-[#00ff9d]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white tracking-[0.1em] uppercase">Ticket #{getTicketId()}: System Support</h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[9px] font-black uppercase tracking-widest bg-[#00ff9d]/10 text-[#00ff9d] border border-[#00ff9d]/30 px-2.5 py-1 rounded-md">
                      Status: Open
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Assigned to: L2 Admin Support</span>
                  </div>
                </div>
              </div>
              <div className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] uppercase tracking-[0.2em] font-black rounded-lg flex items-center gap-2 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                <AlertCircle className="w-3.5 h-3.5" /> Secure HIPAA Channel
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent bg-transparent">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex items-center gap-3 bg-[#1a1c2c] px-6 py-3 rounded border border-[#2a364a] shadow-md">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-slate-400 text-sm font-medium">Loading ticket history...</span>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4 opacity-70 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="w-24 h-24 rounded bg-[#1a1c2c] flex items-center justify-center shadow-xl border border-[#2a364a]">
                <Ticket className="w-10 h-10 text-slate-500" />
              </div>
              <div className="text-center">
                <h4 className="text-lg font-bold text-slate-300 mb-1">No messages in this ticket</h4>
                <p className="text-xs text-slate-500 max-w-xs">Describe your issue below to open a new support request.</p>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => {
              const currentUserId = resolveUserId();
              const isMine = msg.sender_id === currentUserId;
              const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
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
                "Low": "text-slate-400 bg-slate-500/20 border-slate-500/30",
                "Medium": "text-amber-400 bg-amber-500/20 border-amber-500/30",
                "High": "text-orange-400 bg-orange-500/20 border-orange-500/30",
                "Critical": "text-red-400 bg-red-500/20 border-red-500/30"
              };
              
              return (
                <div key={msg.id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${isFirst ? 'mt-6' : 'mt-2'}`}>
                  <div className={`group relative max-w-[85%] md:max-w-[75%] px-6 py-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all ${
                    isMine 
                      ? 'bg-[#00e5ff]/5 text-slate-200 rounded-2xl rounded-tr-sm border border-[#00e5ff]/20' 
                      : 'bg-[#00ff9d]/5 text-slate-200 rounded-2xl rounded-tl-sm border border-[#00ff9d]/20'
                  }`}>
                    {parsedMeta && (
                      <div className={`text-[9px] font-black mb-4 pb-4 border-b flex flex-wrap items-center gap-x-3 gap-y-2 uppercase tracking-[0.1em] ${isMine ? 'border-white/10' : 'border-white/10'}`}>
                         <div className="flex items-center gap-2">
                           <span className={`px-2.5 py-1 rounded-md ${isMine ? 'bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[#00e5ff]' : 'bg-[#00ff9d]/10 border border-[#00ff9d]/30 text-[#00ff9d]'}`}>{parsedMeta.category}</span>
                           <span className={isMine ? "text-[#00e5ff]/50" : "text-[#00ff9d]/50"}>/</span>
                           <span className={isMine ? "text-slate-300" : "text-slate-300"}>{parsedMeta.subCategory}</span>
                         </div>
                         
                         {parsedMeta.priority && (
                           <>
                             <span className={isMine ? "text-slate-500 hidden sm:inline" : "text-slate-500 hidden sm:inline"}>•</span>
                             <span className={`px-2.5 py-1 rounded-md border ${isMine ? (priorityColors[parsedMeta.priority] || 'text-slate-400 bg-black/40 border-white/10') : (priorityColors[parsedMeta.priority] || 'text-slate-300 bg-black/40 border-white/10')}`}>
                               {parsedMeta.priority} Priority
                             </span>
                           </>
                         )}
                         
                         {parsedMeta.impactedSystem && (
                           <>
                             <span className={isMine ? "text-slate-500 hidden sm:inline" : "text-slate-500 hidden sm:inline"}>•</span>
                             <span className={isMine ? "text-slate-400" : "text-slate-400"}>System: {parsedMeta.impactedSystem}</span>
                           </>
                         )}
                         
                         {parsedMeta.patientRef && (
                           <>
                             <span className={isMine ? "text-slate-500 hidden sm:inline" : "text-slate-500 hidden sm:inline"}>•</span>
                             <span className={`px-2.5 py-1 rounded-md ${isMine ? 'bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[#00e5ff]' : 'bg-[#00ff9d]/10 text-[#00ff9d] border border-[#00ff9d]/30'}`}>
                               Ref: {parsedMeta.patientRef}
                             </span>
                           </>
                         )}
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{textContent}</p>
                    <div className={`text-[10px] mt-4 flex items-center gap-2 font-bold uppercase tracking-widest ${isMine ? 'text-slate-500 justify-end' : 'text-slate-500'}`}>
                      {msg.sent_via_email && (
                        <span className={`flex items-center gap-1 mr-1 px-2 py-1 rounded-md ${isMine ? 'bg-black/40 text-slate-300 border border-white/10' : 'bg-black/40 text-slate-300 border border-white/10'}`} title="Dispatched via Email">
                          <Mail className="w-3 h-3" /> Sent via Email
                        </span>
                      )}
                      {time}
                      
                      <button onClick={() => setSelectedMessage(msg)} className={`flex items-center gap-1 hover:text-white transition-colors ${isMine ? 'text-[#00e5ff]' : 'text-[#00ff9d]'} ml-3`}>
                        <Maximize2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline uppercase font-black tracking-widest text-[9px]">View</span>
                      </button>
                      
                      {isMine && (
                        <button onClick={() => handleDelete(msg.id)} disabled={isDeleting} className="flex items-center gap-1 hover:text-red-400 text-red-500/70 transition-colors ml-2">
                          <Trash2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline uppercase font-black tracking-widest text-[9px]">Delete</span>
                        </button>
                      )}
                      
                      {isMine && (
                        <span className="ml-3 pl-3 border-l border-white/10">
                          {msg.is_read ? (
                            <CheckCheck className="w-4 h-4 text-[#00e5ff]" title="Read by Admin" />
                          ) : (
                            <Check className="w-4 h-4 text-[#00e5ff]/50" title="Delivered" />
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
          </>
        )}

        {activeTab === 'create' && (
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent bg-transparent">
          <div className="bg-black/40 border-b border-white/10 p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-[#0f1522]/80 border border-[#00e5ff]/30 rounded-full flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(0,229,255,0.2)]">
              <AlertCircle className="w-8 h-8 text-[#00e5ff]" />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-[0.2em] mb-2">Submit a Support Request</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 max-w-lg mx-auto">Please provide detailed information about the issue you are facing. Our L2 Support Team will review and respond as quickly as possible.</p>
          </div>
          
          <div className="p-6 md:p-10">
            <form onSubmit={handleSend} className="max-w-4xl mx-auto flex flex-col gap-8">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Issue Category <span className="text-red-500">*</span></label>
                <select 
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); setSubCategory(""); }}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-bold tracking-wide text-slate-200 focus:outline-none focus:border-[#00e5ff]/50 focus:ring-1 focus:ring-[#00e5ff]/50 transition-all cursor-pointer hover:border-white/20 shadow-inner"
                  required
                >
                  <option value="" disabled>Select Primary Category...</option>
                  {Object.keys(issueCategories).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Specific Issue <span className="text-red-500">*</span></label>
                <select 
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  disabled={!category}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-bold tracking-wide text-slate-200 focus:outline-none focus:border-[#00e5ff]/50 focus:ring-1 focus:ring-[#00e5ff]/50 transition-all cursor-pointer hover:border-white/20 shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                >
                  <option value="" disabled>Select Specific Issue...</option>
                  {category && issueCategories[category as keyof typeof issueCategories].map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Priority Level <span className="text-red-500">*</span></label>
                <select 
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-bold tracking-wide text-slate-200 focus:outline-none focus:border-[#00e5ff]/50 focus:ring-1 focus:ring-[#00e5ff]/50 transition-all cursor-pointer hover:border-white/20 shadow-inner"
                  required
                >
                  <option value="" disabled>Select Priority...</option>
                  <option value="Low">Low - Minor issue, no workflow interruption</option>
                  <option value="Medium">Medium - Noticeable issue, work can continue</option>
                  <option value="High">High - Significant workflow interruption</option>
                  <option value="Critical">Critical - Complete system failure / Data risk</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Impacted System <span className="text-red-500">*</span></label>
                <select 
                  value={impactedSystem}
                  onChange={(e) => setImpactedSystem(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-bold tracking-wide text-slate-200 focus:outline-none focus:border-[#00e5ff]/50 focus:ring-1 focus:ring-[#00e5ff]/50 transition-all cursor-pointer hover:border-white/20 shadow-inner"
                  required
                >
                  <option value="" disabled>Select System...</option>
                  <option value="Core AI Prediction Engine">Core AI Prediction Engine</option>
                  <option value="Patient Records Database">Patient Records Database</option>
                  <option value="Image Upload & Processing">Image Upload & Processing</option>
                  <option value="Reporting & Export">Reporting & Export</option>
                  <option value="General UI / Dashboard">General UI / Dashboard</option>
                  <option value="Other / Unknown">Other / Unknown</option>
                </select>
              </div>
            </div>
            
              <div className="w-full">
                 <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Patient ID / Reference (Optional)</label>
               <input 
                  type="text"
                  value={patientRef}
                  onChange={(e) => setPatientRef(e.target.value)}
                  placeholder="e.g. PAT-9832 (If applicable)"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-bold tracking-wide text-white focus:outline-none focus:border-[#00e5ff]/50 focus:ring-1 focus:ring-[#00e5ff]/50 transition-all placeholder-slate-600 shadow-inner"
               />
            </div>
            
              <div className="w-full">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center justify-between">
                  <span>Detailed Description <span className="text-red-500">*</span></span>
                  <button type="button" title="Attach file" className="text-[#00e5ff] hover:text-white transition-colors flex items-center gap-1.5 text-[9px] font-black tracking-widest bg-[#00e5ff]/10 px-2 py-1 rounded border border-[#00e5ff]/30">
                    <Paperclip className="w-3.5 h-3.5" /> ATTACH FILE
                  </button>
                </label>
                <textarea
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
                  placeholder="Provide detailed information about the issue to help IT resolve it quickly..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-sm font-bold tracking-wide text-white focus:outline-none focus:border-[#00e5ff]/50 focus:ring-1 focus:ring-[#00e5ff]/50 transition-all placeholder-slate-600 shadow-inner resize-y min-h-[140px]"
                  required
                />
                <div className="flex items-center gap-3 mt-3">
                  {analyzeTone(newMessage) && (
                    <span className={`text-[9px] font-black uppercase tracking-[0.1em] px-2.5 py-1 rounded-md border ${analyzeTone(newMessage)?.color} shadow-sm transition-all animate-in fade-in zoom-in-95 duration-200`}>
                      {analyzeTone(newMessage)?.icon} Tone: {analyzeTone(newMessage)?.tone}
                    </span>
                  )}
                  {getSuggestion(newMessage) && (
                    <button type="button" onClick={() => setNewMessage(newMessage + getSuggestion(newMessage))} className="text-[9px] font-black text-[#00e5ff] bg-[#00e5ff]/10 border border-[#00e5ff]/30 px-2.5 py-1 rounded-md hover:bg-[#00e5ff]/20 transition-all flex items-center gap-1.5 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                      ✨ Suggestion: {getSuggestion(newMessage)} (Press Tab)
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end pt-6 border-t border-white/10">
                <button
                  type="submit"
                  disabled={!newMessage.trim() || !category || !subCategory || !priority || !impactedSystem}
                  className="px-8 py-4 bg-[#00e5ff]/10 hover:bg-[#00e5ff]/20 text-[#00e5ff] rounded-xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all border border-[#00e5ff]/30 hover:border-[#00e5ff]/60 hover:shadow-[0_0_15px_rgba(0,229,255,0.3)] disabled:opacity-50 disabled:border-slate-700 disabled:text-slate-500 disabled:bg-slate-800 disabled:shadow-none"
                >
                  <Send className="w-4 h-4" />
                  SUBMIT TICKET
                </button>
              </div>
            </form>
          </div>
        </div>
        )}
      </div>

      {/* Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-[#0a0f18]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.8)] w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
              <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-[0.1em]">
                <Ticket className="w-5 h-5 text-[#00e5ff]" />
                Ticket Details
              </h3>
              <button onClick={() => setSelectedMessage(null)} className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex-1 bg-transparent">
              {(() => {
                let parsed: any = null;
                let text = selectedMessage.content;
                if (text.startsWith("[TICKET_META]")) {
                  try {
                    const endIdx = text.indexOf("[/TICKET_META]");
                    if (endIdx > -1) {
                      parsed = JSON.parse(text.substring(13, endIdx));
                      text = text.substring(endIdx + 14).trim();
                    }
                  } catch(e) {}
                } else {
                  const match = text.match(/^\[(.*?)\] - (.*?)\n\n([\s\S]*)$/);
                  if (match) {
                    parsed = { category: match[1], subCategory: match[2] };
                    text = match[3];
                  }
                }
                
                return (
                  <div>
                    {parsed && (
                      <div className="grid grid-cols-2 gap-5 mb-8">
                        <div className="bg-black/40 border border-white/10 p-4 rounded-xl shadow-inner">
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Category</p>
                          <p className="text-sm text-slate-200 font-bold tracking-wide">{parsed.category}</p>
                        </div>
                        <div className="bg-black/40 border border-white/10 p-4 rounded-xl shadow-inner">
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Specific Issue</p>
                          <p className="text-sm text-slate-200 font-bold tracking-wide">{parsed.subCategory}</p>
                        </div>
                        {parsed.priority && (
                          <div className="bg-black/40 border border-white/10 p-4 rounded-xl shadow-inner">
                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Priority</p>
                            <p className={`text-sm font-black tracking-wide ${
                              parsed.priority === 'Critical' ? 'text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]' :
                              parsed.priority === 'High' ? 'text-orange-400' :
                              parsed.priority === 'Medium' ? 'text-amber-400' : 'text-slate-300'
                            }`}>{parsed.priority}</p>
                          </div>
                        )}
                        {parsed.impactedSystem && (
                          <div className="bg-black/40 border border-white/10 p-4 rounded-xl shadow-inner">
                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Impacted System</p>
                            <p className="text-sm text-slate-200 font-bold tracking-wide">{parsed.impactedSystem}</p>
                          </div>
                        )}
                        {parsed.patientRef && (
                          <div className="bg-black/40 border border-white/10 p-4 rounded-xl shadow-inner col-span-2 flex items-center justify-between">
                            <div>
                              <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Patient Reference</p>
                              <p className="text-sm text-[#00e5ff] font-mono font-bold tracking-widest">{parsed.patientRef}</p>
                            </div>
                            <div className="px-2.5 py-1.5 bg-[#00e5ff]/10 text-[#00e5ff] text-[9px] font-black uppercase tracking-[0.2em] rounded-md border border-[#00e5ff]/30">
                              Linked
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div>
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-3">
                        Detailed Description
                        <span className="flex-1 h-px bg-white/10"></span>
                      </p>
                      <div className="bg-black/40 border border-white/10 p-6 rounded-xl text-sm font-medium text-slate-300 whitespace-pre-wrap leading-relaxed shadow-inner">
                        {text}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
            
            <div className="p-6 border-t border-white/10 bg-black/40">
              <div className="flex flex-col gap-4">
                {selectedMessage.sender_id !== resolveUserId() && (
                  <div>
                    <div className="flex gap-4">
                      <input
                        type="text"
                        spellCheck="true"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="TYPE A QUICK REPLY..."
                        className="flex-1 bg-[#0f1522]/80 border border-white/10 rounded-xl px-5 py-3 text-xs font-black tracking-widest text-slate-200 focus:outline-none focus:border-[#00ff9d]/50 focus:ring-1 focus:ring-[#00ff9d]/50 transition-all placeholder-slate-600 shadow-inner"
                        onKeyDown={(e) => {
                          const suggestion = getSuggestion(replyText);
                          if (e.key === 'Tab' && suggestion) {
                            e.preventDefault();
                            setReplyText(replyText + suggestion);
                          } else if (e.key === 'Enter') {
                            e.preventDefault();
                            handleQuickReply();
                          }
                        }}
                      />
                      <button 
                        onClick={handleQuickReply}
                        disabled={isReplying || !replyText.trim()}
                        className="px-6 py-3 bg-[#00ff9d]/10 hover:bg-[#00ff9d]/20 text-[#00ff9d] rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-[#00ff9d]/30 hover:border-[#00ff9d]/60 hover:shadow-[0_0_15px_rgba(0,255,157,0.3)] disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-700 disabled:shadow-none shadow-sm flex items-center justify-center min-w-[120px]"
                      >
                        {isReplying ? "SENDING..." : "REPLY"}
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      {analyzeTone(replyText) && (
                        <span className={`text-[9px] font-black uppercase tracking-[0.1em] px-2.5 py-1 rounded-md border ${analyzeTone(replyText)?.color} shadow-sm transition-all animate-in fade-in zoom-in-95 duration-200`}>
                          {analyzeTone(replyText)?.icon} Tone: {analyzeTone(replyText)?.tone}
                        </span>
                      )}
                      {getSuggestion(replyText) && (
                        <button type="button" onClick={() => setReplyText(replyText + getSuggestion(replyText))} className="text-[9px] font-black text-[#00ff9d] bg-[#00ff9d]/10 border border-[#00ff9d]/30 px-2.5 py-1 rounded-md hover:bg-[#00ff9d]/20 transition-all flex items-center gap-1.5 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                          ✨ Suggestion: {getSuggestion(replyText)} (Press Tab)
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center mt-2">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Ticket ID: {selectedMessage.id || "N/A"}
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setSelectedMessage(null)} className="px-6 py-2.5 bg-black/40 hover:bg-white/5 text-slate-300 rounded-lg font-black text-[9px] uppercase tracking-[0.2em] transition-colors border border-white/10">
                      CLOSE
                    </button>
                    {selectedMessage.sender_id === resolveUserId() && (
                      <button 
                        onClick={() => handleDelete(selectedMessage.id)}
                        disabled={isDeleting}
                        className="px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-black text-[9px] uppercase tracking-[0.2em] transition-all border border-red-500/30 flex items-center gap-2 disabled:opacity-50 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {isDeleting ? "DELETING..." : "DELETE"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
