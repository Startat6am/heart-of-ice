import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Heart of Ice", description: "Heart of Ice — interactive reading experience." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
