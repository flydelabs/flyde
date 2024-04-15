import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { User } from "@supabase/supabase-js";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { SimpleUser, simplifiedUser } from "@/lib/user";

interface UserContextType {
  user: SimpleUser | null;
  loading: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
});

export function UserProvider({ children }: any) {
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClientComponentClient<Database>();
    const fetchUser = async () => {
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (currentUser) {
        setUser(simplifiedUser(currentUser));
      }

      setLoading(false);
    };

    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export const useCurrentUser = () => useContext(UserContext);
