import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ConfigContextProvider } from "@/global-context/config/config";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider delayDuration={200}>
        <ConfigContextProvider>
          <Component {...pageProps} />
        </ConfigContextProvider>
      </TooltipProvider>
      <Toaster />
    </ThemeProvider>
  );
}
