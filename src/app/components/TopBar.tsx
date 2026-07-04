import { useState, useRef, useEffect } from "react";
import { Search, Bell, HelpCircle, Plus, X, FolderKanban, Users, Lightbulb, Wallet, Calendar, FileText, Menu, ChevronDown } from "lucide-react";
import type { Page } from "../App";

const pageLabels: Record<Page, string> = {
  dashboard: "Dashboard",
  projects: "Projetos",
  ideas: "Banco de Ideias",
  crm: "CRM de Leads",
  financial: "Financeiro",
  agenda: "Agenda",
  platforms: "Plataformas",
  content: "Conteúdo",
  knowledge: "Conhecimento",
  goals: "Metas",
  reports: "Relatórios",
  settings: "Configurações",
};

const breadcrumbs: Partial<Record<Page, string>> = {
  projects: "Operacional",
  ideas: "Operacional",
  crm: "Operacional",
  financial: "Operacional",
  agenda: "Operacional",
  platforms: "Conteúdo",
  content: "Conteúdo",
  knowledge: "Conteúdo",
  goals: "Estratégia",
  reports: "Estratégia",
  settings: "Estratégia",
};

const quickActions = [
  { label: "Novo projeto", icon: FolderKanban, color: "#06B6D4", bg: "#E0F9FF" },
  { label: "Cadastrar lead", icon: Users, color: "#7C3AED", bg: "#F5F3FF" },
  { label: "Adicionar ideia", icon: Lightbulb, color: "#F59E0B", bg: "#FFFBEB" },
  { label: "Registrar receita", icon: Wallet, color: "#10B981", bg: "#ECFDF5" },
  { label: "Registrar despesa", icon: Wallet, color: "#EF4444", bg: "#FEF2F2" },
  { label: "Criar compromisso", icon: Calendar, color: "#7C3AED", bg: "#F5F3FF" },
  { label: "Adicionar conteúdo", icon: FileText, color: "#06B6D4", bg: "#E0F9FF" },
];

const notifications = [
  { id: 1, text: "Projeto Alpha está 3 dias atrasado", time: "5min", color: "#EF4444", unread: true },
  { id: 2, text: "Lead João Silva aguarda proposta", time: "1h", color: "#F59E0B", unread: true },
  { id: 3, text: "Meta Q2 atingiu 73% do objetivo", time: "2h", color: "#10B981", unread: true },
  { id: 4, text: "Reunião com Innovate em 30min", time: "30min", color: "#06B6D4", unread: false },
  { id: 5, text: "Fernanda enviou novo arquivo", time: "3h", color: "#7C3AED", unread: false },
];

interface TopBarProps {
  currentPage: Page;
  onMenuToggle: () => void;
  darkMode: boolean;
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
}

export function TopBar({ currentPage, onMenuToggle, darkMode }: TopBarProps) {
  const [showQuick, setShowQuick] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const quickRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useClickOutside(quickRef as React.RefObject<HTMLElement>, () => setShowQuick(false));
  useClickOutside(notifRef as React.RefObject<HTMLElement>, () => setShowNotifications(false));

  const unreadCount = notifications.filter(n => n.unread).length;
  const breadcrumb = breadcrumbs[currentPage];

  return (
    <header
      className="flex items-center justify-between border-b flex-shrink-0 relative z-20 no-print"
      style={{ height: 64, paddingLeft: 24, paddingRight: 24, background: "var(--card)", borderColor: "var(--border)" }}
    >
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu button */}
        <button
          onClick={onMenuToggle}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-muted md:hidden flex-shrink-0"
          style={{ color: "var(--muted-foreground)" }}
        >
          <Menu size={18} />
        </button>

        <div className="min-w-0">
          {breadcrumb && (
            <div className="text-xs hidden sm:block" style={{ color: "var(--muted-foreground)" }}>
              {breadcrumb} /
            </div>
          )}
          <h1 className="font-bold text-base leading-none" style={{ color: "var(--foreground)" }}>
            {pageLabels[currentPage]}
          </h1>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Search — desktop */}
        <div className="relative hidden lg:flex items-center">
          <Search size={13} className="absolute left-3" style={{ color: "var(--muted-foreground)" }} />
          <input
            type="text"
            placeholder="Buscar na plataforma..."
            className="pl-8 pr-3 py-2 rounded-xl text-sm outline-none border transition-all"
            style={{
              background: "var(--muted)",
              color: "var(--foreground)",
              borderColor: "var(--border)",
              width: 220,
            }}
            onFocus={(e) => { e.target.style.width = "280px"; e.target.style.borderColor = "var(--primary)"; }}
            onBlur={(e) => { e.target.style.width = "220px"; e.target.style.borderColor = "var(--border)"; }}
          />
        </div>

        {/* Mobile search button */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-muted lg:hidden"
          style={{ color: "var(--muted-foreground)" }}
        >
          <Search size={16} />
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowQuick(false); }}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-muted"
            style={{ color: "var(--muted-foreground)" }}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span
                className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
                style={{ background: "#EF4444", fontSize: 9 }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              className="absolute right-0 top-12 w-84 rounded-2xl shadow-2xl border overflow-hidden z-50"
              style={{ background: "var(--card)", borderColor: "var(--border)", width: 340 }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="font-bold text-sm" style={{ color: "var(--foreground)" }}>Notificações</div>
                <button className="text-xs font-medium" style={{ color: "var(--primary)" }}>Marcar todas como lidas</button>
              </div>
              <div className="max-h-80 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 px-4 py-3 border-b last:border-0 transition-colors hover:bg-muted cursor-pointer"
                    style={{ borderColor: "var(--border)", background: n.unread ? `${n.color}06` : "transparent" }}
                  >
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: n.unread ? n.color : "var(--border)" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>{n.text}</p>
                      <span className="text-xs mt-0.5 block" style={{ color: "var(--muted-foreground)" }}>há {n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Help */}
        <button
          className="w-9 h-9 rounded-xl hidden sm:flex items-center justify-center transition-colors hover:bg-muted"
          style={{ color: "var(--muted-foreground)" }}
        >
          <HelpCircle size={16} />
        </button>

        {/* Quick Action */}
        <div className="relative" ref={quickRef}>
          <button
            onClick={() => { setShowQuick(!showQuick); setShowNotifications(false); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90 shadow-sm"
            style={{ background: "linear-gradient(135deg, #06B6D4, #7C3AED)", color: "white" }}
          >
            {showQuick ? <X size={14} /> : <Plus size={14} />}
            <span className="hidden sm:inline">Novo</span>
          </button>

          {showQuick && (
            <div
              className="absolute right-0 top-12 w-56 rounded-2xl shadow-2xl border overflow-hidden z-50"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <div className="px-4 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="text-xs font-bold" style={{ color: "var(--muted-foreground)" }}>AÇÃO RÁPIDA</div>
              </div>
              {quickActions.map((a, i) => {
                const Icon = a.icon;
                return (
                  <button
                    key={i}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors hover:bg-muted"
                    style={{ color: "var(--foreground)" }}
                    onClick={() => setShowQuick(false)}
                  >
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: a.bg }}>
                      <Icon size={12} style={{ color: a.color }} />
                    </div>
                    {a.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Avatar */}
        <button
          className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl transition-colors hover:bg-muted"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow"
            style={{ background: "linear-gradient(135deg, #06B6D4, #7C3AED)" }}
          >
            D
          </div>
          <ChevronDown size={12} className="hidden sm:block" style={{ color: "var(--muted-foreground)" }} />
        </button>
      </div>

      {/* Mobile search bar */}
      {showSearch && (
        <div
          className="absolute top-full left-0 right-0 z-40 px-4 py-3 border-b lg:hidden"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
            <input
              autoFocus
              type="text"
              placeholder="Buscar na plataforma..."
              className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none border"
              style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--primary)" }}
            />
          </div>
        </div>
      )}
    </header>
  );
}
