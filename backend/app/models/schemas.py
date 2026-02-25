"""
Pydantic models for request/response schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from enum import Enum


class RiskLevel(str, Enum):
    """Risk level for trading decisions"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class TradeAction(str, Enum):
    """Possible trade actions"""
    BUY = "BUY"
    SELL = "SELL"
    HOLD = "HOLD"


class Trade(BaseModel):
    """Trade record"""
    id: int
    symbol: str
    action: TradeAction
    amount: float
    price: float
    tx_hash: Optional[str]
    status: str
    timestamp: datetime


# ============ Market Data Models ============

class MarketDataRequest(BaseModel):
    """Request for market data"""
    symbol: str = Field(..., description="Token symbol, e.g., 'ethereum'")
    days: int = Field(default=7, ge=1, le=365, description="Number of days of history")


class OHLCV(BaseModel):
    """OHLCV candlestick data"""
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float


class TechnicalIndicators(BaseModel):
    """Technical analysis indicators"""
    rsi_14: float = Field(..., ge=0, le=100, description="14-period RSI")
    ema_12: float = Field(..., description="12-period EMA")
    ema_26: float = Field(..., description="26-period EMA")
    sma_20: float = Field(..., description="20-period SMA")
    sma_50: float = Field(..., description="50-period SMA")
    volatility: float = Field(..., ge=0, description="Price volatility percentage")
    macd: float = Field(..., description="MACD line")
    macd_signal: float = Field(..., description="MACD signal line")


class MarketDataResponse(BaseModel):
    """Complete market data response"""
    symbol: str
    current_price: float
    price_change_24h: float
    price_change_percentage_24h: float
    volume_24h: float
    market_cap: float
    indicators: TechnicalIndicators
    ohlcv: list[OHLCV]


# ============ AI Signal Models ============

class AISignalRequest(BaseModel):
    """Request for AI trading signal"""
    symbol: str = Field(..., description="Token symbol")
    risk_level: RiskLevel = Field(default=RiskLevel.MEDIUM)
    user_address: Optional[str] = Field(None, description="User wallet address for logging")


class AISignalResponse(BaseModel):
    """AI trading signal response - strictly validated"""
    action: TradeAction = Field(..., description="Recommended action")
    confidence: float = Field(..., ge=0, le=1, description="Confidence score 0-1")
    amount_pct: int = Field(..., ge=0, le=100, description="Recommended trade amount as percentage")
    reasoning: str = Field(..., min_length=10, max_length=500, description="Human-readable explanation")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    symbol: str = Field(..., description="Token symbol analyzed")
    risk_level: RiskLevel = Field(..., description="Risk level used for analysis")


# ============ Trade Models ============

class TradeLogRequest(BaseModel):
    """Request to log a trade"""
    user_address: str = Field(..., description="User wallet address")
    tx_hash: Optional[str] = Field(None, description="Transaction hash (null for paper trades)")
    token_in: str = Field(..., description="Input token address")
    token_out: str = Field(..., description="Output token address")
    amount_in: str = Field(..., description="Input amount in wei")
    amount_out: str = Field(..., description="Output amount in wei")
    is_paper_trade: bool = Field(default=True, description="Whether this is a paper trade")
    ai_signal_id: Optional[str] = Field(None, description="Associated AI signal ID")


class TradeLogResponse(BaseModel):
    """Trade log response"""
    id: str
    user_address: str
    tx_hash: Optional[str]
    token_in: str
    token_out: str
    amount_in: str
    amount_out: str
    is_paper_trade: bool
    created_at: datetime


class TradeHistoryResponse(BaseModel):
    """Trade history for a user"""
    trades: list[TradeLogResponse]
    total_count: int
    paper_trade_count: int
    real_trade_count: int


# ============ Paper Trade Models ============

class PaperTradeBalance(BaseModel):
    """Paper trading balance"""
    token: str
    symbol: str
    balance: str
    usd_value: float


class PaperPortfolio(BaseModel):
    """Paper trading portfolio"""
    user_address: str
    balances: list[PaperTradeBalance]
    total_usd_value: float
    pnl_percentage: float
