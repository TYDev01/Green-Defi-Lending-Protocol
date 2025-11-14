import type { Metadata } from "next";
import { ClientProviders } from "@/components/client-providers";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "GreenDeFi - Carbon-Negative Lending on Hedera",
  description: "DeFi lending protocol that rewards borrowers for carbon offsets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <ClientProviders>
          <Header />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
          <footer className="bg-gray-800 text-white py-8 mt-16">
            <div className="container mx-auto px-4 text-center">
              <p className="text-gray-400">
                © 2025 GreenDeFi. Built on Hedera's Carbon-Negative Network.
              </p>
              <div className="mt-4 space-x-4">
                <a href="#" className="text-green-400 hover:text-green-300">Twitter</a>
                <a href="#" className="text-green-400 hover:text-green-300">Discord</a>
                <a href="#" className="text-green-400 hover:text-green-300">Docs</a>
              </div>
            </div>
          </footer>
        </ClientProviders>
      </body>
    </html>
  );
}

