"""
Supabase Database Service
Handles all database operations for trade logging and user data
"""
from datetime import datetime
from typing import Optional, List
from supabase import create_client, Client
from app.core.config import settings
from app.models.schemas import (
    TradeLogRequest, 
    TradeLogResponse, 
    TradeHistoryResponse,
    AISignalResponse,
    PaperPortfolio,
    PaperTradeBalance
)
import uuid


class DatabaseService:
    """Service for Supabase database operations"""
    
    def __init__(self):
        """Initialize Supabase client"""
        if settings.SUPABASE_URL and settings.SUPABASE_KEY:
            self.client: Client = create_client(
                settings.SUPABASE_URL, 
                settings.SUPABASE_KEY
            )
            self.enabled = True
        else:
            self.client = None
            self.enabled = False
            print("⚠️ Supabase not configured - using in-memory storage")
            # In-memory fallback for demo
            self._trades: List[dict] = []
            self._signals: List[dict] = []
            self._paper_balances: dict = {}
    
    async def log_trade(self, trade: TradeLogRequest) -> TradeLogResponse:
        """
        Log a trade to the database
        
        Args:
            trade: Trade details to log
            
        Returns:
            Created trade record
        """
        trade_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        trade_data = {
            "id": trade_id,
            "user_address": trade.user_address,
            "tx_hash": trade.tx_hash,
            "token_in": trade.token_in,
            "token_out": trade.token_out,
            "amount_in": trade.amount_in,
            "amount_out": trade.amount_out,
            "is_paper_trade": trade.is_paper_trade,
            "ai_signal_id": trade.ai_signal_id,
            "created_at": now.isoformat()
        }
        
        if self.enabled:
            table = "paper_trades" if trade.is_paper_trade else "trade_history"
            result = self.client.table(table).insert(trade_data).execute()
            return TradeLogResponse(**result.data[0])
        else:
            self._trades.append(trade_data)
            return TradeLogResponse(
                id=trade_id,
                user_address=trade.user_address,
                tx_hash=trade.tx_hash,
                token_in=trade.token_in,
                token_out=trade.token_out,
                amount_in=trade.amount_in,
                amount_out=trade.amount_out,
                is_paper_trade=trade.is_paper_trade,
                created_at=now
            )
    
    async def get_trade_history(
        self, 
        user_address: str,
        limit: int = 50,
        include_paper: bool = True
    ) -> TradeHistoryResponse:
        """
        Get trade history for a user
        
        Args:
            user_address: User's wallet address
            limit: Maximum number of trades to return
            include_paper: Whether to include paper trades
            
        Returns:
            Trade history with counts
        """
        if self.enabled:
            # Fetch real trades
            real_result = self.client.table("trade_history")\
                .select("*")\
                .eq("user_address", user_address)\
                .order("created_at", desc=True)\
                .limit(limit)\
                .execute()
            
            trades = [TradeLogResponse(**t) for t in real_result.data]
            real_count = len(real_result.data)
            
            # Fetch paper trades if requested
            paper_count = 0
            if include_paper:
                paper_result = self.client.table("paper_trades")\
                    .select("*")\
                    .eq("user_address", user_address)\
                    .order("created_at", desc=True)\
                    .limit(limit)\
                    .execute()
                paper_trades = [TradeLogResponse(**t) for t in paper_result.data]
                trades.extend(paper_trades)
                paper_count = len(paper_result.data)
            
            # Sort combined list by date
            trades.sort(key=lambda x: x.created_at, reverse=True)
            
            return TradeHistoryResponse(
                trades=trades[:limit],
                total_count=real_count + paper_count,
                paper_trade_count=paper_count,
                real_trade_count=real_count
            )
        else:
            # In-memory fallback
            user_trades = [
                t for t in self._trades 
                if t["user_address"] == user_address
            ]
            if not include_paper:
                user_trades = [t for t in user_trades if not t["is_paper_trade"]]
            
            paper_count = sum(1 for t in user_trades if t["is_paper_trade"])
            real_count = len(user_trades) - paper_count
            
            return TradeHistoryResponse(
                trades=[
                    TradeLogResponse(
                        id=t["id"],
                        user_address=t["user_address"],
                        tx_hash=t["tx_hash"],
                        token_in=t["token_in"],
                        token_out=t["token_out"],
                        amount_in=t["amount_in"],
                        amount_out=t["amount_out"],
                        is_paper_trade=t["is_paper_trade"],
                        created_at=datetime.fromisoformat(t["created_at"])
                    )
                    for t in user_trades[:limit]
                ],
                total_count=len(user_trades),
                paper_trade_count=paper_count,
                real_trade_count=real_count
            )
    
    async def log_ai_signal(self, signal: AISignalResponse, user_address: Optional[str] = None) -> str:
        """
        Log an AI signal for audit trail
        
        Args:
            signal: The AI-generated signal
            user_address: Optional user who requested the signal
            
        Returns:
            Signal ID
        """
        signal_id = str(uuid.uuid4())
        
        signal_data = {
            "id": signal_id,
            "user_address": user_address,
            "symbol": signal.symbol,
            "action": signal.action.value,
            "confidence": signal.confidence,
            "amount_pct": signal.amount_pct,
            "reasoning": signal.reasoning,
            "risk_level": signal.risk_level.value,
            "created_at": signal.timestamp.isoformat()
        }
        
        if self.enabled:
            self.client.table("ai_signals").insert(signal_data).execute()
        else:
            self._signals.append(signal_data)
        
        return signal_id
    
    async def get_paper_portfolio(self, user_address: str) -> PaperPortfolio:
        """
        Get paper trading portfolio for a user
        
        Args:
            user_address: User's wallet address
            
        Returns:
            Paper portfolio with balances
        """
        # Default starting balance for new users
        default_balances = [
            PaperTradeBalance(
                token="0x0000000000000000000000000000000000000000",
                symbol="ETH",
                balance="10000000000000000000",  # 10 ETH
                usd_value=25000.0
            ),
            PaperTradeBalance(
                token="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                symbol="USDC",
                balance="10000000000",  # 10,000 USDC
                usd_value=10000.0
            )
        ]
        
        if self.enabled:
            # Fetch from database
            result = self.client.table("paper_balances")\
                .select("*")\
                .eq("user_address", user_address)\
                .execute()
            
            if result.data:
                balances = [
                    PaperTradeBalance(**b) for b in result.data
                ]
            else:
                # Initialize with default balances
                for balance in default_balances:
                    self.client.table("paper_balances").insert({
                        "user_address": user_address,
                        **balance.model_dump()
                    }).execute()
                balances = default_balances
        else:
            # In-memory fallback
            if user_address not in self._paper_balances:
                self._paper_balances[user_address] = default_balances
            balances = self._paper_balances[user_address]
        
        total_value = sum(b.usd_value for b in balances)
        
        return PaperPortfolio(
            user_address=user_address,
            balances=balances,
            total_usd_value=total_value,
            pnl_percentage=0.0  # Calculate based on initial value
        )


# Singleton instance
db_service = DatabaseService()
