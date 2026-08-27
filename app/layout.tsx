import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ajaia Docs | Collaborative Document Editor',
  description:
    'A lightweight, AI-native full stack collaborative document editor inspired by Google Docs & Notion.',
  keywords: ['document editor', 'rich text', 'collaborative editing', 'file import', 'Ajaia'],
  authors: [{ name: 'Mohan Kumar Sampatirao', url: 'mailto:mohankumarsampatirao@gmail.com' }],
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
