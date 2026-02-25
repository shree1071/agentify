"""
Trade Service
Handles trade execution logic and logging.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from app.models.schemas import TradeAction, Trade

class TradeService:
    """
    Service for managing trades.
    
    Since this is a non-custodial agent, the actual execution happens on the frontend
    via smart contracts. This service is primarily for:
    1. Logging executed trades
    2. Tracking trade history
    3. verifying on-chain execution (future scope)
    """
    
    def __init__(self):
        # In a real app, this would connect to Supabase/Postgres
        # For now, we use an in-memory list or file
        self._trades: List[Trade] = []
        
    async def log_trade(self, trade_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Log a trade executed by the user on the frontend.
        """
        try:
            # Create trade record
            trade = {
                "id": len(self._trades) + 1,
                "symbol": trade_data.get("symbol"),
                "action": trade_data.get("action"),
                "amount": trade_data.get("amount"),
                "price": trade_data.get("price"),
                "tx_hash": trade_data.get("tx_hash"),
                "status": "CONFIRMED", # Assumed confirmed for now
                "timestamp": datetime.utcnow().isoformat()
            }
            
            self._trades.append(trade)
            print(f"Trade logged: {trade}")
            return trade
            
        except Exception as e:
            print(f"Error logging trade: {e}")
            return {"error": str(e)}

    async def get_trade_history(self, user_address: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get trade history, optionally filtered by user.
        """
        # In future, filter by user_address
        return self._trades
