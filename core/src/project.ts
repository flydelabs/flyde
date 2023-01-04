import { CustomPartRepo, Trigger, ExecuteEnv } from ".";

export interface ProjectInfo {
  id: string;
  name: string;
  created: number;
  updated: number;
  slug: string;
  authorId: string;
}

export interface Project extends ProjectInfo {
  customRepo: CustomPartRepo;
  triggers: Trigger[];
  env?: ExecuteEnv;
}
