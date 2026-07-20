import { useState, useEffect } from "react";

export function useIsMobileApp() {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return Boolean((window as any).Capacitor) || window.innerWidth < 768;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(Boolean((window as any).Capacitor) || window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}
