import React, { useState } from 'react';
import { Database, Code2, Copy, Check, Layers, Table } from 'lucide-react';

interface SchemaViewerProps {
  rawPrismaSchema?: string;
}

export const SchemaViewer: React.FC<SchemaViewerProps> = ({ rawPrismaSchema }) => {
  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');
  const [copied, setCopied] = useState(false);

  const defaultSchema = `// Prisma schema for Agentic Commerce Assistant
// Supports SQLite for local development and PostgreSQL for production

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  user
  admin
}

enum OrderStatus {
  pending
  paid
  failed
}

enum MessageRole {
  user
  agent
}

enum AgentActionType {
  recommend
  add_to_cart
  compare
}

model User {
  id            String         @id @default(cuid())
  email         String         @unique
  passwordHash  String?
  name          String
  googleId      String?        @unique
  role          Role           @default(user)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  
  cartItems     CartItem[]
  orders        Order[]
  conversations Conversation[]
}

model Product {
  id          String      @id @default(cuid())
  name        String
  description String
  price       Float
  category    String
  stock       Int         @default(0)
  imageUrl    String?
  tags        String      // JSON string array for cross-db compatibility
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  cartItems   CartItem[]
  orderItems  OrderItem[]
}

model CartItem {
  id        String   @id @default(cuid())
  userId    String
  productId String
  quantity  Int      @default(1)
  addedAt   DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([userId, productId])
}

model Order {
  id              String      @id @default(cuid())
  userId          String
  status          OrderStatus @default(pending)
  totalAmount     Float
  razorpayOrderId String?     @unique
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  items           OrderItem[]
}

model OrderItem {
  id              String   @id @default(cuid())
  orderId         String
  productId       String
  quantity        Int
  priceAtPurchase Float

  order           Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product         Product  @relation(fields: [productId], references: [id], onDelete: Restrict)
}

model Conversation {
  id        String        @id @default(cuid())
  userId    String
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages  Message[]
  actions   AgentAction[]
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  role           MessageRole  @default(user)
  content        String
  toolCalls      String?      // Stored as JSON string
  createdAt      DateTime     @default(now())

  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
}

model AgentAction {
  id             String          @id @default(cuid())
  conversationId String
  actionType     AgentActionType
  payload        String          // Stored as JSON string
  createdAt      DateTime        @default(now())

  conversation   Conversation    @relation(fields: [conversationId], references: [id], onDelete: Cascade)
}`;

  const schemaContent = rawPrismaSchema || defaultSchema;

  const copyCode = () => {
    navigator.clipboard.writeText(schemaContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const entities = [
    {
      name: 'User',
      color: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5',
      badge: 'Auth & Profile',
      fields: [
        { name: 'id', type: 'String (cuid)', tag: '@id' },
        { name: 'email', type: 'String', tag: '@unique' },
        { name: 'passwordHash', type: 'String?' },
        { name: 'name', type: 'String' },
        { name: 'googleId', type: 'String?', tag: '@unique' },
        { name: 'role', type: 'Role enum (user, admin)', tag: '@default(user)' },
        { name: 'createdAt / updatedAt', type: 'DateTime' },
      ],
      relations: ['1:N CartItem', '1:N Order', '1:N Conversation'],
    },
    {
      name: 'Product',
      color: 'border-sky-500/40 text-sky-600 dark:text-sky-400 bg-sky-500/5',
      badge: 'Catalog & Stock',
      fields: [
        { name: 'id', type: 'String (cuid)', tag: '@id' },
        { name: 'name', type: 'String' },
        { name: 'description', type: 'String' },
        { name: 'price', type: 'Float' },
        { name: 'category', type: 'String' },
        { name: 'stock', type: 'Int', tag: '@default(0)' },
        { name: 'imageUrl', type: 'String?' },
        { name: 'tags', type: 'String (JSON array)' },
      ],
      relations: ['1:N CartItem', '1:N OrderItem'],
    },
    {
      name: 'CartItem',
      color: 'border-indigo-500/40 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5',
      badge: 'Active Basket',
      fields: [
        { name: 'id', type: 'String (cuid)', tag: '@id' },
        { name: 'userId', type: 'String (FK)' },
        { name: 'productId', type: 'String (FK)' },
        { name: 'quantity', type: 'Int', tag: '@default(1)' },
        { name: 'addedAt', type: 'DateTime' },
      ],
      relations: ['N:1 User', 'N:1 Product', 'Unique [userId, productId]'],
    },
    {
      name: 'Order',
      color: 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/5',
      badge: 'Checkout & Payments',
      fields: [
        { name: 'id', type: 'String (cuid)', tag: '@id' },
        { name: 'userId', type: 'String (FK)' },
        { name: 'status', type: 'OrderStatus (pending, paid, failed)' },
        { name: 'totalAmount', type: 'Float' },
        { name: 'razorpayOrderId', type: 'String?', tag: '@unique' },
        { name: 'createdAt / updatedAt', type: 'DateTime' },
      ],
      relations: ['N:1 User', '1:N OrderItem'],
    },
    {
      name: 'OrderItem',
      color: 'border-orange-500/40 text-orange-600 dark:text-orange-400 bg-orange-500/5',
      badge: 'Line Items',
      fields: [
        { name: 'id', type: 'String (cuid)', tag: '@id' },
        { name: 'orderId', type: 'String (FK)' },
        { name: 'productId', type: 'String (FK)' },
        { name: 'quantity', type: 'Int' },
        { name: 'priceAtPurchase', type: 'Float' },
      ],
      relations: ['N:1 Order (Cascade)', 'N:1 Product (Restrict)'],
    },
    {
      name: 'Conversation',
      color: 'border-purple-500/40 text-purple-600 dark:text-purple-400 bg-purple-500/5',
      badge: 'AI Chat Thread',
      fields: [
        { name: 'id', type: 'String (cuid)', tag: '@id' },
        { name: 'userId', type: 'String (FK)' },
        { name: 'createdAt / updatedAt', type: 'DateTime' },
      ],
      relations: ['N:1 User', '1:N Message', '1:N AgentAction'],
    },
    {
      name: 'Message',
      color: 'border-pink-500/40 text-pink-600 dark:text-pink-400 bg-pink-500/5',
      badge: 'Chat History & Tools',
      fields: [
        { name: 'id', type: 'String (cuid)', tag: '@id' },
        { name: 'conversationId', type: 'String (FK)' },
        { name: 'role', type: 'MessageRole (user, agent)' },
        { name: 'content', type: 'String' },
        { name: 'toolCalls', type: 'String? (JSON args)' },
        { name: 'createdAt', type: 'DateTime' },
      ],
      relations: ['N:1 Conversation'],
    },
    {
      name: 'AgentAction',
      color: 'border-teal-500/40 text-teal-600 dark:text-teal-400 bg-teal-500/5',
      badge: 'Agentic Analytics',
      fields: [
        { name: 'id', type: 'String (cuid)', tag: '@id' },
        { name: 'conversationId', type: 'String (FK)' },
        { name: 'actionType', type: 'AgentActionType (recommend, add_to_cart, compare)' },
        { name: 'payload', type: 'String (JSON payload)' },
        { name: 'createdAt', type: 'DateTime' },
      ],
      relations: ['N:1 Conversation'],
    },
  ];

  return (
    <div id="prisma-schema-section" className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 mb-4 border-b border-neutral-100 dark:border-neutral-800">
        <div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-500" />
            Prisma Schema (<code className="text-xs font-mono text-indigo-600 dark:text-indigo-400">schema.prisma</code>)
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            8 entities designed for Agentic Commerce (PostgreSQL & SQLite cross-compatible)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs">
            <button
              onClick={() => setViewMode('visual')}
              className={`px-3 py-1 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${viewMode === 'visual' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-600 dark:text-neutral-400'}`}
            >
              <Table className="w-3.5 h-3.5" />
              Entity Cards
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={`px-3 py-1 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${viewMode === 'code' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-600 dark:text-neutral-400'}`}
            >
              <Code2 className="w-3.5 h-3.5" />
              schema.prisma
            </button>
          </div>

          <button
            id="btn-copy-schema"
            onClick={copyCode}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {viewMode === 'visual' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {entities.map((entity) => (
            <div
              key={entity.name}
              className={`border rounded-xl p-3.5 flex flex-col justify-between ${entity.color}`}
            >
              <div>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-current/15">
                  <span className="font-bold text-sm font-mono tracking-tight text-neutral-900 dark:text-white">
                    {entity.name}
                  </span>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-white/70 dark:bg-neutral-800/70 border border-current/20">
                    {entity.badge}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  {entity.fields.map((f) => (
                    <div key={f.name} className="flex items-center justify-between text-neutral-700 dark:text-neutral-300 font-mono text-[11px]">
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">{f.name}</span>
                      <span className="text-neutral-500 dark:text-neutral-400 text-[10px]">{f.type}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-current/15 text-[10px] text-neutral-600 dark:text-neutral-400">
                <span className="font-semibold block mb-0.5 text-neutral-800 dark:text-neutral-200">Relations:</span>
                <div className="flex flex-wrap gap-1">
                  {entity.relations.map((r) => (
                    <span key={r} className="bg-white/80 dark:bg-neutral-950/40 px-1.5 py-0.5 rounded font-mono">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative">
          <pre className="p-4 bg-neutral-950 text-neutral-200 rounded-lg text-xs font-mono overflow-x-auto max-h-96 border border-neutral-800 leading-relaxed">
            <code>{schemaContent}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
