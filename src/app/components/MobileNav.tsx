import { LayoutDashboard, FolderKanban, Users, Wallet, Target, BarChart3 } from "lucide-react";
import type { Page } from "../App";

interface MobileNavProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const items = [
  { id: "dashboard", label: "Início", icon: LayoutDashboard },
  { id: "projects", label: "Projetos", icon: FolderKanban },
  { id: "crm", label: "CRM", icon: Users },
  { id: "financial", label: "Finanças", icon: Wallet },
  { id: "goals", label: "Metas", icon: Target },
  { id: "reports", label: "Relatórios", icon: BarChart3 },
];

export function MobileNav({ currentPage, onNavigate }: MobileNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 flex md:hidden border-t safe-area-bottom no-print"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = currentPage === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as Page)}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors"
            style={{ color: active ? "var(--primary)" : "var(--muted-foreground)" }}
          >
            <Icon size={18} />
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 400 }}>{item.label}</span>
            {active && (
              <span className="absolute bottom-0 w-8 h-0.5 rounded-full" style={{ background: "var(--primary)" }} />
            )}
          </button>
        );
      })}
    </nav>
  );
}
