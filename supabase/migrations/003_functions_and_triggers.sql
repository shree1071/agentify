-- Migration: Helper Functions and Triggers
-- Description: Creates utility functions for common operations

-- =====================================================
-- FUNCTION: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to user_settings
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to trade_strategies
CREATE TRIGGER update_trade_strategies_updated_at
  BEFORE UPDATE ON trade_strategies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Calculate win rate
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_win_rate(p_user_id UUID, p_period_days INTEGER DEFAULT 30)
RETURNS DECIMAL(5, 2) AS $$
DECLARE
  win_rate DECIMAL(5, 2);
BEGIN
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE (COUNT(*) FILTER (WHERE profit_loss_usd > 0) * 100.0) / COUNT(*)
    END INTO win_rate
  FROM trades
  WHERE user_id = p_user_id
    AND status = 'confirmed'
    AND is_paper_trade = false
    AND created_at > NOW() - (p_period_days || ' days')::INTERVAL;
  
  RETURN COALESCE(win_rate, 0);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Get user portfolio value
-- =====================================================
CREATE OR REPLACE FUNCTION get_portfolio_value(p_user_id UUID)
RETURNS DECIMAL(20, 8) AS $$
DECLARE
  portfolio_value DECIMAL(20, 8);
BEGIN
  SELECT total_value_usd INTO portfolio_value
  FROM portfolios
  WHERE user_id = p_user_id
  ORDER BY snapshot_at DESC
  LIMIT 1;
  
  RETURN COALESCE(portfolio_value, 0);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Log user action (audit trail)
-- =====================================================
CREATE OR REPLACE FUNCTION log_user_action(
  p_user_id UUID,
  p_action_type TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_action_details JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action_type,
    resource_type,
    resource_id,
    action_details,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_action_type,
    p_resource_type,
    p_resource_id,
    p_action_details,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Auto-create user settings on user insert
-- =====================================================
CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_settings_on_signup
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_user_settings();
