import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Send,
  MessageCircle,
  Clock,
  Check,
  CheckCheck,
  ExternalLink,
  MapPin,
  Tag,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  AlertCircle
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

export default function MessagesPage() {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeConvoId = searchParams.get("conversation");

  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const activeConvoRef = useRef(activeConvo);
  activeConvoRef.current = activeConvo;

  const isFetchingMessagesRef = useRef(false);
  const isFetchingConvosRef = useRef(false);

  // Play a gentle, pleasant synthetic chime for incoming peer messages
  const playNotificationChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Audio autoplay blocked or unsupported
    }
  }, []);

  // Check whether user is scrolled near the bottom (threshold 140px)
  const isUserNearBottom = () => {
    const el = chatContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 140;
  };

  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Fetch all conversations
  const fetchConversations = useCallback(async (isInitial = false) => {
    if (isFetchingConvosRef.current) return;
    try {
      isFetchingConvosRef.current = true;
      if (isInitial) setLoading(true);

      const res = await api.get("/messages/conversations");
      if (res.data?.success && Array.isArray(res.data.conversations)) {
        const list = res.data.conversations;
        setConversations(list);

        const currentActive = activeConvoRef.current;
        if (!currentActive && list.length > 0) {
          if (activeConvoId) {
            const found = list.find((c) => c._id === activeConvoId);
            setActiveConvo(found || list[0]);
          } else {
            setActiveConvo(list[0]);
            setSearchParams({ conversation: list[0]._id }, { replace: true });
          }
        } else if (currentActive && activeConvoId && currentActive._id !== activeConvoId) {
          const found = list.find((c) => c._id === activeConvoId);
          if (found) setActiveConvo(found);
        }
      }
    } catch (err) {
      if (isInitial) console.error("Failed to load conversations:", err);
    } finally {
      isFetchingConvosRef.current = false;
      if (isInitial) setLoading(false);
    }
  }, [activeConvoId, setSearchParams]);

  // Fetch messages for active conversation
  const fetchActiveMessages = useCallback(async (isBackground = false) => {
    const convoId = activeConvoRef.current?._id;
    if (!convoId || isFetchingMessagesRef.current) return;

    try {
      isFetchingMessagesRef.current = true;
      if (!isBackground) setIsSyncing(true);

      const res = await api.get(`/messages/${convoId}`);
      if (res.data?.success && Array.isArray(res.data.messages)) {
        const fetchedMessages = res.data.messages;

        setMessages((prev) => {
          // Compare if anything changed
          if (
            prev.length === fetchedMessages.length &&
            prev.length > 0 &&
            prev[prev.length - 1]._id === fetchedMessages[fetchedMessages.length - 1]._id &&
            prev[prev.length - 1].isRead === fetchedMessages[fetchedMessages.length - 1].isRead
          ) {
            return prev;
          }

          // Check for new incoming message from the peer
          const prevIds = new Set(prev.map((m) => m._id));
          const hasNewIncoming = fetchedMessages.some(
            (m) =>
              !prevIds.has(m._id) &&
              String(m.sender?._id || m.sender) !== String(user?._id)
          );

          if (hasNewIncoming && isBackground) {
            playNotificationChime();
          }

          // Preserve pending optimistic messages
          const pendingOptimistic = prev.filter(
            (m) => m.isOptimistic && !fetchedMessages.some((f) => f.text === m.text)
          );

          const nextMessages = [...fetchedMessages, ...pendingOptimistic];

          if (isUserNearBottom() || isInitialLoadRef.current) {
            setTimeout(() => {
              scrollToBottom(isInitialLoadRef.current ? "auto" : "smooth");
              isInitialLoadRef.current = false;
            }, 60);
          }

          return nextMessages;
        });

        // Update last message in conversations list and clear unread count for this conversation
        if (fetchedMessages.length > 0) {
          const lastMsg = fetchedMessages[fetchedMessages.length - 1];
          setConversations((prev) =>
            prev.map((c) =>
              c._id === convoId
                ? {
                    ...c,
                    unreadCount: 0,
                    lastMessage: {
                      text: lastMsg.text,
                      createdAt: lastMsg.createdAt,
                      sender: lastMsg.sender
                    }
                  }
                : c
            )
          );
        }
      }
    } catch (err) {
      if (!isBackground) console.error("Failed to load messages:", err);
    } finally {
      isFetchingMessagesRef.current = false;
      if (!isBackground) setIsSyncing(false);
    }
  }, [user?._id, playNotificationChime]);

  // Initial mount: load conversations list
  useEffect(() => {
    fetchConversations(true);
  }, [fetchConversations]);

  // Handle changes to active conversation ID in URL
  useEffect(() => {
    if (activeConvoId && conversations.length > 0) {
      const found = conversations.find((c) => c._id === activeConvoId);
      if (found && found._id !== activeConvo?._id) {
        setActiveConvo(found);
      }
    }
  }, [activeConvoId, conversations, activeConvo?._id]);

  // Live polling effect for active conversation (every 2.5s)
  useEffect(() => {
    if (!activeConvo?._id) return;

    isInitialLoadRef.current = true;
    fetchActiveMessages(false);

    const messagePollInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchActiveMessages(true);
      }
    }, 2500);

    return () => {
      clearInterval(messagePollInterval);
    };
  }, [activeConvo?._id, fetchActiveMessages]);

  // Background polling for conversations list (every 6s) + instant refresh on tab focus
  useEffect(() => {
    const convoPollInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchConversations(false);
      }
    }, 6000);

    const handleFocus = () => {
      fetchConversations(false);
      if (activeConvoRef.current?._id) {
        fetchActiveMessages(true);
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      clearInterval(convoPollInterval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [fetchConversations, fetchActiveMessages]);

  // Socket.IO real-time listener for incoming messages (hybrid with live polling)
  useEffect(() => {
    if (!socket) return;

    const handleIncoming = (data) => {
      if (!data?.message) return;

      if (data.conversationId === activeConvoRef.current?._id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === data.message._id)) return prev;
          playNotificationChime();
          const next = [...prev, data.message];
          if (isUserNearBottom()) {
            setTimeout(() => scrollToBottom("smooth"), 50);
          }
          return next;
        });
      }

      setConversations((prev) =>
        prev.map((c) =>
          c._id === data.conversationId
            ? {
                ...c,
                unreadCount:
                  c._id === activeConvoRef.current?._id
                    ? 0
                    : (c.unreadCount || 0) + 1,
                lastMessage: {
                  text: data.message.text,
                  createdAt: new Date(),
                  sender: data.message.sender
                }
              }
            : c
        )
      );
    };

    socket.on("new_message", handleIncoming);
    return () => {
      socket.off("new_message", handleIncoming);
    };
  }, [socket, playNotificationChime]);

  // Handle Send Message with Instant Optimistic UI
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !activeConvo || sending) return;

    const textToSend = inputText.trim();
    setInputText("");

    const otherParticipant = getOtherParticipant(activeConvo);
    const tempId = `optimistic-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,
      conversation: activeConvo._id,
      sender: {
        _id: user?._id,
        name: user?.name,
        profilePhoto: user?.profilePhoto
      },
      text: textToSend,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
      isPending: true
    };

    // Instant optimistic render
    setMessages((prev) => [...prev, optimisticMessage]);
    setTimeout(() => scrollToBottom("smooth"), 30);

    // Update conversation snippet in sidebar immediately
    setConversations((prev) =>
      prev.map((c) =>
        c._id === activeConvo._id
          ? {
              ...c,
              lastMessage: {
                text: textToSend,
                createdAt: new Date(),
                sender: { _id: user?._id, name: user?.name }
              }
            }
          : c
      )
    );

    try {
      setSending(true);
      const res = await api.post("/messages", {
        conversationId: activeConvo._id,
        receiverId: otherParticipant?._id || otherParticipant,
        text: textToSend
      });

      if (res.data?.success && res.data.message) {
        setMessages((prev) =>
          prev.map((m) => (m._id === tempId ? res.data.message : m))
        );
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m._id === tempId ? { ...m, isPending: false, isFailed: true } : m
        )
      );
    } finally {
      setSending(false);
    }
  };

  const getOtherParticipant = (convo) => {
    if (!convo?.participants) return null;
    return convo.participants.find((p) => String(p._id || p) !== String(user?._id));
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-8 w-full max-w-full overflow-x-hidden">
      
      {/* Page Header */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Campus Messages & Inquiries
            </h1>
            <div className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-full text-[11px] font-bold border border-emerald-200/80 dark:border-emerald-800/80">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Sync</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time chat with college peers, arrange safe campus inspections, and confirm deals.
          </p>
        </div>

        {/* Manual Refresh Button */}
        {activeConvo && (
          <button
            onClick={() => {
              fetchActiveMessages(false);
              fetchConversations(false);
            }}
            disabled={isSyncing}
            className="self-start sm:self-auto px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            title="Check for new messages now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-emerald-600" : ""}`} />
            <span>{isSyncing ? "Checking..." : "Sync Messages"}</span>
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[calc(100vh-10.5rem)] md:h-[700px] min-h-[480px] w-full max-w-full">
        
        {/* Left: Conversations list (4 cols) */}
        <div
          className={`md:col-span-4 border-r border-slate-200 dark:border-slate-800 flex flex-col ${
            activeConvo ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>Conversations</span>
              {conversations.some((c) => c.unreadCount > 0) && (
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              )}
            </span>
            <span className="text-xs text-slate-400 font-normal">
              {conversations.length} total
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {loading && conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Loading chats...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active conversations yet. Reach out to a seller on any listing!
              </div>
            ) : (
              conversations.map((convo) => {
                const other = getOtherParticipant(convo);
                const isSelected = activeConvo?._id === convo._id;
                const hasUnread = Boolean(convo.unreadCount && convo.unreadCount > 0);

                return (
                  <button
                    key={convo._id}
                    onClick={() => {
                      setActiveConvo(convo);
                      setSearchParams({ conversation: convo._id });
                    }}
                    className={`w-full p-4 text-left transition-colors flex items-start gap-3 relative ${
                      isSelected
                        ? "bg-emerald-50/80 dark:bg-emerald-950/40"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    {/* Unread Accent Bar */}
                    {hasUnread && !isSelected && (
                      <div className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-500 rounded-r-full"></div>
                    )}

                    {other?.profilePhoto ? (
                      <img
                        src={other.profilePhoto}
                        alt={other.name}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-emerald-500/20"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {other?.name?.charAt(0) || "U"}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <p className={`text-xs truncate ${hasUnread ? "font-black text-slate-900 dark:text-white" : "font-bold text-slate-800 dark:text-slate-200"}`}>
                          {other?.name || "Campus Peer"}
                        </p>
                        <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">
                          {convo.lastMessage?.createdAt
                            ? new Date(convo.lastMessage.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit"
                              })
                            : ""}
                        </span>
                      </div>

                      <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                        {convo.product?.title || "Item Listing"}
                      </p>

                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <p className={`text-xs truncate ${hasUnread ? "font-bold text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>
                          {convo.lastMessage?.text || "Started conversation"}
                        </p>
                        {hasUnread && (
                          <span className="ml-1 px-1.5 py-0.2 bg-emerald-600 text-white rounded-full text-[10px] font-bold flex-shrink-0">
                            {convo.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Message Window (8 cols) */}
        <div
          className={`md:col-span-8 flex flex-col bg-slate-50/50 dark:bg-slate-950 ${
            activeConvo ? "flex" : "hidden md:flex"
          }`}
        >
          {activeConvo ? (
            <>
              {/* Active Header with Product summary */}
              <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <button
                    onClick={() => {
                      setActiveConvo(null);
                      setSearchParams({});
                    }}
                    className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex-shrink-0"
                    title="Back to all conversations"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  {getOtherParticipant(activeConvo)?.profilePhoto ? (
                    <img
                      src={getOtherParticipant(activeConvo).profilePhoto}
                      alt={getOtherParticipant(activeConvo).name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/20"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                      {getOtherParticipant(activeConvo)?.name?.charAt(0) || "U"}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                        {getOtherParticipant(activeConvo)?.name || "Peer"}
                      </h3>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Live sync active"></span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {getOtherParticipant(activeConvo)?.department}
                      {getOtherParticipant(activeConvo)?.college
                        ? ` • ${getOtherParticipant(activeConvo).college}`
                        : ""}
                    </p>
                  </div>
                </div>

                {/* Attached Product Box */}
                {activeConvo.product && (
                  <Link
                    to={`/products/${activeConvo.product._id}`}
                    className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs max-w-[135px] sm:max-w-xs transition-colors flex-shrink-0"
                    title="View Product Page"
                  >
                    <img
                      src={activeConvo.product.primaryImage || activeConvo.product.images?.[0]}
                      alt={activeConvo.product.title}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="truncate min-w-0">
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate text-[11px] sm:text-xs">
                        {activeConvo.product.title}
                      </p>
                      <p className="text-[10px] sm:text-[11px] font-black text-emerald-700 dark:text-emerald-400">
                        ₹{activeConvo.product.price}
                      </p>
                    </div>
                    <ExternalLink className="w-3 h-3 text-slate-400 flex-shrink-0 hidden sm:block" />
                  </Link>
                )}
              </div>

              {/* Chat Thread */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3"
              >
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs">
                    <MessageCircle className="w-10 h-10 mb-2 text-slate-300 dark:text-slate-700" />
                    <span className="font-medium">
                      No messages yet in this chat.
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      Say hello and coordinate your campus exchange!
                    </span>
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
                          className={`max-w-md px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs transition-all ${
                            isMe
                              ? "bg-emerald-600 text-white rounded-br-xs"
                              : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-xs"
                          }`}
                        >
                          {m.text}
                        </div>

                        <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-slate-400 dark:text-slate-500">
                          <span>
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>

                          {isMe && (
                            <>
                              {m.isFailed ? (
                                <span className="text-red-500 font-semibold flex items-center gap-0.5">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>Failed</span>
                                </span>
                              ) : m.isPending ? (
                                <Clock className="w-3 h-3 text-slate-400 animate-spin" />
                              ) : m.isRead ? (
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" title="Seen" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-slate-400" title="Sent" />
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Footer */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message (e.g. Can we meet at the library at 4pm?)..."
                  className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-850"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-2xl shadow-sm transition-all active:scale-95 flex items-center justify-center flex-shrink-0"
                  title="Send Message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-slate-400 text-sm">
              <MessageCircle className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-700" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No Conversation Selected</p>
              <p className="text-xs text-slate-400 mt-1">Select a conversation from the left to start chatting live.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}