import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Web Audio API examples",
  description: "Web Audio API examples",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav>
          <ul>
            <li>
              <Link href={"/"}>Example 1</Link>
            </li>
            <li>
              <Link href={"/examples"}>Example 2</Link>
            </li>
          </ul>
        </nav>
        {children}
      </body>
    </html>
  );
}
