import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@ryy1109/web-components/theme.css";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Alkali",
  description:
    "Highly reactive productivity. Organize subjects, manage study tasks, and track progress.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
