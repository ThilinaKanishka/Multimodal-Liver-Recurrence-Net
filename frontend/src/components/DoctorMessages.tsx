import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, User, MessageSquare, AlertCircle } from 'lucide-react';

export const DoctorMessages = ({ user }: { user: any }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
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

  const fetchMessages = async () => {
    try {
      const currentUserId = resolveUserId();
      if (!currentUserId) {
        setLoading(false);
        return;
      }
      const res = await axios.get(`http://127.0.0.1:8000/api/messages/conversation/${currentUserId}/${adminId}`);
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
    if (!newMessage.trim() || !currentUserId) return;

    try {
      const msgData = {
        sender_id: currentUserId,
        receiver_id: adminId,
        content: newMessage
      };
      setNewMessage("");
      // Optimistic update
      setMessages(prev => [...prev, { ...msgData, _id: Date.now().toString(), timestamp: new Date().toISOString(), is_read: false }]);
      
      await axios.post('http://127.0.0.1:8000/api/messages/send', msgData);
      fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 p-8 bg-[#070b14] text-slate-300 font-sans flex flex-col h-screen overflow-hidden animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-6 border-b border-[#1e293b] pb-4 flex-shrink-0">
        <div className="p-2 bg-blue-500/10 text-blue-400 rounded"><MessageSquare className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-wide uppercase">IT Support & Messaging</h1>
          <p className="text-slate-400 text-sm">පද්ධතියේ ගැටලුවක් ඇත්නම් IT Admin හට කෙලින්ම දැනුම් දෙන්න</p>
        </div>
      </div>

      <div className="flex-1 bg-[#131826] border border-[#1e293b] rounded-xl shadow-2xl flex flex-col overflow-hidden relative">
        {/* Chat Header */}
        <div className="bg-[#1a2133] border-b border-[#1e293b] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center">
              <User className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-200">System Administrator</h3>
              <p className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Online
              </p>
            </div>
          </div>
          <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] uppercase tracking-widest font-bold rounded flex items-center gap-2">
            <AlertCircle className="w-3 h-3" /> Encrypted Channel
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#0a0e17] relative">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-500">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3 opacity-50">
              <MessageSquare className="w-12 h-12" />
              <p className="text-xs uppercase tracking-widest">No messages yet. Send a message to start.</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const currentUserId = resolveUserId();
              const isMine = msg.sender_id === currentUserId;
              const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={msg.id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl p-4 shadow-md ${isMine ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-[#1e293b] text-slate-200 rounded-bl-sm border border-[#2a364a]'}`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <div className={`text-[10px] mt-2 flex items-center gap-1 ${isMine ? 'text-blue-200 justify-end' : 'text-slate-400'}`}>
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
        <form onSubmit={handleSend} className="bg-[#1a2133] border-t border-[#1e293b] p-4 flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message to IT Admin here..."
            className="flex-1 bg-[#0a0e17] border border-[#2a364a] rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-600"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg"
          >
            Send <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
