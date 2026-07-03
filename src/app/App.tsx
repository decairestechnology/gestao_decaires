import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { MobileNav } from "./components/MobileNav";
import { Dashboard } from "./components/Dashboard";
import { Projects } from "./components/Projects";
import { Ideas } from "./components/Ideas";
import { CRM } from "./components/CRM";
import { Financial } from "./components/Financial";
import { Agenda } from "./components/Agenda";
import { Platforms } from "./components/Platforms";
import { Content } from "./components/Content";
import { Knowledge } from "./components/Knowledge";
import { Goals } from "./components/Goals";
import { Reports } from "./components/Reports";
import { Settings } from "./components/Settings";
import { useAuth } from "./auth/AuthContext";
import { Login } from "./auth/Login";

export type Page =
  | "dashboard" | "projects" | "ideas" | "crm" | "financial" | "agenda"
  | "platforms" | "content" | "knowledge" | "goals" | "reports" | "settings";

export default function App() {
  const { user, loading, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "var(--background)" }}>
        <Loader2 size={20} className="animate-spin" style={{ color: "var(--muted-foreground)" }} />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard": return <Dashboard onNavigate={setCurrentPage} />;
      case "projects": return <Projects />;
      case "ideas": return <Ideas />;
      case "crm": return <CRM />;
      case "financial": return <Financial />;
      case "agenda": return <Agenda />;
      case "platforms": return <Platforms />;
      case "content": return <Content />;
      case "knowledge": return <Knowledge />;
      case "goals": return <Goals />;
      case "reports": return <Reports />;
      case "settings": return <Settings darkMode={darkMode} onToggleDark={() => setDarkMode(!darkMode)} />;
      default: return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)", fontFamily: "'Manrope', 'Inter', system-ui, sans-serif" }}>
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Sidebar — hidden on mobile unless open */}
      <div
        className={`fixed md:relative inset-y-0 left-0 z-50 md:z-auto transition-transform duration-300 md:translate-x-0 ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
        style={{ height: "100%", flexShrink: 0 }}
      >
        <Sidebar
          currentPage={currentPage}
          onNavigate={(page) => { setCurrentPage(page); setMobileSidebarOpen(false); }}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(!darkMode)}
          user={user}
          onLogout={logout}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar
          currentPage={currentPage}
          onMenuToggle={() => setMobileSidebarOpen(true)}
          darkMode={darkMode}
        />
        <main className="flex-1 overflow-hidden pb-16 md:pb-0">
          {renderPage()}
        </main>
        {/* Mobile bottom nav */}
        <MobileNav currentPage={currentPage} onNavigate={setCurrentPage} />
      </div>
    </div>
  );
}
