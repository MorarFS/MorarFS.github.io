import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Florin-Stefan Morar | Historian',
  description: 'Florin-Stefan Morar, historian at the National University of Singapore. Research in global history, the history of science, and computational humanities.',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
