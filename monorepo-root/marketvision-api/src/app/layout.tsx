import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./styles/globals.scss";

// Импортируем планировщик парсинга (запускается автоматически в production)
import "./services/parsingScheduler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MarketVision - Аналитика цен",
  description: "Мониторинг цен на компьютерные комплектующие и электронику",
  keywords: "цены, мониторинг, компьютерные комплектующие, электроника, аналитика",
  authors: [{ name: "MarketVision Team" }],
  openGraph: {
    title: "MarketVision - Аналитика цен",
    description: "Мониторинг цен на компьютерные комплектующие и электронику",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
