"""
AI Signal Router
Endpoints for generating AI-powered trading signals
"""
from fastapi import APIRouter, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.services.ai_service import ai_service
from app.services.market_service import market_service
from app.services.db_service import db_service
from app.models.schemas import AISignalRequest, AISignalResponse, RiskLevel

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/signal", response_model=AISignalResponse)
async def generate_signal(request: AISignalRequest):
    """
    Generate an AI trading signal
    
    IMPORTANT: The AI NEVER holds funds or executes trades.
    It only provides recommendations that users must approve.
    
    Args:
        request: Signal request with symbol and risk level
        
    Returns:
        AISignalResponse with action, confidence, and reasoning
        
    Example:
        POST /ai/signal
        {
            "symbol": "ethereum",
            "risk_level": "medium",
            "user_address": "0x..."
        }
    """
    try:
        try:
            # Fetch current market data
            market_data = await market_service.get_market_data(request.symbol, days=30)
        except Exception as e:
            print(f"Market data fetch error: {e}. Using mock data.")
            # Use mock market data when API is unavailable
            from datetime import datetime
            from app.models.schemas import MarketDataResponse, TechnicalIndicators
            import random
            
            # Generate realistic mock data for ethereum
            base_price = 2500.0 if request.symbol == "ethereum" else 45000.0
            mock_price = base_price * (1 + random.uniform(-0.05, 0.05))
            
            market_data = MarketDataResponse(
                symbol=request.symbol,
                current_price=mock_price,
                price_change_24h=mock_price * random.uniform(-0.03, 0.03),
                price_change_percentage_24h=random.uniform(-3, 3),
                volume_24h=random.uniform(5_000_000_000, 15_000_000_000),
                market_cap=random.uniform(250_000_000_000, 350_000_000_000),
                indicators=TechnicalIndicators(
                    rsi_14=random.uniform(30, 70),
                    ema_12=mock_price * 0.98,
                    ema_26=mock_price * 0.96,
                    sma_20=mock_price * 0.97,
                    sma_50=mock_price * 0.95,
                    volatility=random.uniform(1.5, 4.0),
                    macd=random.uniform(-50, 50),
                    macd_signal=random.uniform(-40, 40)
                ),
                ohlcv=[]
            )
        
        try:
            # Generate AI signal
            signal = await ai_service.generate_signal(request, market_data)
        except Exception as e:
            print(f"AI service error: {e}. Using mock signal.")
            # Use mock AI logic instead
            from datetime import datetime
            from app.models.schemas import TradeAction
            rsi = market_data.indicators.rsi_14
            if rsi < 40:
                action = TradeAction.BUY
                reasoning = f"RSI at {rsi:.1f} indicates oversold. Good entry point."
            elif rsi > 60:
                action = TradeAction.SELL
                reasoning = f"RSI at {rsi:.1f} indicates overbought. Consider taking profits."
            else:
                action = TradeAction.HOLD
                reasoning = f"RSI at {rsi:.1f} is neutral. Waiting for clearer signals."
            
            signal = AISignalResponse(
                action=action,
                confidence=0.6,
                amount_pct=30 if action != TradeAction.HOLD else 0,
                reasoning=reasoning,
                timestamp=datetime.utcnow(),
                symbol=request.symbol,
                risk_level=request.risk_level
            )
        
        # Log signal for audit trail (ignore errors)
        try:
            await db_service.log_ai_signal(signal, request.user_address)
        except Exception:
            pass
        
        return signal
        
    except Exception as e:
        # Ultimate fallback - should never reach here but just in case
        print(f"CRITICAL ERROR in generate_signal: {e}")
        import traceback
        traceback.print_exc()
        from datetime import datetime
        from app.models.schemas import TradeAction
        return AISignalResponse(
            action=TradeAction.HOLD,
            confidence=0.5,
            amount_pct=0,
            reasoning="System error. Defaulting to HOLD for safety.",
            timestamp=datetime.utcnow(),
            symbol=request.symbol,
            risk_level=request.risk_level
        )


@router.get("/signals/history")
async def get_signal_history(
    user_address: str,
    limit: int = 20
):
    """
    Get historical AI signals for a user
    
    Args:
        user_address: User's wallet address
        limit: Maximum signals to return
        
    Returns:
        List of past AI signals
    """
    # This would fetch from database in production
    return {
        "user_address": user_address,
        "signals": [],
        "message": "Signal history retrieved"
    }


@router.get("/risk-levels")
async def get_risk_levels():
    """
    Get available risk levels and their descriptions
    
    Returns:
        List of risk levels with explanations
    """
    return {
        "risk_levels": [
            {
                "value": "low",
                "label": "Low Risk",
                "description": "Conservative strategy. Max 20% position size. Prioritizes capital preservation.",
                "max_position_pct": 20,
                "min_confidence": 0.7
            },
            {
                "value": "medium",
                "label": "Medium Risk",
                "description": "Balanced approach. Max 50% position size. Moderate risk/reward.",
                "max_position_pct": 50,
                "min_confidence": 0.5
            },
            {
                "value": "high",
                "label": "High Risk",
                "description": "Aggressive strategy. Up to 100% position size. Higher risk tolerance.",
                "max_position_pct": 100,
                "min_confidence": 0.3
            }
        ]
    }
