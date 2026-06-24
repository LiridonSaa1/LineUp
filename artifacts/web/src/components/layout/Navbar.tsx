import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
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
  const logoutMutation = useLogout();

  const isHome = location === "/";
  const isTransparent = isHome && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  return (
    <>
      {/* ── Main header ── */}
      <header
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
                ? "backdrop-blur-xl shadow-lg shadow-black/30 border border-white/8 py-2.5 rounded-2xl px-5"
                : "py-4"
            }`}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/25 group-hover:shadow-primary/40 transition-shadow duration-300">
                <img src={logoImg} alt="TRIM" className="w-5 h-5 object-contain" style={{ filter: "brightness(0) invert(1)" }} />
              </div>
              <span
                className={`text-xl font-bold tracking-tight transition-colors duration-300 ${isTransparent || scrolled ? "text-white" : "text-foreground"}`}
              >
                TRIM<span className="text-primary">.</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative text-sm font-medium transition-colors duration-200 group ${
                    isTransparent || scrolled
                      ? location === link.href
                        ? "text-white font-semibold"
                        : "text-white/70 hover:text-white"
                      : location === link.href
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute -bottom-0.5 left-0 h-[1.5px] rounded-full transition-all duration-300 ${
                      location === link.href
                        ? "w-full"
                        : "w-0 group-hover:w-full"
                    } ${isTransparent || scrolled ? "bg-white" : "bg-primary"}`}
                  />
                </Link>
              ))}
              <a
                href="/#reklama"
                onClick={handleReklama}
                className={`relative text-sm font-medium transition-colors duration-200 group cursor-pointer ${
                  isTransparent || scrolled
                    ? "text-white/70 hover:text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Reklama
                <span className={`absolute -bottom-0.5 left-0 h-[1.5px] rounded-full transition-all duration-300 w-0 group-hover:w-full ${isTransparent || scrolled ? "bg-white" : "bg-primary"}`} />
              </a>
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <Link
                    href="/notifications"
                    className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                      isTransparent
                        ? "text-white/80 hover:text-white hover:bg-white/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-black/5"
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-background animate-pulse" />
                  </Link>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={`flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full transition-all duration-200 group ${
                          isTransparent
                            ? "hover:bg-white/10"
                            : "hover:bg-black/5"
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
                          className={`hidden md:block text-sm font-medium max-w-[100px] truncate transition-colors duration-300 ${isTransparent ? "text-white" : "text-foreground"}`}
                        >
                          {user.name.split(" ")[0]}
                        </span>
                        <ChevronDown
                          className={`hidden md:block w-3.5 h-3.5 transition-colors ${isTransparent ? "text-white/60 group-hover:text-white" : "text-muted-foreground group-hover:text-foreground"}`}
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
                    className={`hidden md:inline-flex items-center btn-pill liquid-glass text-sm font-medium px-4 py-2 ${
                      isTransparent || scrolled
                        ? "text-white"
                        : "text-foreground"
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
                  isTransparent ? "hover:bg-white/10" : "hover:bg-black/5"
                }`}
                onClick={() => setMobileOpen((p) => !p)}
                aria-label="Menu"
              >
                <span
                  className={`block h-0.5 rounded-full transition-all duration-300 origin-center ${isTransparent ? "bg-white" : "bg-foreground"} ${mobileOpen ? "w-5 rotate-45 translate-y-2" : "w-4.5"}`}
                />
                <span
                  className={`block w-4.5 h-0.5 rounded-full transition-all duration-300 ${isTransparent ? "bg-white" : "bg-foreground"} ${mobileOpen ? "opacity-0 scale-x-0" : ""}`}
                />
                <span
                  className={`block h-0.5 rounded-full transition-all duration-300 origin-center ${isTransparent ? "bg-white" : "bg-foreground"} ${mobileOpen ? "w-5 -rotate-45 -translate-y-2" : "w-4.5"}`}
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
              onClick={(e) => { setMobileOpen(false); handleReklama(e); }}
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
