import { useEffect } from "react";

export function useDocumentTitle(title) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title
      ? `${title} | CampusCycle — Give Your Things a Second Life`
      : "CampusCycle — Give Your Things a Second Life";

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}