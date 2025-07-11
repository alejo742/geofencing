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
      <body className="h-screen w-screen overflow-hidden">
        <AppProvider>
          <main className="flex flex-col md:flex-row relative h-full w-full">
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  );
}
