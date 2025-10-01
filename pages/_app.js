import "@/styles/globals.css";
import { Inter } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function App({ Component, pageProps }) {
  return (
    <main
      className={`${GeistSans.variable} ${GeistMono.variable} ${inter.variable}  font-sans`}
    >
      <Component {...pageProps} />
    </main>
  );
}
