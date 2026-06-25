import { Link, useLocation } from "wouter";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LogOut,
  User,
  LayoutDashboard,
  Calendar,
  ShoppingBag,
  Bell,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { useLogout } from "@workspace/api-client-react";
import logoImg from "@assets/LINE_1782305856031.png";

export function Navbar() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isOverDark, setIsOverDark] = useState(true);
  const headerRef = useRef<HTMLElement>(null);
  const logoutMutation = useLogout();

  const isHome = location === "/";
  const isTransparent = isHome && !scrolled;

  // Detect the background colour of the page section behind the navbar
  const checkBgBehindNav = useCallback(() => {
    const x = window.innerWidth / 2;
    const y = 70; // middle of navbar height
    const elements = document.elementsFromPoint(x, y);
    const navEl = headerRef.current;
    // Skip navbar itself and its descendants
    const pageEl = elements.find((el) => !navEl?.contains(el) && el !== navEl);
    if (!pageEl) return;

    let node: Element | null = pageEl;
    while (node && node !== document.documentElement) {
      const bg = window.getComputedStyle(node).backgroundColor;
      if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
        const nums = bg.match(/[\d.]+/g);
        if (nums && nums.length >= 3) {
          const [r, g, b] = nums.map(Number);
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          setIsOverDark(luminance < 0.55);
          return;
        }
      }
      node = node.parentElement;
    }
    // fallback: hero is dark
    setIsOverDark(true);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const newScrolled = window.scrollY > 40;
      setScrolled(newScrolled);
      // On home page, always stay dark/glass — no bg detection needed
      if (newScrolled && !isHome) checkBgBehindNav();
      else setIsOverDark(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [checkBgBehindNav, isHome]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {}
    logout();
    setLocation("/");
  };

  const navLinks = [
    { href: "/barbershops", label: "Zbulo" },
    { href: "/marketplace", label: "Dyqani" },
  ];

  const handleReklama = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location !== "/") {
      window.location.href = "/#reklama";
      return;
    }
    const el = document.getElementById("reklama");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  // When scrolled over a light section, the pill pill needs a dark bg so text is readable
  const onDark = isTransparent || (scrolled && isOverDark);
  // When scrolled over a light/white section
  const onLight = scrolled && !isOverDark;

  // Pill background when scrolled over light sections
  const scrolledPillBg = onLight
    ? "bg-white/95 backdrop-blur-xl shadow-lg shadow-black/12 border border-black/8"
    : "backdrop-blur-xl shadow-lg shadow-black/30 border border-white/8";

  return (
    <>
      {/* ── Main header ── */}
      <header
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          scrolled
            ? "py-1.5"
            : isTransparent
              ? "py-0"
              : "py-0 border-b border-border/20 bg-background/90 backdrop-blur-xl"
        }`}
      >
        <div
          className={`mx-auto transition-all duration-500 ${scrolled ? "max-w-7xl px-4" : "max-w-7xl px-6"}`}
        >
          <div
            className={`flex items-center justify-between transition-all duration-500 ${
              scrolled
                ? `${scrolledPillBg} py-2.5 rounded-2xl px-5`
                : "py-4"
            }`}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <img
                src={logoImg}
                alt="TRIM"
                className="h-8 w-auto object-contain transition-opacity duration-300 group-hover:opacity-80"
                style={{
                  filter:
                    onDark
                      ? "brightness(0) invert(1)"
                      : "brightness(0)",
                }}
              />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative text-sm font-medium transition-all duration-200 px-3.5 py-2 rounded-full group ${
                      onDark
                        ? isActive
                          ? "text-white bg-white/15 font-semibold"
                          : "text-white/75 hover:text-white hover:bg-white/10 active:bg-white/20"
                        : isActive
                          ? "text-foreground bg-black/8 font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-black/6 active:bg-black/10"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <a
                href="/#reklama"
                onClick={handleReklama}
                className={`relative text-sm font-medium transition-all duration-200 px-3.5 py-2 rounded-full cursor-pointer ${
                  onDark
                    ? "text-white/75 hover:text-white hover:bg-white/10 active:bg-white/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-black/6 active:bg-black/10"
                }`}
              >
                Reklama
              </a>
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <Link
                    href="/notifications"
                    className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                      onDark
                        ? "text-white/80 hover:text-white hover:bg-white/10 active:bg-white/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-black/6 active:bg-black/10"
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-background animate-pulse" />
                  </Link>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={`flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full transition-all duration-200 group ${
                          onDark
                            ? "hover:bg-white/10 active:bg-white/20"
                            : "hover:bg-black/6 active:bg-black/10"
                        }`}
                      >
                        <Avatar className="h-8 w-8 ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all duration-200">
                          <AvatarImage
                            src={user.avatarUrl || undefined}
                            alt={user.name}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={`hidden md:block text-sm font-medium max-w-[100px] truncate transition-colors duration-300 ${onDark ? "text-white" : "text-foreground"}`}
                        >
                          {user.name.split(" ")[0]}
                        </span>
                        <ChevronDown
                          className={`hidden md:block w-3.5 h-3.5 transition-colors ${onDark ? "text-white/60 group-hover:text-white" : "text-muted-foreground group-hover:text-foreground"}`}
                        />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-60 glass-strong border-black/8 rounded-2xl p-2 shadow-xl shadow-black/10 mt-2"
                      align="end"
                      sideOffset={8}
                    >
                      <div className="px-3 py-2.5 mb-1">
                        <p className="text-sm font-semibold">{user.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {user.email}
                        </p>
                        <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wider">
                          {user.role}
                        </span>
                      </div>
                      <DropdownMenuSeparator className="bg-black/6 my-1" />

                      {user.role === "admin" && (
                        <DropdownMenuItem
                          asChild
                          className="rounded-xl px-3 py-2.5 cursor-pointer hover:bg-black/5 focus:bg-black/5"
                        >
                          <Link
                            href="/admin"
                            className="flex items-center w-full gap-2.5"
                          >
                            <LayoutDashboard className="h-4 w-4 text-primary" />
                            <span>Paneli Admin</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {user.role === "owner" && (
                        <DropdownMenuItem
                          asChild
                          className="rounded-xl px-3 py-2.5 cursor-pointer hover:bg-black/5 focus:bg-black/5"
                        >
                          <Link
                            href="/dashboard"
                            className="flex items-center w-full gap-2.5"
                          >
                            <LayoutDashboard className="h-4 w-4 text-primary" />
                            <span>Paneli i Dyqanit</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        asChild
                        className="rounded-xl px-3 py-2.5 cursor-pointer hover:bg-black/5 focus:bg-black/5"
                      >
                        <Link
                          href="/appointments"
                          className="flex items-center w-full gap-2.5"
                        >
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Takimet e Mia</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        asChild
                        className="rounded-xl px-3 py-2.5 cursor-pointer hover:bg-black/5 focus:bg-black/5"
                      >
                        <Link
                          href="/orders"
                          className="flex items-center w-full gap-2.5"
                        >
                          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                          <span>Porositë e Mia</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        asChild
                        className="rounded-xl px-3 py-2.5 cursor-pointer hover:bg-black/5 focus:bg-black/5"
                      >
                        <Link
                          href="/profile"
                          className="flex items-center w-full gap-2.5"
                        >
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>Cilësimet e Profilit</span>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="bg-black/6 my-1" />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="rounded-xl px-3 py-2.5 cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-600"
                      >
                        <LogOut className="mr-2.5 h-4 w-4" />
                        <span>Dil</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className={`hidden md:inline-flex items-center btn-pill liquid-glass text-sm font-medium px-4 py-2 transition-all duration-200 hover:scale-[1.03] active:scale-95 ${
                      onDark
                        ? "text-white hover:bg-white/20"
                        : "text-foreground hover:bg-black/8"
                    }`}
                  >
                    Hyr
                  </Link>
                  <Link
                    href="/register"
                    className="btn-pill inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white text-sm font-semibold shadow-md shadow-primary/30 hover:shadow-lg hover:shadow-primary/40 hover:scale-[1.03] active:scale-95 transition-all duration-200"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Fillo
                  </Link>
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                className={`md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-full transition-all ${
                  onDark ? "hover:bg-white/10 active:bg-white/20" : "hover:bg-black/6 active:bg-black/10"
                }`}
                onClick={() => setMobileOpen((p) => !p)}
                aria-label="Menu"
              >
                <span
                  className={`block h-0.5 rounded-full transition-all duration-300 origin-center ${onDark ? "bg-white" : "bg-foreground"} ${mobileOpen ? "w-5 rotate-45 translate-y-2" : "w-4.5"}`}
                />
                <span
                  className={`block w-4.5 h-0.5 rounded-full transition-all duration-300 ${onDark ? "bg-white" : "bg-foreground"} ${mobileOpen ? "opacity-0 scale-x-0" : ""}`}
                />
                <span
                  className={`block h-0.5 rounded-full transition-all duration-300 origin-center ${onDark ? "bg-white" : "bg-foreground"} ${mobileOpen ? "w-5 -rotate-45 -translate-y-2" : "w-4.5"}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden mx-4 mt-2 glass-strong rounded-2xl overflow-hidden transition-all duration-300 ${mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
        >
          <div className="p-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  location === link.href
                    ? "text-foreground bg-primary/8 font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-black/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <a
              href="/#reklama"
              onClick={(e) => {
                setMobileOpen(false);
                handleReklama(e);
              }}
              className="px-4 py-3 rounded-xl text-sm font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-black/5"
            >
              Reklama
            </a>
            {!user && (
              <div className="flex gap-2 mt-2 pt-2 border-t border-black/6">
                <Link
                  href="/login"
                  className="flex-1 py-3 text-center text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl hover:bg-black/5 transition-all"
                >
                  Hyr
                </Link>
                <Link
                  href="/register"
                  className="btn-pill flex-1 py-3 text-center text-sm font-semibold bg-primary text-white"
                >
                  Regjistrohu
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Spacer — skip on home so hero starts from top */}
      {!isHome && <div className="h-16" />}
    </>
  );
}
