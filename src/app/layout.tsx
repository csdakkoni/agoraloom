import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AgoraLoom ERP",
  description: "Production and Inventory Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen`}>
        <div className="flex">
          <Sidebar />
          <main className="flex-1 ml-64 p-8 min-h-screen bg-slate-50">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

