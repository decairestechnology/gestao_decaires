import { useState } from "react";
import { User, Building, Users, Shield, Bell, Plug, Lock, Palette, CreditCard, ChevronRight, Check, Sun, Moon } from "lucide-react";

const tabs = [
  { id: "profile", label: "Perfil", icon: User },
  { id: "company", label: "Empresa", icon: Building },
  { id: "users", label: "Usuários", icon: Users },
  { id: "permissions", label: "Permissões", icon: Shield },
  { id: "notifications", label: "Notificações", icon: Bell },
  { id: "integrations", label: "Integrações", icon: Plug },
  { id: "security", label: "Segurança", icon: Lock },
  { id: "appearance", label: "Aparência", icon: Palette },
  { id: "billing", label: "Assinatura", icon: CreditCard },
];

const teamMembers = [
  { name: "Daniel DeCaires", email: "daniel@decaires.com.br", role: "Admin", avatar: "D", status: "Ativo", color: "#06B6D4" },
  { name: "Julia Prado", email: "julia@decaires.com.br", role: "Membro", avatar: "J", status: "Ativo", color: "#7C3AED" },
  { name: "Marcos Lima", email: "marcos@decaires.com.br", role: "Membro", avatar: "M", status: "Ativo", color: "#10B981" },
  { name: "Rafael Alves", email: "rafael@decaires.com.br", role: "Visualizador", avatar: "R", status: "Pendente", color: "#F59E0B" },
  { name: "Fernanda Braga", email: "fernanda@decaires.com.br", role: "Membro", avatar: "F", status: "Ativo", color: "#EF4444" },
];

const integrations = [
  { name: "Google Calendar", desc: "Sincronize eventos e compromissos automaticamente", icon: "📅", connected: true },
  { name: "WhatsApp Business", desc: "Receba notificações e interaja via WhatsApp", icon: "💬", connected: false },
  { name: "Gmail", desc: "Integre emails de clientes e leads", icon: "📧", connected: true },
  { name: "Stripe", desc: "Gestão de pagamentos e assinaturas recorrentes", icon: "💳", connected: false },
  { name: "Slack", desc: "Notificações e alertas no Slack da equipe", icon: "⚡", connected: false },
  { name: "GitHub", desc: "Vincule repositórios aos projetos", icon: "🐙", connected: true },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
      style={{ background: checked ? "var(--primary)" : "var(--switch-background)" }}
    >
      <div
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
      />
    </button>
  );
}

function FormField({ label, type = "text", value, placeholder }: { label: string; type?: string; value?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--foreground)" }}>{label}</label>
      <input
        type={type}
        defaultValue={value}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all"
        style={{
          background: "var(--muted)",
          color: "var(--foreground)",
          borderColor: "var(--border)",
        }}
        onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
        onBlur={(e) => e.target.style.borderColor = "var(--border)"}
      />
    </div>
  );
}

interface SettingsProps {
  darkMode: boolean;
  onToggleDark: () => void;
}

export function Settings({ darkMode, onToggleDark }: SettingsProps) {
  const [activeTab, setActiveTab] = useState("profile");
  const [notifs, setNotifs] = useState({
    email: true, push: true, weekly: false, leads: true, projects: true, financial: false,
  });

  const toggleNotif = (key: keyof typeof notifs) => setNotifs(n => ({ ...n, [key]: !n[key] }));

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left tabs */}
      <div
        className="w-52 flex-shrink-0 border-r flex flex-col py-4 px-2 overflow-y-auto"
        style={{ borderColor: "var(--border)", background: "var(--card)", scrollbarWidth: "none" }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-0.5 text-left transition-all"
              style={{
                background: active ? "var(--accent)" : "transparent",
                color: active ? "var(--primary)" : "var(--muted-foreground)",
              }}
            >
              <Icon size={15} style={{ flexShrink: 0 }} />
              <span className="text-sm font-medium flex-1">{tab.label}</span>
              {active && <ChevronRight size={12} />}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8" style={{ scrollbarWidth: "none" }}>
        {activeTab === "profile" && (
          <div className="max-w-xl space-y-6">
            <div>
              <h3 className="font-extrabold text-base mb-0.5" style={{ color: "var(--foreground)" }}>Meu Perfil</h3>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Gerencie suas informações pessoais e preferências.</p>
            </div>
            <div className="flex items-center gap-4 p-5 rounded-2xl border" style={{ background: "var(--muted)", borderColor: "var(--border)" }}>
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white shadow"
                style={{ background: "linear-gradient(135deg, #06B6D4, #7C3AED)" }}
              >D</div>
              <div>
                <div className="font-bold" style={{ color: "var(--foreground)" }}>Daniel DeCaires</div>
                <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>CEO & Fundador</div>
                <button className="text-xs mt-1.5 font-bold px-2.5 py-1 rounded-lg" style={{ background: "var(--accent)", color: "var(--primary)" }}>
                  Alterar foto
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Nome completo" value="Daniel DeCaires" />
              <FormField label="Cargo" value="CEO & Fundador" />
              <FormField label="Email" type="email" value="daniel@decaires.com.br" />
              <FormField label="Telefone" type="tel" value="(11) 99999-0000" />
            </div>
            <button
              className="px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition hover:opacity-90"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              Salvar alterações
            </button>
          </div>
        )}

        {activeTab === "company" && (
          <div className="max-w-xl space-y-6">
            <div>
              <h3 className="font-extrabold text-base mb-0.5" style={{ color: "var(--foreground)" }}>Empresa</h3>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Dados da organização exibidos na plataforma.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <FormField label="Nome da empresa" value="DeCaires Technology" />
              </div>
              <FormField label="CNPJ" value="00.000.000/0001-00" />
              <FormField label="Setor" value="Tecnologia da Informação" />
              <FormField label="Email corporativo" type="email" value="contato@decaires.com.br" />
              <FormField label="Site" value="decaires.com.br" />
              <div className="sm:col-span-2">
                <FormField label="Endereço" value="São Paulo, SP – Brasil" />
              </div>
            </div>
            <button className="px-5 py-2.5 rounded-xl text-sm font-bold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
              Salvar
            </button>
          </div>
        )}

        {activeTab === "users" && (
          <div className="max-w-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base mb-0.5" style={{ color: "var(--foreground)" }}>Usuários e Equipes</h3>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Gerencie os membros e acessos da equipe.</p>
              </div>
              <button className="px-3 py-2 rounded-xl text-sm font-bold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                + Convidar membro
              </button>
            </div>
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              {teamMembers.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-5 py-4 border-b last:border-0 transition-colors hover:bg-muted"
                  style={{ borderColor: "var(--border)", background: "var(--card)" }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                    style={{ background: m.color }}
                  >
                    {m.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{m.name}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{m.email}</div>
                  </div>
                  <select
                    defaultValue={m.role}
                    className="text-xs px-2 py-1.5 rounded-lg border outline-none hidden sm:block"
                    style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                  >
                    <option>Admin</option>
                    <option>Membro</option>
                    <option>Visualizador</option>
                  </select>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-bold"
                    style={{
                      background: m.status === "Ativo" ? "#ECFDF5" : "#FFFBEB",
                      color: m.status === "Ativo" ? "#065F46" : "#B45309",
                    }}
                  >
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="max-w-xl space-y-5">
            <div>
              <h3 className="font-extrabold text-base mb-0.5" style={{ color: "var(--foreground)" }}>Notificações</h3>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Configure quando e como ser notificado.</p>
            </div>
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              {[
                ["Resumo diário por email", "email"],
                ["Notificações push no navegador", "push"],
                ["Relatório semanal por email", "weekly"],
                ["Alertas de novos leads", "leads"],
                ["Atualizações de projetos", "projects"],
                ["Alertas financeiros", "financial"],
              ].map(([label, key]) => (
                <div
                  key={key as string}
                  className="flex items-center justify-between px-5 py-4 border-b last:border-0 transition-colors hover:bg-muted"
                  style={{ borderColor: "var(--border)", background: "var(--card)" }}
                >
                  <span className="text-sm" style={{ color: "var(--foreground)" }}>{label as string}</span>
                  <Toggle
                    checked={notifs[key as keyof typeof notifs]}
                    onChange={() => toggleNotif(key as keyof typeof notifs)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "integrations" && (
          <div className="max-w-2xl space-y-5">
            <div>
              <h3 className="font-extrabold text-base mb-0.5" style={{ color: "var(--foreground)" }}>Integrações</h3>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Conecte ferramentas externas à plataforma.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {integrations.map((intg, i) => (
                <div
                  key={i}
                  className="rounded-2xl border p-4 flex items-start gap-3 transition-all hover:shadow-md"
                  style={{
                    background: "var(--card)",
                    borderColor: intg.connected ? "var(--primary)" : "var(--border)",
                    boxShadow: intg.connected ? "0 0 0 1px var(--primary)" : undefined,
                  }}
                >
                  <div className="text-2xl flex-shrink-0 mt-0.5">{intg.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm mb-0.5" style={{ color: "var(--foreground)" }}>{intg.name}</div>
                    <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>{intg.desc}</div>
                    <button
                      className="text-xs px-3 py-1.5 rounded-lg font-bold"
                      style={{
                        background: intg.connected ? "#ECFDF5" : "var(--primary)",
                        color: intg.connected ? "#065F46" : "white",
                      }}
                    >
                      {intg.connected ? (
                        <span className="flex items-center gap-1"><Check size={10} />Conectado</span>
                      ) : "Conectar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="max-w-md space-y-5">
            <div>
              <h3 className="font-extrabold text-base mb-0.5" style={{ color: "var(--foreground)" }}>Segurança</h3>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Proteja sua conta com senhas e autenticação.</p>
            </div>
            <div className="rounded-2xl border p-5 space-y-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="font-bold text-sm" style={{ color: "var(--foreground)" }}>Alterar senha</div>
              {["Senha atual", "Nova senha", "Confirmar nova senha"].map((l) => (
                <FormField key={l} label={l} type="password" placeholder="••••••••" />
              ))}
              <button className="w-full py-2.5 rounded-xl text-sm font-bold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                Alterar senha
              </button>
            </div>
            <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm" style={{ color: "var(--foreground)" }}>Autenticação em dois fatores</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Adicione uma camada extra de proteção</div>
                </div>
                <Toggle checked={false} onChange={() => {}} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "appearance" && (
          <div className="max-w-lg space-y-5">
            <div>
              <h3 className="font-extrabold text-base mb-0.5" style={{ color: "var(--foreground)" }}>Aparência</h3>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Personalize o visual da plataforma.</p>
            </div>

            <div className="rounded-2xl border p-5 space-y-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              {/* Theme */}
              <div>
                <div className="font-bold text-sm mb-3" style={{ color: "var(--foreground)" }}>Tema</div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Claro", icon: Sun, dark: false },
                    { label: "Escuro", icon: Moon, dark: true },
                  ].map((t) => {
                    const Icon = t.icon;
                    const selected = darkMode === t.dark;
                    return (
                      <button
                        key={t.label}
                        onClick={onToggleDark}
                        className="rounded-xl border-2 p-4 flex flex-col items-center gap-2 cursor-pointer transition-all"
                        style={{
                          borderColor: selected ? "var(--primary)" : "var(--border)",
                          background: selected ? "var(--accent)" : "var(--muted)",
                        }}
                      >
                        <Icon size={20} style={{ color: selected ? "var(--primary)" : "var(--muted-foreground)" }} />
                        <div className="text-sm font-bold" style={{ color: selected ? "var(--primary)" : "var(--foreground)" }}>
                          {t.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accent color */}
              <div>
                <div className="font-bold text-sm mb-3" style={{ color: "var(--foreground)" }}>Cor de destaque</div>
                <div className="flex gap-3 flex-wrap">
                  {[
                    { color: "#06B6D4", label: "Ciano" },
                    { color: "#7C3AED", label: "Roxo" },
                    { color: "#3B82F6", label: "Azul" },
                    { color: "#10B981", label: "Verde" },
                    { color: "#F59E0B", label: "Âmbar" },
                    { color: "#EF4444", label: "Vermelho" },
                  ].map(({ color, label }) => (
                    <button
                      key={color}
                      title={label}
                      className="w-9 h-9 rounded-xl cursor-pointer border-2 transition-all hover:scale-110"
                      style={{ background: color, borderColor: color === "#06B6D4" ? "var(--foreground)" : "transparent" }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "billing" && (
          <div className="max-w-lg space-y-5">
            <div>
              <h3 className="font-extrabold text-base mb-0.5" style={{ color: "var(--foreground)" }}>Assinatura e Cobrança</h3>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Gerencie seu plano e método de pagamento.</p>
            </div>
            <div
              className="rounded-2xl p-5"
              style={{ background: "linear-gradient(135deg, #0E7490 0%, #7C3AED 100%)" }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-extrabold text-white text-lg">Plano Business</div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.75)" }}>Até 20 usuários · Todos os módulos</div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-white/20 text-white">Ativo</span>
              </div>
              <div className="text-3xl font-extrabold text-white mb-1">
                R$ 299<span className="text-base font-normal opacity-75">/mês</span>
              </div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
                Próxima cobrança: 10/07/2026 · Cartão •••• 4242
              </div>
              <div className="flex gap-2 mt-4">
                <button className="text-xs px-3 py-2 rounded-xl font-bold" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>
                  Alterar plano
                </button>
                <button className="text-xs px-3 py-2 rounded-xl font-bold" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>
                  Gerenciar pagamento
                </button>
              </div>
            </div>
            <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="font-bold text-sm mb-3" style={{ color: "var(--foreground)" }}>Histórico de cobranças</div>
              {[
                { date: "10/06/2026", desc: "Plano Business – Junho", value: "R$ 299,00", status: "Pago" },
                { date: "10/05/2026", desc: "Plano Business – Maio", value: "R$ 299,00", status: "Pago" },
                { date: "10/04/2026", desc: "Plano Business – Abril", value: "R$ 299,00", status: "Pago" },
              ].map((h, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                  <div>
                    <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{h.desc}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{h.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{h.value}</div>
                    <span className="text-xs font-bold" style={{ color: "#10B981" }}>{h.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeTab === "permissions") && (
          <div className="max-w-xl flex flex-col items-center justify-center py-24">
            <div className="text-5xl mb-4">🔧</div>
            <div className="font-extrabold text-base" style={{ color: "var(--foreground)" }}>Em desenvolvimento</div>
            <div className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>Esta seção estará disponível em breve.</div>
          </div>
        )}
      </div>
    </div>
  );
}
