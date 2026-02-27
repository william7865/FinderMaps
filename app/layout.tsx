<<<<<<< HEAD
// app/layout.tsx
=======
>>>>>>> f265c4a (FinderMaps)
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
<<<<<<< HEAD
  title: "RestaurantFinder — Discover great places near you",
  description: "Interactive restaurant map powered by OpenStreetMap and Foursquare",
=======
  title: "Forkmap — Find exceptional restaurants near you",
  description: "Discover the best restaurants near you. Real data, beautiful maps, smart routing.",
  themeColor: "#faf9f7",
>>>>>>> f265c4a (FinderMaps)
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
<<<<<<< HEAD
    <html lang="en">
      <body className="bg-stone-950 text-stone-100 antialiased">{children}</body>
=======
    <html lang="en" style={{ height: "100%", colorScheme: "light" }}>
      <body style={{ height: "100%", margin: 0, padding: 0 }}>{children}</body>
>>>>>>> f265c4a (FinderMaps)
    </html>
  );
}
