import { useEffect } from "react";
import { useRouter } from "next/router";

export const useUnsavedChangesWarning = (hasUnsavedChanges: boolean) => {
  const router = useRouter();

  useEffect(() => {
    const handleWindowClose = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        return (e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?");
      }
    };

    const handleRouteChange = (url: string) => {
      if (
        router.asPath !== url &&
        hasUnsavedChanges &&
        !confirm("You have unsaved changes. Are you sure you want to leave?")
      ) {
        router.events.emit("routeChangeError");
        throw "Route change aborted.";
      }
    };

    // Add event listeners
    window.addEventListener("beforeunload", handleWindowClose);
    router.events.on("routeChangeStart", handleRouteChange);

    // Clean up
    return () => {
      window.removeEventListener("beforeunload", handleWindowClose);
      router.events.off("routeChangeStart", handleRouteChange);
    };
  }, [hasUnsavedChanges, router]);
};
