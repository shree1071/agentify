"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Zap, BarChart3, Shield } from "lucide-react";

interface HeaderProps {
    isPaperTrading: boolean;
    onTogglePaperTrading: () => void;
}

/**
 * Header Component
 * Contains logo, navigation, paper trading toggle, and wallet connection
 */
export function Header({ isPaperTrading, onTogglePaperTrading }: HeaderProps) {
    return (
        <header className="glass border-b border-dark-700 sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo and Title */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center animate-pulse-glow">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold gradient-text">AI Trading Agent</h1>
                            <p className="text-xs text-dark-400">Non-Custodial • AI-Powered</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center gap-6">
                        <a href="#" className="flex items-center gap-2 text-dark-300 hover:text-white transition-colors">
                            <BarChart3 className="w-4 h-4" />
                            Dashboard
                        </a>
                        <a href="#" className="flex items-center gap-2 text-dark-300 hover:text-white transition-colors">
                            <Shield className="w-4 h-4" />
                            Security
                        </a>
                    </nav>

                    {/* Controls */}
                    <div className="flex items-center gap-4">
                        {/* Paper Trading Toggle */}
                        <div className="flex items-center gap-3 bg-dark-800 rounded-lg px-4 py-2">
                            <span className={`text-sm ${isPaperTrading ? 'text-dark-400' : 'text-accent-green font-medium'}`}>
                                Real
                            </span>
                            <button
                                onClick={onTogglePaperTrading}
                                className={`relative w-12 h-6 rounded-full transition-colors ${isPaperTrading ? 'bg-primary-500' : 'bg-accent-green'
                                    }`}
                            >
                                <span
                                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isPaperTrading ? 'left-1' : 'left-7'
                                        }`}
                                />
                            </button>
                            <span className={`text-sm ${isPaperTrading ? 'text-primary-400 font-medium' : 'text-dark-400'}`}>
                                Paper
                            </span>
                        </div>

                        {/* Wallet Connect */}
                        <ConnectButton
                            accountStatus={{
                                smallScreen: "avatar",
                                largeScreen: "full",
                            }}
                            chainStatus="icon"
                            showBalance={{
                                smallScreen: false,
                                largeScreen: true,
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Paper Trading Banner */}
            {isPaperTrading && (
                <div className="bg-primary-500/20 border-t border-primary-500/30 py-2 text-center">
                    <p className="text-sm text-primary-300">
                        🧪 Paper Trading Mode - No real funds will be used
                    </p>
                </div>
            )}
        </header>
    );
}
