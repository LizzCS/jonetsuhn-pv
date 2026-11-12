import type { Metadata } from "next";
import { Inter, Marcellus } from "next/font/google";
import "./globals.css";
import AppBar from "@/components/AppBar";
import Footer from "@/components/Footer";
import ChatbotButton from "@/components/ChatbotButton";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const marcellus = Marcellus({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-marcellus",
});

export const metadata: Metadata = {
  title: "Jonetsu Japanese Kitchen",
  description: "Cocina japonesa por pedido en San Pedro Sula.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body
        className={`${inter.variable} ${marcellus.variable} font-sans antialiased`}
      >
        <AppBar />
        <main>{children}</main>
        <Footer />
        <ChatbotButton />
      </body>
    </html>
  );
}
