import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, User, MessageSquare, AlertCircle, Paperclip, Check, CheckCheck, Info, Ticket, X, Trash2, Maximize2, Mail } from 'lucide-react';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const adminId = "ST-ADMIN";

  const resolveUserId = () => {
    let uid = user?.id || user?._id || user?.staffId;
    if (!uid) {
      const saved = localStorage.getItem("hepatoai_current_user");
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

  return (
    <div className="flex-1 p-4 md:p-8 bg-[#070b14] text-slate-300 font-sans flex flex-col h-screen overflow-hidden animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-6 border-b border-[#1e293b] pb-5 flex-shrink-0">
        <div className="p-3 bg-[#131524] border border-[#1e293b] text-blue-400 rounded-lg shadow-sm">
          <Ticket className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-wide uppercase">IT Helpdesk & Ticketing</h1>
          <p className="text-slate-400 text-sm flex items-center gap-2 mt-1">
            <Info className="w-3.5 h-3.5" /> Enterprise Clinical Systems Support
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6 flex-shrink-0 border-b border-[#1e293b] pb-5">
        <button 
          onClick={() => setActiveTab('create')}
          className={`px-5 py-2.5 rounded font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'create' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-[#131524] text-slate-400 hover:text-slate-200 hover:bg-[#1a1c2c] border border-[#2a364a]'
          }`}
        >
          <Ticket className="w-4 h-4" /> Create New Ticket
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-5 py-2.5 rounded font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'history' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-[#131524] text-slate-400 hover:text-slate-200 hover:bg-[#1a1c2c] border border-[#2a364a]'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Ticket History
          {messages.length > 0 && (
            <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${activeTab === 'history' ? 'bg-blue-500/30' : 'bg-slate-700 text-slate-300'}`}>
              {messages.length}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 bg-[#0f111a] border border-[#1e293b] rounded-lg shadow-2xl flex flex-col overflow-hidden relative">
        {activeTab === 'history' && (
          <>
            {/* Ticketing Header */}
            <div className="bg-[#131524] border-b border-[#1e293b] p-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded bg-[#1a1c2c] border border-[#2a364a] flex items-center justify-center shadow-sm">
                  <Ticket className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-wide">Ticket #{getTicketId()}: System Support</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                      Status: Open
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Assigned to: L2 Admin Support</span>
                  </div>
                </div>
              </div>
              <div className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 text-[10px] uppercase tracking-widest font-bold rounded flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5" /> Secure HIPAA Channel
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar bg-[#131524]">
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
                  <div className={`group relative max-w-[85%] md:max-w-[75%] px-5 py-4 shadow-sm transition-all ${
                    isMine 
                      ? 'bg-[#1a1d27] text-slate-200 rounded-lg rounded-tr-sm border border-[#2a364a]' 
                      : 'bg-[#1a1c2c] text-slate-200 rounded-lg rounded-tl-sm border border-[#2a364a]'
                  }`}>
                    {parsedMeta && (
                      <div className={`text-[11px] font-bold mb-3 pb-3 border-b flex flex-wrap items-center gap-x-3 gap-y-2 ${isMine ? 'border-[#2a364a]' : 'border-[#2a364a]'}`}>
                         <div className="flex items-center gap-2">
                           <span className={`px-2 py-0.5 rounded ${isMine ? 'bg-[#0f111a] border border-[#2a364a] text-slate-300' : 'bg-[#2a364a] text-slate-300'}`}>{parsedMeta.category}</span>
                           <span className={isMine ? "text-slate-500" : "text-slate-500"}>/</span>
                           <span className={isMine ? "text-slate-300" : "text-slate-300"}>{parsedMeta.subCategory}</span>
                         </div>
                         
                         {parsedMeta.priority && (
                           <>
                             <span className={isMine ? "text-slate-500 hidden sm:inline" : "text-slate-500 hidden sm:inline"}>•</span>
                             <span className={`px-2 py-0.5 rounded border ${isMine ? (priorityColors[parsedMeta.priority] || 'text-slate-400 bg-[#0f111a] border-[#2a364a]') : (priorityColors[parsedMeta.priority] || 'text-slate-300 bg-slate-800')}`}>
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
                             <span className={`px-2 py-0.5 rounded ${isMine ? 'bg-[#0f111a] border border-[#2a364a] text-slate-300' : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'}`}>
                               Ref: {parsedMeta.patientRef}
                             </span>
                           </>
                         )}
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{textContent}</p>
                    <div className={`text-[10px] mt-2.5 flex items-center gap-2 ${isMine ? 'text-slate-400 justify-end' : 'text-slate-400'}`}>
                      {msg.sent_via_email && (
                        <span className={`flex items-center gap-1 mr-1 px-1.5 py-0.5 rounded ${isMine ? 'bg-[#0f111a] text-slate-300 border border-[#2a364a]' : 'bg-slate-800 text-slate-300'}`} title="Dispatched via Email">
                          <Mail className="w-2.5 h-2.5" /> Sent via Email
                        </span>
                      )}
                      {time}
                      
                      <button onClick={() => setSelectedMessage(msg)} className={`flex items-center gap-1 hover:text-white transition-colors ${isMine ? 'text-slate-300' : 'text-slate-400'} ml-3`}>
                        <Maximize2 className="w-3 h-3" /> <span className="hidden sm:inline uppercase font-bold tracking-wider text-[9px]">View</span>
                      </button>
                      
                      {isMine && (
                        <button onClick={() => handleDelete(msg.id)} disabled={isDeleting} className="flex items-center gap-1 hover:text-red-300 text-red-400/70 transition-colors ml-1">
                          <Trash2 className="w-3 h-3" /> <span className="hidden sm:inline uppercase font-bold tracking-wider text-[9px]">Delete</span>
                        </button>
                      )}
                      
                      {isMine && (
                        <span className="ml-2 pl-2 border-l border-blue-400/30">
                          {msg.is_read ? (
                            <CheckCheck className="w-3.5 h-3.5 text-sky-300" title="Read by Admin" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-blue-300/70" title="Delivered" />
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
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#131524]">
          <div className="bg-[#0f111a] border-b border-[#1e293b] p-6 text-center">
            <div className="w-16 h-16 mx-auto bg-[#1a1c2c] border border-[#2a364a] rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Submit a Support Request</h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">Please provide detailed information about the issue you are facing. Our L2 Support Team will review and respond as quickly as possible.</p>
          </div>
          
          <div className="p-6 md:p-8">
            <form onSubmit={handleSend} className="max-w-4xl mx-auto flex flex-col gap-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Issue Category <span className="text-red-500">*</span></label>
                <select 
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); setSubCategory(""); }}
                  className="w-full bg-[#0f111a] border border-[#2a364a] rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer hover:border-slate-600"
                  required
                >
                  <option value="" disabled>Select Primary Category...</option>
                  {Object.keys(issueCategories).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Specific Issue <span className="text-red-500">*</span></label>
                <select 
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  disabled={!category}
                  className="w-full bg-[#0f111a] border border-[#2a364a] rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:border-slate-600"
                  required
                >
                  <option value="" disabled>Select Specific Issue...</option>
                  {category && issueCategories[category as keyof typeof issueCategories].map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Priority Level <span className="text-red-500">*</span></label>
                <select 
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-[#0f111a] border border-[#2a364a] rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer hover:border-slate-600"
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
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Impacted System <span className="text-red-500">*</span></label>
                <select 
                  value={impactedSystem}
                  onChange={(e) => setImpactedSystem(e.target.value)}
                  className="w-full bg-[#0f111a] border border-[#2a364a] rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer hover:border-slate-600"
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
                 <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Patient ID / Reference (Optional)</label>
               <input 
                  type="text"
                  value={patientRef}
                  onChange={(e) => setPatientRef(e.target.value)}
                  placeholder="e.g. PAT-9832 (If applicable)"
                  className="w-full bg-[#0f111a] border border-[#2a364a] rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-600 shadow-inner"
               />
            </div>
            
              <div className="w-full">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Detailed Description <span className="text-red-500">*</span></span>
                  <button type="button" title="Attach file" className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 text-[10px]">
                    <Paperclip className="w-3.5 h-3.5" /> Attach File
                  </button>
                </label>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Provide detailed information about the issue to help IT resolve it quickly..."
                  className="w-full bg-[#0f111a] border border-[#2a364a] rounded px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-600 shadow-inner resize-y min-h-[120px]"
                  required
                />
              </div>
              
              <div className="flex justify-end pt-4 border-t border-[#2a364a]">
                <button
                  type="submit"
                  disabled={!newMessage.trim() || !category || !subCategory || !priority || !impactedSystem}
                  className="px-8 py-3 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded font-bold flex items-center justify-center gap-2 transition-all border border-blue-600 hover:border-blue-500 disabled:border-slate-700 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  <span className="text-xs tracking-wider uppercase">Submit Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
        )}
      </div>

      {/* Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-[#131524] border border-[#2a364a] rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-[#1e293b] flex items-center justify-between bg-[#0f111a]">
              <h3 className="text-base font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wide">
                <Ticket className="w-5 h-5 text-indigo-400" />
                Ticket Details
              </h3>
              <button onClick={() => setSelectedMessage(null)} className="text-slate-400 hover:text-white transition-colors p-1.5 rounded hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-[#131524]">
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
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-[#0f111a] border border-[#2a364a] p-3 rounded">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Category</p>
                          <p className="text-sm text-slate-200 font-medium">{parsed.category}</p>
                        </div>
                        <div className="bg-[#0f111a] border border-[#2a364a] p-3 rounded">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Specific Issue</p>
                          <p className="text-sm text-slate-200 font-medium">{parsed.subCategory}</p>
                        </div>
                        {parsed.priority && (
                          <div className="bg-[#0f111a] border border-[#2a364a] p-3 rounded">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Priority</p>
                            <p className={`text-sm font-bold ${
                              parsed.priority === 'Critical' ? 'text-red-400' :
                              parsed.priority === 'High' ? 'text-orange-400' :
                              parsed.priority === 'Medium' ? 'text-amber-400' : 'text-slate-300'
                            }`}>{parsed.priority}</p>
                          </div>
                        )}
                        {parsed.impactedSystem && (
                          <div className="bg-[#0f111a] border border-[#2a364a] p-3 rounded">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Impacted System</p>
                            <p className="text-sm text-slate-200">{parsed.impactedSystem}</p>
                          </div>
                        )}
                        {parsed.patientRef && (
                          <div className="bg-[#0f111a] border border-[#2a364a] p-3 rounded col-span-2 flex items-center justify-between">
                            <div>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Patient Reference</p>
                              <p className="text-sm text-indigo-300 font-mono">{parsed.patientRef}</p>
                            </div>
                            <div className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-wider rounded border border-indigo-500/20">
                              Linked
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                        Detailed Description
                        <span className="flex-1 h-px bg-[#2a364a]"></span>
                      </p>
                      <div className="bg-[#0f111a] border border-[#2a364a] p-5 rounded text-sm text-slate-300 whitespace-pre-wrap leading-relaxed shadow-inner">
                        {text}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
            
            <div className="p-4 border-t border-[#1e293b] bg-[#0f111a] flex justify-between items-center">
              <div className="text-xs text-slate-500">
                Ticket ID: {selectedMessage.id || "N/A"}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setSelectedMessage(null)} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold text-xs uppercase tracking-wider transition-colors border border-[#2a364a]">
                  Close
                </button>
                {selectedMessage.sender_id === resolveUserId() && (
                  <button 
                    onClick={() => handleDelete(selectedMessage.id)}
                    disabled={isDeleting}
                    className="px-5 py-2 bg-red-900/40 hover:bg-red-600 text-white rounded font-bold text-xs uppercase tracking-wider transition-all border border-red-900/50 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isDeleting ? "Deleting..." : "Delete Ticket"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
