import httpx
import pandas as pd
from datetime import datetime
from typing import Optional
from app.core.config import settings
from app.models.schemas import MarketDataResponse, TechnicalIndicators, OHLCV


class MarketDataService:
    """Service for fetching and processing market data"""
    
    COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3"
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        
    async def get_market_data(self, symbol: str, days: int = 7) -> MarketDataResponse:
        """
        Fetch market data and calculate technical indicators
        
        Args:
            symbol: Token ID (e.g., 'ethereum', 'bitcoin')
            days: Number of days of historical data
            
        Returns:
            MarketDataResponse with OHLCV and indicators
        """
        # Fetch current price data
        price_data = await self._fetch_price_data(symbol)
        
        # Fetch OHLC historical data
        ohlc_data = await self._fetch_ohlc_data(symbol, days)
        
        # Calculate technical indicators
        indicators = self._calculate_indicators(ohlc_data)
        
        # Convert OHLC to response format
        ohlcv_list = [
            OHLCV(
                timestamp=datetime.fromtimestamp(row['timestamp'] / 1000),
                open=row['open'],
                high=row['high'],
                low=row['low'],
                close=row['close'],
                volume=row.get('volume', 0)
            )
            for _, row in ohlc_data.iterrows()
        ]
        
        return MarketDataResponse(
            symbol=symbol,
            current_price=price_data['current_price'],
            price_change_24h=price_data['price_change_24h'],
            price_change_percentage_24h=price_data['price_change_percentage_24h'],
            volume_24h=price_data['total_volume'],
            market_cap=price_data['market_cap'],
            indicators=indicators,
            ohlcv=ohlcv_list
        )
    
    async def _fetch_price_data(self, symbol: str) -> dict:
        """Fetch current price data from CoinGecko"""
        url = f"{self.COINGECKO_BASE_URL}/coins/{symbol}"
        params = {
            "localization": "false",
            "tickers": "false",
            "market_data": "true",
            "community_data": "false",
            "developer_data": "false"
        }
        
        headers = {}
        if settings.COINGECKO_API_KEY:
            headers["x-cg-demo-api-key"] = settings.COINGECKO_API_KEY
            
        response = await self.client.get(url, params=params, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        market_data = data.get('market_data', {})
        return {
            'current_price': market_data.get('current_price', {}).get('usd', 0),
            'price_change_24h': market_data.get('price_change_24h', 0),
            'price_change_percentage_24h': market_data.get('price_change_percentage_24h', 0),
            'total_volume': market_data.get('total_volume', {}).get('usd', 0),
            'market_cap': market_data.get('market_cap', {}).get('usd', 0)
        }
    
    async def _fetch_ohlc_data(self, symbol: str, days: int) -> pd.DataFrame:
        """Fetch OHLC historical data from CoinGecko"""
        url = f"{self.COINGECKO_BASE_URL}/coins/{symbol}/ohlc"
        params = {"vs_currency": "usd", "days": days}
        
        headers = {}
        if settings.COINGECKO_API_KEY:
            headers["x-cg-demo-api-key"] = settings.COINGECKO_API_KEY
            
        response = await self.client.get(url, params=params, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        # Convert to DataFrame
        df = pd.DataFrame(data, columns=['timestamp', 'open', 'high', 'low', 'close'])
        
        # Fetch volume data separately (market_chart endpoint)
        volume_url = f"{self.COINGECKO_BASE_URL}/coins/{symbol}/market_chart"
        volume_params = {"vs_currency": "usd", "days": days}
        volume_response = await self.client.get(volume_url, params=volume_params, headers=headers)
        
        if volume_response.status_code == 200:
            volume_data = volume_response.json()
            volumes = volume_data.get('total_volumes', [])
            if volumes:
                volume_df = pd.DataFrame(volumes, columns=['timestamp', 'volume'])
                # Merge on closest timestamp
                df['volume'] = 0.0
                for i, row in df.iterrows():
                    closest_vol = min(volumes, key=lambda x: abs(x[0] - row['timestamp']))
                    df.at[i, 'volume'] = closest_vol[1]
        else:
            df['volume'] = 0.0
            
        return df
    
    def _calculate_indicators(self, df: pd.DataFrame) -> TechnicalIndicators:
        """Calculate technical analysis indicators manually using pandas"""
        if len(df) < 26:  # Minimum data needed for EMA-26
            return TechnicalIndicators(
                rsi_14=50.0,
                ema_12=df['close'].iloc[-1] if len(df) > 0 else 0,
                ema_26=df['close'].iloc[-1] if len(df) > 0 else 0,
                sma_20=df['close'].iloc[-1] if len(df) > 0 else 0,
                sma_50=df['close'].iloc[-1] if len(df) > 0 else 0,
                volatility=0.0,
                macd=0.0,
                macd_signal=0.0
            )
        
        close = df['close']
        
        # RSI Calculation
        delta = close.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        
        # EMA and SMA Calculation
        ema_12 = close.ewm(span=12, adjust=False).mean()
        ema_26 = close.ewm(span=26, adjust=False).mean()
        sma_20 = close.rolling(window=20).mean()
        sma_50 = close.rolling(window=min(50, len(df))).mean()
        
        # MACD Calculation
        macd_line = ema_12 - ema_26
        macd_signal = macd_line.ewm(span=9, adjust=False).mean()
        
        # Volatility (standard deviation of returns)
        returns = close.pct_change()
        volatility = returns.std() * 100
        
        return TechnicalIndicators(
            rsi_14=float(rsi.iloc[-1]) if not pd.isna(rsi.iloc[-1]) else 50.0,
            ema_12=float(ema_12.iloc[-1]),
            ema_26=float(ema_26.iloc[-1]),
            sma_20=float(sma_20.iloc[-1]) if not pd.isna(sma_20.iloc[-1]) else float(close.iloc[-1]),
            sma_50=float(sma_50.iloc[-1]) if not pd.isna(sma_50.iloc[-1]) else float(close.iloc[-1]),
            volatility=float(volatility) if not pd.isna(volatility) else 0.0,
            macd=float(macd_line.iloc[-1]),
            macd_signal=float(macd_signal.iloc[-1])
        )
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()


# Singleton instance
market_service = MarketDataService()
