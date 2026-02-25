# 🤖 AI Trading Agent - Full Stack DApp

Non-custodial AI-powered blockchain trading platform with paper trading and real-time analytics.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- MetaMask browser extension

---

## 📦 Installation

```powershell
# Clone and navigate to project
cd c:\Users\shree\Desktop\agentify

# Install backend dependencies
cd backend
python -m pip install -r requirements.txt
python -m pip install supabase

# Install frontend dependencies
cd ..\frontend
npm install
npm install @supabase/supabase-js

# Install contract dependencies
cd ..\contracts
npm install
```

---

## ⚙️ Configuration

### 1. Backend Configuration
Create/edit `backend/.env`:
```bash
GEMINI_API_KEY=your-gemini-key
ALCHEMY_API_KEY=your-alchemy-key
COINGECKO_API_KEY=your-coingecko-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Frontend Configuration
`frontend/.env.local` is already configured:
```bash
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=...
NEXT_PUBLIC_TRADING_AGENT_ADDRESS=0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e
NEXT_PUBLIC_SUPABASE_URL=https://pdhmplldrgotljbtzyfk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## 🏃 Running the Application

### Step 1: Start Hardhat Local Blockchain
```powershell
cd c:\Users\shree\Desktop\agentify\contracts
npx hardhat node
```
**Output**: 
- Blockchain running on `http://127.0.0.1:8545`
- 20 test accounts with 10,000 ETH each
- Keep this terminal open!

### Step 2: Start Backend API
```powershell
# New terminal window
cd c:\Users\shree\Desktop\agentify\backend
uvicorn app.main:app --reload
```
**Output**: 
- API running on `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`

### Step 3: Start Frontend
```powershell
# New terminal window
cd c:\Users\shree\Desktop\agentify\frontend
npm run dev
```
**Output**: 
- App running on `http://localhost:3001`
- Open in browser!

---

## 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3001 | Main trading dashboard |
| **Backend API** | http://localhost:8000 | FastAPI backend |
| **API Docs** | http://localhost:8000/docs | Swagger UI |
| **Blockchain** | http://127.0.0.1:8545 | Hardhat local network |
| **Supabase** | https://pdhmplldrgotljbtzyfk.supabase.co | Database dashboard |

---

## 🎮 Using the App

### 1. Connect MetaMask
- Click "Connect Wallet" in the app
- Import a Hardhat test account:
  - Copy private key from Hardhat terminal (when you started npx hardhat node)
  - MetaMask → Import Account → Paste private key
  - You now have 10,000 test ETH!

### 2. Add Localhost Network to MetaMask
- Network Name: `Hardhat Localhost`
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency Symbol: `ETH`

### 3. Start Trading
- Toggle "Paper Trading" mode OFF for real blockchain transactions
- Select token (ETH, BTC, SOL, etc.)
- Get AI trading signals
- Execute trades
- Track portfolio and performance

---

## 🗄️ Database Setup (Supabase)

### Create Tables
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select project: `pdhmplldrgotljbtzyfk`
3. Go to **SQL Editor**
4. Run these migrations in order:
   ```
   supabase/migrations/001_initial_schema.sql
   supabase/migrations/002_rls_policies.sql
   supabase/migrations/003_functions_and_triggers.sql
   ```

### Verify Setup
- Go to **Table Editor**
- You should see 8 tables: users, trades, ai_signals, portfolios, etc.

---

## 📁 Project Structure

```
agentify/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── main.py      # API entry point
│   │   ├── routers/     # API endpoints
│   │   └── services/    # Business logic
│   └── .env             # Backend config
│
├── frontend/            # Next.js frontend
│   ├── src/
│   │   ├── app/         # Pages & layouts
│   │   ├── components/  # React components
│   │   └── hooks/       # Custom hooks
│   └── .env.local       # Frontend config
│
├── contracts/           # Smart contracts
│   ├── contracts/       # Solidity files
│   ├── scripts/         # Deploy scripts
│   └── hardhat.config.js
│
└── supabase/            # Database
    └── migrations/      # SQL migrations
```

---

## 🛠️ Common Commands

### Development
```powershell
# Restart backend (after code changes)
cd backend
python -m uvicorn main:app --reload

# Restart frontend (after code changes)
cd frontend
npm run dev

# Reset Hardhat blockchain (clears all data)
cd contracts
# Ctrl+C to stop, then restart:
npx hardhat node
```

### Testing
```powershell
# Test AI signal generation
cd backend
python test_ai_signal.py

# Run frontend in production mode
cd frontend
npm run build
npm start
```

### Debugging
```powershell
# Check backend logs
# Look at terminal running uvicorn

# Check frontend build errors
cd frontend
npm run build

# Check Hardhat console
cd contracts
npx hardhat console --network localhost
```

---

## 🔑 Get Test ETH

### Hardhat Local Network (Default)
When you run `npx hardhat node`, you get 20 accounts with 10,000 ETH each.

**Import test account to MetaMask:**
1. Copy a private key from Hardhat terminal output
2. MetaMask → Import Account → Paste key
3. You now have 10,000 test ETH!

### Sepolia Testnet (Optional)
For more realistic testing:
1. Switch to Sepolia network in MetaMask
2. Get free testnet ETH:
   - https://sepoliafaucet.com/
   - https://www.infura.io/faucet/sepolia
3. Update contract addresses in `.env.local`

---

## 🚨 Troubleshooting

### "EADDRINUSE: address already in use 127.0.0.1:8545"
✅ **This is good!** Your Hardhat node is already running. No action needed.

### "pip is not recognized"
```powershell
# Try this instead:
python -m pip install supabase
```

### MetaMask shows $0.00
✅ **Normal for localhost!** Check your ETH balance (e.g., 9,802 ETH) - that's what matters.

### Next.js 404 errors during startup
⏳ **Just wait!** Next.js is compiling. Takes 30-90 seconds on first run.

### Backend "Module not found"
```powershell
cd backend
python -m pip install -r requirements.txt
python -m pip install supabase
```

---

## 🎯 Features

### ✅ Implemented
- 🔗 **Wallet Connection** - RainbowKit + WalletConnect
- 💰 **Real Balance Display** - Live ETH balance & USD value
- ⛽ **Gas Tracker** - Real-time Low/Standard/Fast gas prices
- 🤖 **AI Signals** - Gemini-powered trading recommendations
- 📊 **Price Charts** - Live crypto price charts
- 🔄 **Paper Trading** - Risk-free testing mode
- 💱 **Real Trading** - Execute trades on blockchain
- 🗄️ **Database** - Supabase for trades, signals, analytics
- 📈 **Portfolio Tracking** - Real-time balance updates
- 🌐 **Network Status** - Live block numbers

### 🚧 Coming Soon
- Transaction history from blockchain
- Advanced analytics dashboard
- Multi-token portfolio
- Trading strategies
- Performance metrics
- Pending transaction notifications

---

## 📚 Documentation

- **Setup Guide**: `supabase/SETUP.md`
- **Troubleshooting**: `TROUBLESHOOTING.md`
- **Next Steps**: `NEXT_STEPS.md`
- **API Docs**: http://localhost:8000/docs (when backend is running)

---

## 🔒 Security Notes

- ⚠️ **Service Role Key**: Never expose in frontend! Backend only.
- ✅ **Anon Key**: Safe for frontend use (with RLS enabled)
- 🔐 **Private Keys**: Never commit to Git! Use `.env` files.
- 🎭 **Localhost ETH**: Test money only - has no real value

---

## 📞 Support

Having issues? Check:
1. All 3 services are running (blockchain, backend, frontend)
2. Environment variables are set correctly
3. MetaMask is on correct network (Localhost 31337)
4. Hardhat node hasn't been reset (would lose deployed contracts)

---

## 🎉 You're Ready!

Start all three services, connect your wallet, and start trading! 🚀

**Happy Trading!** 💰
