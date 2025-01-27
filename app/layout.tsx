import type { Metadata } from "next";
import "./globals.css";
import { Inter, Homemade_Apple, Nothing_You_Could_Do, Alex_Brush, Caveat } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

const homemadeApple = Homemade_Apple({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-homemade-apple',
});

const nothingYouCouldDo = Nothing_You_Could_Do({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-nothing-you-could-do',
});

const alexBrush = Alex_Brush({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-alex-brush',
});

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
});

export const metadata: Metadata = {
  title: "Note Generator",
  description: "Generate thoughtful, personalized notes for any occasion",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${homemadeApple.variable} ${nothingYouCouldDo.variable} ${alexBrush.variable} ${caveat.variable}`}>
        {children}
      </body>
    </html>
  );
}
