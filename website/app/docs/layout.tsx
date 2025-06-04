'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const sidebarItems = [
  {
    title: 'Getting Started',
    href: '/docs/getting-started',
  },
  {
    title: 'Core Concepts',
    href: '/docs/concepts',
  },
  {
    title: 'Tutorials',
    href: '/docs/tutorials',
  },
  {
    title: 'API Reference',
    href: '/docs/api',
  },
];

export default function DocsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <div className="container mx-auto px-4 flex flex-col md:flex-row gap-8 py-8">
      <aside className="md:w-64 flex-shrink-0">
        <div className="sticky top-24">
          <div className="mb-4">
            <h2 className="font-medium text-lg mb-2">Documentation</h2>
          </div>
          <nav className="flex flex-col space-y-1">
            {sidebarItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 hover:bg-muted rounded-md transition-colors ${
                  pathname === item.href
                    ? 'bg-muted font-medium text-foreground'
                    : 'text-foreground/70'
                }`}
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <article className="prose prose-invert max-w-none">
          {children}
        </article>
      </div>
    </div>
  );
} 