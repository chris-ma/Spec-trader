import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kronos Trading Signals",
  description: "Kronos-inspired signal dashboard for global shares and commodities",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased" style={{ background: 'var(--bg)', color: 'var(--dark)' }}>
        {children}
      </body>
    </html>
  );
}
