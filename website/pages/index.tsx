import Link from "next/link";
import { Star } from "lucide-react";
import SubscribeButton from "@/components/SubscribeButton";
import { EmbeddedFlyde } from "@/components/EmbeddedFlyde";
import { SubtleExamplePicker } from "@/components/SubtleExamplePicker";
import Head from "next/head";
import { useState } from "react";

export default function Home() {
  const [activeExample, setActiveExample] = useState('blog-generator');

  return (
    <>
      <Head>
        <title>Visual AI Flows | In Your Codebase</title>
        <meta name="description" content="The missing link between developers and non-developers working on AI workflows" />
      </Head>

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
        <section className="pt-12 sm:pt-16 md:pt-20 pb-8 md:pb-8 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-30">
            <div className="absolute top-[20%] right-[10%] w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 rounded-full bg-blue-500 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute bottom-[30%] left-[5%] w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 rounded-full bg-blue-400 blur-[150px] animate-pulse" style={{ animationDuration: '12s' }} />
            <div className="absolute top-[50%] left-[30%] w-16 sm:w-24 md:w-32 h-16 sm:h-24 md:h-32 rounded-full bg-indigo-500 blur-[80px] animate-pulse" style={{ animationDuration: '10s' }} />
          </div>
          <div className="container px-4 sm:px-8 md:px-12 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-6 sm:mb-8 text-white">
                Stop building AI logic<br className="hidden sm:block" /> <span className="text-blue-400">outside</span> your <span className="relative">codebase<span className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-blue-400/0 via-blue-400 to-blue-400/0"></span></span>
              </h1>
              <div className="max-w-3xl mx-auto animate-in fade-in duration-1000 delay-300">
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed text-zinc-400">
                  Like n8n, but inside your codebase. Build AI agents visually, import your functions, deploy with your app. Works with VS Code, Cursor, Windsurf. Plays nicely with Claude Code, Gemini CLI, and more.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Section - Takes up most of the viewport */}
        <section className="px-4 sm:px-8 md:px-12 pb-12 md:pb-16 relative">
          <div className="container mx-auto max-w-7xl">
            <div className="w-full h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[70vh] bg-zinc-900 rounded-xl shadow-2xl overflow-hidden border border-zinc-800 transition-all hover:border-zinc-700 hover:shadow-blue-900/10 hover:shadow-[0_0_30px_rgba(30,64,175,0.07)] group relative">
              <EmbeddedFlyde
                activeExample={activeExample}
                onExampleChange={setActiveExample}
              />
            </div>
            <p className="text-xs text-zinc-500 mt-2 text-center">
              This flow demonstrates LLM integration across multiple providers (OpenAI & Anthropic) with structured output generation, content processing, and response formatting.
            </p>

            {/* CTA after demo - More prominent */}
            <div className="mt-12 text-center">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/quick-start"
                  className="inline-flex px-8 py-4 bg-blue-600 text-white font-semibold text-lg rounded-lg hover:bg-blue-700 transition-all hover:scale-105 duration-300 shadow-lg hover:shadow-blue-500/25"
                >
                  Quick Start
                </Link>
                <Link
                  href="/playground/blog-generator"
                  className="inline-flex px-8 py-4 bg-zinc-800 text-white font-semibold text-lg rounded-lg hover:bg-zinc-700 transition-all hover:scale-105 duration-300 shadow-lg border border-zinc-700"
                >
                  Try Playground
                </Link>
              </div>
              <p className="text-xs text-zinc-500 mt-3">Get Flyde running in your project in under 5 minutes</p>
            </div>

            {/* Subtle Example Picker Below
            <div className="mt-4 flex justify-center">
              <SubtleExamplePicker
                activeExample={activeExample}
                onExampleChange={setActiveExample}
              />
            </div> */}
          </div>
        </section>

        <section className="py-16 sm:py-20 md:py-24 relative text-center">
          <div className="flex flex-col items-center gap-8 animate-in fade-in-50 duration-1000 delay-500">
            <Link
              href="https://github.com/flydelabs/flyde"
              className="inline-flex items-center text-xs text-zinc-400 hover:text-zinc-200 transition-colors py-1"
            >
              <Star className="mr-1.5 h-3.5 w-3.5" />
              <span>View on GitHub</span>
            </Link>
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
                The only visual flow builder that runs in-codebase, with full access to your runtime code. Works seamlessly with AI coding tools like Cursor and Windsurf.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
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
              <div className="p-6 sm:p-8 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all hover:translate-y-[-4px] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] duration-300 group">
                <div className="w-12 h-12 flex items-center justify-center bg-blue-500/10 rounded-lg mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3">AI Coding Enhanced</h3>
                <p className="text-zinc-400 text-sm sm:text-base">Works seamlessly with Cursor, Windsurf, and other AI coding tools. Augments rather than replaces your development workflow.</p>
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
                href="/quick-start"
                className="px-6 sm:px-8 py-3 sm:py-4 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all hover:scale-105 duration-300"
              >
                Start Now
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
    </>
  );
}