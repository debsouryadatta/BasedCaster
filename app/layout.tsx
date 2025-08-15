import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Space_Grotesk } from "next/font/google"
import "./globals.css"
import MiniAppReady from "../components/MiniAppReady"
import BottomNav from "@/components/BottomNav"
import Providers from "./providers"
import WalletAutoConnect from "@/components/WalletAutoConnect"
import HotToaster from "@/components/HotToaster"

const PROD = process.env.NEXT_PUBLIC_APP_URL || "https://dare-me-eight.vercel.app"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "600", "700", "800", "900"],
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
  weight: ["400", "600", "700"],
})

const miniappEmbed = {
  version: "1",
  imageUrl: `${PROD}/og.png`,
  button: {
    title: "Open BasedCaster",
    action: {
      type: "launch_miniapp",
      name: "BasedCaster",
      url: PROD,
      splashImageUrl: `${PROD}/splash-200.png`,
      splashBackgroundColor: "#EEF2FF",
    },
  },
}

export const metadata: Metadata = {
  title: "BasedCaster",
  description: "Analyze Twitter vibes for Base/Farcaster culture and mint a personality card.",
  other: {
    "fc:miniapp": JSON.stringify(miniappEmbed),
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}>
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <body className="min-h-dvh bg-background text-foreground pb-[env(safe-area-inset-bottom)]">
        <Providers>
          <HotToaster />
          <MiniAppReady />
          <WalletAutoConnect />
          {children}
        </Providers>
      </body>
    </html>
  )
}
