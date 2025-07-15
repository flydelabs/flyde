'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DocPage } from '@/lib/docs';

interface ClientSidebarProps {
  docs: DocPage[];
}

export function ClientSidebar({ docs }: ClientSidebarProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col space-y-1">
      {docs.map((doc) => (
        <Link
          key={doc.slug}
          href={`/docs/${doc.slug}`}
          className={`px-3 py-2 hover:bg-muted rounded-md transition-colors ${
            pathname === `/docs/${doc.slug}`
              ? 'bg-muted font-medium text-foreground'
              : 'text-foreground/70'
          }`}
        >
          {doc.title}
        </Link>
      ))}
    </nav>
  );
}