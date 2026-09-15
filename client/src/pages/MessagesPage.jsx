import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Send,
  MessageCircle,
  Clock,
  CheckCheck,
  ExternalLink,
  MapPin,
  Tag
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

export default function MessagesPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeConvoId = searchParams.get("conversation");

  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef(null);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await api.get("/messages/conversations");
      if (res.data.success) {
        setConversations(res.data.conversations || []);

        if (res.data.conversations.length > 0) {
          if (activeConvoId) {
            const found = res.data.conversations.find((c) => c._id === activeConvoId);
            setActiveConvo(found || res.data.conversations[0]);
          } else {
            setActiveConvo(res.data.conversations[0]);
            setSearchParams({ conversation: res.data.conversations[0]._id });
          }
        }
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeConvo?._id) return;

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/${activeConvo._id}`);
        if (res.data.success) {
          setMessages(res.data.messages || []);
        }
      } catch (err) {
        console.error("Failed to load messages:", err);
      }
    };

    fetchMessages();
  }, [activeConvo?._id]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket.IO real-time listener for incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleIncoming = (data) => {
      if (data.conversationId === activeConvo?._id) {
        setMessages((prev) => [...prev, data.message]);
      }
      // Update snippet in conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c._id === data.conversationId
            ? { ...c, lastMessage: { text: data.message.text, createdAt: new Date() } }
            : c
        )
      );
    };

    socket.on("new_message", handleIncoming);

    return () => {
      socket.off("new_message", handleIncoming);
    };
  }, [socket, activeConvo?._id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConvo) return;

    const textToSend = inputText.trim();
    setInputText("");

    try {
      const otherParticipant = activeConvo.participants.find(
        (p) => String(p._id || p) !== String(user._id)
      );

      const res = await api.post("/messages", {
        conversationId: activeConvo._id,
        receiverId: otherParticipant?._id || otherParticipant,
        text: textToSend
      });

      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.message]);
        setConversations((prev) =>
          prev.map((c) =>
            c._id === activeConvo._id
              ? { ...c, lastMessage: { text: textToSend, createdAt: new Date() } }
              : c
          )
        );
      }
    } catch (err) {
      alert("Failed to send message.");
    }
  };

  const getOtherParticipant = (convo) => {
    if (!convo?.participants) return null;
    return convo.participants.find((p) => String(p._id || p) !== String(user?._id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Campus Messages & Inquiries
        </h1>
        <p className="text-xs text-slate-500">
          Chat with peers, arrange safe library/hostel inspections, and confirm offers.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[620px] max-h-[750px]">
        
        {/* Left: Conversations list (4 cols) */}
        <div className="md:col-span-4 border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-800 flex items-center justify-between">
            <span>Conversations</span>
            <span className="text-xs text-slate-400 font-normal">{conversations.length} total</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active conversations yet. Reach out to a seller on any listing!
              </div>
            ) : (
              conversations.map((convo) => {
                const other = getOtherParticipant(convo);
                const isSelected = activeConvo?._id === convo._id;

                return (
                  <button
                    key={convo._id}
                    onClick={() => {
                      setActiveConvo(convo);
                      setSearchParams({ conversation: convo._id });
                    }}
                    className={`w-full p-4 text-left transition-colors flex items-start gap-3 ${
                      isSelected ? "bg-emerald-50/60" : "hover:bg-slate-50"
                    }`}
                  >
                    {other?.profilePhoto ? (
                      <img
                        src={other.profilePhoto}
                        alt={other.name}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-emerald-500/20"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {other?.name?.charAt(0) || "U"}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <p className="text-xs font-bold text-slate-900 truncate">{other?.name}</p>
                        <span className="text-[10px] text-slate-400">
                          {convo.lastMessage?.createdAt
                            ? new Date(convo.lastMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : ""}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-emerald-700 truncate">
                        {convo.product?.title || "Product"}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {convo.lastMessage?.text || "Started conversation"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Message Window (8 cols) */}
        <div className="md:col-span-8 flex flex-col bg-slate-50/50">
          
          {activeConvo ? (
            <>
              {/* Active Header with Product summary */}
              <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {getOtherParticipant(activeConvo)?.profilePhoto ? (
                    <img
                      src={getOtherParticipant(activeConvo).profilePhoto}
                      alt={getOtherParticipant(activeConvo).name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                      {getOtherParticipant(activeConvo)?.name?.charAt(0) || "U"}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {getOtherParticipant(activeConvo)?.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {getOtherParticipant(activeConvo)?.department}
                    </p>
                  </div>
                </div>

                {/* Attached Product Box */}
                {activeConvo.product && (
                  <Link
                    to={`/products/${activeConvo.product._id}`}
                    className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs max-w-xs transition-colors"
                  >
                    <img
                      src={activeConvo.product.primaryImage || activeConvo.product.images?.[0]}
                      alt={activeConvo.product.title}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                    <div className="truncate">
                      <p className="font-bold text-slate-800 truncate">{activeConvo.product.title}</p>
                      <p className="text-[11px] font-black text-emerald-700">
                        ₹{activeConvo.product.price}
                      </p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  </Link>
                )}
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs">
                    <MessageCircle className="w-8 h-8 mb-2 text-slate-300" />
                    <span>No messages yet. Say hello and coordinate your campus exchange!</span>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = String(m.sender?._id || m.sender) === String(user?._id);

                    return (
                      <div
                        key={m._id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-md px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                            isMe
                              ? "bg-emerald-600 text-white rounded-br-xs"
                              : "bg-white text-slate-800 border border-slate-200 rounded-bl-xs"
                          }`}
                        >
                          {m.text}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Footer */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message (e.g. Can we meet at the library 4pm?)..."
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-2xl shadow-sm transition-all active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex items-center justify-center p-8 text-slate-400 text-sm">
              Select a conversation from the left to start messaging
            </div>
          )}

        </div>

      </div>

    </div>
  );
}