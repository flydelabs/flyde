import Link from 'next/link';
import { Github, MessageSquareMore, Twitter } from 'lucide-react';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="border-t border-zinc-800/50 bg-black relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute bottom-0 left-[20%] w-64 h-64 rounded-full bg-blue-500 blur-[150px] animate-pulse" style={{ animationDuration: '15s' }} />
      </div>
      <div className="container mx-auto px-8 py-12 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start">
            <div className="mb-4">
              <Link href="/" className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-500">
                <Image src="/logo-white.png" alt="Flyde" width={80} height={32} />
              </Link>
            </div>
            <p className="text-sm text-zinc-400">
              Built with ❤️ by Flyde Labs
            </p>
          </div>
          
          <nav className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex space-x-6">
              <Link
                href="/blog"
                className="text-zinc-400 hover:text-white transition-colors"
              >
                Blog
              </Link>
              <Link
                href="/docs"
                className="text-zinc-400 hover:text-white transition-colors"
              >
                Documentation
              </Link>
              <Link
                href="/playground"
                className="text-zinc-400 hover:text-white transition-colors"
              >
                Playground
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link 
                href="https://github.com/flydelabs/flyde" 
                className="text-zinc-400 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <Github size={20} />
              </Link>
              <Link 
                href="https://twitter.com/flydedlabs" 
                className="text-zinc-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </Link>

              <Link 
                href="https://www.flyde.dev/discord" 
                className="text-zinc-400 hover:text-white transition-colors"
                aria-label="Discord"
              >
                <MessageSquareMore  size={20} />
              </Link>
            </div>
            
          </nav>
        </div>
        
        <div className="mt-8 pt-6 border-t border-zinc-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-zinc-500">
            © {new Date().getFullYear()} Flyde Labs. All rights reserved.
          </p>
         
        </div>
      </div>
    </footer>
  );
} 