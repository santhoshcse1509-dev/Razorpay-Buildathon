import React, { useState } from 'react';
import { Folder, FileCode, FileText, ChevronRight, ChevronDown, Check, Copy } from 'lucide-react';

interface FileNode {
  name: string;
  type: 'folder' | 'file';
  description?: string;
  badge?: string;
  children?: FileNode[];
}

export const FolderStructureViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    root: true,
    backend: true,
    backend_prisma: true,
    backend_src: true,
    backend_routes: true,
    frontend: true,
    frontend_src: true,
    frontend_components: true,
  });

  const toggleFolder = (key: string) => {
    setOpenFolders((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const projectTreeText = `agentic-commerce-assistant/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Full Prisma schema (8 entities + relations)
│   │   ├── seed.ts             # Seeding 8 users, 30 products, 5 orders, sample chats
│   │   └── dev.db              # SQLite development database
│   ├── src/
│   │   ├── routes/
│   │   │   ├── health.ts       # Health-check endpoint (/api/health)
│   │   │   ├── products.ts     # Products & category catalog API
│   │   │   ├── users.ts        # User records & role management
│   │   │   ├── orders.ts       # Orders & status stats
│   │   │   ├── conversations.ts# AI chat messages & agent actions
│   │   │   └── stats.ts        # Database overview metrics
│   │   ├── config.ts           # Environment & secret validation (no hardcoded keys)
│   │   ├── db.ts               # PrismaClient instance singleton
│   │   └── app.ts              # Express application router setup
│   └── .env.example            # Backend secrets template
├── frontend/
│   ├── src/
│   │   ├── components/         # Modular UI presentation components
│   │   ├── api.ts              # Typed API fetchers
│   │   ├── types.ts            # Global frontend TypeScript contracts
│   │   └── App.tsx             # Main React view
│   └── .env.example            # Frontend client variables template
├── server.ts                   # Unified Express + Vite dev & production server
├── .env.example                # Root environment template
├── .gitignore                  # Production-safe gitignore (node_modules, .env, *.db)
├── metadata.json               # AI Studio project manifest
└── package.json                # Project dependencies & Prisma scripts`;

  const copyStructure = () => {
    navigator.clipboard.writeText(projectTreeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="folder-structure-section" className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-100 dark:border-neutral-800">
        <div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Folder className="w-4 h-4 text-amber-500" />
            Project Architecture & Folder Structure
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Strict separation between <code className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1 py-0.5 rounded">/backend</code> and <code className="text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-1 py-0.5 rounded">/frontend</code> with unified dev server
          </p>
        </div>
        <button
          id="btn-copy-folder-tree"
          onClick={copyStructure}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied Tree' : 'Copy Tree'}
        </button>
      </div>

      <div className="font-mono text-xs text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-950/70 p-4 rounded-lg border border-neutral-200/80 dark:border-neutral-800/80 overflow-x-auto space-y-1.5">
        {/* Root */}
        <div className="text-neutral-900 dark:text-neutral-100 font-semibold flex items-center gap-1.5">
          <Folder className="w-4 h-4 text-amber-500" /> agentic-commerce-assistant/
        </div>

        {/* Backend Folder */}
        <div className="pl-4 space-y-1">
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
            <Folder className="w-3.5 h-3.5" /> backend/
            <span className="text-[10px] text-neutral-400 font-sans ml-2">Node.js Express + Prisma ORM Layer</span>
          </div>

          <div className="pl-4 space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
              <Folder className="w-3.5 h-3.5 text-neutral-400" /> prisma/
            </div>
            <div className="pl-4 space-y-1 border-l border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 pl-2">
                <FileCode className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">schema.prisma</span>
                <span className="text-[10px] text-neutral-400 font-sans">8 entities: User, Product, Cart, Order, Conversations</span>
              </div>
              <div className="flex items-center gap-2 pl-2">
                <FileCode className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">seed.ts</span>
                <span className="text-[10px] text-neutral-400 font-sans">Seeds 8 users, 30 products, 5 orders, demo chat</span>
              </div>
              <div className="flex items-center gap-2 pl-2">
                <FileText className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-neutral-600 dark:text-neutral-400">dev.db</span>
                <span className="text-[10px] text-neutral-400 font-sans">Local SQLite DB fallback (PostgreSQL ready)</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 mt-2">
              <Folder className="w-3.5 h-3.5 text-neutral-400" /> src/
            </div>
            <div className="pl-4 space-y-1 border-l border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 pl-2">
                <Folder className="w-3.5 h-3.5 text-neutral-400" /> routes/
                <span className="text-[10px] text-neutral-400 font-sans">(health.ts, products.ts, users.ts, orders.ts, conversations.ts)</span>
              </div>
              <div className="flex items-center gap-2 pl-2">
                <FileCode className="w-3.5 h-3.5 text-neutral-500" />
                <span>config.ts</span>
                <span className="text-[10px] text-neutral-400 font-sans">Secret loaders & validation (never hardcoded)</span>
              </div>
              <div className="flex items-center gap-2 pl-2">
                <FileCode className="w-3.5 h-3.5 text-neutral-500" />
                <span>db.ts</span>
                <span className="text-[10px] text-neutral-400 font-sans">PrismaClient singleton</span>
              </div>
              <div className="flex items-center gap-2 pl-2">
                <FileCode className="w-3.5 h-3.5 text-neutral-500" />
                <span>app.ts</span>
                <span className="text-[10px] text-neutral-400 font-sans">Express middleware & routing factory</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pl-2 mt-1">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-neutral-700 dark:text-neutral-300 font-medium">.env.example</span>
              <span className="text-[10px] text-neutral-400 font-sans">DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY, RAZORPAY_*, GOOGLE_*</span>
            </div>
          </div>
        </div>

        {/* Frontend Folder */}
        <div className="pl-4 space-y-1 mt-2">
          <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-medium">
            <Folder className="w-3.5 h-3.5" /> frontend/
            <span className="text-[10px] text-neutral-400 font-sans ml-2">React 19 + Tailwind CSS + Lucide Icons</span>
          </div>

          <div className="pl-4 space-y-1 border-l border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2 pl-2">
              <Folder className="w-3.5 h-3.5 text-neutral-400" /> src/components/
              <span className="text-[10px] text-neutral-400 font-sans">HealthBanner, SchemaViewer, SeedDataExplorer, ApiTester</span>
            </div>
            <div className="flex items-center gap-2 pl-2">
              <FileCode className="w-3.5 h-3.5 text-sky-500" />
              <span>api.ts</span>
              <span className="text-[10px] text-neutral-400 font-sans">Typed REST fetchers hitting /api/* endpoints</span>
            </div>
            <div className="flex items-center gap-2 pl-2">
              <FileCode className="w-3.5 h-3.5 text-sky-500" />
              <span>types.ts</span>
              <span className="text-[10px] text-neutral-400 font-sans">Data models matching Prisma entities</span>
            </div>
            <div className="flex items-center gap-2 pl-2">
              <FileText className="w-3.5 h-3.5 text-sky-500" />
              <span className="text-neutral-700 dark:text-neutral-300 font-medium">.env.example</span>
              <span className="text-[10px] text-neutral-400 font-sans">VITE_API_URL, VITE_RAZORPAY_KEY_ID, VITE_GOOGLE_CLIENT_ID</span>
            </div>
          </div>
        </div>

        {/* Root Files */}
        <div className="pl-4 space-y-1 mt-2 pt-2 border-t border-neutral-200/50 dark:border-neutral-800/50">
          <div className="flex items-center gap-2">
            <FileCode className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">server.ts</span>
            <span className="text-[10px] text-neutral-400 font-sans">Unified Express + Vite Dev & Prod server (Port 3000)</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-amber-500" />
            <span>.env.example</span>
            <span className="text-[10px] text-neutral-400 font-sans">Full consolidated environment specification</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-neutral-400" />
            <span>.gitignore</span>
            <span className="text-[10px] text-neutral-400 font-sans">node_modules, .env*, dist, *.db ignored</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-neutral-400" />
            <span>package.json</span>
            <span className="text-[10px] text-neutral-400 font-sans">Scripts for dev, build, prisma:generate, prisma:push, prisma:seed</span>
          </div>
        </div>
      </div>
    </div>
  );
};
