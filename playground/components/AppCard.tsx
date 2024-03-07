import { PlaygroundApp } from "@/types/entities";
import Link from "next/link";
import { TimeAgo } from "./Utils/TimeAgo";
import { useRouter } from "next/router";
import { useCallback } from "react";

export function AppCard({ app }: { app: PlaygroundApp }) {
  const updated = new Date(app.last_updated_date);
  const router = useRouter();

  const onUserClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      e.preventDefault();
      e.stopPropagation();
      router.push(`/users/${app.creator_id}`);
    },
    [router, app]
  );

  return (
    <div
      className="flex flex-col justify-between w-96 h-36 py-5 px-10 border-slate-200 border bg-white rounded-xl m-4 hover:bg-gray-100 cursor-pointer"
      onClick={() => router.push(`/apps/${app.id}`)}
    >
      <header>
        <Link href={`/apps/${app.id}`} className="!no-underline text-blue-500">
          <h1 className="text-lg font-bold w-full text-center">{app.title}</h1>
        </Link>
      </header>

      <div className="text-sm text-slate-500">
        By{" "}
        <Link href={`/users/${app.creator_id}`} onClick={onUserClick}>
          @{app.creator_name}
        </Link>
      </div>
      <div className="flex-row justify-center flex gap-2">
        <div className="text-sm text-slate-500">
          <div>
            Modified <TimeAgo date={updated} /> ago
          </div>
        </div>
        {/* <span> · </span> */}
        {/* <div className="text-sm text-slate-500">
          Forked {app.forks_count} time{app.forks_count === 1 ? "" : "s"}
        </div> */}
      </div>
    </div>
  );
}
