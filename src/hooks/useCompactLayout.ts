import { useEffect, useState } from "react";

// Include small phones in landscape, and react to rotation/window resizing.
export const COMPACT_LAYOUT_QUERY = "(max-width: 520px), (max-width: 900px) and (max-height: 480px)";

export function useCompactLayout() {
  const [compact, setCompact] = useState(() => window.matchMedia(COMPACT_LAYOUT_QUERY).matches);
  useEffect(() => {
    const query = window.matchMedia(COMPACT_LAYOUT_QUERY);
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return compact;
}
