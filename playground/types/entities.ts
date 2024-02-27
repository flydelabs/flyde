import { AppData } from "@/components/AppView";
import { Database } from "./supabase";

export type PlaygroundApp = Database["public"]["Tables"]["apps"]["Row"] & {
  files: AppData["files"];
};
