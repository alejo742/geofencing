import type { Metadata } from "next";
import "./globals.css";
import 'leaflet/dist/leaflet.css';
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: 'Evergreen Geofencing Tool',
  description: 'Simple tool for creating geofences for Dartmouth campus locations',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <header className="bg-green-800 text-white p-4 shadow-md">
            <h1 className="text-xl font-bold">Evergreen Geofencing Tool</h1>
          </header>
          <main className="flex flex-col md:flex-row h-[calc(100vh-64px)]">
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  );
}
