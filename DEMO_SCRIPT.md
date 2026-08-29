# 🎙️ Live Demo Presentation Script
## Agentic Commerce Assistant • 6-Step Walkthrough

> **Presenter Note**: This script is tailored for a spoken presentation. Follow the narrative cues, highlighted actions, and speaking notes for a smooth 4-to-5 minute demonstration.

---

### ⏱️ Quick Summary of Steps
1. **Step 1: Sign In & Authentication** (Show user context & role)
2. **Step 2: Catalog Discovery & Multi-Facet Filtering** (Show standard shopping flow)
3. **Step 3: Consultative AI Shopping Concierge** (Show natural language recommendations & clarifying questions)
4. **Step 4: Zero-Click Cart Mutation via Claude Tool-Use** (Show autonomous action execution)
5. **Step 5: Abandoned Cart Detection & AI Nudge** (Show proactive retention lever)
6. **Step 6: Razorpay Checkout & Executive Analytics Dashboard** (Show conversion lift & agent attribution)

---

### 🗣️ Step 1: Sign In & Authentication
**Action**: Click the **Sign In** button in the top navigation bar. Click **"Sophia Rodriguez (Customer)"** to quick-fill credentials and submit.

**What to Say Aloud**:
> *"Welcome everyone. Today I'm presenting the **Agentic Commerce Assistant**—an intelligent e-commerce platform that pairs modern retail with autonomous LLM tool-calling.*
> 
> *I'll begin by logging in as **Sophia**, a customer. The application uses JWT authentication with role-based access control, distinguishing standard shoppers from store administrators."*

---

### 🗣️ Step 2: Browse Catalog & Fast Filtering
**Action**: Scroll through the product catalog. Click the **"Apparel"** category chip, then adjust the price slider or type *"shoes"* into the search bar. Click one product to open the detail modal.

**What to Say Aloud**:
> *"Here in our storefront, customers can browse real inventory backed by Prisma ORM and SQLite. We have over thirty seeded products across Electronics, Apparel, Home & Living, and Fitness.*
> 
> *Notice how fast the multi-facet filtering is—filtering by price, category, stock availability, and sorting by price or rating. But in modern commerce, users don't just want static filters—they want consultative advice. Let's open our AI shopping concierge."*

---

### 🗣️ Step 3: Consultative AI Dialogue & Clarifying Questions
**Action**: Click the **"Ask AI Assistant"** floating button on the bottom right. Click the sample prompt: **"👟 Running shoes under ₹3000"** (or type *"I need running shoes under ₹3000"*).

**What to Say Aloud**:
> *"When we open the AI Assistant, we are connected to **Anthropic Claude** with structured tool-calling enabled.*
> 
> *Notice how Claude doesn't just guess or hallucinate—it executes the `search_catalog` tool directly against our database, checks live prices and stock, and formats a consultative recommendation with exact pricing in INR.*
> 
> *If we ask a broader question, the assistant asks smart clarifying questions regarding terrain, arch support, or budget, mimicking a knowledgeable retail associate."*

---

### 🗣️ Step 4: Autonomous Cart Mutation via Tool-Use
**Action**: In the chat box, type: **"Add the AeroTrack Lightweight running shoes to my cart"** and press Enter.

**What to Say Aloud**:
> *"Now for the real agentic capability: autonomous actions.*
> 
> *I simply ask the assistant to add the shoes to my cart. Claude calls the `add_to_cart` tool, securely updates the database cart session, and the frontend cart badge increments instantly.*
> 
> *No navigating away, no hunting for buttons—the agent handles the transaction directly within the conversation stream."*

---

### 🗣️ Step 5: Abandoned Cart Detection & AI Retention Nudge
**Action**: Click the **Cart** icon in the navigation to open the Cart Page. Click the **"Simulate Idle Nudge"** button (or let it detect idle state).

**What to Say Aloud**:
> *"Cart abandonment is the single biggest revenue leak in e-commerce, averaging nearly 70% industry-wide.*
> 
> *Our platform actively monitors user session activity. When two minutes of inactivity occur with items in the cart, our background service triggers a personalized AI nudge banner.*
> 
> *The agent presents a compelling summary of the items in Sophia's cart and offers a 10% recovery coupon code—`CART10`. Let's apply that coupon and proceed to checkout."*

---

### 🗣️ Step 6: Checkout & Executive Analytics Dashboard
**Action**: 
1. Click **Proceed to Checkout**, complete the simulated Razorpay payment flow, and observe the success screen.
2. Click the user menu in the top right, select **Admin Analytics Dashboard** (or switch to **Elena Vance (Admin)**).
3. Walk through the **Headline Metrics**, the **Conversion Trend Chart**, the **Top Recommendations Table**, and the **Conversation Log Viewer**.

**What to Say Aloud**:
> *"We complete checkout with our integrated Razorpay payment gateway simulation, which securely verifies signatures on the backend.*
> 
> *Now, let's look at the business impact. Switching to our Administrator account, we unlock the **Admin Analytics & Telemetry Dashboard**.*
> 
> *If a non-admin attempts to view this, our backend strictly enforces **HTTP 403 Forbidden**.*
> 
> *As admins, we see real-time business telemetry:
> - **Conversion Rate** computed as paid orders over unique product viewers.
> - **Cart Abandonment Rate** tracked over time.
> - And crucially, our **Agent-Assisted vs. Self-Service Ratio**, which mathematically proves that orders influenced by AI recommendations generate higher conversion rates and larger average order values.*
> 
> *We can also inspect every agent conversation turn, reviewing tool execution logs and payload latencies.*
> 
> *Thank you! I'm happy to take any questions."*
