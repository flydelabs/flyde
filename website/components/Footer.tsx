import Link from 'next/link';
import { Github, Mail, MessageSquareMore, Twitter } from 'lucide-react';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="border-t border-zinc-800/50 bg-black relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute bottom-0 left-[20%] w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 rounded-full bg-blue-500 blur-[150px] animate-pulse" style={{ animationDuration: '15s' }} />
      </div>
      <div className="container mx-auto px-4 sm:px-8 py-8 sm:py-12 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
          <div className="flex flex-col items-center md:items-start">
            <div className="mb-3 sm:mb-4">
              <Link href="/" className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-500">
                <Image src="/logo-white.png" alt="Flyde" width={80} height={32} className="w-16 sm:w-20" />
              </Link>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400">
              Built with ❤️ by Flyde Labs
            </p>
          </div>

          <nav className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
            <div className="flex flex-wrap justify-center gap-4 sm:space-x-6 sm:gap-0">
              <Link
                href="/blog"
                className="text-zinc-400 hover:text-white transition-colors text-sm"
              >
                Blog
              </Link>
              <Link
                href="/docs"
                className="text-zinc-400 hover:text-white transition-colors text-sm"
              >
                Documentation
              </Link>
              <Link
                href="/playground"
                className="text-zinc-400 hover:text-white transition-colors text-sm"
              >
                Playground
              </Link>
              <Link
                href="https://studio.flyde.dev"
                className="text-zinc-400 hover:text-white transition-colors text-sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                Studio
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href="https://github.com/flydelabs/flyde"
                className="text-zinc-400 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <Github size={18} />
              </Link>
              <Link
                href="https://twitter.com/flydedlabs"
                className="text-zinc-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={18} />
              </Link>

              <Link
                href="https://www.flyde.dev/discord"
                className="text-zinc-400 hover:text-white transition-colors"
                aria-label="Discord"
              >
                <MessageSquareMore size={18} />
              </Link>

              <Link
                href="mailto:gabriel@flyde.dev"
                className="text-zinc-400 hover:text-white transition-colors"
                aria-label="Email"
              >
                <Mail size={18} />
              </Link>
            </div>

          </nav>
        </div>

        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-zinc-800/50 flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
          <p className="text-xs text-zinc-500 text-center md:text-left">
            © {new Date().getFullYear()} Flyde Labs. All rights reserved.
          </p>

        </div>
      </div>
    </footer>
  );
} 