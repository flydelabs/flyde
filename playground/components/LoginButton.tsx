"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function LoginButton(props: { path?: string }) {
  async function login() {
    const supabase = createClientComponentClient();
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${location.origin}/auth/callback?path=${encodeURIComponent(
          props.path ?? ""
        )}`,
      },
    });
  }

  return (
    <button
      onClick={login}
      className="py-2 px-4 rounded-md no-underline bg-btn-background hover:bg-btn-background-hover"
    >
      Login with GitHub
    </button>
  );
}
