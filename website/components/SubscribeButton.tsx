"use client";

import { useState, useEffect } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";

interface SubscribeButtonProps {
    source?: string;
}

export default function SubscribeButton({ source = "home" }: SubscribeButtonProps) {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");

    // Hide the subscription label when subscription is successful
    useEffect(() => {
        if (isSuccess) {
            const label = document.querySelector('.subscription-label') as HTMLElement;
            if (label) {
                label.style.display = 'none';
            }
        }
    }, [isSuccess]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !email.includes("@")) {
            setError("Please enter a valid email");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            // This endpoint will be implemented later by the user
            const response = await fetch("/api/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, source }),
            });

            if (response.ok) {
                setIsSuccess(true);
                setEmail("");
            } else {
                setError("Something went wrong. Please try again.");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            {isSuccess ? (
                <div className="px-3 py-1.5 text-xs text-blue-400 bg-blue-400/5 rounded-full border border-blue-400/10 whitespace-nowrap">
                    Thanks! We&apos;ll notify you when it launches. Meanwhile, please
                    <Link
                        href="https://github.com/flydelabs/flyde"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 hover:text-blue-300 transition-colors ml-1"
                    >
                        star our repo.
                    </Link>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <div className="relative flex-grow">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="w-full px-4 py-2 rounded-full bg-zinc-800/50 border border-zinc-700/50 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50"
                            disabled={isLoading}
                        />
                        {error && <p className="absolute -bottom-5 left-3 text-[10px] text-red-400">{error}</p>}
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all flex items-center justify-center whitespace-nowrap"
                    >
                        {isLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <>
                                Subscribe
                                <ChevronRight className="ml-1 h-3.5 w-3.5" />
                            </>
                        )}
                    </button>
                </form>
            )}
        </div>
    );
} 