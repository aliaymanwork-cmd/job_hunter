import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'SOC Hunt | Dubai Job Command Center', description: 'Personal SOC and incident response job hunt tracker for Dubai.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
