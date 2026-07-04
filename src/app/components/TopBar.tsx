import { useState, useRef, useEffect } from "react";
import { Search, Bell, HelpCircle, Plus, X, FolderKanban, Users, Lightbulb, Wallet, Calendar, FileText, Menu, ChevronDown, LogOut, Settings as SettingsIcon, Loader2 } from "lucide-react";
import type { User as FirebaseUser } from "firebase/auth";
import type { Page } from "../App";
import { globalSearch, fetchNotifications, type SearchResult, type NotificationItem } from "../../lib/api";

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

const quickActions: { label: string; icon: any; color: string; bg: string; page: Page }[] = [
  { label: "Novo projeto", icon: FolderKanban, color: "#06B6D4", bg: "#E0F9FF", page: "projects" },
  { label: "Cadastrar lead", icon: Users, color: "#7C3AED", bg: "#F5F3FF", page: "crm" },
  { label: "Adicionar ideia", icon: Lightbulb, color: "#F59E0B", bg: "#FFFBEB", page: "ideas" },
  { label: "Registrar receita/despesa", icon: Wallet, color: "#10B981", bg: "#ECFDF5", page: "financial" },
  { label: "Criar compromisso", icon: Calendar, color: "#7C3AED", bg: "#F5F3FF", page: "agenda" },
  { label: "Adicionar conteúdo", icon: FileText, color: "#06B6D4", bg: "#E0F9FF", page: "content" },
];

interface TopBarProps {
  currentPage: Page;
  onMenuToggle: () => void;
  darkMode: boolean;
  onNavigate: (page: Page) => void;
  user: FirebaseUser | null;
  onLogout: () => void;
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

export function TopBar({ currentPage, onMenuToggle, darkMode, onNavigate, user, onLogout }: TopBarProps) {
  const [showQuick, setShowQuick] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const quickRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useClickOutside(quickRef as React.RefObject<HTMLElement>, () => setShowQuick(false));
  useClickOutside(notifRef as React.RefObject<HTMLElement>, () => setShowNotifications(false));
  useClickOutside(avatarRef as React.RefObject<HTMLElement>, () => setShowAvatarMenu(false));
  useClickOutside(helpRef as React.RefObject<HTMLElement>, () => setShowHelp(false));
  useClickOutside(searchRef as React.RefObject<HTMLElement>, () => setShowResults(false));

  // Busca com debounce
  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        setResults(await globalSearch(query.trim()));
        setShowResults(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  function loadNotifications() {
    setNotifLoading(true);
    fetchNotifications()
      .then(setNotifications)
      .catch(() => setNotifications([]))
      .finally(() => setNotifLoading(false));
  }

  const visibleNotifications = notifications.filter((n) => !dismissedIds.includes(n.id));
  const unreadCount = visibleNotifications.length;
  const breadcrumb = breadcrumbs[currentPage];
  const displayName = user?.displayName || user?.email?.split("@")[0] || "Usuário";
  const initials = displayName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  function goToResult(r: SearchResult) {
    onNavigate(r.page as Page);
    setQuery("");
    setShowResults(false);
    setShowSearch(false);
  }

  return (
    <header
      className="flex items-center justify-between border-b flex-shrink-0 relative z-20 no-print"
      style={{ height: 64, paddingLeft: 24, paddingRight: 24, background: "var(--card)", borderColor: "var(--border)" }}
    >
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
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
        <div className="relative hidden lg:flex items-center" ref={searchRef}>
          <Search size={13} className="absolute left-3 z-10" style={{ color: "var(--muted-foreground)" }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={(e) => { e.target.style.width = "280px"; e.target.style.borderColor = "var(--primary)"; if (results.length) setShowResults(true); }}
            onBlur={(e) => { e.target.style.width = "220px"; }}
            placeholder="Buscar na plataforma..."
            className="pl-8 pr-3 py-2 rounded-xl text-sm outline-none border transition-all"
            style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)", width: 220 }}
          />
          {showResults && query.trim().length >= 2 && (
            <div className="absolute right-0 top-11 w-80 rounded-2xl shadow-2xl border overflow-hidden z-50" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              {searching && (
                <div className="px-4 py-3 text-xs flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}>
                  <Loader2 size={12} className="animate-spin" />Buscando...
                </div>
              )}
              {!searching && results.length === 0 && (
                <div className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>Nada encontrado.</div>
              )}
              {!searching && results.map((r) => (
                <button
                  key={`${r.page}-${r.id}`}
                  onClick={() => goToResult(r)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted border-b last:border-0"
                  style={{ borderColor: "var(--border)" }}
                >
                  <span className="text-base flex-shrink-0">{r.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{r.title}</div>
                    {r.subtitle && <div className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{r.subtitle}</div>}
                  </div>
                </button>
              ))}
            </div>
          )}
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
            onClick={() => { const next = !showNotifications; setShowNotifications(next); setShowQuick(false); setShowAvatarMenu(false); setShowHelp(false); if (next) loadNotifications(); }}
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
              className="absolute right-0 top-12 rounded-2xl shadow-2xl border overflow-hidden z-50"
              style={{ background: "var(--card)", borderColor: "var(--border)", width: 340 }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="font-bold text-sm" style={{ color: "var(--foreground)" }}>Notificações</div>
                {visibleNotifications.length > 0 && (
                  <button onClick={() => setDismissedIds(notifications.map((n) => n.id))} className="text-xs font-medium" style={{ color: "var(--primary)" }}>
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                {notifLoading && (
                  <div className="px-4 py-4 text-xs flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}>
                    <Loader2 size={12} className="animate-spin" />Carregando...
                  </div>
                )}
                {!notifLoading && visibleNotifications.length === 0 && (
                  <div className="px-4 py-6 text-xs text-center" style={{ color: "var(--muted-foreground)" }}>Nenhuma notificação por aqui. 🎉</div>
                )}
                {!notifLoading && visibleNotifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => { onNavigate(n.page as Page); setShowNotifications(false); }}
                    className="flex items-start gap-3 px-4 py-3 border-b last:border-0 transition-colors hover:bg-muted cursor-pointer"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: n.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>{n.text}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setDismissedIds((d) => [...d, n.id]); }} className="flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Help */}
        <div className="relative" ref={helpRef}>
          <button
            onClick={() => { setShowHelp(!showHelp); setShowQuick(false); setShowNotifications(false); setShowAvatarMenu(false); }}
            className="w-9 h-9 rounded-xl hidden sm:flex items-center justify-center transition-colors hover:bg-muted"
            style={{ color: "var(--muted-foreground)" }}
          >
            <HelpCircle size={16} />
          </button>
          {showHelp && (
            <div className="absolute right-0 top-12 w-64 rounded-2xl shadow-2xl border overflow-hidden z-50 p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="font-bold text-sm mb-1" style={{ color: "var(--foreground)" }}>Precisa de ajuda?</div>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Fale com o administrador do sistema ou mande um e-mail pra equipe técnica descrevendo o que está tentando fazer.
              </p>
            </div>
          )}
        </div>

        {/* Quick Action */}
        <div className="relative" ref={quickRef}>
          <button
            onClick={() => { setShowQuick(!showQuick); setShowNotifications(false); setShowAvatarMenu(false); setShowHelp(false); }}
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
                    onClick={() => { onNavigate(a.page); setShowQuick(false); }}
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
        <div className="relative" ref={avatarRef}>
          <button
            onClick={() => { setShowAvatarMenu(!showAvatarMenu); setShowQuick(false); setShowNotifications(false); setShowHelp(false); }}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl transition-colors hover:bg-muted"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow"
              style={{ background: "linear-gradient(135deg, #06B6D4, #7C3AED)" }}
            >
              {initials}
            </div>
            <ChevronDown size={12} className="hidden sm:block" style={{ color: "var(--muted-foreground)" }} />
          </button>

          {showAvatarMenu && (
            <div className="absolute right-0 top-12 w-56 rounded-2xl shadow-2xl border overflow-hidden z-50" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="text-sm font-bold truncate" style={{ color: "var(--foreground)" }}>{displayName}</div>
                <div className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{user?.email}</div>
              </div>
              <button
                onClick={() => { onNavigate("settings"); setShowAvatarMenu(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors hover:bg-muted"
                style={{ color: "var(--foreground)" }}
              >
                <SettingsIcon size={14} />Configurações
              </button>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors hover:bg-muted"
                style={{ color: "#EF4444" }}
              >
                <LogOut size={14} />Sair
              </button>
            </div>
          )}
        </div>
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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar na plataforma..."
              className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none border"
              style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--primary)" }}
            />
          </div>
          {query.trim().length >= 2 && (
            <div className="mt-2 rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              {searching && <div className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>Buscando...</div>}
              {!searching && results.length === 0 && <div className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>Nada encontrado.</div>}
              {!searching && results.map((r) => (
                <button
                  key={`${r.page}-${r.id}`}
                  onClick={() => goToResult(r)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted border-b last:border-0"
                  style={{ borderColor: "var(--border)", background: "var(--card)" }}
                >
                  <span className="text-base flex-shrink-0">{r.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{r.title}</div>
                    {r.subtitle && <div className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{r.subtitle}</div>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
