import { useState, useEffect } from "react";
import { User, Building, Users, Shield, Bell, Plug, Lock, Palette, CreditCard, ChevronRight, Check, Sun, Moon, Loader2 } from "lucide-react";
import { updateProfile, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { useAuth } from "../auth/AuthContext";
import { auth } from "../../lib/firebase";
import { companySettingsApi, userSettingsApi, type CompanySettings } from "../../lib/api";
import { applyAccentColor } from "../../lib/theme";

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

// Nenhuma integração está de fato conectada ainda — isso vai mudar módulo a módulo
// conforme cada uma for implementada de verdade (ex: Google Calendar na Agenda).
const integrations = [
  { name: "Google Calendar", desc: "Sincronize eventos e compromissos automaticamente", icon: "📅", connected: false },
  { name: "WhatsApp Business", desc: "Receba notificações e interaja via WhatsApp", icon: "💬", connected: false },
  { name: "Gmail", desc: "Integre emails de clientes e leads", icon: "📧", connected: false },
  { name: "Stripe", desc: "Gestão de pagamentos e assinaturas recorrentes", icon: "💳", connected: false },
  { name: "Slack", desc: "Notificações e alertas no Slack da equipe", icon: "⚡", connected: false },
  { name: "GitHub", desc: "Vincule repositórios aos projetos", icon: "🐙", connected: false },
];

const ACCENT_COLORS = [
  { color: "#06B6D4", label: "Ciano" },
  { color: "#7C3AED", label: "Roxo" },
  { color: "#3B82F6", label: "Azul" },
  { color: "#10B981", label: "Verde" },
  { color: "#F59E0B", label: "Âmbar" },
  { color: "#EF4444", label: "Vermelho" },
];

const NOTIF_FIELDS: [string, string][] = [
  ["Resumo diário por email", "email"],
  ["Notificações push no navegador", "push"],
  ["Relatório semanal por email", "weekly"],
  ["Alertas de novos leads", "leads"],
  ["Atualizações de projetos", "projects"],
  ["Alertas financeiros", "financial"],
];
const NOTIF_DEFAULTS: Record<string, boolean> = { email: true, push: true, weekly: false, leads: true, projects: true, financial: false };

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

function FormField({ label, type = "text", value, placeholder, onChange }: { label: string; type?: string; value?: string; placeholder?: string; onChange?: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--foreground)" }}>{label}</label>
      <input
        type={type}
        value={onChange ? value : undefined}
        defaultValue={onChange ? undefined : value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [notifs, setNotifs] = useState<Record<string, boolean>>(NOTIF_DEFAULTS);
  const [notifsLoading, setNotifsLoading] = useState(true);
  const [savingNotifKey, setSavingNotifKey] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState(user?.displayName ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [companyForm, setCompanyForm] = useState<CompanySettings>({ name: "", cnpj: "", sector: "", email: "", website: "", address: "" });
  const [companyLoading, setCompanyLoading] = useState(true);
  const [companySaving, setCompanySaving] = useState(false);
  const [companySaved, setCompanySaved] = useState(false);
  const [accentColor, setAccentColor] = useState("#06B6D4");
  const [savingAccent, setSavingAccent] = useState(false);

  useEffect(() => {
    companySettingsApi.get()
      .then((s) => setCompanyForm({ name: s.name ?? "", cnpj: s.cnpj ?? "", sector: s.sector ?? "", email: s.email ?? "", website: s.website ?? "", address: s.address ?? "" }))
      .catch(() => {})
      .finally(() => setCompanyLoading(false));
    userSettingsApi.get()
      .then((s) => {
        setNotifs({ ...NOTIF_DEFAULTS, ...(s.notifications ?? {}) });
        setAccentColor(s.accent_color || "#06B6D4");
      })
      .catch(() => {})
      .finally(() => setNotifsLoading(false));
  }, []);

  async function handleSaveCompany() {
    setCompanySaving(true);
    setCompanySaved(false);
    try {
      await companySettingsApi.update(companyForm);
      setCompanySaved(true);
    } finally {
      setCompanySaving(false);
    }
  }

  async function toggleNotif(key: string) {
    const next = { ...notifs, [key]: !notifs[key] };
    setNotifs(next);
    setSavingNotifKey(key);
    try {
      await userSettingsApi.update({ notifications: { [key]: next[key] } });
    } finally {
      setSavingNotifKey(null);
    }
  }

  async function handleAccentChange(color: string) {
    setAccentColor(color);
    applyAccentColor(color);
    setSavingAccent(true);
    try {
      await userSettingsApi.update({ accent_color: color });
    } finally {
      setSavingAccent(false);
    }
  }
  const displayName = user?.displayName || user?.email?.split("@")[0] || "Usuário";
  const initials = displayName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  async function handleSaveProfile() {
    if (!auth.currentUser) return;
    setSavingProfile(true);
    setProfileSaved(false);
    try {
      await updateProfile(auth.currentUser, { displayName: nameInput });
      setProfileSaved(true);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    if (!auth.currentUser || !auth.currentUser.email) return;
    setPwMessage(null);

    if (pwForm.next.length < 6) {
      setPwMessage({ type: "error", text: "A nova senha precisa ter pelo menos 6 caracteres." });
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwMessage({ type: "error", text: "As senhas novas não coincidem." });
      return;
    }

    setPwSaving(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, pwForm.current);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, pwForm.next);
      setPwForm({ current: "", next: "", confirm: "" });
      setPwMessage({ type: "ok", text: "Senha alterada com sucesso ✅" });
    } catch (err: any) {
      const msg = err?.code === "auth/invalid-credential" || err?.code === "auth/wrong-password"
        ? "Senha atual incorreta."
        : "Não foi possível alterar a senha.";
      setPwMessage({ type: "error", text: msg });
    } finally {
      setPwSaving(false);
    }
  }

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
              >{initials}</div>
              <div>
                <div className="font-bold" style={{ color: "var(--foreground)" }}>{displayName}</div>
                <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>{user?.email}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Nome completo" value={nameInput} onChange={setNameInput} />
              <FormField label="Email" type="email" value={user?.email ?? ""} placeholder="—" />
            </div>
            {profileSaved && (
              <div className="text-xs rounded-lg px-3 py-2 inline-block" style={{ background: "#ECFDF5", color: "#065F46" }}>
                Perfil atualizado ✅
              </div>
            )}
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile || !nameInput.trim()}
              className="px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              {savingProfile && <Loader2 size={14} className="animate-spin" />}
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
            {companyLoading ? (
              <div className="text-xs flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}><Loader2 size={12} className="animate-spin" />Carregando...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <FormField label="Nome da empresa" placeholder="Ex: DeCaires Technology" value={companyForm.name ?? ""} onChange={(v) => setCompanyForm({ ...companyForm, name: v })} />
                  </div>
                  <FormField label="CNPJ" placeholder="00.000.000/0001-00" value={companyForm.cnpj ?? ""} onChange={(v) => setCompanyForm({ ...companyForm, cnpj: v })} />
                  <FormField label="Setor" placeholder="Ex: Tecnologia da Informação" value={companyForm.sector ?? ""} onChange={(v) => setCompanyForm({ ...companyForm, sector: v })} />
                  <FormField label="Email corporativo" type="email" placeholder="contato@suaempresa.com.br" value={companyForm.email ?? ""} onChange={(v) => setCompanyForm({ ...companyForm, email: v })} />
                  <FormField label="Site" placeholder="suaempresa.com.br" value={companyForm.website ?? ""} onChange={(v) => setCompanyForm({ ...companyForm, website: v })} />
                  <div className="sm:col-span-2">
                    <FormField label="Endereço" placeholder="Cidade, Estado – País" value={companyForm.address ?? ""} onChange={(v) => setCompanyForm({ ...companyForm, address: v })} />
                  </div>
                </div>
                {companySaved && (
                  <div className="text-xs rounded-lg px-3 py-2 inline-block" style={{ background: "#ECFDF5", color: "#065F46" }}>
                    Dados da empresa salvos ✅
                  </div>
                )}
                <button
                  onClick={handleSaveCompany}
                  disabled={companySaving}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                  style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                >
                  {companySaving && <Loader2 size={14} className="animate-spin" />}
                  Salvar alterações
                </button>
              </>
            )}
          </div>
        )}

        {activeTab === "users" && (
          <div className="max-w-2xl space-y-5">
            <div>
              <h3 className="font-extrabold text-base mb-0.5" style={{ color: "var(--foreground)" }}>Usuários e Equipes</h3>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Gerencie os membros e acessos da equipe.</p>
            </div>
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <div
                className="flex items-center gap-4 px-5 py-4 border-b last:border-0"
                style={{ borderColor: "var(--border)", background: "var(--card)" }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #06B6D4, #7C3AED)" }}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{displayName}</div>
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{user?.email}</div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: "#ECFDF5", color: "#065F46" }}>
                  Você
                </span>
              </div>
            </div>
            <div className="rounded-xl px-4 py-3 text-xs" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
              Por enquanto, novos membros da equipe são adicionados manualmente pelo administrador direto no Firebase Console (Authentication → Users → Add user). Um convite self-service pode ser criado depois, se fizer sentido.
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="max-w-xl space-y-5">
            <div>
              <h3 className="font-extrabold text-base mb-0.5" style={{ color: "var(--foreground)" }}>Notificações</h3>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Configure quando e como ser notificado.</p>
            </div>
            {notifsLoading ? (
              <div className="text-xs flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}><Loader2 size={12} className="animate-spin" />Carregando...</div>
            ) : (
              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                {NOTIF_FIELDS.map(([label, key]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between px-5 py-4 border-b last:border-0 transition-colors hover:bg-muted"
                    style={{ borderColor: "var(--border)", background: "var(--card)" }}
                  >
                    <span className="text-sm" style={{ color: "var(--foreground)" }}>{label}</span>
                    <div className="flex items-center gap-2">
                      {savingNotifKey === key && <Loader2 size={12} className="animate-spin" style={{ color: "var(--muted-foreground)" }} />}
                      <Toggle checked={notifs[key]} onChange={() => toggleNotif(key)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                      disabled
                      title="Em breve"
                      className="text-xs px-3 py-1.5 rounded-lg font-bold opacity-60 cursor-not-allowed"
                      style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                    >
                      Em breve
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
              <FormField label="Senha atual" type="password" placeholder="••••••••" value={pwForm.current} onChange={(v) => setPwForm({ ...pwForm, current: v })} />
              <FormField label="Nova senha" type="password" placeholder="••••••••" value={pwForm.next} onChange={(v) => setPwForm({ ...pwForm, next: v })} />
              <FormField label="Confirmar nova senha" type="password" placeholder="••••••••" value={pwForm.confirm} onChange={(v) => setPwForm({ ...pwForm, confirm: v })} />
              {pwMessage && (
                <div
                  className="text-xs rounded-lg px-3 py-2"
                  style={{ background: pwMessage.type === "ok" ? "#ECFDF5" : "#FEF2F2", color: pwMessage.type === "ok" ? "#065F46" : "#991B1B" }}
                >
                  {pwMessage.text}
                </div>
              )}
              <button
                onClick={handleChangePassword}
                disabled={pwSaving || !pwForm.current || !pwForm.next || !pwForm.confirm}
                className="w-full py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                {pwSaving && <Loader2 size={14} className="animate-spin" />}
                Alterar senha
              </button>
            </div>
            <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm" style={{ color: "var(--foreground)" }}>Autenticação em dois fatores</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Adicione uma camada extra de proteção — em breve</div>
                </div>
                <span className="text-xs px-3 py-1.5 rounded-lg font-bold opacity-60" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
                  Em breve
                </span>
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
                <div className="flex items-center gap-2 mb-3">
                  <div className="font-bold text-sm" style={{ color: "var(--foreground)" }}>Cor de destaque</div>
                  {savingAccent && <Loader2 size={12} className="animate-spin" style={{ color: "var(--muted-foreground)" }} />}
                </div>
                <div className="flex gap-3 flex-wrap">
                  {ACCENT_COLORS.map(({ color, label }) => (
                    <button
                      key={color}
                      title={label}
                      onClick={() => handleAccentChange(color)}
                      className="w-9 h-9 rounded-xl cursor-pointer border-2 transition-all hover:scale-110 flex items-center justify-center"
                      style={{ background: color, borderColor: accentColor === color ? "var(--foreground)" : "transparent" }}
                    >
                      {accentColor === color && <Check size={14} color="white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "billing" && (
          <div className="max-w-xl flex flex-col items-center justify-center py-24">
            <div className="text-5xl mb-4">💳</div>
            <div className="font-extrabold text-base" style={{ color: "var(--foreground)" }}>Sem cobrança configurada</div>
            <div className="text-sm mt-1 text-center max-w-sm" style={{ color: "var(--muted-foreground)" }}>
              Esse sistema é de uso interno da equipe, sem plano pago. Se um dia precisar cobrar clientes por acesso, essa é a tela onde a integração de pagamento entraria.
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
