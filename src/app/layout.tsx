import type { Metadata } from "next";
import { Poppins, Barlow_Condensed } from "next/font/google";
import { SpotifyProvider } from "@/components/site/SpotifyProvider";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-poppins",
  display: "swap",
});

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-barlow",
  display: "swap",
});

export const metadata: Metadata = {
  title: "songspot – Free 0.1-Second Guess the Song Game",
  description: "Play songspot, a free online song guessing game that starts with a 0.1-second clip. Test your music knowledge across genres and eras — no signup required.",
  icons: { icon: "/logo.png", apple: "/logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${barlow.variable} dark`} style={{ colorScheme: "dark" }}>
      <body>
        <SpotifyProvider>{children}</SpotifyProvider>
      </body>
    </html>
  );
}
