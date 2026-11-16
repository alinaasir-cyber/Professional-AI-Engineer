'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  Film,
  Smile,
  Send,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Bot,
  Image as ImageIcon,
  Download,
  ExternalLink,
  Plus,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
  Trash2,
  Sparkles,
  LogIn,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from 'lucide-react';

function GoogleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

interface ToolCall {
  toolName: 'DatabaseChatTool' | 'MovieDatabaseTool' | 'DadJokesTool' | 'ImageGeneratorTool';
  args: any;
  result: any;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  error?: boolean;
}

interface ConversationItem {
  id: string;
  title: string;
  updatedAt: string;
}

interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
  provider?: string;
}

export default function Home() {
  // Authentication & Initial State
  const [authChecking, setAuthChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authName, setAuthName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Chat State
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [currentConvTitle, setCurrentConvTitle] = useState('New Conversation');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [jokeVotes, setJokeVotes] = useState<Record<string, { up: number; down: number; userVoted?: 'up' | 'down' }>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      setAuthChecking(true);
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.authenticated && data.user) {
        setCurrentUser(data.user);
        fetchConversations();
      } else {
        setCurrentUser(null);
      }
    } catch (e) {
      console.warn('Session check warning:', e);
      setCurrentUser(null);
    } finally {
      setAuthChecking(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'google',
          name: 'Abdi Naasir',
          email: 'cnaasirm60@gmail.com',
          image: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        fetchConversations();
      } else {
        setAuthError(data.error || 'Google sign in failed');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Network error during sign in');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim()) {
      setAuthError('Please enter your email address.');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'credentials',
          name: authName.trim() || authEmail.split('@')[0],
          email: authEmail.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        setAuthEmail('');
        setAuthName('');
        fetchConversations();
      } else {
        setAuthError(data.error || 'Failed to authenticate');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Network error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      setCurrentUser(null);
      handleNewChat();
      setConversations([]);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      if (data.success && Array.isArray(data.conversations)) {
        setConversations(data.conversations);
      }
    } catch (e) {
      console.warn('Failed to load conversations:', e);
    }
  };

  const loadConversation = async (convId: string, title: string) => {
    setCurrentConvId(convId);
    setCurrentConvTitle(title);
    setLoading(true);
    try {
      const res = await fetch(`/api/conversations/${convId}`);
      const data = await res.json();
      if (data.success && data.conversation) {
        setMessages(
          data.conversation.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            toolCalls: m.toolCalls,
          }))
        );
      }
    } catch (e) {
      console.error('Error loading conversation:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentConvId(null);
    setCurrentConvTitle('New Conversation');
    setMessages([]);
    setInput('');
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation?')) return;
    try {
      await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (currentConvId === id) {
        handleNewChat();
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationId: currentConvId,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();

      if (data.conversationId) {
        setCurrentConvId(data.conversationId);
        if (data.conversationTitle) {
          setCurrentConvTitle(data.conversationTitle);
        }
        fetchConversations();
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.content || '',
        toolCalls: data.toolCalls,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Error: Could not get a response (${err.message}). Please retry.`,
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (jokeId: string, type: 'up' | 'down') => {
    if (jokeVotes[jokeId]?.userVoted) return;

    setJokeVotes((prev) => {
      const current = prev[jokeId] || { up: 0, down: 0 };
      return {
        ...prev,
        [jokeId]: {
          up: type === 'up' ? current.up + 1 : current.up,
          down: type === 'down' ? current.down + 1 : current.down,
          userVoted: type,
        },
      };
    });

    try {
      await fetch('/api/jokes/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jokeId, voteType: type }),
      });
    } catch (e) {
      console.error('Failed to submit vote:', e);
    }
  };

  const handleDownloadImage = (imageUrl: string, filename: string = 'ai-image.jpg') => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // -------------------------------------------------------------
  // VIEW 1: Loading State during Auth Check
  // -------------------------------------------------------------
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800">
        <div className="w-14 h-14 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-md mb-4 animate-pulse">
          <Bot className="w-8 h-8" />
        </div>
        <div className="flex items-center space-x-2 text-sky-600 font-semibold text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading AI Chatbot, please wait...</span>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: Clean, Centered Registration & Sign-In Page in English
  // Visible ONLY when user is NOT logged in!
  // -------------------------------------------------------------
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50/70 via-white to-sky-100/50 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-sky-500 selection:text-white relative overflow-hidden">
        {/* Subtle Decorative Ambient Background Blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-sky-300/15 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-bold text-base shadow-sm">
            AI
          </div>
          <span className="font-extrabold text-xl text-slate-900 tracking-tight">AI Tools Studio</span>
        </div>

        {/* Centered Registration / Sign-In Card */}
        <div className="w-full max-w-md bg-white border border-sky-100 rounded-3xl p-7 sm:p-9 shadow-xl shadow-sky-100/60 relative z-10">
          {/* Card Header & Tabs */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {authMode === 'signin' ? 'Welcome Back' : 'Create an Account'}
            </h2>
            <p className="text-xs text-slate-500 mt-1.5">
              {authMode === 'signin'
                ? 'Sign in to access your conversations and AI tools.'
                : 'Sign up to start chatting and generating images.'}
            </p>
          </div>

          {/* Sign In / Sign Up Mode Switcher Tabs */}
          <div className="flex border-b border-slate-100 pb-3 mb-6">
            <button
              onClick={() => { setAuthMode('signin'); setAuthError(null); }}
              className={`flex-1 text-center py-2 text-xs font-bold transition-all relative ${
                authMode === 'signin' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign In
              {authMode === 'signin' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => { setAuthMode('signup'); setAuthError(null); }}
              className={`flex-1 text-center py-2 text-xs font-bold transition-all relative ${
                authMode === 'signup' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign Up
              {authMode === 'signup' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 rounded-full" />
              )}
            </button>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
              {authError}
            </div>
          )}

          <div className="space-y-4">
            {/* 1. Continue with Google Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={authLoading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-medium text-xs border border-slate-200 hover:border-slate-300 transition-all shadow-2xs hover:shadow-xs group disabled:opacity-50"
            >
              <GoogleIcon className="w-4 h-4 flex-none group-hover:scale-105 transition-transform" />
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-100" />
              <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                or continue with email
              </span>
              <div className="flex-grow border-t border-slate-100" />
            </div>

            {/* 2. Email & Name Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3.5">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Abdi Naasir"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="cnaasirm60@gmail.com"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading || !authEmail.trim()}
                className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1.5"
              >
                {authLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Please wait...</span>
                  </>
                ) : (
                  <>
                    <span>{authMode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* 3. Fast Demo Login */}
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={handleGoogleSignIn}
                disabled={authLoading}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-sky-600 hover:text-sky-700 bg-sky-50/80 hover:bg-sky-100/80 py-2 rounded-xl font-medium transition-colors border border-sky-100"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Quick Login: <b>Abdi Naasir</b></span>
              </button>
            </div>
          </div>

          {/* Card Footer Switcher */}
          <div className="mt-6 text-center text-xs text-slate-500">
            {authMode === 'signin' ? (
              <span>
                Don't have an account?{' '}
                <button
                  onClick={() => { setAuthMode('signup'); setAuthError(null); }}
                  className="text-sky-600 hover:text-sky-700 font-bold ml-1"
                >
                  Sign Up
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  onClick={() => { setAuthMode('signin'); setAuthError(null); }}
                  className="text-sky-600 hover:text-sky-700 font-bold ml-1"
                >
                  Sign In
                </button>
              </span>
            )}
          </div>

          <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secure session • Neon PostgreSQL</span>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 3: Full AI Chatbot Experience (Sky-Blue Theme)
  // Visible ONLY when user IS LOGGED IN!
  // -------------------------------------------------------------
  return (
    <div className="flex h-screen max-h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* 1. Left Collapsible Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64 sm:w-72' : 'w-0'
        } transition-all duration-300 ease-in-out flex-none flex flex-col bg-white border-r border-slate-200 overflow-hidden relative z-20 shadow-sm`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              AI
            </div>
            <span className="font-bold text-sm text-slate-900 tracking-tight">AI Chatbot</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* "+ New chat" Button */}
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2.5 bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-600 px-4 py-2.5 rounded-full font-medium text-xs border border-slate-200 hover:border-sky-200 transition-all shadow-2xs group"
          >
            <Plus className="w-4 h-4 text-sky-500 group-hover:scale-110 transition-transform" />
            <span>New chat</span>
          </button>
        </div>

        {/* Recent Conversations List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Recent
          </div>
          {conversations.length === 0 ? (
            <div className="text-xs text-slate-400 italic px-3 py-2">
              No conversations yet.
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => loadConversation(conv.id, conv.title)}
                className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                  currentConvId === conv.id
                    ? 'bg-sky-50 text-sky-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                  <MessageSquare className="w-3.5 h-3.5 flex-none opacity-60 text-sky-500" />
                  <span className="truncate">{conv.title}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteConversation(e, conv.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1 rounded transition-opacity"
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* User Account / Profile Section at Sidebar Bottom */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {currentUser.image ? (
                <img
                  src={currentUser.image}
                  alt={currentUser.name || 'User'}
                  className="w-8 h-8 rounded-full border border-sky-200 object-cover flex-none"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-xs flex-none shadow-2xs">
                  {(currentUser.name || currentUser.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {currentUser.name || 'User'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors flex-none"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Chat Area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 bg-slate-50/70">
        {/* Top Header */}
        <header className="flex-none border-b border-slate-200 bg-white/95 backdrop-blur px-4 py-3 sm:px-8">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="text-slate-500 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors mr-1"
                  title="Open Sidebar"
                >
                  <PanelLeft className="w-5 h-5 text-sky-500" />
                </button>
              )}
              <div className="w-9 h-9 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-none">
                AI
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-base text-slate-900 leading-none truncate max-w-[180px] sm:max-w-md">
                  {currentConvTitle}
                </h1>
                <p className="text-xs text-sky-500 font-medium mt-1">
                  Chat with AI Assistant
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={handleNewChat}
                className="text-xs border border-slate-200 hover:border-sky-300 text-slate-700 hover:text-sky-600 px-3.5 py-1.5 rounded-full font-medium transition-colors shadow-2xs flex items-center gap-1.5"
                title="Start a new chat"
              >
                <Plus className="w-3.5 h-3.5 text-sky-500" />
                <span className="hidden sm:inline">New Chat</span>
              </button>

              <button
                onClick={handleNewChat}
                className="text-xs border border-sky-200 text-sky-600 hover:bg-sky-50 px-3.5 py-1.5 rounded-full font-medium transition-colors shadow-2xs flex items-center gap-1.5"
                title="Reset Conversation"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>

              {/* Sign Out Button in Header */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                  <span className="truncate max-w-[120px]">{currentUser.name || currentUser.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-xs bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 px-3 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1.5 border border-slate-200 hover:border-red-200"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Message Stream View */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 ? (
              /* Empty State - Sky Blue Robot Badge */
              <div className="h-full min-h-[55vh] flex flex-col items-center justify-center text-center p-6">
                <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mb-4 shadow-sm text-sky-500">
                  <Bot className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Start a conversation
                </h2>
                <p className="text-slate-500 text-sm mt-1.5 max-w-sm">
                  Ask me anything! I can query databases, search movies, tell jokes, or generate images.
                </p>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="space-y-4">
                  {/* User Bubble - Sky Blue Pill on the right */}
                  {m.role === 'user' && (
                    <div className="flex justify-end items-end space-x-2">
                      <div className="bg-sky-500 text-white px-5 py-2.5 rounded-3xl rounded-br-xs text-sm max-w-lg shadow-sm font-normal">
                        {m.content}
                      </div>
                      <div className="w-7 h-7 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs flex-none shadow-xs">
                        {currentUser?.name ? currentUser.name[0].toUpperCase() : 'U'}
                      </div>
                    </div>
                  )}

                  {/* Assistant Bubble - Sky Blue Robot Avatar Badge */}
                  {m.role === 'assistant' && (
                    <div className="flex justify-start items-start space-x-3 max-w-3xl">
                      <div className="w-8 h-8 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-500 flex-none shadow-xs mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="flex-1 space-y-3">
                        {/* Text Content */}
                        <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-xs p-4 text-sm text-slate-800 shadow-2xs leading-relaxed">
                          {m.content}
                        </div>

                        {/* Tool Execution Cards */}
                        {m.toolCalls && m.toolCalls.map((tc, idx) => (
                          <div key={idx} className="space-y-2">
                            {/* 1. Database Tool Output */}
                            {tc.toolName === 'DatabaseChatTool' && tc.result && (
                              <div className="bg-white border border-emerald-100 rounded-xl p-4 shadow-2xs">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="p-1 rounded bg-emerald-50 text-emerald-600">
                                    <Database className="w-4 h-4" />
                                  </div>
                                  <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                                    PostgreSQL Query Result
                                  </span>
                                  {tc.result.rows && (
                                    <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium ml-auto">
                                      {tc.result.rowCount} rows
                                    </span>
                                  )}
                                </div>

                                {tc.result.query && (
                                  <pre className="text-xs bg-slate-900 text-slate-100 p-2.5 rounded-lg overflow-x-auto mb-3 font-mono">
                                    <code>{tc.result.query}</code>
                                  </pre>
                                )}

                                {tc.result.rows && tc.result.rows.length > 0 && (
                                  <div className="overflow-x-auto border border-slate-100 rounded-lg max-h-60">
                                    <table className="w-full text-xs text-left text-slate-600">
                                      <thead className="text-[11px] uppercase bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                                        <tr>
                                          {Object.keys(tc.result.rows[0]).map((col) => (
                                            <th key={col} className="px-3 py-2">{col}</th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {tc.result.rows.map((row: any, rIdx: number) => (
                                          <tr key={rIdx} className="hover:bg-slate-50/60">
                                            {Object.values(row).map((val: any, cIdx: number) => (
                                              <td key={cIdx} className="px-3 py-1.5 whitespace-nowrap">
                                                {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')}
                                              </td>
                                            ))}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* 2. Movie Database Tool Output */}
                            {tc.toolName === 'MovieDatabaseTool' && tc.result && tc.result.movie && (
                              <div className="bg-white border border-sky-100 rounded-xl p-4 shadow-2xs">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="p-1 rounded bg-sky-50 text-sky-600">
                                    <Film className="w-4 h-4" />
                                  </div>
                                  <span className="text-xs font-semibold text-sky-800 uppercase tracking-wider">
                                    Movie Details (OMDb)
                                  </span>
                                </div>

                                <div className="flex gap-4">
                                  {tc.result.movie.poster && tc.result.movie.poster !== 'N/A' && (
                                    <img
                                      src={tc.result.movie.poster}
                                      alt={tc.result.movie.title}
                                      className="w-20 h-28 object-cover rounded-lg shadow-sm border border-slate-200 flex-none"
                                    />
                                  )}
                                  <div className="flex-1 space-y-1.5">
                                    <div className="flex items-baseline justify-between">
                                      <h4 className="font-bold text-slate-900 text-sm">
                                        {tc.result.movie.title}{' '}
                                        <span className="text-xs text-slate-400 font-normal">
                                          ({tc.result.movie.year})
                                        </span>
                                      </h4>
                                      {tc.result.movie.imdbRating && (
                                        <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md font-bold">
                                          ⭐ {tc.result.movie.imdbRating}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium">
                                      {tc.result.movie.genre} • {tc.result.movie.runtime}
                                    </p>
                                    <p className="text-xs text-slate-600 line-clamp-3">
                                      {tc.result.movie.plot}
                                    </p>
                                    {tc.result.movie.director && (
                                      <p className="text-[11px] text-slate-400">
                                        Director: {tc.result.movie.director}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* 3. Dad Jokes Tool Output */}
                            {tc.toolName === 'DadJokesTool' && tc.result && tc.result.joke && (
                              <div className="bg-white border border-amber-100 rounded-xl p-4 shadow-2xs space-y-3">
                                <div className="flex items-center gap-2">
                                  <div className="p-1 rounded bg-amber-50 text-amber-600">
                                    <Smile className="w-4 h-4" />
                                  </div>
                                  <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                                    Dad Joke
                                  </span>
                                </div>

                                <blockquote className="text-sm font-medium text-slate-800 italic border-l-2 border-amber-400 pl-3 py-1">
                                  "{tc.result.joke}"
                                </blockquote>

                                <div className="flex items-center gap-3 pt-1 border-t border-slate-100 text-xs">
                                  <span className="text-slate-400 text-[11px]">Was this funny?</span>
                                  <button
                                    onClick={() => handleVote(tc.result.id, 'up')}
                                    disabled={!!jokeVotes[tc.result.id]?.userVoted}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full border transition-colors ${
                                      jokeVotes[tc.result.id]?.userVoted === 'up'
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold'
                                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                                    }`}
                                  >
                                    <ThumbsUp className="w-3 h-3" />
                                    <span>
                                      {(tc.result.votesUp || 0) + (jokeVotes[tc.result.id]?.userVoted === 'up' ? 1 : 0)}
                                    </span>
                                  </button>
                                  <button
                                    onClick={() => handleVote(tc.result.id, 'down')}
                                    disabled={!!jokeVotes[tc.result.id]?.userVoted}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full border transition-colors ${
                                      jokeVotes[tc.result.id]?.userVoted === 'down'
                                        ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold'
                                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                                    }`}
                                  >
                                    <ThumbsDown className="w-3 h-3" />
                                    <span>
                                      {(tc.result.votesDown || 0) + (jokeVotes[tc.result.id]?.userVoted === 'down' ? 1 : 0)}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* 4. Image Generator Tool Output (Sky Blue) */}
                            {tc.toolName === 'ImageGeneratorTool' && tc.result && tc.result.imageUrl && (
                              <div className="bg-white border border-sky-100 rounded-xl overflow-hidden shadow-2xs">
                                <div className="p-3 bg-sky-50/60 border-b border-sky-100 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1 rounded bg-sky-100 text-sky-600">
                                      <ImageIcon className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-semibold text-sky-800 uppercase tracking-wider">
                                      Generated with Flux AI
                                    </span>
                                  </div>
                                  <a
                                    href={tc.result.imageUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] text-sky-600 hover:text-sky-700 flex items-center gap-1 font-medium"
                                  >
                                    <span>Full Resolution</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>

                                <div className="p-4 bg-slate-950 flex flex-col items-center">
                                  <img
                                    src={tc.result.imageUrl}
                                    alt={tc.result.prompt}
                                    className="max-h-96 w-auto rounded-lg shadow-md border border-slate-800 object-contain"
                                    loading="lazy"
                                  />
                                </div>

                                <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
                                  <span className="text-slate-500 italic truncate max-w-xs sm:max-w-md">
                                    Prompt: "{tc.result.prompt}"
                                  </span>
                                  <button
                                    onClick={() => handleDownloadImage(tc.result.imageUrl, `ai-flux-${Date.now()}.jpg`)}
                                    className="flex items-center gap-1 text-slate-600 hover:text-sky-600 font-medium px-2 py-1 rounded hover:bg-slate-50 transition-colors"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Download</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-500 flex-none animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-xs text-slate-400 ml-1">AI is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Footer / Input Bar */}
        <footer className="flex-none border-t border-slate-200 bg-white/95 backdrop-blur px-4 py-3 sm:px-8 shadow-sm">
          <div className="max-w-4xl mx-auto">
            {/* Input Form with Plus button, Input pill, and Send button */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2.5"
            >
              <button
                type="button"
                onClick={() => handleSendMessage('Generate image of a cute kitten playing with a ball')}
                title="Quick image generator"
                className="w-9 h-9 rounded-full border border-slate-300 text-slate-500 hover:text-sky-600 hover:border-sky-300 flex items-center justify-center flex-none transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>

              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={loading}
                  className="w-full bg-white border border-sky-300 rounded-full px-5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-2xs disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-400 text-white flex items-center justify-center transition-all shadow-sm flex-none disabled:shadow-none"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </footer>
      </div>
    </div>
  );
}
