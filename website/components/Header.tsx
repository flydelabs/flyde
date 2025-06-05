'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Blog', href: '/blog' },
  { name: 'Playground', href: '/playground' },
  { name: 'Documentation', href: '/docs' },
];

export function Header() {
  const pathname = usePathname();
  const [starCount, setStarCount] = useState<number | null>(null);

  useEffect(() => {
    // Fetch star count from GitHub API
    fetch('https://api.github.com/repos/flydelabs/flyde')
      .then(response => response.json())
      .then(data => {
        if (data.stargazers_count) {
          setStarCount(data.stargazers_count);
        }
      })
      .catch(error => {
        console.warn('Failed to fetch GitHub stars:', error);
        setStarCount(2232);
      });
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-black backdrop-blur supports-[backdrop-filter]:bg-black/80">
      <div className="container flex h-16 max-w-screen-2xl items-center px-8">
        <div className="mr-8 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Image src="/logo-text.png" alt="Flyde" width={80} height={32} />
          </Link>
        </div>
        <nav className="flex items-center space-x-8 text-sm font-medium">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`transition-colors hover:text-white/80 ${pathname === item.href ? 'text-white' : 'text-white/60'
                }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-4">
            <a
              href="https://github.com/flydelabs/flyde"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-sm text-white border border-zinc-800 transition-colors group"
            >
              <Star className="h-4 w-4 text-white group-hover:text-blue-400 transition-colors" />
              <span>Star</span>
              {starCount && (
                <span className="px-2 py-0.5 bg-zinc-800 rounded-full text-xs font-medium">
                  {starCount.toLocaleString()}
                </span>
              )}
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
} 