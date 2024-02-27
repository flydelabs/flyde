import { AppCard } from "@/components/AppCard";
import { PlaygroundApp } from "@/types/entities";
import { Database } from "@/types/supabase";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import Link from "next/link";

export const getServerSideProps: GetServerSideProps<{
  apps: PlaygroundApp[];
}> = async (context) => {
  const supabase = createPagesServerClient<Database>(context);

  const userId = context.params?.userId as string;

  const res = await supabase
    .from("apps")
    .select("*")
    .eq("creator_id", userId)
    .order("last_updated_date", { ascending: false })
    .limit(100);

  if (res.error) {
    throw res.error.message;
  }

  if (!res.data) {
    throw new Error("App not found");
  }
  return {
    props: {
      apps: res.data as PlaygroundApp[],
    },
  };
};

export default function Home({
  apps,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  if (!apps.length) {
    return (
      <main className="flex flex-col text-center my-10">
        <h1 className="text-2xl font-bold">Flyde Playground</h1>
        <p className="text-lg">No apps found for this user</p>
        <Link href={`/`}>View all apps</Link>
      </main>
    );
  } else {
    const userName = apps[0].creator_name; // hackish!
    return (
      <main className="flex  flex-col text-center my-10">
        <h1 className="text-2xl font-bold">Flyde Playground</h1>
        <h2 className="text-xl font-semibold">Apps by @{userName}</h2>
        <Link href={`/`}>View all apps</Link>

        <div className="flex flex-row flex-wrap card-container max-w-8xl mx-auto justify-center  mt-10">
          {apps.map((app) => (
            <AppCard app={app} key={app.id} />
          ))}
        </div>
        <Head>
          <title>@{userName}&apos;s Apps | Flyde Playground</title>
          <meta property="og:title" content="Flyde Playground" key="title" />
        </Head>
      </main>
    );
  }
}
