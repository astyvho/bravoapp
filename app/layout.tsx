import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BravoFocusTimer',
  description: 'Simple countdown timer with gamification',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}