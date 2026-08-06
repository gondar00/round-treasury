'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@round-treasury/ui';

const navItems = [
  { label: 'Home', href: '/', icon: '⊞' },
  { label: 'Accounts', href: '/accounts', icon: '⊟' },
  { label: 'Portfolio', href: '/portfolio', icon: '⊠' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-64 border-r border-border bg-card min-h-screen p-6">
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight">Round.</h1>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname === item.href || pathname.startsWith(item.href + '/')
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:bg-secondary/50'
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
