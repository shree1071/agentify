-- ===========================================
-- AI Trading Agent - Supabase Database Schema
-- ===========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- Users Table
-- ===========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    -- User preferences
    default_risk_level VARCHAR(10) DEFAULT 'medium' CHECK (default_risk_level IN ('low', 'medium', 'high')),
    max_trade_amount VARCHAR(78),  -- Max trade amount in wei
    paper_trading_enabled BOOLEAN DEFAULT true,
    
    -- Stats
    total_trades INTEGER DEFAULT 0,
    total_paper_trades INTEGER DEFAULT 0
);

-- Index for wallet lookups
CREATE INDEX idx_users_wallet ON users(wallet_address);

-- ===========================================
-- AI Signals Table (Audit Trail)
-- ===========================================
CREATE TABLE ai_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_address VARCHAR(42),
    symbol VARCHAR(50) NOT NULL,
    action VARCHAR(4) NOT NULL CHECK (action IN ('BUY', 'SELL', 'HOLD')),
    confidence DECIMAL(3, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    amount_pct INTEGER NOT NULL CHECK (amount_pct >= 0 AND amount_pct <= 100),
    reasoning TEXT NOT NULL,
    risk_level VARCHAR(10) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    
    -- Market data snapshot at signal time
    price_at_signal DECIMAL(20, 8),
    rsi_at_signal DECIMAL(5, 2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    -- Foreign key to users (optional - signals can be generated without login)
    FOREIGN KEY (user_address) REFERENCES users(wallet_address) ON DELETE SET NULL
);

-- Index for user signal history
CREATE INDEX idx_signals_user ON ai_signals(user_address);
CREATE INDEX idx_signals_created ON ai_signals(created_at DESC);
CREATE INDEX idx_signals_symbol ON ai_signals(symbol);

-- ===========================================
-- Trade History Table (Real Trades)
-- ===========================================
CREATE TABLE trade_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_address VARCHAR(42) NOT NULL,
    tx_hash VARCHAR(66) NOT NULL UNIQUE,
    
    -- Trade details
    token_in VARCHAR(42) NOT NULL,
    token_out VARCHAR(42) NOT NULL,
    amount_in VARCHAR(78) NOT NULL,  -- Wei as string for precision
    amount_out VARCHAR(78) NOT NULL,
    
    -- Associated AI signal
    ai_signal_id UUID REFERENCES ai_signals(id) ON DELETE SET NULL,
    
    -- Metadata
    chain_id INTEGER DEFAULT 11155111,  -- Sepolia
    block_number BIGINT,
    gas_used VARCHAR(78),
    
    is_paper_trade BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    FOREIGN KEY (user_address) REFERENCES users(wallet_address) ON DELETE CASCADE
);

-- Index for user trade history
CREATE INDEX idx_trades_user ON trade_history(user_address);
CREATE INDEX idx_trades_created ON trade_history(created_at DESC);
CREATE INDEX idx_trades_tx ON trade_history(tx_hash);

-- ===========================================
-- Paper Trades Table
-- ===========================================
CREATE TABLE paper_trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_address VARCHAR(42) NOT NULL,
    
    -- Trade details (no tx_hash for paper trades)
    token_in VARCHAR(42) NOT NULL,
    token_out VARCHAR(42) NOT NULL,
    amount_in VARCHAR(78) NOT NULL,
    amount_out VARCHAR(78) NOT NULL,
    
    -- Simulated price at trade time
    price_in DECIMAL(20, 8),
    price_out DECIMAL(20, 8),
    
    -- Associated AI signal
    ai_signal_id UUID REFERENCES ai_signals(id) ON DELETE SET NULL,
    
    is_paper_trade BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    FOREIGN KEY (user_address) REFERENCES users(wallet_address) ON DELETE CASCADE
);

-- Index for paper trades
CREATE INDEX idx_paper_trades_user ON paper_trades(user_address);
CREATE INDEX idx_paper_trades_created ON paper_trades(created_at DESC);

-- ===========================================
-- Paper Balances Table
-- ===========================================
CREATE TABLE paper_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_address VARCHAR(42) NOT NULL,
    token VARCHAR(42) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    balance VARCHAR(78) NOT NULL,  -- Wei as string
    usd_value DECIMAL(20, 2) DEFAULT 0,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(user_address, token),
    FOREIGN KEY (user_address) REFERENCES users(wallet_address) ON DELETE CASCADE
);

-- Index for balance lookups
CREATE INDEX idx_balances_user ON paper_balances(user_address);

-- ===========================================
-- Row Level Security (RLS)
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_balances ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
-- Users can only see their own data

CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address');

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address');

CREATE POLICY "Users can view own signals"
    ON ai_signals FOR SELECT
    USING (user_address = current_setting('request.jwt.claims')::json->>'wallet_address');

CREATE POLICY "Users can view own trades"
    ON trade_history FOR SELECT
    USING (user_address = current_setting('request.jwt.claims')::json->>'wallet_address');

CREATE POLICY "Users can view own paper trades"
    ON paper_trades FOR SELECT
    USING (user_address = current_setting('request.jwt.claims')::json->>'wallet_address');

CREATE POLICY "Users can view own balances"
    ON paper_balances FOR SELECT
    USING (user_address = current_setting('request.jwt.claims')::json->>'wallet_address');

-- ===========================================
-- Functions & Triggers
-- ===========================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_balances_updated_at
    BEFORE UPDATE ON paper_balances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Increment trade count trigger
CREATE OR REPLACE FUNCTION increment_trade_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_paper_trade THEN
        UPDATE users SET total_paper_trades = total_paper_trades + 1
        WHERE wallet_address = NEW.user_address;
    ELSE
        UPDATE users SET total_trades = total_trades + 1
        WHERE wallet_address = NEW.user_address;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_real_trade_count
    AFTER INSERT ON trade_history
    FOR EACH ROW
    EXECUTE FUNCTION increment_trade_count();

CREATE TRIGGER increment_paper_trade_count
    AFTER INSERT ON paper_trades
    FOR EACH ROW
    EXECUTE FUNCTION increment_trade_count();
