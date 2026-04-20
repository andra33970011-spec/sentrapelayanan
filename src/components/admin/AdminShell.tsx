import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LayoutDashboard, Inbox, Users, Settings, ChevronRight } from "lucide-react";
import { OPD_LIST } from "@/data/admin-mock";
import { setOpdAktif, useAdminStore } from "@/store/admin-store";
import lambang from "@/assets/lambang.png";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin", label: "Permohonan", icon: Inbox, exact: true, hash: "tabel" },
];

export function AdminShell({
  children,
  breadcrumb,
}: {
  children: ReactNode;
  breadcrumb?: { label: string; to?: string }[];
}) {
  const { opdAktifId } = useAdminStore();
  const opd = OPD_LIST.find((o) => o.id === opdAktifId)!;

  return (
    <div className="min-h-screen bg-surface">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src={lambang} alt="" className="h-8 w-8" />
            <div className="hidden sm:block leading-tight">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Admin OPD</div>
              <div className="font-display text-sm font-bold">Kabupaten Buton Selatan</div>
            </div>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <label className="hidden sm:block text-xs text-muted-foreground">OPD aktif</label>
            <select
              value={opdAktifId}
              onChange={(e) => setOpdAktif(e.target.value)}
              className="h-9 rounded-md border border-border bg-background px-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Pilih OPD"
            >
              {OPD_LIST.map((o) => (
                <option key={o.id} value={o.id}>{o.singkatan}</option>
              ))}
            </select>
            <div className="hidden md:flex h-9 items-center gap-2 rounded-md bg-primary-soft px-3 text-xs font-semibold text-primary">
              <span className="h-2 w-2 rounded-full bg-success" />
              Mode Demo
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-background min-h-[calc(100vh-3.5rem)] sticky top-14">
          <div className="p-4">
            <div className="rounded-lg bg-gradient-primary p-3 text-primary-foreground shadow-soft">
              <div className="text-[10px] uppercase opacity-80">OPD</div>
              <div className="text-sm font-semibold leading-tight">{opd.nama}</div>
            </div>
          </div>
          <nav className="px-2 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                activeOptions={{ exact: true }}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-surface-foreground hover:bg-primary-soft hover:text-primary"
                activeProps={{ className: "bg-primary-soft text-primary" }}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
            <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground cursor-not-allowed">
              <Users className="h-4 w-4" />
              Petugas <span className="ml-auto text-[10px]">soon</span>
            </div>
            <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground cursor-not-allowed">
              <Settings className="h-4 w-4" />
              Pengaturan <span className="ml-auto text-[10px]">soon</span>
            </div>
          </nav>
          <div className="mt-auto p-4 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-primary">← Kembali ke Portal Warga</Link>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          {breadcrumb && breadcrumb.length > 0 && (
            <div className="border-b border-border bg-background/60 px-4 py-2 md:px-6">
              <nav className="flex items-center gap-1 text-xs text-muted-foreground">
                <Link to="/admin" className="hover:text-primary">Admin</Link>
                {breadcrumb.map((b, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <ChevronRight className="h-3 w-3" />
                    {b.to ? (
                      <Link to={b.to} className="hover:text-primary">{b.label}</Link>
                    ) : (
                      <span className="text-foreground font-medium">{b.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            </div>
          )}
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  tone = "default",
  icon: Icon,
}: {
  label: string;
  value: string | number;
  delta?: string;
  tone?: "default" | "accent" | "gold" | "success" | "destructive";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const toneClass = {
    default: "bg-primary-soft text-primary",
    accent: "bg-accent/15 text-accent",
    gold: "bg-gold/20 text-gold-foreground",
    success: "bg-success/15 text-success",
    destructive: "bg-destructive/15 text-destructive",
  }[tone];
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {Icon && (
          <span className={`grid h-8 w-8 place-items-center rounded-md ${toneClass}`}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="mt-3 font-display text-2xl font-bold text-foreground">{value}</div>
      {delta && <div className="mt-1 text-xs text-muted-foreground">{delta}</div>}
    </div>
  );
}
