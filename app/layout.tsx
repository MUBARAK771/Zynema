import type { Metadata } from "next";
import { Poppins, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Sidebar from "./components/sidebar";
import AuthGate from "./components/AuthGate";
import DashboardWelcome from "./components/DashboardWelcome";
import { getLoginUrl } from "@/lib/auth";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zynema",
  description: "TV and movie discovery for your next binge session",
  icons: {
    icon: "/zynema-logo.png",
    apple: "/zynema-logo.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const loginUrl = getLoginUrl();

  return (
    <html
      lang="en"
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
    >
     <body className="bg-[#0b0c0e] text-zinc-100 antialiased font-sans">
       <AuthGate loginUrl={loginUrl}>
         <div className="flex h-screen overflow-hidden">
           <Sidebar loginUrl={loginUrl} />
           <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
             <Header />
             <DashboardWelcome />
             <main className="flex-1 overflow-y-auto pb-20 scrollbar-none md:pb-0">{children}</main>
           </div>
          </div>
       </AuthGate>
      </body>
    </html>
  );
}