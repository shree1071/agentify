<div align="center">

# 🤖 Agentify — AI-Powered Blockchain Trading Platform

<p align="center">
  <img src="https://img.shields.io/badge/LangChain-Agents-1C3C3C?style=for-the-badge&logo=chainlink&logoColor=white" />
  <img src="https://img.shields.io/badge/Google_Gemini-AI_Brain-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js_15-Frontend-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Solidity-Smart_Contracts-363636?style=for-the-badge&logo=solidity&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
</p>

> **A non-custodial, AI-agent-powered DeFi trading platform** — where LangChain autonomous agents analyze on-chain data, generate real-time trading signals, and execute blockchain transactions, all without ever taking custody of user funds.

</div>

---

## ✨ What Makes This Different

Most trading bots are rule-based scripts. **Agentify uses LangChain AI agents** — autonomous, reasoning systems that can plan multi-step trading strategies, use tools dynamically, and adapt their decisions based on live market context. Think of it as giving a portfolio analyst a blockchain wallet and an always-on internet connection.

```
User Intent → LangChain Agent → [Tool: Price Feed] → [Tool: On-Chain Analysis]
                                       ↓
                              Reasoning & Signal Generation
                                       ↓
                    [Tool: Smart Contract Execution] → Trade Confirmed on Blockchain
```

---

## 🧠 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 15)                │
│  RainbowKit Wallet  │  Live Charts  │  AI Signal Dashboard  │
└────────────────────────────┬────────────────────────────────┘
                             │ REST / WebSocket
┌────────────────────────────▼────────────────────────────────┐
│                    BACKEND (FastAPI + LangChain)             │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │              LangChain Agent Executor               │  │
│   │                                                     │  │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │  │
│   │  │ CoinGecko│  │ Alchemy  │  │  Gemini LLM Core │  │  │
│   │  │  Tool    │  │  Tool    │  │  (Reasoning)     │  │  │
│   │  └──────────┘  └──────────┘  └──────────────────┘  │  │
│   │                                                     │  │
│   └─────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   Supabase    │  │  Hardhat / EVM   │  │  CoinGecko API   │
│  (Postgres)   │  │  Smart Contracts │  │  (Price Feeds)   │
└───────────────┘  └──────────────────┘  └──────────────────┘
```

---

## 🚀 Core Features

### 🤖 LangChain AI Agent System
- **Autonomous trading agents** built with LangChain's AgentExecutor and custom tool bindings
- Agents equipped with tools for live price fetching, on-chain data querying, and signal generation
- Multi-step reasoning: agents plan, evaluate, and adapt before committing to a signal
- Gemini Pro as the core LLM powering agent cognition

### ⛓️ Non-Custodial Blockchain Execution
- Smart contracts deployed on EVM-compatible chains (Hardhat local / Sepolia testnet)
- Users retain full control — private keys never leave the client
- RainbowKit + WalletConnect for seamless wallet integration
- Real-time gas estimation with Low / Standard / Fast tiers

### 📊 Trading Infrastructure
- **Paper Trading Mode** — risk-free simulation using live prices
- **Live Trading Mode** — direct smart contract execution via MetaMask
- Portfolio tracking with real-time P&L calculations
- Persistent trade history stored in Supabase (PostgreSQL with Row Level Security)

### 📡 Real-Time Data Pipeline
- Live crypto price charts via CoinGecko API
- On-chain block monitoring via Alchemy WebSocket subscriptions
- Sub-second gas price updates across fee tiers

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **AI Agents** | LangChain + Gemini Pro | Autonomous reasoning, tool use, signal generation |
| **Backend** | FastAPI (Python) | API server, agent orchestration |
| **Frontend** | Next.js 15, TypeScript | Trading dashboard, real-time UI |
| **Blockchain** | Solidity, Hardhat, ethers.js | Smart contracts, local devnet |
| **Wallet** | RainbowKit, WalletConnect | Non-custodial wallet integration |
| **Database** | Supabase (PostgreSQL) | Trade history, signals, portfolios |
| **Price Data** | CoinGecko API | Live market prices and OHLCV data |
| **Node Provider** | Alchemy | On-chain data, WebSocket streams |

---

## ⚙️ Local Setup

### Prerequisites

- Node.js 18+
- Python 3.8+
- MetaMask browser extension

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/agentify
cd agentify

# Backend (FastAPI + LangChain)
cd backend
pip install -r requirements.txt

# Frontend (Next.js)
cd ../frontend
npm install

# Smart Contracts (Hardhat)
cd ../contracts
npm install
```

### 2. Configure Environment

**`backend/.env`**
```env
GEMINI_API_KEY=your-gemini-key         # LLM powering the agents
ALCHEMY_API_KEY=your-alchemy-key       # On-chain data provider
COINGECKO_API_KEY=your-coingecko-key  # Price feed
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**`frontend/.env.local`** — pre-configured with Supabase and contract addresses.

### 3. Start All Services

**Terminal 1 — Local Blockchain**
```bash
cd contracts
npx hardhat node
# Spins up a local EVM with 20 accounts @ 10,000 ETH each
```

**Terminal 2 — AI Agent Backend**
```bash
cd backend
uvicorn app.main:app --reload
# API: http://localhost:8000
# Swagger: http://localhost:8000/docs
```

**Terminal 3 — Frontend**
```bash
cd frontend
npm run dev
# App: http://localhost:3001
```

---

## 🗄️ Database Setup (Supabase)

1. Open the [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **SQL Editor** in your project
3. Run migrations in order:
```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls_policies.sql
supabase/migrations/003_functions_and_triggers.sql
```

This creates 8 tables: `users`, `trades`, `ai_signals`, `portfolios`, and more — all secured with Row Level Security.

---

## 🦊 MetaMask Configuration

**Add Hardhat Local Network:**

| Field | Value |
|-------|-------|
| Network Name | `Hardhat Localhost` |
| RPC URL | `http://127.0.0.1:8545` |
| Chain ID | `31337` |
| Currency | `ETH` |

**Import a test wallet:**
Copy any private key from the Hardhat terminal output → MetaMask → Import Account. You'll have 10,000 test ETH to work with.

---

## 🗂️ Project Structure

```
agentify/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── agents/              # LangChain agent definitions & tool bindings
│   │   ├── routers/             # REST API endpoints
│   │   └── services/            # Price feeds, signal logic, portfolio mgmt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js App Router pages
│   │   ├── components/          # Dashboard, charts, wallet UI
│   │   └── hooks/               # Custom hooks (wallet, prices, signals)
│   └── .env.local
│
├── contracts/
│   ├── contracts/               # Solidity smart contracts
│   ├── scripts/                 # Deployment scripts
│   └── hardhat.config.js
│
└── supabase/
    └── migrations/              # SQL schema migrations
```

---

## 🔐 Security

- **Service Role Key** — backend only, never exposed to the client
- **Row Level Security** — all Supabase tables enforce per-user data isolation
- **Non-Custodial Design** — private keys never leave the user's MetaMask
- **Environment Variables** — all secrets via `.env` files, excluded from version control

---

## 🗺️ Roadmap

- [x] LangChain agent integration with Gemini Pro
- [x] Paper trading simulation mode
- [x] Real blockchain trade execution
- [x] Live price charts and gas tracking
- [x] Supabase persistence with RLS
- [ ] Multi-agent collaboration (analyst + executor agents)
- [ ] On-chain transaction history indexing
- [ ] Advanced agent memory with vector store (LangChain + pgvector)
- [ ] Multi-token portfolio with weighted rebalancing
- [ ] Backtesting engine for agent strategies

---

## 🧪 Testing

```bash
# Test AI agent signal generation
cd backend
python test_ai_signal.py

# Run frontend production build
cd frontend
npm run build && npm start

# Hardhat contract console
cd contracts
npx hardhat console --network localhost
```

---

## 🌐 Service Reference

| Service | URL |
|---------|-----|
| Frontend App | http://localhost:3001 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |
| Local Blockchain | http://127.0.0.1:8545 |

---

<div align="center">

**Built with LangChain · Gemini · Next.js · FastAPI · Solidity**

*Non-custodial. Agent-powered. On-chain.*

</div>
