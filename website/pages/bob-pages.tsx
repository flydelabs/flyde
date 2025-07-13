import { EmbeddedFlyde } from "@/components/EmbeddedFlyde";

export default function BobPages() {
  return (
    <div className="flex flex-col w-full bg-black text-white">
      <section className="px-4 sm:px-8 md:px-12 pb-12 md:pb-16 relative">
        <div className="container mx-auto max-w-7xl">
          <div className="w-full h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[70vh] bg-zinc-900 rounded-xl shadow-2xl overflow-hidden border border-zinc-800 transition-all hover:border-zinc-700 hover:shadow-blue-900/10 hover:shadow-[0_0_30px_rgba(30,64,175,0.07)] group relative">
            {/* Video Demo with Image Fallback */}
            <EmbeddedFlyde />
          </div>
        </div>
      </section>
    </div>
  );
}