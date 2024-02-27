import { User } from "@supabase/supabase-js";

export interface SimpleUser {
  id: string;
  username: string;
}

export function simplifiedUser(user: User): SimpleUser {
  const {
    user_metadata: { user_name, name },
  } = user;
  return {
    id: user.id,
    username: user_name ?? name ?? "N/A",
  };
}
