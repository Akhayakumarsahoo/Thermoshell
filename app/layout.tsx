import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ThermoShelter — Passive Thermal Shelter Design Software | SIH 2026 · DRDO',
  description: 'Area-Specific Passive Shelter Thermal Design Software developed for Smart India Hackathon 2026 Problem Statement 26051 for DRDO / Department of Defence Production.',
  keywords: ['thermal-design', 'passive-shelter', 'sih2026', 'drdo', 'ladakh', 'climate-resilient']
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
