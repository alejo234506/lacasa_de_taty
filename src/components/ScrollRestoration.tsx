
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SCROLL_KEY = "casa_taty_scroll";

function scrollToHash(hash: string, behavior: ScrollBehavior = "auto") {
  const el = document.querySelector(hash);
  if (!el) return false;
  el.scrollIntoView({ behavior, block: "start" });
  return true;
}

export function ScrollRestoration() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;

    history.scrollRestoration = "manual";

    const hash = window.location.hash;
    if (hash) scrollToHash(hash);

    let saveTimer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        sessionStorage.setItem(`${SCROLL_KEY}:${pathname}`, String(window.scrollY));
      }, 100);
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      clearTimeout(saveTimer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  return null;
}

export function scrollToSection(hash: string) {
  document.documentElement.classList.add("scroll-smooth");
  const ok = scrollToHash(hash, "smooth");
  if (ok) {
    history.replaceState(null, "", hash);
  }
  window.setTimeout(() => {
    document.documentElement.classList.remove("scroll-smooth");
  }, 800);
  return ok;
}
