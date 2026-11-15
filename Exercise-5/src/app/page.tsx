'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  Film,
  Smile,
  Send,
  RotateCcw,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Clock,
  MessageSquare,
} from 'lucide-react';

interface ToolCall {
  toolName: 'DatabaseChatTool' | 'MovieDatabaseTool' | 'DadJokesTool';
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

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [jokeVotes, setJokeVotes] = useState<Record<string, { up: number; down: number; userVoted?: 'up' | 'down' }>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    { label: 'Show me all sci-fi movies', tool: 'db' },
    { label: 'Find users over 25', tool: 'db' },
    { label: 'Get movies with rating above 8.5', tool: 'db' },
    { label: 'Count total movies by genre', tool: 'db' },
    { label: 'Search movie Inception', tool: 'movie' },
    { label: 'Tell me a programming joke', tool: 'joke' },
  ];

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
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();

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

  const handleReset = async () => {
    try {
      await fetch('/api/reset', { method: 'POST' });
    } catch (e) {}
    setMessages([]);
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
        body: JSON.stringify({ id: jokeId, type }),
      });
    } catch (e) {
      console.error('Vote failed:', e);
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-slate-50 text-slate-900">
      {/* Top Navbar */}
      <header className="flex-none border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 py-3 sm:px-6 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-lg text-slate-900 leading-tight">
                AI Chatbot
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Neon DB & API Active
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs bg-white hover:bg-slate-100 text-slate-700 px-3.5 py-1.5 rounded-lg border border-slate-300 font-medium transition-colors shadow-sm"
              title="Clear conversation"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            /* Clean Minimalist Empty State (Short English message) */
            <div className="h-full min-h-[55vh] flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-3 shadow-sm">
                <MessageSquare className="w-6 h-6 text-indigo-500" />
              </div>
              <p className="text-base font-medium text-slate-700">How can I help you today?</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5 px-1 text-xs text-slate-500">
                  {msg.role === 'user' ? (
                    <span className="font-medium">You</span>
                  ) : (
                    <span className="flex items-center gap-1 text-indigo-600 font-medium">
                      <Sparkles className="w-3.5 h-3.5" /> AI Chatbot
                    </span>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl px-4 py-3.5 max-w-[92%] sm:max-w-[85%] text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/10'
                      : msg.error
                      ? 'bg-rose-50 border border-rose-200 text-rose-800 rounded-tl-none shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Render Tool Results */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="mt-4 space-y-4">
                      {msg.toolCalls.map((tc, idx) => (
                        <div key={idx} className="mt-2">
                          {/* 1. Database Result Table */}
                          {tc.toolName === 'DatabaseChatTool' && (
                            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                              <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 text-xs text-slate-700">
                                <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                                  <Database className="w-4 h-4 text-emerald-600" /> Neon PostgreSQL Query Result
                                </span>
                                <div className="flex items-center gap-3 font-medium text-slate-500">
                                  <span>Rows: {tc.result.rowCount ?? 0}</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {tc.result.metadata?.executionTimeMs ?? 0}ms
                                  </span>
                                </div>
                              </div>

                              {tc.result.success && tc.result.data?.length > 0 ? (
                                <div className="overflow-x-auto max-h-72">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-slate-100/70 text-slate-600 uppercase tracking-wider sticky top-0 border-b border-slate-200">
                                      <tr>
                                        {tc.result.columns?.map((col: string) => (
                                          <th key={col} className="px-3.5 py-2 font-medium">
                                            {col}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {tc.result.data.map((row: any, rIdx: number) => (
                                        <tr
                                          key={rIdx}
                                          className="hover:bg-slate-50 transition-colors"
                                        >
                                          {tc.result.columns?.map((col: string) => (
                                            <td
                                              key={col}
                                              className="px-3.5 py-2 text-slate-700 whitespace-nowrap"
                                            >
                                              {typeof row[col] === 'object' && row[col] !== null
                                                ? JSON.stringify(row[col])
                                                : String(row[col] ?? '')}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="p-4 text-xs text-slate-500 italic">
                                  {tc.result.error || 'No records found matching your query.'}
                                </div>
                              )}
                            </div>
                          )}

                          {/* 2. Movie Card with Poster */}
                          {tc.toolName === 'MovieDatabaseTool' && tc.result.movie && (
                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row gap-4">
                              {tc.result.movie.poster ? (
                                <img
                                  src={tc.result.movie.poster}
                                  alt={tc.result.movie.title}
                                  className="w-28 h-40 object-cover rounded-lg shadow-sm border border-slate-200 self-center sm:self-start flex-none"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-28 h-40 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs text-center p-2 flex-none">
                                  No Poster Available
                                </div>
                              )}

                              <div className="flex-1 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h3 className="font-semibold text-base text-slate-900">
                                      {tc.result.movie.title}
                                      <span className="text-slate-500 font-normal ml-1.5 text-sm">
                                        ({tc.result.movie.year})
                                      </span>
                                    </h3>
                                    <p className="text-xs text-indigo-600 font-medium">
                                      {tc.result.movie.genre} • {tc.result.movie.runtime}
                                    </p>
                                  </div>
                                  <span
                                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${
                                      tc.result.movie.source === 'cache'
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : tc.result.movie.source === 'api'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}
                                  >
                                    {tc.result.movie.source.toUpperCase()}
                                  </span>
                                </div>

                                <p className="text-xs text-slate-600 leading-relaxed">
                                  {tc.result.movie.plot}
                                </p>

                                <div className="text-xs text-slate-500 space-y-0.5">
                                  <div>
                                    <span className="text-slate-400 font-medium">Director:</span>{' '}
                                    {tc.result.movie.director}
                                  </div>
                                  <div>
                                    <span className="text-slate-400 font-medium">Cast:</span>{' '}
                                    {tc.result.movie.actors}
                                  </div>
                                </div>

                                {/* Ratings Badges */}
                                {tc.result.movie.ratings?.length > 0 && (
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    {tc.result.movie.ratings.map((r: any, rIdx: number) => (
                                      <span
                                        key={rIdx}
                                        className="text-[11px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200 font-medium"
                                      >
                                        ★ {r.Source}: {r.Value}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Recommendations Chips */}
                                {tc.result.movie.recommendations?.length > 0 && (
                                  <div className="pt-2 border-t border-slate-100">
                                    <span className="text-[11px] text-slate-500 block mb-1">
                                      Recommended Similar Movies:
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {tc.result.movie.recommendations.map((rec: any, rIdx: number) => (
                                        <button
                                          key={rIdx}
                                          onClick={() => handleSendMessage(`Search movie ${rec.title}`)}
                                          className="text-[11px] bg-slate-50 hover:bg-slate-100 text-indigo-700 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors"
                                        >
                                          <span>{rec.title}</span>
                                          <span className="text-slate-400">({rec.rating}★)</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* 3. Styled Joke Card with Rating Buttons */}
                          {tc.toolName === 'DadJokesTool' && tc.result.joke && (
                            <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 to-purple-50/40 p-4 shadow-sm space-y-3">
                              <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5 text-indigo-700 font-semibold capitalize">
                                  <Smile className="w-4 h-4 text-indigo-600" /> {tc.result.joke.category} Joke
                                </span>
                                <span className="text-[10px] text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200 font-medium">
                                  {tc.result.joke.source === 'api' ? 'icanhazdadjoke API' : 'Offline DB Cache'}
                                </span>
                              </div>

                              <p className="text-base text-slate-900 font-serif italic border-l-2 border-indigo-500 pl-3 py-1">
                                &quot;{tc.result.joke.joke}&quot;
                              </p>

                              {/* Live Rating System */}
                              <div className="flex items-center justify-between pt-2 border-t border-indigo-100 text-xs">
                                <span className="text-slate-500">Did this make you laugh?</span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleVote(tc.result.joke.id, 'up')}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all ${
                                      jokeVotes[tc.result.joke.id]?.userVoted === 'up'
                                        ? 'bg-emerald-100 border-emerald-500 text-emerald-800'
                                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                                    }`}
                                  >
                                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>
                                      {(jokeVotes[tc.result.joke.id]?.up ?? tc.result.joke.votesUp)}
                                    </span>
                                  </button>

                                  <button
                                    onClick={() => handleVote(tc.result.joke.id, 'down')}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all ${
                                      jokeVotes[tc.result.joke.id]?.userVoted === 'down'
                                        ? 'bg-rose-100 border-rose-500 text-rose-800'
                                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                                    }`}
                                  >
                                    <ThumbsDown className="w-3.5 h-3.5 text-rose-600" />
                                    <span>
                                      {(jokeVotes[tc.result.joke.id]?.down ?? tc.result.joke.votesDown)}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Loading state indicator */}
          {loading && (
            <div className="flex flex-col items-start space-y-1">
              <span className="text-xs text-indigo-600 px-1 font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 animate-spin" /> Thinking...
              </span>
              <div className="bg-white border border-slate-200 shadow-sm rounded-2xl rounded-tl-none px-4 py-3 text-slate-500 text-sm flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce"></span>
                <span
                  className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                ></span>
                <span
                  className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                ></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Preset Suggestions & Input Section */}
      <footer className="flex-none border-t border-slate-200 bg-white/90 backdrop-blur-md px-4 py-3 sm:px-6 shadow-sm">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Quick Pill Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-slate-400 flex-none font-medium">Quick Prompts:</span>
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p.label)}
                disabled={loading}
                className="flex-none px-3 py-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm hover:border-indigo-400 transition-all flex items-center gap-1 font-medium"
              >
                {p.tool === 'db' && <Database className="w-3 h-3 text-emerald-600" />}
                {p.tool === 'movie' && <Film className="w-3 h-3 text-sky-600" />}
                {p.tool === 'joke' && <Smile className="w-3 h-3 text-amber-600" />}
                <span>{p.label}</span>
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything, query database, or search movies..."
              disabled={loading}
              className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50 shadow-sm"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 text-white p-2.5 rounded-xl font-medium transition-all shadow-md shadow-indigo-600/20 disabled:shadow-none flex-none"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}
