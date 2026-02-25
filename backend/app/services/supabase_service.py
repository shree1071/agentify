"""
Supabase Database Service
Handles all database operations for the trading platform
"""

import os
from typing import Optional, Dict, Any, List
from supabase import create_client, Client
from datetime import datetime

class SupabaseService:
    """Service class for Supabase database operations"""
    
    def __init__(self):
        """Initialize Supabase client"""
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
        
        self.client: Client = create_client(supabase_url, supabase_key)
    
    # =====================================================
    # USER OPERATIONS
    # =====================================================
    
    async def get_or_create_user(self, wallet_address: str, email: Optional[str] = None) -> Dict[str, Any]:
        """Get existing user or create new one"""
        # Try to find existing user
        result = self.client.table("users").select("*").eq("wallet_address", wallet_address).execute()
        
        if result.data:
            # Update last login
            self.client.table("users").update({
                "last_login_at": datetime.utcnow().isoformat()
            }).eq("wallet_address", wallet_address).execute()
            
            return result.data[0]
        
        # Create new user
        new_user = {
            "wallet_address": wallet_address,
            "email": email,
            "last_login_at": datetime.utcnow().isoformat()
        }
        
        result = self.client.table("users").insert(new_user).execute()
        return result.data[0]
    
    # =====================================================
    # TRADE OPERATIONS
    # =====================================================
    
    async def log_trade(self, trade_data: Dict[str, Any]) -> Dict[str, Any]:
        """Log a trade (paper or real)"""
        result = self.client.table("trades").insert(trade_data).execute()
        return result.data[0]
    
    async def update_trade_status(
        self, 
        trade_id: str, 
        status: str, 
        transaction_hash: Optional[str] = None,
        error_message: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update trade status"""
        update_data = {
            "status": status,
            "confirmed_at": datetime.utcnow().isoformat() if status == "confirmed" else None
        }
        
        if transaction_hash:
            update_data["transaction_hash"] = transaction_hash
        
        if error_message:
            update_data["error_message"] = error_message
        
        result = self.client.table("trades").update(update_data).eq("id", trade_id).execute()
        return result.data[0] if result.data else {}
    
    async def get_user_trades(
        self, 
        user_id: str, 
        limit: int = 50,
        is_paper_trade: Optional[bool] = None
    ) -> List[Dict[str, Any]]:
        """Get user's trade history"""
        query = self.client.table("trades").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit)
        
        if is_paper_trade is not None:
            query = query.eq("is_paper_trade", is_paper_trade)
        
        result = query.execute()
        return result.data
    
    # =====================================================
    # AI SIGNAL OPERATIONS
    # =====================================================
    
    async def save_ai_signal(self, signal_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save AI trading signal"""
        result = self.client.table("ai_signals").insert(signal_data).execute()
        return result.data[0]
    
    async def update_signal_execution(
        self,
        signal_id: str,
        execution_price: float,
        outcome: str,
        roi_percent: Optional[float] = None
    ) -> Dict[str, Any]:
        """Update signal with execution results"""
        update_data = {
            "is_executed": True,
            "execution_price": execution_price,
            "outcome": outcome,
            "executed_at": datetime.utcnow().isoformat()
        }
        
        if roi_percent is not None:
            update_data["roi_percent"] = roi_percent
        
        result = self.client.table("ai_signals").update(update_data).eq("id", signal_id).execute()
        return result.data[0] if result.data else {}
    
    async def get_active_signals(self, user_id: Optional[str] = None, symbol: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get active AI signals"""
        query = self.client.table("ai_signals").select("*").eq("is_executed", False).gt("expires_at", datetime.utcnow().isoformat())
        
        if user_id:
            query = query.eq("user_id", user_id)
        
        if symbol:
            query = query.eq("symbol", symbol)
        
        result = query.order("created_at", desc=True).execute()
        return result.data
    
    # =====================================================
    # PORTFOLIO OPERATIONS
    # =====================================================
    
    async def snapshot_portfolio(self, portfolio_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save portfolio snapshot"""
        result = self.client.table("portfolios").insert(portfolio_data).execute()
        return result.data[0]
    
    async def get_portfolio_history(self, user_id: str, limit: int = 30) -> List[Dict[str, Any]]:
        """Get portfolio history for charts"""
        result = self.client.table("portfolios").select("*").eq("user_id", user_id).order("snapshot_at", desc=True).limit(limit).execute()
        return result.data
    
    # =====================================================
    # ANALYTICS OPERATIONS
    # =====================================================
    
    async def calculate_performance_metrics(self, user_id: str, period_type: str = "monthly") -> Dict[str, Any]:
        """Calculate and store performance metrics"""
        # This would typically call a PostgreSQL function
        result = self.client.rpc("calculate_performance_metrics", {
            "p_user_id": user_id,
            "p_period_type": period_type
        }).execute()
        
        return result.data
    
    async def get_win_rate(self, user_id: str, days: int = 30) -> float:
        """Get user's win rate"""
        result = self.client.rpc("calculate_win_rate", {
            "p_user_id": user_id,
            "p_period_days": days
        }).execute()
        
        return result.data if result.data else 0.0
    
    # =====================================================
    # AUDIT LOG OPERATIONS
    # =====================================================
    
    async def log_action(
        self,
        user_id: str,
        action_type: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        action_details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ) -> Dict[str, Any]:
        """Log user action for audit trail"""
        log_data = {
            "user_id": user_id,
            "action_type": action_type,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "action_details": action_details,
            "ip_address": ip_address
        }
        
        result = self.client.table("audit_logs").insert(log_data).execute()
        return result.data[0]


# Global instance
supabase_service = SupabaseService()
