import { useEffect, useState } from "react";

export function useLandscapeLock() {

  const [isPortrait, setIsPortrait] =
    useState(false);

  useEffect(() => {

    const check = () => {

      setIsPortrait(
        window.innerHeight > window.innerWidth
      );
    };

    check();

    window.addEventListener(
      "resize",
      check
    );

    return () => {
      window.removeEventListener(
        "resize",
        check
      );
    };

  }, []);

  return { isPortrait };
}