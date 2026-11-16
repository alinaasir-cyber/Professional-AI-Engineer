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
  Bot,
  Image as ImageIcon,
  Download,
  ExternalLink,
  Plus,
} from 'lucide-react';

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

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [jokeVotes, setJokeVotes] = useState<Record<string, { up: number; down: number; userVoted?: 'up' | 'down' }>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    { label: '🎨 Generate image of a futuristic flying car', tool: 'image' },
    { label: 'Show me all sci-fi movies', tool: 'db' },
    { label: 'Search movie Inception', tool: 'movie' },
    { label: 'Tell me a programming joke', tool: 'joke' },
    { label: 'Find users over 25', tool: 'db' },
    { label: 'Count total movies by genre', tool: 'db' },
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
    <div className="flex flex-col h-screen max-h-screen bg-slate-50/70 text-slate-900 font-sans">
      {/* Top Header - Styled like course screenshot */}
      <header className="flex-none border-b border-slate-200 bg-white/95 backdrop-blur px-4 py-3 sm:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              AI
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-900 leading-none">
                New Conversation
              </h1>
              <p className="text-xs text-rose-500 font-medium mt-1">
                Chat with AI Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleReset}
              className="text-xs border border-rose-200 text-rose-600 hover:bg-rose-50 px-4 py-1.5 rounded-full font-medium transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Chat</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            /* Empty State - Exact match of course video screenshot */
            <div className="h-full min-h-[55vh] flex flex-col items-center justify-center text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-4 shadow-sm text-rose-500">
                <Bot className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Start a conversation</h2>
              <p className="text-sm text-slate-500 mt-1">
                Ask me anything! I can query databases, search movies, tell jokes, or generate images.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                {msg.role === 'user' ? (
                  <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-semibold flex-none shadow-sm">
                    U
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center flex-none shadow-2xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl px-5 py-3.5 max-w-[90%] sm:max-w-[80%] text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-rose-500 text-white rounded-tr-none'
                      : msg.error
                      ? 'bg-red-50 border border-red-200 text-red-800 rounded-tl-none'
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Render Tool Results */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="mt-4 space-y-4">
                      {msg.toolCalls.map((tc, idx) => (
                        <div key={idx} className="mt-2">
                          {/* 1. AI Image Generator Result Card */}
                          {tc.toolName === 'ImageGeneratorTool' && tc.result.imageUrl && (
                            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                                <span className="font-semibold text-rose-600 flex items-center gap-1.5">
                                  <ImageIcon className="w-4 h-4" /> Generated with Flux AI
                                </span>
                                <a
                                  href={tc.result.imageUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-slate-500 hover:text-rose-600 flex items-center gap-1"
                                >
                                  <span>Full Resolution</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                              <div className="relative group bg-slate-950 flex items-center justify-center max-h-[460px] overflow-hidden">
                                <img
                                  src={tc.result.imageUrl}
                                  alt={tc.result.prompt}
                                  className="w-full object-contain max-h-[460px] transition-transform duration-300 group-hover:scale-[1.01]"
                                  loading="lazy"
                                />
                              </div>
                              <div className="p-3 bg-white flex items-center justify-between gap-3 text-xs border-t border-slate-100">
                                <div className="flex-1 min-w-0">
                                  <p className="text-slate-800 font-semibold truncate">
                                    &quot;{tc.result.userPrompt || tc.result.prompt}&quot;
                                  </p>
                                  {tc.result.enhancedPrompt && (
                                    <p className="text-[11px] text-slate-400 truncate italic">
                                      Flux English: {tc.result.enhancedPrompt}
                                    </p>
                                  )}
                                </div>
                                <a
                                  href={tc.result.imageUrl}
                                  download={`ai-image-${Date.now()}.jpg`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors shadow-2xs flex-none"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download</span>
                                </a>
                              </div>
                            </div>
                          )}

                          {/* 2. Database Result Table */}
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
                                        <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                                          {tc.result.columns?.map((col: string) => (
                                            <td key={col} className="px-3.5 py-2 text-slate-700 whitespace-nowrap">
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

                          {/* 3. Movie Card with Poster */}
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
                                    <p className="text-xs text-rose-500 font-medium">
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
                                    <span className="text-slate-400 font-medium">Director:</span> {tc.result.movie.director}
                                  </div>
                                  <div>
                                    <span className="text-slate-400 font-medium">Cast:</span> {tc.result.movie.actors}
                                  </div>
                                </div>

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
                              </div>
                            </div>
                          )}

                          {/* 4. Styled Joke Card with Live Votes */}
                          {tc.toolName === 'DadJokesTool' && tc.result.joke && (
                            <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 shadow-sm space-y-3">
                              <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5 text-rose-600 font-semibold capitalize">
                                  <Smile className="w-4 h-4" /> {tc.result.joke.category} Joke
                                </span>
                                <span className="text-[10px] text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200 font-medium">
                                  {tc.result.joke.source === 'api' ? 'icanhazdadjoke API' : 'Offline DB Cache'}
                                </span>
                              </div>

                              <p className="text-base text-slate-900 font-serif italic border-l-2 border-rose-500 pl-3 py-1">
                                &quot;{tc.result.joke.joke}&quot;
                              </p>

                              <div className="flex items-center justify-between pt-2 border-t border-rose-100 text-xs">
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
                                    <span>{jokeVotes[tc.result.joke.id]?.up ?? tc.result.joke.votesUp}</span>
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
                                    <span>{jokeVotes[tc.result.joke.id]?.down ?? tc.result.joke.votesDown}</span>
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

          {/* Loading indicator */}
          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center flex-none">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 text-slate-500 text-sm flex items-center space-x-2 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                <span className="text-xs text-slate-400 ml-1">AI is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Footer / Input Bar - Matches course screenshot */}
      <footer className="flex-none border-t border-slate-200 bg-white/95 backdrop-blur px-4 py-3 sm:px-8 shadow-sm">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Quick Pill Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-slate-400 flex-none font-medium">Quick Prompts:</span>
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p.label)}
                disabled={loading}
                className="flex-none px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs hover:border-rose-400 transition-all flex items-center gap-1.5 font-medium"
              >
                {p.tool === 'image' && <ImageIcon className="w-3.5 h-3.5 text-rose-500" />}
                {p.tool === 'db' && <Database className="w-3.5 h-3.5 text-emerald-600" />}
                {p.tool === 'movie' && <Film className="w-3.5 h-3.5 text-sky-600" />}
                {p.tool === 'joke' && <Smile className="w-3.5 h-3.5 text-amber-500" />}
                <span>{p.label}</span>
              </button>
            ))}
          </div>

          {/* Input Box matching the screenshot */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2.5"
          >
            {/* User Avatar */}
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs flex-none shadow-2xs">
              N
            </div>

            {/* Plus button */}
            <button
              type="button"
              onClick={() => handleSendMessage('Generate image of a cute kitten playing with a ball')}
              title="Quick image generator"
              className="w-8 h-8 rounded-full border border-slate-300 text-slate-500 hover:text-rose-600 hover:border-rose-300 flex items-center justify-center flex-none transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={loading}
                className="w-full bg-white border border-rose-300 rounded-full px-5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-2xs disabled:opacity-50"
              />
            </div>

            {/* Send button */}
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-full bg-rose-500 hover:bg-rose-600 disabled:bg-slate-200 disabled:text-slate-400 text-white flex items-center justify-center transition-all shadow-sm flex-none disabled:shadow-none"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}
