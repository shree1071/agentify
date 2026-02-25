// Type definitions for the AI Trading Agent

export interface AISignal {
    action: "BUY" | "SELL" | "HOLD";
    confidence: number;
    amount_pct: number;
    reasoning: string;
    timestamp: string;
    symbol: string;
    risk_level: RiskLevel;
}

export type RiskLevel = "low" | "medium" | "high";

export interface MarketData {
    symbol: string;
    current_price: number;
    price_change_24h: number;
    price_change_percentage_24h: number;
    volume_24h: number;
    market_cap: number;
    indicators: TechnicalIndicators;
    ohlcv: OHLCV[];
}

export interface TechnicalIndicators {
    rsi_14: number;
    ema_12: number;
    ema_26: number;
    sma_20: number;
    sma_50: number;
    volatility: number;
    macd: number;
    macd_signal: number;
}

export interface OHLCV {
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface Trade {
    id: string;
    user_address: string;
    tx_hash: string | null;
    token_in: string;
    token_out: string;
    amount_in: string;
    amount_out: string;
    is_paper_trade: boolean;
    created_at: string;
}

export interface PaperPortfolio {
    user_address: string;
    balances: PaperBalance[];
    total_usd_value: number;
    pnl_percentage: number;
}

export interface PaperBalance {
    token: string;
    symbol: string;
    balance: string;
    usd_value: number;
}
