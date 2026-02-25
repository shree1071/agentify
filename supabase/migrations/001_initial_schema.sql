-- Migration: Initial Schema Setup
-- Description: Creates all core tables for AI trading platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: users
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  email TEXT,
  username TEXT,
  avatar_url TEXT,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB
);

CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_referral ON users(referral_code);

-- =====================================================
-- TABLE: user_settings
-- =====================================================
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  max_trade_limit DECIMAL(20, 8),
  default_slippage DECIMAL(5, 2) DEFAULT 0.5,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')) DEFAULT 'medium',
  auto_trade_enabled BOOLEAN DEFAULT false,
  notification_preferences JSONB DEFAULT '{"email": true, "browser": true}',
  preferred_tokens TEXT[] DEFAULT ARRAY['ETH', 'USDC'],
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =====================================================
-- TABLE: ai_signals
-- =====================================================
CREATE TABLE ai_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Signal details
  symbol TEXT NOT NULL,
  signal_type TEXT CHECK (signal_type IN ('BUY', 'SELL', 'HOLD')) NOT NULL,
  confidence_score DECIMAL(5, 2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
  
  -- Recommendation
  entry_price DECIMAL(20, 8),
  target_price DECIMAL(20, 8),
  stop_loss DECIMAL(20, 8),
  recommended_position_size DECIMAL(20, 8),
  
  -- AI analysis
  reasoning TEXT,
  technical_indicators JSONB,
  sentiment_score DECIMAL(5, 2),
  risk_assessment TEXT CHECK (risk_assessment IN ('low', 'medium', 'high')),
  
  -- Performance
  is_executed BOOLEAN DEFAULT false,
  execution_price DECIMAL(20, 8),
  outcome TEXT CHECK (outcome IN ('profitable', 'loss', 'breakeven', 'pending')) DEFAULT 'pending',
  roi_percent DECIMAL(10, 4),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  
  -- Model info
  model_version TEXT,
  model_name TEXT DEFAULT 'gemini-pro',
  
  metadata JSONB
);

CREATE INDEX idx_signals_user ON ai_signals(user_id);
CREATE INDEX idx_signals_symbol ON ai_signals(symbol);
CREATE INDEX idx_signals_created ON ai_signals(created_at DESC);
CREATE INDEX idx_signals_type ON ai_signals(signal_type);

-- =====================================================
-- TABLE: trades
-- =====================================================
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Trade details
  transaction_hash TEXT,
  is_paper_trade BOOLEAN DEFAULT false,
  trade_direction TEXT CHECK (trade_direction IN ('buy', 'sell')) NOT NULL,
  
  -- Tokens
  token_in_address TEXT NOT NULL,
  token_in_symbol TEXT NOT NULL,
  token_out_address TEXT NOT NULL,
  token_out_symbol TEXT NOT NULL,
  
  -- Amounts
  amount_in DECIMAL(30, 18) NOT NULL,
  amount_out DECIMAL(30, 18) NOT NULL,
  expected_amount_out DECIMAL(30, 18),
  slippage_percent DECIMAL(5, 2),
  
  -- Pricing
  price_at_execution DECIMAL(20, 8),
  gas_fee_eth DECIMAL(20, 18),
  gas_fee_usd DECIMAL(20, 8),
  
  -- Status
  status TEXT CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled')) DEFAULT 'pending',
  error_message TEXT,
  
  -- Blockchain data
  block_number BIGINT,
  chain_id INTEGER DEFAULT 31337,
  
  -- AI signal reference
  ai_signal_id UUID REFERENCES ai_signals(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  
  -- Performance tracking
  profit_loss_usd DECIMAL(20, 8),
  profit_loss_percent DECIMAL(10, 4),
  
  metadata JSONB
);

CREATE INDEX idx_trades_user ON trades(user_id);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_created ON trades(created_at DESC);
CREATE INDEX idx_trades_tx_hash ON trades(transaction_hash) WHERE transaction_hash IS NOT NULL;
CREATE INDEX idx_trades_signal ON trades(ai_signal_id);

-- =====================================================
-- TABLE: portfolios
-- =====================================================
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Portfolio values
  total_value_usd DECIMAL(20, 8) NOT NULL,
  total_eth_balance DECIMAL(30, 18),
  total_token_balance_usd DECIMAL(20, 8),
  
  -- P&L
  total_pnl_usd DECIMAL(20, 8),
  total_pnl_percent DECIMAL(10, 4),
  daily_pnl_usd DECIMAL(20, 8),
  weekly_pnl_usd DECIMAL(20, 8),
  monthly_pnl_usd DECIMAL(20, 8),
  
  -- Asset breakdown
  holdings JSONB,
  
  -- Timestamp
  snapshot_at TIMESTAMPTZ DEFAULT NOW(),
  
  metadata JSONB
);

CREATE INDEX idx_portfolios_user ON portfolios(user_id);
CREATE INDEX idx_portfolios_snapshot ON portfolios(snapshot_at DESC);

-- =====================================================
-- TABLE: performance_metrics
-- =====================================================
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Period
  period_type TEXT CHECK (period_type IN ('daily', 'weekly', 'monthly', 'all_time')) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Trade stats
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  win_rate DECIMAL(5, 2),
  
  -- Financial metrics
  total_volume_usd DECIMAL(20, 8),
  total_pnl_usd DECIMAL(20, 8),
  avg_profit_per_trade DECIMAL(20, 8),
  max_drawdown_percent DECIMAL(10, 4),
  sharpe_ratio DECIMAL(10, 4),
  
  -- Risk metrics
  total_gas_fees_usd DECIMAL(20, 8),
  avg_slippage_percent DECIMAL(5, 2),
  
  -- Timestamps
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  metadata JSONB,
  
  UNIQUE(user_id, period_type, period_start)
);

CREATE INDEX idx_metrics_user ON performance_metrics(user_id);
CREATE INDEX idx_metrics_period ON performance_metrics(period_type, period_start);

-- =====================================================
-- TABLE: trade_strategies
-- =====================================================
CREATE TABLE trade_strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  strategy_type TEXT CHECK (strategy_type IN ('manual', 'ai_generated', 'hybrid')) DEFAULT 'manual',
  
  -- Strategy parameters
  rules JSONB,
  target_tokens TEXT[],
  max_position_size DECIMAL(20, 8),
  stop_loss_percent DECIMAL(5, 2),
  take_profit_percent DECIMAL(5, 2),
  
  -- Performance
  is_active BOOLEAN DEFAULT true,
  backtest_results JSONB,
  live_performance JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  metadata JSONB
);

CREATE INDEX idx_strategies_user ON trade_strategies(user_id);
CREATE INDEX idx_strategies_active ON trade_strategies(is_active) WHERE is_active = true;

-- =====================================================
-- TABLE: audit_logs
-- =====================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  
  -- Details
  action_details JSONB,
  ip_address INET,
  user_agent TEXT,
  
  -- Status
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action_type);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
