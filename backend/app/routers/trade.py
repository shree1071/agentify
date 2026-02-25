from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from app.services.trade_service import TradeService
from app.services.supabase_service import supabase_service
from datetime import datetime
import uuid

router = APIRouter(
    tags=["trade"],
    responses={404: {"description": "Not found"}},
)

trade_service = TradeService()


class TradeLogRequest(BaseModel):
    """Simple trade log request from frontend"""
    symbol: str
    action: str
    amount: float
    price: float
    tx_hash: str
    user_address: str


@router.post("/log")
async def log_trade(request: TradeLogRequest):
    """Log a confirmed trade from the frontend (simple endpoint)"""
    result = await trade_service.log_trade(request.dict())
    return {"success": True, "trade": result}


@router.get("/history")
async def get_history(user_address: Optional[str] = None):
    """Get trade history"""
    trades = await trade_service.get_trade_history(user_address)
    return {"success": True, "trades": trades, "count": len(trades)}

class PaperTradeRequest(BaseModel):
    user_address: str
    token_in: str
    token_out: str
    amount_in: str
    amount_out: str
    is_paper_trade: bool = True

class RealTradeRequest(BaseModel):
    user_address: str
    token_in_address: str
    token_in_symbol: str
    token_out_address: str
    token_out_symbol: str
    amount_in: str
    amount_out: str
    transaction_hash: str
    trade_direction: str
    slippage_percent: Optional[float] = 0.5
    gas_fee_eth: Optional[str] = None
    gas_fee_usd: Optional[float] = None
    ai_signal_id: Optional[str] = None

@router.post("/paper")
async def execute_paper_trade(request: PaperTradeRequest):
    """Execute and log a paper trade (simulated)"""
    try:
        # Get or create user
        user = await supabase_service.get_or_create_user(request.user_address)
        
        # Create trade record
        trade_data = {
            "user_id": user["id"],
            "is_paper_trade": True,
            "trade_direction": "buy" if "USDC" in request.token_in else "sell",
            "token_in_address": request.token_in,
            "token_in_symbol": "USDC" if "USDC" in request.token_in else "ETH",
            "token_out_address": request.token_out,
            "token_out_symbol": "ETH" if "ETH" in request.token_out else "USDC",
            "amount_in": request.amount_in,
            "amount_out": request.amount_out,
            "status": "confirmed",
            "executed_at": datetime.utcnow().isoformat(),
            "confirmed_at": datetime.utcnow().isoformat()
        }
        
        # Save to database
        saved_trade = await supabase_service.log_trade(trade_data)
        
        return {
            "success": True,
            "message": "Paper trade executed successfully",
            "trade_id": saved_trade["id"],
            "trade": saved_trade
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log paper trade: {str(e)}")

@router.post("/real")
async def log_real_trade(request: RealTradeRequest):
    """Log a confirmed real trade from blockchain"""
    try:
        # Get or create user
        user = await supabase_service.get_or_create_user(request.user_address)
        
        # Create trade record
        trade_data = {
            "user_id": user["id"],
            "transaction_hash": request.transaction_hash,
            "is_paper_trade": False,
            "trade_direction": request.trade_direction,
            "token_in_address": request.token_in_address,
            "token_in_symbol": request.token_in_symbol,
            "token_out_address": request.token_out_address,
            "token_out_symbol": request.token_out_symbol,
            "amount_in": request.amount_in,
            "amount_out": request.amount_out,
            "slippage_percent": request.slippage_percent,
            "status": "confirmed",
            "executed_at": datetime.utcnow().isoformat(),
            "confirmed_at": datetime.utcnow().isoformat()
        }
        
        if request.gas_fee_eth:
            trade_data["gas_fee_eth"] = request.gas_fee_eth
        
        if request.gas_fee_usd:
            trade_data["gas_fee_usd"] = request.gas_fee_usd
        
        if request.ai_signal_id:
            trade_data["ai_signal_id"] = request.ai_signal_id
        
        # Save to database
        saved_trade = await supabase_service.log_trade(trade_data)
        
        # Log audit trail
        await supabase_service.log_action(
            user_id=user["id"],
            action_type="trade_executed",
            resource_type="trade",
            resource_id=saved_trade["id"],
            action_details={
                "transaction_hash": request.transaction_hash,
                "direction": request.trade_direction,
                "amount": request.amount_in
            }
        )
        
        return {
            "success": True,
            "message": "Trade logged successfully",
            "trade_id": saved_trade["id"],
            "trade": saved_trade
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log trade: {str(e)}")

@router.get("/history/{user_address}")
async def get_trade_history(user_address: str, limit: int = 50, is_paper: Optional[bool] = None):
    """Get trade history for a user"""
    try:
        # Get user
        user = await supabase_service.get_or_create_user(user_address)
        
        # Get trades
        trades = await supabase_service.get_user_trades(
            user_id=user["id"],
            limit=limit,
            is_paper_trade=is_paper
        )
        
        return {
            "success": True,
            "trades": trades,
            "count": len(trades)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch trades: {str(e)}")
