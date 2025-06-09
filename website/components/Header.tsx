'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Star, Menu, X } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <div className="container flex h-16 max-w-screen-2xl items-center px-4 sm:px-8">
        <div className="mr-4 sm:mr-8 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Image src="/logo-text.png" alt="Flyde" width={80} height={32} className="w-16 sm:w-20" />
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
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

        <div className="flex flex-1 items-center justify-end space-x-2 sm:space-x-4">
          {/* Star Button */}
          <nav className="flex items-center">
            <a
              href="https://github.com/flydelabs/flyde"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-xs sm:text-sm text-white border border-zinc-800 transition-colors group"
            >
              <Star className="h-3 w-3 sm:h-4 sm:w-4 text-white group-hover:text-blue-400 transition-colors" />
              <span className="hidden sm:inline">Star</span>
              {starCount && (
                <span className="px-1.5 sm:px-2 py-0.5 bg-zinc-800 rounded-full text-xs font-medium">
                  {starCount > 1000 ? `${(starCount/1000).toFixed(1)}k` : starCount.toLocaleString()}
                </span>
              )}
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-white hover:text-white/80 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800/50 bg-black backdrop-blur supports-[backdrop-filter]:bg-black/95">
          <nav className="container mx-auto px-4 py-4 space-y-3">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block py-2 text-sm font-medium transition-colors hover:text-white/80 ${pathname === item.href ? 'text-white' : 'text-white/60'
                  }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
} 