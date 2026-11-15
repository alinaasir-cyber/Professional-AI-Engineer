import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Chatbot',
  description: 'AI Chatbot with Database Chat, OMDb Movie Database & Dad Jokes Tools',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
