import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import FooterClient from "@/components/common/FooterClient";
import { AuthProvider } from "@/components/providers/AuthProvider";

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
  description: "Мониторинг цен на компьютерные комплектующие",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={montserrat.variable}>
        <AuthProvider>
          {children}
          <FooterClient />
        </AuthProvider>
      </body>
    </html>
  );
}
