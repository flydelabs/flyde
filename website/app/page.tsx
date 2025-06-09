import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Star } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col w-full bg-black text-white">
      {/* WIP Banner */}
      <div className="sticky top-16 z-30 border-b border-zinc-800/30 bg-black/60 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-8 md:px-12 py-2">
          <div className="text-center">
            <p className="text-xs text-zinc-400">
              This website is a work in progress. Flyde 1.0.0 is coming soon with a complete platform overhaul.
              <Link href="/docs" className="ml-2 text-zinc-300 hover:text-white transition-colors underline underline-offset-4">
                View current docs
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Hero Section - More breathing room */}
      <section className="pt-12 sm:pt-16 md:pt-20 pb-16 md:pb-20 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-30">
          <div className="absolute top-[20%] right-[10%] w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 rounded-full bg-blue-500 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-[30%] left-[5%] w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 rounded-full bg-blue-400 blur-[150px] animate-pulse" style={{ animationDuration: '12s' }} />
          <div className="absolute top-[50%] left-[30%] w-16 sm:w-24 md:w-32 h-16 sm:h-24 md:h-32 rounded-full bg-indigo-500 blur-[80px] animate-pulse" style={{ animationDuration: '10s' }} />
        </div>
        <div className="container px-4 sm:px-8 md:px-12 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-6 sm:mb-8 bg-clip-text text-transparent bg-gradient-to-br from-white via-blue-100 to-zinc-400 animate-in slide-in-from-bottom-4 duration-700">
              Visual AI Flows<span className="text-blue-400 animate-in fade-in duration-1000 delay-300">.</span> <span className="relative inline-block text-blue-400 animate-in slide-in-from-bottom-8 duration-700 delay-150">In Your <span className="relative">Codebase<span className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-blue-400/0 via-blue-400 to-blue-400/0"></span></span></span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed text-zinc-400 mb-8 sm:mb-10 max-w-3xl mx-auto animate-in fade-in duration-1000 delay-300">
              An enterprise-ready, holistic solution for prototyping, integrating, evaluating and iterating on AI-heavy backend logic, directly in your codebase.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 animate-in fade-in-50 duration-1000 delay-500">
              <Link
                href="/docs"
                className="px-6 py-3 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all hover:scale-105 duration-300 flex items-center justify-center"
              >
                Get started
                <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/playground"
                className="px-6 py-3 rounded-md bg-zinc-800 text-white font-medium hover:bg-zinc-700 border border-zinc-700 transition-all hover:scale-105 duration-300"
              >
                Try the playground
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section - Takes up most of the viewport */}
      <section className="px-4 sm:px-8 md:px-12 pb-12 md:pb-16 relative">
        <div className="container mx-auto max-w-7xl">
          <div className="w-full h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh] bg-zinc-900 rounded-xl shadow-2xl overflow-hidden border border-zinc-800 transition-all hover:border-zinc-700 hover:shadow-blue-900/10 hover:shadow-[0_0_30px_rgba(30,64,175,0.07)] group relative">
            {/* Interactive Example Placeholder */}
            <div className="relative w-full h-full">
              <Image
                src="/example-placeholder.png"
                alt="Flyde Flow Example"
                fill
                className="object-cover object-center"
                priority
              />
              {/* Hover Tooltip with Delay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-[2000ms] flex items-center justify-center p-4">
                <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 sm:px-6 py-3 sm:py-4 shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-[2000ms] max-w-sm text-center">
                  <p className="text-white font-medium mb-1 text-sm sm:text-base">Interactive Example Coming Soon</p>
                  <p className="text-zinc-300 text-xs sm:text-sm">We&apos;re working on bringing you a fully interactive flow editor</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 md:py-24 relative">
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute bottom-[20%] right-[15%] w-48 sm:w-64 md:w-80 h-48 sm:h-64 md:h-80 rounded-full bg-blue-500 blur-[120px] animate-pulse" style={{ animationDuration: '15s' }} />
        </div>
        <div className="container mx-auto max-w-6xl px-4 sm:px-8 md:px-12 relative z-10">
          <div className="flex flex-col items-center mb-12 sm:mb-16">
            <div className="inline-block px-3 py-1 mb-4 text-xs font-medium text-blue-300 bg-blue-500/10 rounded-full border border-blue-500/20">
              Core Benefits
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4">Why Flyde</h2>
            <p className="text-zinc-400 text-center max-w-2xl text-sm sm:text-base">
              The only visual flow builder that runs in-codebase, with full access to your runtime code
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="p-6 sm:p-8 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all hover:translate-y-[-4px] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] duration-300 group">
              <div className="w-12 h-12 flex items-center justify-center bg-blue-500/10 rounded-lg mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3">In-Codebase Integration</h3>
              <p className="text-zinc-400 text-sm sm:text-base">Runs directly in your codebase with access to runtime code and existing frameworks.</p>
            </div>
            <div className="p-6 sm:p-8 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all hover:translate-y-[-4px] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] duration-300 group">
              <div className="w-12 h-12 flex items-center justify-center bg-blue-500/10 rounded-lg mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3">Visual AI Workflows</h3>
              <p className="text-zinc-400 text-sm sm:text-base">Prototype, integrate, evaluate and iterate on AI-heavy backend logic visually.</p>
            </div>
            <div className="p-6 sm:p-8 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all hover:translate-y-[-4px] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] duration-300 group">
              <div className="w-12 h-12 flex items-center justify-center bg-blue-500/10 rounded-lg mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3">Lower Collaboration Barrier</h3>
              <p className="text-zinc-400 text-sm sm:text-base">A visual extension of TypeScript that bridges the gap between developers and non-developers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto max-w-4xl px-4 sm:px-8 md:px-12 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">Ready to transform your AI workflow?</h2>
          <p className="text-zinc-400 mb-6 sm:mb-8 max-w-2xl mx-auto text-sm sm:text-base">
            Start building powerful AI agents and workflows visually, with the full power of your codebase.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4">
            <Link
              href="/docs"
              className="px-6 sm:px-8 py-3 sm:py-4 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all hover:scale-105 duration-300"
            >
              Get started
            </Link>
            <Link
              href="https://github.com/flydelabs/flyde"
              className="px-6 sm:px-8 py-3 sm:py-4 rounded-md bg-zinc-900 text-white font-medium hover:bg-zinc-800 border border-zinc-800 transition-all hover:scale-105 duration-300 flex items-center justify-center group"
            >
              <Star className="mr-2 h-4 w-4 text-white group-hover:text-blue-400 transition-colors group-hover:rotate-12 duration-300" />
              Star on GitHub
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
