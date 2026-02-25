import asyncio
import os
from dotenv import load_dotenv

# Load env from .env
load_dotenv()

from app.services.ai_service import AISignalService
from app.models.schemas import AISignalRequest, MarketDataResponse, RiskLevel

async def test_gemini():
    print(f"Testing Gemini integration with model: {os.getenv('AI_MODEL')}")
    service = AISignalService()
    
    request = AISignalRequest(
        symbol="ethereum",
        risk_level=RiskLevel.MEDIUM,
        user_address="0x1234567890123456789012345678901234567890"
    )
    
    # Mock market data for test
    market_data = MarketDataResponse(
        symbol="ethereum",
        current_price=2500.0,
        price_change_percentage_24h=2.5,
        volume_24h=1000000000,
        market_cap=300000000000,
        indicators={
            "rsi_14": 45.0,
            "ema_12": 2480.0,
            "ema_26": 2450.0,
            "sma_20": 2400.0,
            "sma_50": 2300.0,
            "macd": 10.0,
            "macd_signal": 5.0,
            "volatility": 1.5
        }
    )
    
    with open("test_result.txt", "w") as f:
        print("Generating signal...", file=f)
        try:
            signal = await service.generate_signal(request, market_data)
            print("\n=== AI SIGNAL RESULT ===", file=f)
            print(f"Action: {signal.action}", file=f)
            print(f"Confidence: {signal.confidence}", file=f)
            print(f"Amount %: {signal.amount_pct}%", file=f)
            print(f"Reasoning: {signal.reasoning}", file=f)
            print("========================\n", file=f)
            print("SUCCESS", file=f)
        except Exception as e:
            print(f"Error generating signal: {e}", file=f)

if __name__ == "__main__":
    asyncio.run(test_gemini())
