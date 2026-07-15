import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "星舰猎盘 · CPI Research", template: "%s" },
  description: "将宏观数据转译成可验证、可追溯的交易研究信号。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "星舰猎盘 · CPI Research",
    description: "CPI、FOMC 与就业研究舱：把宏观数据和政策变化转译成可追溯的交易信号。",
    type: "website",
    images: [{ url: "/og.png", width: 1734, height: 907, alt: "星舰猎盘 CPI Research" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "星舰猎盘 · CPI Research",
    description: "把宏观数据，转译成可交易的信号。",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
