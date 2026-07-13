import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  ShoppingCart,
  Bell,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { useLogout } from "@workspace/api-client-react";
import { useCart } from "@/context/CartContext";
import logoImg from "@assets/LINE_(2)_1782421072087.png";

export function Navbar() {
  const { user, logout } = useAuth();
  const { count: cartCount } = useCart();
  const [location, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const logoutMutation = useLogout();

  const isHome = location === "/";
  const isBookingPage = location.startsWith("/book/");
  const isBarbershopsPage = location === "/barbershops" || location.startsWith("/barbershops/") || isBookingPage;
  const usesOverlayNav = isHome || isBarbershopsPage || isBookingPage;
  // Show dark pill when scrolled OR on pages without a hero behind the nav.
  const hasBg = scrolled || !usesOverlayNav;

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      if (window.scrollY <= 40 && isHome) setActiveSection("");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  // Scroll-spy
  useEffect(() => {
    if (!isHome) {
      setActiveSection("");
      return;
    }
    const sectionIds = [
      "si-funksionon",
      "vleresuar",
      "pse-lineup",
      "shop",
      "disponueshem",
      "reklama",
      "kontakt",
    ];
    const observers: IntersectionObserver[] = [];
    const ratios = new Map<string, number>();
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          ratios.set(id, entry.intersectionRatio);
          let best = "";
          let bestRatio = 0;
          ratios.forEach((r, sid) => {
            if (r > bestRatio) {
              bestRatio = r;
              best = sid;
            }
          });
          if (bestRatio > 0.1) setActiveSection(best);
        },
        {
          threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
          rootMargin: "-80px 0px 0px 0px",
        },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [isHome, location]);

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

  const scrollToSection = (id: string) => {
    if (id === "home") {
      if (location !== "/") { setLocation("/"); return; }
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (location !== "/") {
      window.location.href = `/#${id}`;
      return;
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleReklama = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location !== "/") {
      window.location.href = "/#reklama";
      return;
    }
    scrollToSection("reklama");
  };

  // Nav sections
  const leftSections = [
    { id: "home", label: "Home" },
    { id: "si-funksionon", label: "Si Funksionon" },
    { id: "vleresuar", label: "Top 10 berberët" },
  ];
  const rightSections = [
    { id: "disponueshem", label: "I disponueshëm në" },
    { id: "kontakt", label: "Na kontaktoni" },
  ];
  const leftPageLinks = [
    { href: "/", label: "Home", onClick: (e: React.MouseEvent) => { e.preventDefault(); if (location === "/") window.scrollTo({ top: 0, behavior: "smooth" }); else setLocation("/"); } },
    { href: "/#si-funksionon", label: "Si Funksionon", onClick: (e: React.MouseEvent) => { e.preventDefault(); scrollToSection("si-funksionon"); } },
    { href: "/#vleresuar", label: "Top 10 berberët", onClick: (e: React.MouseEvent) => { e.preventDefault(); scrollToSection("vleresuar"); } },
  ];
  const rightPageLinks = [
    { href: "/#disponueshem", label: "I disponueshëm në", onClick: (e: React.MouseEvent) => { e.preventDefault(); scrollToSection("disponueshem"); } },
    { href: "/#kontakt", label: "Na kontaktoni", onClick: (e: React.MouseEvent) => { e.preventDefault(); scrollToSection("kontakt"); } },
  ];

  const sectionIsActive = (id: string) =>
    id === "home" ? activeSection === "" : activeSection === id;

  const linkCls = (isActive: boolean) =>
    `text-sm font-medium px-3 py-1.5 rounded-full cursor-pointer whitespace-nowrap border border-transparent transition-all duration-200 nav-link-glass text-white ${
      isActive ? "is-active font-semibold" : "text-white/70 hover:text-white"
    }`;

  const pageLinkCls = (isCurrent: boolean) =>
    `text-sm font-medium px-3 py-1.5 rounded-full whitespace-nowrap border border-transparent transition-all duration-200 nav-link-glass text-white ${
      isCurrent ? "is-active font-semibold" : "text-white/70 hover:text-white"
    }`;
  const userRole = user?.role as string | undefined;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${hasBg ? "py-2" : "py-3"}`}
      >
        <div
          className={`mx-auto transition-all duration-500 ${hasBg ? "max-w-7xl px-4" : "max-w-[1400px] px-6"}`}
        >
          {/* ── Desktop: always 3-col centered logo ── */}
          <div
            className={`hidden md:grid grid-cols-[1fr_auto_1fr] items-center transition-all duration-500 ${
              hasBg
                ? "bg-zinc-900/85 backdrop-blur-xl shadow-lg shadow-black/30 border border-white/8 rounded-2xl px-5 py-1"
                : "px-2 py-0"
            }`}
          >
            {/* LEFT nav */}
            <nav className="flex items-center justify-end gap-0.5">
              {isHome
                ? leftSections.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => scrollToSection(s.id)}
                      className={linkCls(sectionIsActive(s.id))}
                    >
                      {s.label}
                    </button>
                  ))
                : leftPageLinks.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={l.onClick}
                      className={pageLinkCls(location === l.href)}
                    >
                      {l.label}
                    </Link>
                  ))}
              {/* Always-visible: Barbershops */}
              <Link
                href="/barbershops"
                className={pageLinkCls(isBarbershopsPage)}
              >
                Barbershops
              </Link>
            </nav>

            {/* CENTER: logo — always 100px */}
            <div className="flex items-center justify-center px-8">
              <button
                onClick={() => scrollToSection("home")}
                className="flex items-center justify-center group"
                aria-label="Home"
              >
                <img
                  src={logoImg}
                  alt="Line UP"
                  className="h-[100px] w-auto object-contain transition-opacity duration-300 group-hover:opacity-70"
                  style={{ filter: "brightness(0) invert(1)" }}
                />
              </button>
            </div>

            {/* RIGHT nav + auth */}
            <nav className="flex items-center justify-start gap-0.5">
              {/* Always-visible: Dyqani */}
              <Link
                href="/marketplace"
                className={pageLinkCls(location === "/marketplace")}
              >
                Dyqani
              </Link>
              {isHome
                ? rightSections.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => scrollToSection(s.id)}
                      className={linkCls(sectionIsActive(s.id))}
                    >
                      {s.label}
                    </button>
                  ))
                : rightPageLinks.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className={pageLinkCls(location === l.href)}
                      onClick={l.onClick}
                    >
                      {l.label}
                    </Link>
                  ))}

              {/* Auth */}
              <div className="flex items-center gap-2 ml-3">
                {/* Cart icon */}
                <Link
                  href="/marketplace"
                  className="relative w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
                  aria-label="Shporta"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center leading-none ring-2 ring-zinc-900 animate-bounce-once">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </Link>
                {user ? (
                  <>
                    <Link
                      href="/notifications"
                      className="relative w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
                    >
                      <Bell className="w-4 h-4" />
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-zinc-900 animate-pulse" />
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full hover:bg-white/10 active:bg-white/20 transition-all duration-200 group">
                          <Avatar className="h-8 w-8 ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all">
                            <AvatarImage
                              src={user.avatarUrl || undefined}
                              alt={user.name}
                            />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="hidden md:block text-sm font-medium text-white max-w-[100px] truncate">
                            {user.name.split(" ")[0]}
                          </span>
                          <ChevronDown className="hidden md:block w-3.5 h-3.5 text-white/60 group-hover:text-white transition-colors" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="w-60 glass-strong border-black/8 rounded-2xl p-2 shadow-xl mt-2"
                        align="end"
                        sideOffset={8}
                      >
                        <div className="px-3 py-2.5 mb-1">
                          <p className="text-sm font-semibold">{user.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {user.email}
                          </p>
                          <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wider">
                            {userRole}
                          </span>
                        </div>
                        <DropdownMenuSeparator className="bg-black/6 my-1" />
                        {userRole === "admin" && (
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
                        {userRole === "owner" && (
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
                        {userRole === "barber" && (
                          <DropdownMenuItem
                            asChild
                            className="rounded-xl px-3 py-2.5 cursor-pointer hover:bg-black/5 focus:bg-black/5"
                          >
                            <Link
                              href="/barber"
                              className="flex items-center w-full gap-2.5"
                            >
                              <LayoutDashboard className="h-4 w-4 text-primary" />
                              <span>Paneli i Berberit</span>
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          asChild
                          className="rounded-xl px-3 py-2.5 cursor-pointer hover:bg-primary/10 focus:bg-primary/10"
                        >
                          <Link
                            href="/me"
                            className="flex items-center w-full gap-2.5"
                          >
                            <LayoutDashboard className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-primary">Paneli Im</span>
                          </Link>
                        </DropdownMenuItem>
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
                  <>
                    <Link
                      href="/login"
                      className="hidden md:inline-flex items-center btn-pill liquid-glass text-sm font-medium px-4 py-2 text-white hover:bg-white/20 transition-all duration-200 hover:scale-[1.03] active:scale-95"
                    >
                      Hyr
                    </Link>
                    <Link
                      href="/register"
                      className="btn-pill inline-flex items-center gap-1.5 px-5 py-2 bg-primary text-white text-sm font-semibold shadow-md shadow-primary/30 hover:shadow-lg hover:shadow-primary/40 hover:scale-[1.03] active:scale-95 transition-all duration-200"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Fillo
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>

          {/* ── Mobile ── */}
          <div
            className={`md:hidden flex items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-500 ${hasBg ? "bg-zinc-900/85 backdrop-blur-xl shadow-lg shadow-black/30 border border-white/8" : ""}`}
          >
            <button
              onClick={() => scrollToSection("home")}
              className="flex items-center group"
            >
              <img
                src={logoImg}
                alt="Line UP"
                className="h-12 w-auto object-contain group-hover:opacity-70 transition-opacity"
                style={{ filter: "brightness(0) invert(1)" }}
              />
            </button>
            <div className="flex items-center gap-2">
              <Link
                href="/marketplace"
                className="relative w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-all"
                aria-label="Shporta"
              >
                <ShoppingCart className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-0.5 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none ring-2 ring-zinc-900">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
              {user && (
                <Link
                  href="/notifications"
                  className="relative w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full ring-2 ring-zinc-900 animate-pulse" />
                </Link>
              )}
              <button
                className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-full hover:bg-white/10 transition-all"
                onClick={() => setMobileOpen((p) => !p)}
                aria-label="Menu"
              >
                <span
                  className={`block h-0.5 bg-white rounded-full transition-all duration-300 origin-center ${mobileOpen ? "w-5 rotate-45 translate-y-2" : "w-4.5"}`}
                />
                <span
                  className={`block w-4.5 h-0.5 bg-white rounded-full transition-all duration-300 ${mobileOpen ? "opacity-0 scale-x-0" : ""}`}
                />
                <span
                  className={`block h-0.5 bg-white rounded-full transition-all duration-300 origin-center ${mobileOpen ? "w-5 -rotate-45 -translate-y-2" : "w-4.5"}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden mx-4 mt-1 rounded-2xl overflow-hidden transition-all duration-300 ${mobileOpen ? "max-h-[520px] opacity-100" : "max-h-0 opacity-0"}`}
          style={{
            background: "rgba(15,15,20,0.82)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
          }}
        >
          <div className="p-3 flex flex-col gap-1">
            {isHome
              ? [...leftSections, ...rightSections].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setMobileOpen(false); scrollToSection(s.id); }}
                    className={`text-sm font-medium px-4 py-2.5 rounded-full cursor-pointer text-left border transition-all duration-200 nav-link-glass ${
                      sectionIsActive(s.id)
                        ? "is-active font-semibold text-white border-white/15 bg-white/10"
                        : "text-white/70 hover:text-white border-transparent hover:bg-white/8"
                    }`}
                  >
                    {s.label}
                  </button>
                ))
              : [...leftPageLinks, ...rightPageLinks].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={(e) => { l.onClick?.(e as any); setMobileOpen(false); }}
                    className={`text-sm font-medium px-4 py-2.5 rounded-full border transition-all duration-200 nav-link-glass ${
                      location === l.href
                        ? "is-active font-semibold text-white border-white/15 bg-white/10"
                        : "text-white/70 hover:text-white border-transparent hover:bg-white/8"
                    }`}
                  >
                    {l.label}
                  </Link>
                ))}
            {/* Always-visible fixed links */}
            <Link
              href="/barbershops"
              onClick={() => setMobileOpen(false)}
              className={`text-sm font-medium px-4 py-2.5 rounded-full border transition-all duration-200 nav-link-glass ${
                isBarbershopsPage
                  ? "is-active font-semibold text-white border-white/15 bg-white/10"
                  : "text-white/70 hover:text-white border-transparent hover:bg-white/8"
              }`}
            >
              Barbershops
            </Link>
            <Link
              href="/marketplace"
              onClick={() => setMobileOpen(false)}
              className={`text-sm font-medium px-4 py-2.5 rounded-full border transition-all duration-200 nav-link-glass ${
                location === "/marketplace"
                  ? "is-active font-semibold text-white border-white/15 bg-white/10"
                  : "text-white/70 hover:text-white border-transparent hover:bg-white/8"
              }`}
            >
              Dyqani
            </Link>

            {/* Auth buttons */}
            {!user && (
              <div className="flex gap-2 mt-2 pt-2 border-t border-white/8">
                <Link
                  href="/login"
                  className="btn-pill flex-1 py-2.5 text-center text-sm font-medium liquid-glass text-white hover:bg-white/20 transition-all duration-200"
                >
                  Hyr
                </Link>
                <Link
                  href="/register"
                  className="btn-pill flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 bg-primary text-white text-sm font-semibold shadow-md shadow-primary/30 transition-all duration-200"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Fillo
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Spacer only when the page content should start below the fixed nav. */}
      {!usesOverlayNav && <div className="h-[124px]" />}
    </>
  );
}
