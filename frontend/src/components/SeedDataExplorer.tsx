import React, { useState } from 'react';
import { ShoppingBag, Users, Receipt, MessageSquare, Tag, Search, CheckCircle, Clock, XCircle, Bot, Sparkles } from 'lucide-react';
import { Product, User, Order, Conversation } from '../types.js';

interface SeedDataExplorerProps {
  products: Product[];
  users: User[];
  orders: Order[];
  conversations: Conversation[];
  loading: boolean;
}

export const SeedDataExplorer: React.FC<SeedDataExplorerProps> = ({
  products,
  users,
  orders,
  conversations,
  loading,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'users' | 'orders' | 'conversations'>('products');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['All', 'Electronics', 'Apparel', 'Home & Living', 'Fitness & Wellness'];

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div id="seed-data-explorer" className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 mb-4 border-b border-neutral-100 dark:border-neutral-800">
        <div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            Seeded Database Explorer
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Explore 30 products across 4 categories, 8 users, 5 orders, and agent interactions
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'products' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-600 dark:text-neutral-400'}`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-sky-500" />
            Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'users' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-600 dark:text-neutral-400'}`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-500" />
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'orders' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-600 dark:text-neutral-400'}`}
          >
            <Receipt className="w-3.5 h-3.5 text-amber-500" />
            Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('conversations')}
            className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'conversations' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-600 dark:text-neutral-400'}`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
            AI Chats ({conversations.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-neutral-500 animate-pulse">
          Loading seeded records from SQLite/Prisma backend...
        </div>
      ) : (
        <>
          {/* TAB 1: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-neutral-50 dark:bg-neutral-950/40 p-3 rounded-lg border border-neutral-200/80 dark:border-neutral-800">
                {/* Category Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-md transition font-medium cursor-pointer whitespace-nowrap ${selectedCategory === cat ? 'bg-sky-600 text-white shadow-xs' : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Search Box */}
                <div className="relative w-full md:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, tags, description..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-neutral-800 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 max-h-[520px] overflow-y-auto pr-1">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-neutral-50/70 dark:bg-neutral-950/50 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-3 flex flex-col justify-between hover:border-sky-300 dark:hover:border-sky-700/50 transition shadow-2xs"
                  >
                    <div>
                      {product.imageUrl && (
                        <div className="w-full h-32 rounded-lg overflow-hidden mb-2.5 bg-neutral-200 dark:bg-neutral-800">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider text-[10px]">
                          {product.category}
                        </span>
                        <span className="text-neutral-500 font-mono text-[10px]">Stock: {product.stock}</span>
                      </div>
                      <h4 className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 line-clamp-1 mb-1">
                        {product.name}
                      </h4>
                      <p className="text-neutral-500 dark:text-neutral-400 text-[11px] line-clamp-2 leading-relaxed mb-2">
                        {product.description}
                      </p>
                    </div>

                    <div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {Array.isArray(product.tags) &&
                          product.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-neutral-200/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono"
                            >
                              <Tag className="w-2.5 h-2.5" />
                              {tag}
                            </span>
                          ))}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60 dark:border-neutral-800/80">
                        <span className="font-bold font-mono text-sm text-neutral-900 dark:text-neutral-100">
                          ${product.price.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">ID: {product.id}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: USERS */}
          {activeTab === 'users' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 max-h-[520px] overflow-y-auto">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-neutral-50/70 dark:bg-neutral-950/50 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-3.5 flex flex-col justify-between shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-200/70 dark:border-neutral-800">
                      <span className="text-xs font-mono font-semibold text-neutral-900 dark:text-white">
                        {user.name}
                      </span>
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'}`}
                      >
                        {user.role}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
                      <p className="font-mono text-[11px] text-neutral-800 dark:text-neutral-200 truncate">
                        {user.email}
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        Auth: {user.googleId ? 'Google OAuth + Password' : 'Email/Password'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-neutral-200/70 dark:border-neutral-800 text-[10px] text-neutral-500 flex items-center justify-between font-mono">
                    <span>Orders: {user._count?.orders ?? 0}</span>
                    <span>Cart: {user._count?.cartItems ?? 0}</span>
                    <span>Chats: {user._count?.conversations ?? 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-3 max-h-[520px] overflow-y-auto">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-neutral-50/70 dark:bg-neutral-950/50 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-4 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 mb-3 border-b border-neutral-200/70 dark:border-neutral-800">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-semibold text-xs text-neutral-900 dark:text-white">
                        {order.id}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${order.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : order.status === 'pending' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}
                      >
                        {order.status === 'paid' && <CheckCircle className="w-3 h-3" />}
                        {order.status === 'pending' && <Clock className="w-3 h-3" />}
                        {order.status === 'failed' && <XCircle className="w-3 h-3" />}
                        {order.status}
                      </span>
                      {order.razorpayOrderId && (
                        <span className="text-[10px] font-mono text-neutral-400 bg-neutral-200/60 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                          Razorpay: {order.razorpayOrderId}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold font-mono text-neutral-900 dark:text-white">
                        ${order.totalAmount.toFixed(2)}
                      </span>
                      <span className="block text-[10px] text-neutral-500">Customer: {order.user?.name}</span>
                    </div>
                  </div>

                  {/* Line items */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
                      Order Items ({order.items.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-5 h-5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold flex items-center justify-center text-[10px]">
                              {item.quantity}x
                            </span>
                            <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                              {item.product?.name || item.productId}
                            </span>
                          </div>
                          <span className="font-mono text-neutral-600 dark:text-neutral-400 shrink-0 ml-2">
                            ${item.priceAtPurchase.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: CONVERSATIONS & AGENT ACTIONS */}
          {activeTab === 'conversations' && (
            <div className="space-y-4 max-h-[520px] overflow-y-auto">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className="bg-neutral-50/70 dark:bg-neutral-950/50 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-4 shadow-2xs"
                >
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-200/70 dark:border-neutral-800 text-xs">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-purple-500" />
                      <span className="font-mono font-semibold text-neutral-900 dark:text-white">{conv.id}</span>
                      <span className="text-neutral-500">User: {conv.user?.name || conv.userId}</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {new Date(conv.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Messages */}
                  <div className="space-y-2 mb-4">
                    {conv.messages.map((m) => (
                      <div
                        key={m.id}
                        className={`p-3 rounded-lg text-xs ${m.role === 'user' ? 'bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 ml-4' : 'bg-purple-500/10 text-purple-900 dark:text-purple-100 border border-purple-500/20 mr-4'}`}
                      >
                        <div className="flex items-center justify-between mb-1 text-[10px] font-semibold uppercase">
                          <span className={m.role === 'user' ? 'text-neutral-600 dark:text-neutral-400' : 'text-purple-600 dark:text-purple-400'}>
                            {m.role === 'user' ? 'Customer' : 'Claude Commerce Agent'}
                          </span>
                        </div>
                        <p className="leading-relaxed">{m.content}</p>

                        {m.toolCalls && (
                          <div className="mt-2 p-2 bg-neutral-900 text-emerald-400 rounded text-[10px] font-mono border border-neutral-800">
                            <span className="text-neutral-400 block font-semibold mb-0.5">Tool Execution:</span>
                            <pre>{JSON.stringify(m.toolCalls, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Agent Actions for Analytics */}
                  {conv.actions.length > 0 && (
                    <div className="pt-3 border-t border-neutral-200/70 dark:border-neutral-800">
                      <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider block mb-1.5">
                        Captured AgentAction Telemetry (Analytics)
                      </span>
                      <div className="space-y-1.5">
                        {conv.actions.map((act) => (
                          <div
                            key={act.id}
                            className="bg-white dark:bg-neutral-900 p-2 rounded-lg border border-teal-500/30 text-xs font-mono"
                          >
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span className="font-bold text-teal-600 dark:text-teal-400">Action: {act.actionType}</span>
                              <span className="text-[10px] text-neutral-400">ID: {act.id}</span>
                            </div>
                            <pre className="text-[10px] text-neutral-700 dark:text-neutral-300 overflow-x-auto p-1.5 bg-neutral-50 dark:bg-neutral-950 rounded">
                              {JSON.stringify(act.payload, null, 2)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
