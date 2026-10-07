import type { Metadata } from "next";
import "./globals.css";
import { GameProvider } from "./game-state";

export const metadata: Metadata = { title: "Heart of Ice", description: "Интерактивное чтение книги «Сердце льда»." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body><GameProvider>{children}</GameProvider></body></html>;
}
