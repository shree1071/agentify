-- Migration: Row Level Security Policies
-- Description: Sets up RLS policies for all tables

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can insert user (signup)" ON users
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- USER_SETTINGS TABLE POLICIES
-- =====================================================
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- AI_SIGNALS TABLE POLICIES
-- =====================================================
CREATE POLICY "Users can view own signals" ON ai_signals
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service can insert signals" ON ai_signals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own signals" ON ai_signals
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- TRADES TABLE POLICIES
-- =====================================================
CREATE POLICY "Users can view own trades" ON trades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades" ON trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades" ON trades
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- PORTFOLIOS TABLE POLICIES
-- =====================================================
CREATE POLICY "Users can view own portfolio" ON portfolios
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert portfolio snapshots" ON portfolios
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- PERFORMANCE_METRICS TABLE POLICIES
-- =====================================================
CREATE POLICY "Users can view own metrics" ON performance_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert metrics" ON performance_metrics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service can update metrics" ON performance_metrics
  FOR UPDATE USING (true);

-- =====================================================
-- TRADE_STRATEGIES TABLE POLICIES
-- =====================================================
CREATE POLICY "Users can view own strategies" ON trade_strategies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own strategies" ON trade_strategies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strategies" ON trade_strategies
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own strategies" ON trade_strategies
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- AUDIT_LOGS TABLE POLICIES
-- =====================================================
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);
