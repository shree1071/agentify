import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "AI Trading Agent | Non-Custodial Crypto Trading",
    description:
        "AI-powered crypto trading signals with full user control. Paper trade or execute real trades on Ethereum.",
    keywords: ["crypto", "trading", "AI", "blockchain", "ethereum", "defi"],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body className={inter.className}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
