import React from "react";
import { Popover } from "react-tiny-popover";
import LoginButton from "./LoginButton";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "./UserContext";

export function UserProfile() {
  const { user, loading } = useCurrentUser();

  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);

  const popoverMenu = (
    <div
      className="absolute left-0 z-100 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="menu-button"
      tabIndex={-1}
    >
      <div className="py-1" role="none">
        <Link
          href={`/users/${user?.id}`}
          className="text-gray-700 block px-4 py-2 text-sm"
          role="menuitem"
          tabIndex={-1}
          onClick={() => {
            setIsUserMenuOpen(false);
          }}
        >
          My apps
        </Link>

        <form
          action="/auth/sign-out"
          method="post"
          className="text-gray-700 block px-4 py-2 text-sm"
        >
          <button>Sign out</button>
        </form>
      </div>
    </div>
  );

  const path = usePathname();

  if (loading) {
    return <div />;
  }

  return user ? (
    <Popover
      isOpen={isUserMenuOpen}
      positions={["left"]} // preferred positions by priority
      content={popoverMenu}
      padding={80}
      // align="start"
      onClickOutside={() => setIsUserMenuOpen(false)}
    >
      <button
        className="text-base"
        onClick={() => setIsUserMenuOpen((prev) => !prev)}
      >
        @{user.username}
      </button>
    </Popover>
  ) : (
    <LoginButton path={path ?? ""} />
  );
}
