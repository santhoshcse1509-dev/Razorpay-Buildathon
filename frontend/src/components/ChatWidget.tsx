import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  ShoppingCart,
  Check,
  ChevronDown,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Package,
  ArrowRight,
  HelpCircle,
  Zap,
  Tag,
  Search,
} from 'lucide-react';
import { Product } from '../types.js';
import { apiAgentChat } from '../api.js';

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  toolCalls?: any[];
  products?: Product[];
  timestamp: string;
  isStreaming?: boolean;
}

interface ChatWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
  onOpenProductDetail: (productId: string) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  initialQuery?: string | null;
  onClearInitialQuery?: () => void;
}

const SAMPLE_PROMPTS = [
  { text: 'I need running shoes under ₹3000', label: '👟 Running shoes under ₹3000' },
  { text: 'Add the first running shoe to my cart', label: '🛒 Add 1st shoe to cart' },
  { text: 'Compare AeroTrack and VoltDash running shoes', label: '⚖️ Compare running shoes' },
  { text: 'Recommend noise-cancelling headphones for remote work', label: '🎧 ANC Headphones' },
  { text: 'What are your top wellness picks under $60?', label: '⚡ Wellness under $60' },
];

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  isOpen,
  onToggle,
  onOpenProductDetail,
  onAddToCart,
  initialQuery,
  onClearInitialQuery,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-01',
      role: 'agent',
      content:
        '👋 **Hello! I am your AI Shopping Assistant.**\n\nI can help you find products, compare specs side-by-side, give personalized recommendations, and directly add items to your cart.\n\n*Try asking: "I need running shoes under ₹3000" or tap a suggestion below!*',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [turnCount, setTurnCount] = useState(1);
  const [turnsRemaining, setTurnsRemaining] = useState(20);
  const [addedProductIds, setAddedProductIds] = useState<Set<string>>(new Set());
  const [showToolDetails, setShowToolDetails] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  // Handle external query triggers (like "Ask AI about this product")
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSendMessage(initialQuery);
      if (onClearInitialQuery) {
        onClearInitialQuery();
      }
    }
  }, [initialQuery]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    const userMessageId = `usr-${Date.now()}`;
    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMessageId,
        role: 'user',
        content: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];

    setMessages(newMessages);
    setInputText('');
    setLoading(true);

    try {
      const result = await apiAgentChat({
        conversationId,
        message: text,
      });

      if (result.conversationId) {
        setConversationId(result.conversationId);
      }
      if (result.turnCount !== undefined) {
        setTurnCount(result.turnCount);
      }
      if (result.turnsRemaining !== undefined) {
        setTurnsRemaining(result.turnsRemaining);
      }

      // If cart was updated by tool execution, notify parent
      if (result.cartUpdated && result.products && result.products.length > 0) {
        const addedProd = result.products[0];
        setAddedProductIds((prev) => new Set([...prev, addedProd.id]));
        onAddToCart(addedProd, 1);
      }

      setMessages([
        ...newMessages,
        {
          id: `agent-${Date.now()}`,
          role: 'agent',
          content: result.response,
          toolCalls: result.toolCalls,
          products: result.products,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          id: `err-${Date.now()}`,
          role: 'agent',
          content: `⚠️ **Connection issue**: ${err.message || 'Failed to communicate with AI Agent.'}. Please try again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCardAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, 1);
    setAddedProductIds((prev) => new Set([...prev, product.id]));
  };

  const handleResetChat = () => {
    setConversationId(null);
    setTurnCount(1);
    setTurnsRemaining(20);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'agent',
        content:
          '👋 **New session started.**\n\nHow can I help you shop today? Ask for specific items, budget filters, or product comparisons!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const toggleToolDetails = (msgId: string, toolIdx: number) => {
    const key = `${msgId}-${toolIdx}`;
    setShowToolDetails((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Format simple markdown (bold, lists, code)
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 text-xs leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;

          // Bullet points
          if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
            const cleanLine = line.replace(/^[\s•\-\*]+/, '');
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="text-sky-500 font-bold shrink-0 mt-0.5">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(cleanLine) }} />
              </div>
            );
          }

          // Numbered lists (e.g. 1. 2.)
          const numMatch = line.match(/^(\d+)\.\s+(.*)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1 my-1">
                <span className="text-sky-600 dark:text-sky-400 font-semibold shrink-0">
                  {numMatch[1]}.
                </span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(numMatch[2]) }} />
              </div>
            );
          }

          return (
            <p key={idx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />
          );
        })}
      </div>
    );
  };

  const formatInlineMarkdown = (text: string) => {
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-neutral-900 dark:text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-neutral-600 dark:text-neutral-300">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-sky-600 dark:text-sky-400 font-mono text-[11px]">$1</code>');
    return formatted;
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        id="ai-shopping-agent-trigger-btn"
        onClick={onToggle}
        className={`fixed bottom-6 right-6 z-40 p-3.5 rounded-2xl shadow-xl transition-all duration-300 flex items-center gap-2.5 cursor-pointer ${
          isOpen
            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 scale-95 opacity-0 pointer-events-none'
            : 'bg-sky-600 hover:bg-sky-500 text-white hover:scale-105 active:scale-95 shadow-sky-600/30 ring-4 ring-sky-500/20'
        }`}
      >
        <div className="relative">
          <Bot className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-sky-600 animate-pulse" />
        </div>
        <span className="text-xs font-bold tracking-tight pr-1">Ask AI Assistant</span>
      </button>

      {/* Expandable Chat Drawer Panel */}
      <div
        id="ai-chat-panel"
        className={`fixed bottom-6 right-6 z-50 w-full max-w-[420px] h-[640px] max-h-[calc(100vh-3rem)] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${
          isOpen
            ? 'scale-100 opacity-100 translate-y-0 pointer-events-auto'
            : 'scale-90 opacity-0 translate-y-8 pointer-events-none'
        }`}
      >
        {/* Chat Header */}
        <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold text-neutral-900 dark:text-white">
                  Agentic Commerce Assistant
                </h3>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Tool-Use Active
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 flex items-center gap-1">
                <span>Claude Function-Calling</span>
                <span>•</span>
                <span>Turn {turnCount}/20</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleResetChat}
              title="Reset conversation"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onToggle}
              title="Close chat"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3 py-2 bg-neutral-100/60 dark:bg-neutral-900/60 border-b border-neutral-200/60 dark:border-neutral-800/60 overflow-x-auto no-scrollbar flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-sky-500" />
            Try:
          </span>
          {SAMPLE_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p.text)}
              disabled={loading}
              className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white dark:bg-neutral-800 hover:bg-sky-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 transition cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-2xs"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Chat Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 space-y-2 ${
                  msg.role === 'user'
                    ? 'bg-sky-600 text-white rounded-br-xs shadow-xs'
                    : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 rounded-bl-xs border border-neutral-200/70 dark:border-neutral-700/60'
                }`}
              >
                {/* Message Header (Role + Time) */}
                <div className="flex items-center justify-between gap-3 text-[10px] opacity-70 pb-0.5 border-b border-white/10 dark:border-neutral-700/40">
                  <span className="font-semibold flex items-center gap-1">
                    {msg.role === 'user' ? (
                      <>
                        <UserIcon className="w-2.5 h-2.5" />
                        You
                      </>
                    ) : (
                      <>
                        <Bot className="w-2.5 h-2.5 text-sky-400" />
                        AI Shopping Agent
                      </>
                    )}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Formatted Text Content */}
                {renderFormattedContent(msg.content)}

                {/* Tool Execution Badges & Logs */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-neutral-200/50 dark:border-neutral-700/50 space-y-1.5">
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span>Executed Database Tools ({msg.toolCalls.length}):</span>
                    </div>

                    {msg.toolCalls.map((tc: any, tIdx: number) => {
                      const toolKey = `${msg.id}-${tIdx}`;
                      const isExpanded = showToolDetails[toolKey];
                      return (
                        <div
                          key={tIdx}
                          className="bg-white/80 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2 text-[11px]"
                        >
                          <div
                            onClick={() => toggleToolDetails(msg.id, tIdx)}
                            className="flex items-center justify-between cursor-pointer font-mono font-bold text-sky-600 dark:text-sky-400"
                          >
                            <span>⚡ {tc.tool}()</span>
                            <span className="text-[9px] text-neutral-400 flex items-center gap-0.5">
                              {isExpanded ? 'Hide' : 'Details'}
                              <ChevronDown
                                className={`w-3 h-3 transition-transform ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                              />
                            </span>
                          </div>

                          {isExpanded && (
                            <div className="mt-1.5 pt-1.5 border-t border-neutral-200 dark:border-neutral-700 space-y-1 text-[10px] font-mono">
                              <div>
                                <span className="text-neutral-400">Arguments: </span>
                                <span className="text-neutral-700 dark:text-neutral-300">
                                  {JSON.stringify(tc.args)}
                                </span>
                              </div>
                              {tc.actionId && (
                                <div>
                                  <span className="text-neutral-400">AgentAction ID: </span>
                                  <span className="text-emerald-500 font-semibold">
                                    {tc.actionId}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Render Embedded Product Cards directly in message */}
                {msg.products && msg.products.length > 0 && (
                  <div className="pt-2 mt-2 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                      <span>Interactive Products ({msg.products.length}):</span>
                    </div>

                    <div className="space-y-2">
                      {msg.products.map((prod) => {
                        const isAdded = addedProductIds.has(prod.id);
                        return (
                          <div
                            key={prod.id}
                            onClick={() => onOpenProductDetail(prod.id)}
                            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 hover:border-sky-500 rounded-xl p-2.5 transition flex gap-3 items-center group cursor-pointer shadow-2xs"
                          >
                            {/* Product Thumbnail */}
                            <div className="w-14 h-14 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0 flex items-center justify-center">
                              {prod.imageUrl ? (
                                <img
                                  src={prod.imageUrl}
                                  alt={prod.name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                                />
                              ) : (
                                <Package className="w-6 h-6 text-neutral-400" />
                              )}
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate group-hover:text-sky-500 transition">
                                {prod.name}
                              </h4>
                              <div className="flex items-baseline gap-1.5 mt-0.5">
                                <span className="text-xs font-extrabold text-neutral-900 dark:text-white">
                                  ${prod.price.toFixed(2)}
                                </span>
                                <span className="text-[10px] text-neutral-400 font-mono">
                                  (~₹{Math.round(prod.price * 83).toLocaleString('en-IN')})
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono">
                                  {prod.category}
                                </span>
                                {prod.stock > 0 ? (
                                  <span className="text-[9px] text-emerald-500 font-semibold">
                                    In Stock ({prod.stock})
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-rose-500 font-semibold">
                                    Out of Stock
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Direct Add-to-Cart Button with confirmation state */}
                            <button
                              type="button"
                              onClick={(e) => handleCardAddToCart(prod, e)}
                              disabled={prod.stock === 0}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition flex items-center gap-1 cursor-pointer ${
                                isAdded
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-sky-600 hover:bg-sky-500 text-white shadow-2xs'
                              }`}
                            >
                              {isAdded ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Added</span>
                                </>
                              ) : (
                                <>
                                  <ShoppingCart className="w-3.5 h-3.5" />
                                  <span>Add</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Thinking / Tool Execution Indicator */}
          {loading && (
            <div className="flex items-start gap-2 animate-in fade-in duration-200">
              <div className="w-6 h-6 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl rounded-bl-xs px-3.5 py-2.5 flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce" />
                </div>
                <span className="text-[11px] text-neutral-500 font-medium">
                  AI Agent is querying product database & tools...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about shoes under ₹3000, compare items, add to cart..."
                disabled={loading || turnsRemaining <= 0}
                className="w-full pl-3.5 pr-8 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition disabled:opacity-50"
              />
              <Sparkles className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              type="submit"
              disabled={!inputText.trim() || loading || turnsRemaining <= 0}
              className="p-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {turnsRemaining <= 5 && turnsRemaining > 0 && (
            <p className="text-[10px] text-amber-500 mt-1 text-center font-medium">
              ⚠️ Session limit: {turnsRemaining} turns remaining.
            </p>
          )}
        </div>
      </div>
    </>
  );
};
