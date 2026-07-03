import {
  LayoutDashboard, FolderKanban, Lightbulb, Users, Wallet, Calendar,
  Globe, FileText, BookOpen, Target, BarChart3, Settings,
  ChevronLeft, ChevronRight, LogOut, Sun, Moon, Zap
} from "lucide-react";
import type { User } from "firebase/auth";
import type { Page } from "../App";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  collapsed: boolean;
  onToggle: () => void;
  darkMode: boolean;
  onToggleDark: () => void;
  user: User;
  onLogout: () => void;
}

const navGroups = [
  {
    group: "Principal",
    items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    group: "Operacional",
    items: [
      { id: "projects", label: "Projetos", icon: FolderKanban },
      { id: "ideas", label: "Banco de Ideias", icon: Lightbulb },
      { id: "crm", label: "CRM de Leads", icon: Users },
      { id: "financial", label: "Financeiro", icon: Wallet },
      { id: "agenda", label: "Agenda", icon: Calendar },
    ],
  },
  {
    group: "Conteúdo",
    items: [
      { id: "platforms", label: "Plataformas", icon: Globe },
      { id: "content", label: "Conteúdo", icon: FileText },
      { id: "knowledge", label: "Conhecimento", icon: BookOpen },
    ],
  },
  {
    group: "Estratégia",
    items: [
      { id: "goals", label: "Metas", icon: Target },
      { id: "reports", label: "Relatórios", icon: BarChart3 },
      { id: "settings", label: "Configurações", icon: Settings },
    ],
  },
];

export function Sidebar({ currentPage, onNavigate, collapsed, onToggle, darkMode, onToggleDark, user, onLogout }: SidebarProps) {
  const w = collapsed ? 64 : 240;
  const displayName = user.displayName || user.email?.split("@")[0] || "Usuário";
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside
      className="flex flex-col h-full border-r overflow-hidden transition-[width] duration-300 ease-in-out"
      style={{ width: w, minWidth: w, maxWidth: w, background: "var(--sidebar)", borderColor: "var(--sidebar-border)" }}
    >
      {/* Logo */}
      <div
        className="flex items-center justify-between border-b flex-shrink-0"
        style={{ height: 64, padding: collapsed ? "0 16px" : "0 16px", borderColor: "var(--sidebar-border)" }}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ background: "linear-gradient(135deg, #06B6D4 0%, #7C3AED 100%)" }}
            >
              <Zap size={15} color="white" />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-sm tracking-tight leading-none" style={{ color: "var(--sidebar-foreground)" }}>
                DeCaires
              </div>
              <div className="text-xs leading-none mt-0.5 font-medium" style={{ color: "var(--muted-foreground)" }}>
                Technology
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto shadow-sm"
            style={{ background: "linear-gradient(135deg, #06B6D4 0%, #7C3AED 100%)" }}
          >
            <Zap size={15} color="white" />
          </div>
        )}
        <button
          onClick={onToggle}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-80 flex-shrink-0"
          style={{
            background: "var(--muted)",
            color: "var(--muted-foreground)",
            marginLeft: collapsed ? "auto" : "8px",
          }}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3" style={{ scrollbarWidth: "none", padding: collapsed ? "12px 8px" : "12px 10px" }}>
        {navGroups.map((group) => (
          <div key={group.group} className="mb-4">
            {!collapsed && (
              <div
                className="px-2 mb-1.5 text-xs font-bold tracking-widest uppercase"
                style={{ color: "var(--muted-foreground)", fontSize: 9, letterSpacing: "0.08em" }}
              >
                {group.group}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id as Page)}
                  title={collapsed ? item.label : undefined}
                  className="w-full flex items-center rounded-lg transition-all duration-150 group relative mb-0.5"
                  style={{
                    height: 36,
                    padding: collapsed ? "0 10px" : "0 10px",
                    justifyContent: collapsed ? "center" : "flex-start",
                    gap: collapsed ? 0 : 10,
                    background: active ? "var(--sidebar-accent)" : "transparent",
                    color: active ? "var(--sidebar-accent-foreground)" : "var(--sidebar-foreground)",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = "var(--muted)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {active && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                      style={{ background: "var(--primary)" }}
                    />
                  )}
                  <Icon
                    size={15}
                    style={{
                      color: active ? "var(--primary)" : "var(--muted-foreground)",
                      flexShrink: 0,
                      transition: "color 0.15s",
                    }}
                  />
                  {!collapsed && (
                    <span className="text-sm font-medium truncate flex-1 text-left" style={{ color: active ? "var(--sidebar-foreground)" : "var(--sidebar-foreground)", opacity: active ? 1 : 0.75 }}>
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="flex-shrink-0 border-t" style={{ borderColor: "var(--sidebar-border)", padding: collapsed ? "12px 8px" : "12px 10px" }}>
        {/* Dark mode toggle */}
        <button
          onClick={onToggleDark}
          className="w-full flex items-center rounded-lg transition-all hover:opacity-80 mb-2"
          style={{
            height: 34,
            padding: collapsed ? "0 10px" : "0 10px",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: collapsed ? 0 : 10,
            background: "var(--muted)",
            color: "var(--muted-foreground)",
          }}
        >
          {darkMode ? <Sun size={14} /> : <Moon size={14} />}
          {!collapsed && <span className="text-xs font-medium">{darkMode ? "Modo claro" : "Modo escuro"}</span>}
        </button>

        {/* User profile */}
        {!collapsed ? (
          <div
            className="flex items-center gap-2.5 rounded-xl p-2.5 mt-1"
            style={{ background: "var(--muted)" }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow"
              style={{ background: "linear-gradient(135deg, #06B6D4, #7C3AED)" }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold truncate" style={{ color: "var(--sidebar-foreground)" }}>
                {displayName}
              </div>
              <div className="text-xs truncate" style={{ color: "var(--muted-foreground)", fontSize: 10 }}>
                {user.email}
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-6 h-6 flex items-center justify-center rounded-md transition-colors hover:bg-destructive/10 flex-shrink-0"
              style={{ color: "var(--muted-foreground)" }}
            >
              <LogOut size={12} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow"
              style={{ background: "linear-gradient(135deg, #06B6D4, #7C3AED)" }}
            >
              {initials}
            </div>
            <button onClick={onLogout} className="w-6 h-6 flex items-center justify-center rounded-md" style={{ color: "var(--muted-foreground)" }}>
              <LogOut size={12} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
