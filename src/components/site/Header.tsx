import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Search, LogOut } from "lucide-react";
import lambang from "@/assets/lambang.png";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { to: "/", label: "Beranda" },
  { to: "/layanan", label: "Layanan" },
  { to: "/data", label: "Data Terpadu" },
  { to: "/berita", label: "Berita" },
  { to: "/tentang", label: "Tentang" },
  { to: "/kontak", label: "Kontak" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      {/* Top utility bar */}
      <div className="hidden bg-primary text-primary-foreground md:block">
        <div className="container-page flex h-9 items-center justify-between text-xs">
          <span className="opacity-90">Portal Resmi Pemerintah Kabupaten Buton Selatan</span>
          <div className="flex items-center gap-5 opacity-90">
            <a href="#" className="hover:opacity-100">PPID</a>
            <a href="#" className="hover:opacity-100">LAPOR!</a>
            <a href="#" className="hover:opacity-100">Bahasa: ID</a>
          </div>
        </div>
      </div>

      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3">
          <img src={lambang} alt="Lambang" width={40} height={40} className="h-10 w-10" />
          <div className="leading-tight">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Pemerintah Kota</div>
            <div className="font-display text-base font-bold text-foreground">Kabupaten Buton Selatan</div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-md px-3 py-2 text-sm font-medium text-surface-foreground transition-colors hover:bg-primary-soft hover:text-primary"
              activeProps={{ className: "bg-primary-soft text-primary" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            aria-label="Cari"
            className="hidden md:inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-surface-foreground hover:bg-muted"
          >
            <Search className="h-4 w-4" />
          </button>
          {isAdmin && (
            <Link
              to="/admin"
              className="hidden md:inline-flex h-10 items-center rounded-md border border-border px-3 text-sm font-medium text-surface-foreground hover:bg-muted"
            >
              Admin OPD
            </Link>
          )}
          {user ? (
            <button
              onClick={() => signOut()}
              className="hidden md:inline-flex h-10 items-center gap-1.5 rounded-md bg-gradient-primary px-4 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95"
            >
              <LogOut className="h-4 w-4" /> Keluar
            </button>
          ) : (
            <Link
              to="/auth"
              className="hidden md:inline-flex h-10 items-center rounded-md bg-gradient-primary px-4 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95"
            >
              Masuk Akun
            </Link>
          )}
          <button
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-border"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="lg:hidden border-t border-border bg-background">
          <div className="container-page flex flex-col py-2">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                activeOptions={{ exact: item.to === "/" }}
                className="rounded-md px-3 py-3 text-sm font-medium text-surface-foreground hover:bg-muted"
                activeProps={{ className: "bg-primary-soft text-primary" }}
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <button
                onClick={() => { signOut(); setOpen(false); }}
                className="mt-2 inline-flex h-11 items-center justify-center rounded-md bg-gradient-primary text-sm font-semibold text-primary-foreground"
              >
                Keluar
              </button>
            ) : (
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="mt-2 inline-flex h-11 items-center justify-center rounded-md bg-gradient-primary text-sm font-semibold text-primary-foreground"
              >
                Masuk Akun
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
