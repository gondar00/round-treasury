import './global.css';

export const metadata = {
  title: 'Round Treasury',
  description: 'Treasury dashboard for modern companies',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
