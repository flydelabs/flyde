"use client";

import Image from "next/image";

export default function VideoPlayer() {
    return (
        <div className="relative w-full h-full">
            <video
                src="/screencast.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                    console.error('Video failed to load:', e);
                    // Fallback: hide video and show image
                    e.currentTarget.style.display = 'none';
                    const fallbackImage = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallbackImage && fallbackImage.style) {
                        fallbackImage.style.display = 'block';
                    }
                }}
            >
                <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                    <p className="text-zinc-400">Video not supported in your browser</p>
                </div>
            </video>
            {/* Fallback Image */}
            <Image
                src="/example-placeholder.png"
                alt="Flyde Flow Example"
                fill
                className="object-cover object-center hidden"
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
    );
} 