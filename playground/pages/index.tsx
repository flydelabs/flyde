import { GetServerSideProps, InferGetServerSidePropsType } from "next/types";
import { PlaygroundApp } from "@/types/entities";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { AppCard } from "@/components/AppCard";
import Head from "next/head";
// import EmbeddedFlyde from "./EmbeddedFlyde";

export const getServerSideProps: GetServerSideProps<{
  apps: PlaygroundApp[];
}> = async (context) => {
  const supabase = createPagesServerClient<Database>(context);

  const res = await supabase
    .from("apps")
    .select("*")
    .order("last_updated_date", {
      ascending: false,
    })
    .limit(10);

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
  return (
    <main className="flex flex-col text-center my-10">
      <h1 className="text-2xl font-bold">Flyde Playground</h1>
      <h2 className="text-xl font-semibold">Latest apps</h2>

      <div className="flex flex-row flex-wrap card-container max-w-8xl mx-auto justify-center mt-5">
        {apps.map((app) => (
          <AppCard app={app} key={app.id} />
        ))}
      </div>
      <Head>
        <title>Flyde Playground</title>
        <meta property="og:title" content="Flyde Playground" key="title" />
      </Head>
    </main>
  );
}
