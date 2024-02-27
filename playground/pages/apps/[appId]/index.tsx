import { FullPageLoader } from "@/components/FullPageLoader";
import { SimpleUser, simplifiedUser } from "@/lib/user";
import { PlaygroundApp } from "@/types/entities";
import { Database } from "@/types/supabase";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";

export const getServerSideProps: GetServerSideProps<{
  app: PlaygroundApp | null;
  user: SimpleUser | null;
  baseDomain: string;
}> = async (context) => {
  const supabase = createPagesServerClient<Database>(context);

  const appId = context.params?.appId as string;

  const [appResult, userResult] = await Promise.allSettled([
    supabase.from("apps").select("*").eq("id", appId).single(),
    supabase.auth.getUser(),
  ]);

  if (appResult.status === "rejected" || !appResult.value.data) {
    throw new Error(`App not found`);
  }

  const user =
    userResult.status === "fulfilled" ? userResult.value.data.user : null;

  const app = appResult.value.data;

  const baseDomain = `https://${context.req.headers.host ?? "play.flyde.dev"}`;

  return {
    props: {
      app: app as PlaygroundApp,
      user: user ? simplifiedUser(user) : null,
      baseDomain,
    },
  };
};

const DynamicAppView = dynamic(
  () => import("@/components/AppView").then((m) => m.default),
  {
    loading: () => <FullPageLoader />,
    ssr: false,
  }
);

export default function Page({
  app,
  user,
  baseDomain,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  if (app) {
    return <DynamicAppView app={app} user={user} baseDomain={baseDomain} />;
  } else {
    return (
      <div className="flex flex-col text-center my-10">
        <h1 className="text-2xl font-bold">Flyde Playground</h1>
        <p className="text-lg">App not found</p>
        <Link href={`/`}>View all apps</Link>
      </div>
    );
  }
}
