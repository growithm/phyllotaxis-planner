import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Phyllotaxis Planner',
  description: '植物の葉序の法則を応用した有機的な思考整理ツール',
  keywords: ['phyllotaxis', '思考整理', 'マインドマップ', 'アイデア整理'],
  authors: [{ name: 'Phyllotaxis Planner Team' }],
  openGraph: {
    title: 'Phyllotaxis Planner',
    description: '植物の葉序の法則を応用した有機的な思考整理ツール',
    type: 'website',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Phyllotaxis Planner',
    description: '植物の葉序の法則を応用した有機的な思考整理ツール',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  );
}