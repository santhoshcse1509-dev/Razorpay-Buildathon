# 🛍️ Agentic Commerce Assistant

> **A full-stack, enterprise-grade AI commerce platform featuring Claude-powered tool-calling, consultative shopping dialogues, real-time cart mutations, cart abandonment nudges, Razorpay payment verification, and an executive analytics telemetry dashboard.**

---

## 🌟 Executive Summary

The **Agentic Commerce Assistant** transforms e-commerce from static browsing into an interactive, high-converting concierge experience. Powered by **Anthropic Claude 3.5 Sonnet / Haiku** with structured function-calling, the assistant searches live database inventory, compares product specifications side-by-side, asks consultative clarifying questions, and mutates user shopping carts directly within the dialogue stream.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT BROWSER (PORT 3000)                             │
│  React 18 • TypeScript • Tailwind CSS • Lucide Icons • Motion Transitions      │
│  ┌────────────────────┬────────────────────┬─────────────────────────────────┐  │
│  │  Product Catalog   │   AI Chat Widget   │   Admin Analytics & Telemetry   │  │
│  │  (Search & Filter) │  (Tool Execution)  │   (Conversion & Agent Ratios)   │  │
│  └─────────┬──────────┴─────────┬──────────┴────────────────┬────────────────┘  │
└────────────┼────────────────────┼───────────────────────────┼───────────────────┘
             │                    │                           │
             ▼                    ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      EXPRESS BACKEND SERVER (Node.js ESM)                       │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ JWT Authentication Middleware • 403 RBAC Guard • Request Rate Limiting    │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────┬────────────────────┬─────────────────────────────────┐  │
│  │ /api/products      │ /api/agent/chat    │ /admin/analytics (403 Guard)    │  │
│  │ /api/cart          │ /api/checkout      │ /admin/conversations            │  │
│  │ /api/auth          │ /api/verify-payment│ /api/idle-nudge                 │  │
│  └─────────┬──────────┴─────────┬──────────┴────────────────┬────────────────┘  │
└────────────┼────────────────────┼───────────────────────────┼───────────────────┘
             │                    │                           │
     ┌───────┴───────┐    ┌───────┴───────┐           ┌───────┴───────┐
     ▼               ▼    ▼               ▼           ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌───────────────────────────┐
│ Claude API   │ │ SQLite / DB  │ │ Razorpay API │ │ Prisma ORM Database Engine│
│ (Anthropic)  │ │ (dev.db)     │ │ (Payments)   │ │ Users • Products • Orders │
│ Function     │ │ Prisma ORM   │ │ Order Create │ │ CartItems • Conversations │
│ Calling      │ │ Client       │ │ & Signature  │ │ Messages • AgentActions   │
└──────────────┘ └──────────────┘ └──────────────┘ └───────────────────────────┘
```

### Key Components:
1. **Frontend (React 18 + Vite + Tailwind CSS)**: Modular, responsive UI with catalog search/filtering, real-time cart drawer & cart page, consultative floating chat concierge, interactive Razorpay checkout simulation, and executive analytics dashboard with responsive SVG charts.
2. **Express Backend API**: REST routing with JWT authentication, RBAC authorization (`requireAdmin` middleware), order creation, payment signature verification, and conversation state management.
3. **Anthropic Claude Engine**: Stateful conversation loops supporting 4 structured tools (`search_catalog`, `compare_products`, `get_product_details`, `add_to_cart`).
4. **Prisma ORM & SQLite / PostgreSQL**: Strongly-typed schema tracking `User`, `Product`, `ProductView`, `CartItem`, `CartSession`, `Order`, `OrderItem`, `Conversation`, `Message`, and `AgentAction`.
5. **Razorpay Gateway Integration**: Order initialization, signature generation, and verification with support for test-mode simulations and retryable failure recovery.

---

## 🚀 Setup & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd agentic-commerce-assistant
npm install
```

### 2. Environment Variables Configuration
Copy `.env.example` to `.env` and configure your credentials:
```bash
cp .env.example .env
```

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | SQLite or PostgreSQL connection string | `file:./backend/prisma/dev.db` |
| `PORT` | Local dev & production server port | `3000` |
| `JWT_SECRET` | Secret key used to sign and verify user JWTs | `super-secret-jwt-key` |
| `ANTHROPIC_API_KEY` | Anthropic Claude API Key | `sk-ant-api03-...` |
| `RAZORPAY_KEY_ID` | Razorpay Key ID (Test Mode) | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | `rzp_secret_...` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID (Optional) | `...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET`| Google OAuth Client Secret (Optional) | `GOCSPX-...` |

### 3. Database Migration & Comprehensive Seeding
Run Prisma migrations and populate the database with comprehensive catalog products, customer profiles, admin accounts, historical views, abandoned carts, and agent conversations:
```bash
# Push Prisma schema to local database
npx prisma db push

# Run comprehensive seed script
npm run prisma:seed
```

### 4. Running the Application
```bash
# Start development server (Node + Vite on Port 3000)
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

---

## 🧠 Design Rationale & Business Growth Levers

### 1. Why Clarifying Questions Instead of Blind Recommendations?
- **Problem**: Generic e-commerce search returns hundreds of weakly relevant items. Standard chatbots often guess user intent incorrectly, leading to buyer fatigue, high return rates, and zero purchases.
- **Solution**: The assistant asks targeted, single-sentence clarifying questions (e.g., *"What is your preferred budget range?"* or *"Will you use these headphones primarily for commuting or fitness?"*).
- **Outcome**: Replicates the high-touch, consultative guidance of a luxury in-store retail specialist, boosting purchase confidence.

### 2. Why Structured Tool-Calling over Plain Chat?
- **Problem**: LLMs generate plausible but hallucinated prices, unavailable sizes, outdated inventory levels, and cannot mutate user carts without human intervention.
- **Solution**: Claude is strictly bound to deterministic database tools:
  - `search_catalog`: Executes parameterized SQLite/Postgres queries.
  - `compare_products`: Formats side-by-side technical specification matrices.
  - `get_product_details`: Retrieves exact live stock count and variants.
  - `add_to_cart`: Atomically mutates the database `CartItem` table and returns live UI feedback.
- **Outcome**: 100% accurate pricing, verified stock availability, and zero-click cart actions right inside the conversational interface.

### 3. Growth Levers & Revenue Impact
| Feature | Target Growth Metric | Mechanism |
| :--- | :--- | :--- |
| **Abandoned Cart Nudges** | **Reduce Cart Abandonment (by 20–35%)** | Detects 2+ minutes of shopping inactivity and sends personalized AI suggestions with a `CART10` discount code. |
| **Conversational Cross-Sell** | **Increase Average Order Value (AOV)** | When a user adds an item (e.g., *AcousticPro Headphones*), the assistant recommends complementary accessories (e.g., *PulseFlow Charging Hub*). |
| **Agent-Assisted Conversion Ratio** | **Prove AI ROI & Incremental GMV** | The admin analytics dashboard measures orders influenced by `AgentAction` records vs. self-service orders, validating business impact. |

---

## 🔒 Role-Based Access Control (RBAC) & Security

The platform enforces strict role separation:
- **`user` (Customer)**: Can browse catalog, chat with AI, add to cart, receive nudges, and execute checkouts. Restricted with **HTTP 403 Forbidden** when attempting to access `/admin/*` routes.
- **`admin` (Executive / Ops)**: Accesses executive analytics, aggregate conversion time-series, top recommendation leaderboards, and raw Claude conversation logs with tool execution payloads.

### Seeded Credentials for Testing
- **Customer Account**: `sophia.r@example.com` / `demo-password` (Role: `user`)
- **Executive Admin**: `elena.vance@agenticcommerce.com` / `demo-password` (Role: `admin`)
- **Operations Admin**: `marcus.thorne@agenticcommerce.com` / `demo-password` (Role: `admin`)

---

## 📊 Analytics Telemetry Formulas

1. **Conversion Rate (%)**:
   $$\text{Conversion Rate} = \left( \frac{\text{Paid Orders in Date Range}}{\text{Unique Users Viewing } \ge 1 \text{ Product in Date Range}} \right) \times 100$$

2. **Cart Abandonment Rate (%)**:
   $$\text{Abandonment Rate} = \left( \frac{\text{Cart Sessions with Items not Converted within 24h}}{\text{Total Cart Sessions Created in Date Range}} \right) \times 100$$

3. **Agent-Assisted Ratio**:
   $$\text{Agent Assisted \%} = \left( \frac{\text{Paid Orders with Items Matching Agent Recommendations}}{\text{Total Paid Orders}} \right) \times 100$$

---

## 🔮 Known Limitations & Roadmap

1. **Vector Semantic Search**: Currently uses keyword, price range, category, and tag indexing; future releases will integrate `pgvector` with text embeddings for natural language semantic matching.
2. **Multi-Modal Image Input**: Allow customers to upload a photo of an outfit or room interior for visual similarity matching.
3. **Automated WhatsApp / SMS Nudge Webhooks**: Integrate Twilio / WhatsApp Cloud API to deliver cart abandonment nudges to external channels if the browser tab is closed.
4. **Personalized Dynamic Discounting**: Implement machine learning to dynamically calculate the optimal discount percentage needed to convert price-sensitive users.
