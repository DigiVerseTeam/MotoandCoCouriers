import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Moto and Co Couriers",
  description: "Workshop support courier runtime for Brisbane suppliers to Gold Coast workshops."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU">
      <body>
        {children}
      </body>
    </html>
  );
}
