import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ConfigContextProvider } from "@/global-context/config/config";
import { Hanken_Grotesk } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const sans = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${sans.variable} font-sans`}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider delayDuration={200}>
          <ConfigContextProvider>
            <Component {...pageProps} />
          </ConfigContextProvider>
        </TooltipProvider>
        <Toaster />
      </ThemeProvider>
    </div>
  );
}
