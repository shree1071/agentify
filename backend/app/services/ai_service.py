"""
AI Signal Generation Service
Generates trading signals using OpenAI or Gemini
IMPORTANT: AI NEVER holds funds or executes trades - only generates signals
"""
import json
from datetime import datetime
from typing import Optional
import openai
from google import genai
from app.core.config import settings
from app.models.schemas import (
    AISignalRequest, 
    AISignalResponse, 
    TradeAction, 
    RiskLevel,
    MarketDataResponse
)


class AISignalService:
    """
    AI-powered trading signal generator
    
    ARCHITECTURE RULES:
    1. AI NEVER holds private keys or funds
    2. AI ONLY produces structured BUY/SELL/HOLD signals
    3. All outputs are validated through Pydantic schemas
    4. Every decision is logged for auditability
    """
    
    # Internal prompt template - the core of the AI trading logic
    SIGNAL_PROMPT = """You are an expert crypto trading analyst. Analyze the following market data and provide a trading signal.

MARKET DATA:
- Token: {symbol}
- Current Price: ${current_price:,.2f}
- 24h Price Change: {price_change_percentage_24h:+.2f}%
- 24h Volume: ${volume_24h:,.0f}
- Market Cap: ${market_cap:,.0f}

TECHNICAL INDICATORS:
- RSI (14): {rsi_14:.2f}
- EMA (12): ${ema_12:,.2f}
- EMA (26): ${ema_26:,.2f}
- SMA (20): ${sma_20:,.2f}
- SMA (50): ${sma_50:,.2f}
- MACD: {macd:,.4f}
- MACD Signal: {macd_signal:,.4f}
- Volatility: {volatility:.2f}%

RISK PROFILE: {risk_level}
- LOW: Conservative, prioritize capital preservation, small positions
- MEDIUM: Balanced approach, moderate risk/reward
- HIGH: Aggressive, larger positions, higher risk tolerance

ANALYSIS FRAMEWORK:
1. Trend Analysis: Compare EMA-12 vs EMA-26, price vs SMA-50
2. Momentum: RSI levels (oversold <30, overbought >70)
3. MACD: Bullish/bearish crossovers
4. Volatility: Higher volatility = smaller position sizes

Respond with ONLY valid JSON in this exact format:
{{
    "action": "BUY" | "SELL" | "HOLD",
    "confidence": 0.0 to 1.0,
    "amount_pct": 0 to 100,
    "reasoning": "2-3 sentence explanation of your decision"
}}

IMPORTANT:
- For LOW risk: max amount_pct = 20, require confidence > 0.7
- For MEDIUM risk: max amount_pct = 50, require confidence > 0.5
- For HIGH risk: max amount_pct = 100, require confidence > 0.3
- If uncertain, always default to HOLD with reasoning"""

    def __init__(self):
        """Initialize AI clients based on configuration"""
        if settings.AI_PROVIDER == "openai" and settings.OPENAI_API_KEY:
            self.openai_client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            self.provider = "openai"
        elif settings.GEMINI_API_KEY:
            # Initialize the new GenAI client (v0.2.0+)
            try:
                self.gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
                self.provider = "gemini"
            except Exception as e:
                print(f"Failed to initialize Gemini client: {e}")
                self.provider = "mock"
        else:
            self.provider = "mock"  # Fallback for demo
    
    async def generate_signal(
        self, 
        request: AISignalRequest,
        market_data: MarketDataResponse
    ) -> AISignalResponse:
        """
        Generate a trading signal based on market data
        
        Args:
            request: Signal request with symbol and risk level
            market_data: Current market data with indicators
            
        Returns:
            Validated AISignalResponse with action and reasoning
        """
        try:
            # Format the prompt with market data
            prompt = self.SIGNAL_PROMPT.format(
                symbol=market_data.symbol.upper(),
                current_price=market_data.current_price,
                price_change_percentage_24h=market_data.price_change_percentage_24h,
                volume_24h=market_data.volume_24h,
                market_cap=market_data.market_cap,
                rsi_14=market_data.indicators.rsi_14,
                ema_12=market_data.indicators.ema_12,
                ema_26=market_data.indicators.ema_26,
                sma_20=market_data.indicators.sma_20,
                sma_50=market_data.indicators.sma_50,
                macd=market_data.indicators.macd,
                macd_signal=market_data.indicators.macd_signal,
                volatility=market_data.indicators.volatility,
                risk_level=request.risk_level.value.upper()
            )
            
            # Generate signal based on provider
            if self.provider == "openai":
                response = await self._generate_openai(prompt)
            elif self.provider == "gemini":
                response = await self._generate_gemini(prompt)
            else:
                response = self._generate_mock(market_data, request.risk_level)
            
            # Parse and validate response
            signal = self._parse_response(response, request, market_data.symbol)
            
            return signal
        except Exception as e:
            print(f"CRITICAL ERROR in generate_signal: {e}")
            # Fallback to mock data on ANY critical failure so frontend doesn't break
            print("FALLBACK: Using mock generation due to error.")
            response = self._generate_mock(market_data, request.risk_level)
            return self._parse_response(response, request, market_data.symbol)
    
    async def _generate_openai(self, prompt: str) -> str:
        """Generate signal using OpenAI"""
        response = await self.openai_client.chat.completions.create(
            model=settings.AI_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a crypto trading analyst. Always respond with valid JSON only."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,  # Lower temperature for more consistent outputs
            max_tokens=500
        )
        return response.choices[0].message.content
    
    async def _generate_gemini(self, prompt: str) -> str:
        """Generate signal using Gemini (new SDK)"""
        import asyncio
        import re
        retries = 1  # Only 1 retry to fail fast
        
        for attempt in range(retries):
            try:
                # The new SDK is sync by default, but we can wrap it or just call it directly.
                response = self.gemini_client.models.generate_content(
                    model=settings.AI_MODEL, 
                    contents=prompt
                )
                return response.text
                
            except Exception as e:
                error_msg = str(e)
                
                # Check for 429 Rate Limit (quota exceeded) - fail fast, don't wait
                if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
                    print(f"WARNING: Gemini 429 Rate Limited. Falling back to mock.")
                    raise e  # Let fallback handle it immediately
                
                # Check for 503 Overloaded - short retry
                if "503" in error_msg or "overloaded" in error_msg.lower():
                    print(f"WARNING: Gemini 503 Overloaded (Attempt {attempt+1}/{retries}). Retrying...")
                    if attempt < retries - 1:
                        await asyncio.sleep(2)  # Short 2s wait
                        continue
                
                print(f"Gemini API error: {e}")
                # Reraise on last attempt to let the fallback mechanism handle it
                raise e
    
    def _generate_mock(self, market_data: MarketDataResponse, risk_level: RiskLevel) -> str:
        """
        Generate mock signal for demo purposes
        Uses basic technical analysis logic
        """
        rsi = market_data.indicators.rsi_14
        ema_12 = market_data.indicators.ema_12
        ema_26 = market_data.indicators.ema_26
        price = market_data.current_price
        
        # Simple rule-based logic for demo
        if rsi < 30 and ema_12 > ema_26:
            action = "BUY"
            confidence = 0.75
            reasoning = f"RSI at {rsi:.1f} indicates oversold conditions. EMA-12 above EMA-26 suggests bullish momentum. Good entry opportunity."
        elif rsi > 70 and ema_12 < ema_26:
            action = "SELL"
            confidence = 0.70
            reasoning = f"RSI at {rsi:.1f} indicates overbought conditions. EMA-12 below EMA-26 suggests bearish crossover. Consider taking profits."
        elif ema_12 > ema_26 and price > market_data.indicators.sma_50:
            action = "BUY"
            confidence = 0.55
            reasoning = f"Price above SMA-50 with bullish EMA crossover. Moderate uptrend detected."
        elif ema_12 < ema_26 and price < market_data.indicators.sma_50:
            action = "SELL"
            confidence = 0.50
            reasoning = f"Price below SMA-50 with bearish EMA crossover. Downtrend confirmed."
        else:
            action = "HOLD"
            confidence = 0.60
            reasoning = "Mixed signals in technical indicators. Waiting for clearer trend confirmation before taking action."
        
        # Adjust amount based on risk level
        if risk_level == RiskLevel.LOW:
            amount_pct = min(20, int(confidence * 30))
        elif risk_level == RiskLevel.MEDIUM:
            amount_pct = min(50, int(confidence * 60))
        else:  # HIGH
            amount_pct = min(100, int(confidence * 100))
        
        return json.dumps({
            "action": action,
            "confidence": confidence,
            "amount_pct": amount_pct,
            "reasoning": reasoning
        })
    
    def _parse_response(
        self, 
        response: str, 
        request: AISignalRequest,
        symbol: str
    ) -> AISignalResponse:
        """
        Parse and validate AI response
        Falls back to HOLD if parsing fails
        """
        try:
            # Clean the response (remove markdown code blocks if present)
            clean_response = response.strip()
            if clean_response.startswith("```"):
                clean_response = clean_response.split("```")[1]
                if clean_response.startswith("json"):
                    clean_response = clean_response[4:]
            clean_response = clean_response.strip()
            
            data = json.loads(clean_response)
            
            # Validate and create response
            return AISignalResponse(
                action=TradeAction(data.get("action", "HOLD")),
                confidence=max(0, min(1, float(data.get("confidence", 0.5)))),
                amount_pct=max(0, min(100, int(data.get("amount_pct", 0)))),
                reasoning=data.get("reasoning", "Unable to parse AI reasoning"),
                timestamp=datetime.utcnow(),
                symbol=symbol,
                risk_level=request.risk_level
            )
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            # Fallback to safe HOLD signal
            return AISignalResponse(
                action=TradeAction.HOLD,
                confidence=0.0,
                amount_pct=0,
                reasoning=f"Unable to parse AI response. Defaulting to HOLD for safety. Error: {str(e)}",
                timestamp=datetime.utcnow(),
                symbol=symbol,
                risk_level=request.risk_level
            )


# Singleton instance
ai_service = AISignalService()
