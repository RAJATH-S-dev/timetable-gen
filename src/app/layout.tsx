import "./globals.css"; // Relative path to where your css actually is
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-cream text-charcoal antialiased`}>
        {children}
      </body>
    </html>
  );
}