import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./styles/globals.scss";

// Импортируем планировщик парсинга (запускается автоматически в production)
// parsingScheduler removed during cleanup

const montserrat = Montserrat({
  variable: "--font-app-sans",
  subsets: ["latin", "cyrillic"],
  weight: [
    "300",
    "400",
    "500",
    "600",
    "700",
    "800"
  ]
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
        className={`${montserrat.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
