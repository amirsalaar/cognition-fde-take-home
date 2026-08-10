import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flag Change-Control Plane",
  description: "Demo change-control console for virtual feature flags. Synthetic data only.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
