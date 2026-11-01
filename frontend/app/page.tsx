'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = stored ? stored === 'dark' : prefersDark;
    setIsDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const lightTheme = {
    appBg: '#ffffff',
    panelBg: '#ffffff',
    border: 'rgba(52, 71, 104, 0.2)',
    text: '#344768',
    mutedText: '#6b7a99',
    iconBg: 'rgb(211, 174, 26, 0.1)',
    iconHoverBg: 'rgba(52, 71, 104, 0.2)',
    userBubble: '#9053a0',
    userText: '#ffffff',
    assistantBubble: '#344768',
    assistantText: '#ffffff',
    buttonBg: '#344768',
    buttonHover:'rgb(211, 174, 26)',
    buttonActive: '#1f2a3d',
    buttonText: '#ffffff',
    loadingBubble: '#344768',
    inputBg: '#ffffff',
    inputText: '#344768',
    inputBorder: 'rgba(52, 71, 104, 0.3)',
    footerText: '#344768',
    iconColor: '#344768',
  };

  const darkTheme = {
    appBg: '#1a2332',
    panelBg: '#1f2a3d',
    border: 'rgba(255, 255, 255, 0.15)',
    text: '#f1f5fb',
    mutedText: '#cbd5f5',
    iconBg: 'rgba(255, 255, 255, 0.1)',
    iconHoverBg: 'rgba(255, 255, 255, 0.2)',
    userBubble: '#f1f5fb',
    userText: '#9053a0',
    assistantBubble: '#f1f5fb',
    assistantText: '#344768',
    buttonBg: '#f1f5fb',
    buttonHover: 'rgb(211, 174, 26)',
    buttonActive: '#c0cffb',
    buttonText: '#1a2332',
    loadingBubble: '#2f3b57',
    inputBg: '#1a2332',
    inputText: '#f1f5fb',
    inputBorder: 'rgba(255, 255, 255, 0.3)',
    footerText: '#cbd5f5',
    iconColor: '#f1f5fb',
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userInput }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error calling backend API:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please make sure the backend is running and check your API URL configuration.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col transition-colors duration-200" style={{ backgroundColor: theme.appBg }}>
      <header className="border-b px-6 py-4" style={{ backgroundColor: theme.panelBg, borderColor: theme.border }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/decodelogo.svg" alt="BioBuzz Logo" className="h-15 w-auto" />
            <div>
              <h1 className="text-xl font-medium" style={{ color: theme.text }}>
                FTC BioBuzz Chatbot
          </h1>
              <p className="text-xs" style={{ color: theme.mutedText }}>
                Ask me anything about the FTC Game Manual for the 2025-2026 season!
          </p>
        </div>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
            style={{ 
              backgroundColor: theme.iconBg,
              color: theme.iconColor
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.iconHoverBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.iconBg;
            }}
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-8 scroll-smooth">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center animate-fade-in">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl" style={{ backgroundColor: theme.iconBg }}>
                <svg
                  className="h-10 w-10"
                  style={{ color: theme.iconColor }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h2 className="mb-3 text-3xl font-medium" style={{ color: theme.text }}>
                Welcome! 👋
              </h2>
              <p className="mb-2 text-lg" style={{ color: theme.mutedText }}>
                I'm here to help you find answers about the rules for the 2025-2026 FTC BioBuzz season!
              </p>
              <p className="text-sm" style={{ color: theme.mutedText }}>
                Start a conversation by typing a message below
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-5">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex animate-slide-up ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div
                  className="max-w-[85%] rounded-2xl px-5 py-3.5 text-white shadow-md"
                  style={{
                    backgroundColor: message.role === 'user' ? theme.userBubble : theme.assistantBubble,
                    color: message.role === 'user' ? theme.userText : theme.assistantText,
                  }}
                >
                  <div 
                    className="break-words leading-relaxed text-[15px] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                    style={{ color: message.role === 'user' ? theme.userText : theme.assistantText }}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        h1: ({ children }) => <h1 className="mb-2 mt-3 text-xl font-bold first:mt-0">{children}</h1>,
                        h2: ({ children }) => <h2 className="mb-2 mt-3 text-lg font-bold first:mt-0">{children}</h2>,
                        h3: ({ children }) => <h3 className="mb-2 mt-2 text-base font-bold first:mt-0">{children}</h3>,
                        ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="ml-2">{children}</li>,
                        code: ({ children, className }) => {
                          const isInline = !className;
                          return isInline ? (
                            <code className="rounded bg-black/20 px-1.5 py-0.5 text-sm font-mono">{children}</code>
                          ) : (
                            <code className="block rounded bg-black/20 p-2 text-sm font-mono overflow-x-auto">{children}</code>
                          );
                        },
                        pre: ({ children }) => <pre className="mb-2 overflow-x-auto rounded bg-black/20 p-2 text-sm">{children}</pre>,
                        blockquote: ({ children }) => (
                          <blockquote className="mb-2 border-l-4 border-current/30 pl-3 italic">{children}</blockquote>
                        ),
                        a: ({ children, href }) => (
                          <a href={href} className="underline opacity-80 hover:opacity-100" target="_blank" rel="noopener noreferrer">
                            {children}
                          </a>
                        ),
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        hr: () => <hr className="my-3 border-current/20" />,
                        table: ({ children }) => (
                          <div className="mb-2 overflow-x-auto">
                            <table className="min-w-full border-collapse border border-current/20">
                              {children}
                            </table>
                          </div>
                        ),
                        thead: ({ children }) => <thead className="bg-current/10">{children}</thead>,
                        tbody: ({ children }) => <tbody>{children}</tbody>,
                        tr: ({ children }) => <tr className="border-b border-current/20">{children}</tr>,
                        th: ({ children }) => <th className="border border-current/20 px-2 py-1 text-left font-semibold">{children}</th>,
                        td: ({ children }) => <td className="border border-current/20 px-2 py-1">{children}</td>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  <span
                    className="mt-2 block text-xs opacity-80"
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="max-w-[85%] rounded-2xl px-5 py-4 shadow-md" style={{ backgroundColor: theme.loadingBubble }}>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-white [animation-delay:-0.3s]"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-white [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-white"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="border-t px-6 py-5" style={{ backgroundColor: theme.panelBg, borderColor: theme.border }}>
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="w-full rounded-2xl border px-5 py-3.5 pr-12 transition-colors focus:outline-none focus:ring-2"
                style={{ 
                  borderColor: theme.inputBorder,
                  backgroundColor: theme.inputBg,
                  color: theme.inputText,
                  '--tw-ring-color': theme.inputBorder,
                } as React.CSSProperties & { '--tw-ring-color': string }}
                onFocus={(e) => {
                  e.target.style.borderColor = theme.inputBorder;
                  e.target.style.boxShadow = `0 0 0 2px ${theme.inputBorder}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '';
                  e.target.style.boxShadow = '';
                }}
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: theme.mutedText }}>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex items-center gap-2 rounded-2xl px-6 py-3.5 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 shadow-md"
              style={{ backgroundColor: theme.buttonBg, color: theme.buttonText }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = theme.buttonHover;
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = theme.buttonBg;
                }
              }}
              onMouseDown={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = theme.buttonActive;
                }
              }}
              onMouseUp={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = theme.buttonBg;
                }
              }}
            >
              <span>Send</span>
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </form>
      </div>

      <footer className="border-t px-4 py-2" style={{ backgroundColor: theme.panelBg, borderColor: theme.border }}>
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 text-xs" style={{ color: theme.footerText }}>
          <img src="/genetonlogo.svg" alt="Geneton Logo" className="h-6 w-6 rounded-full object-cover" />
          <span>Made by Team Geneton #26507</span>
        </div>
      </footer>
    </div>
  );
}
