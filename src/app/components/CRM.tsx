import { useState } from "react";
import { Plus, Phone, Mail, X, ArrowRight } from "lucide-react";

const stages = [
  { id: "new", label: "Novo lead", color: "#64748B" },
  { id: "contact", label: "Primeiro contato", color: "#06B6D4" },
  { id: "qualify", label: "Qualificação", color: "#7C3AED" },
  { id: "proposal", label: "Proposta enviada", color: "#F59E0B" },
  { id: "negotiation", label: "Negociação", color: "#F97316" },
  { id: "won", label: "Cliente conquistado", color: "#10B981" },
  { id: "lost", label: "Lead perdido", color: "#EF4444" },
];

const leads = [
  { id: 1, name: "João Silva", company: "Innovate Digital", phone: "(11) 99999-1111", email: "joao@innovate.com.br", origin: "LinkedIn", interest: "Desenvolvimento web", value: 45000, responsible: "Daniel", lastContact: "08/06/2026", nextAction: "Enviar proposta técnica", stage: "proposal" },
  { id: 2, name: "Maria Fernandes", company: "Retail Group SA", phone: "(21) 98888-2222", email: "maria@retail.com.br", origin: "Indicação", interest: "App mobile", value: 80000, responsible: "Julia", lastContact: "07/06/2026", nextAction: "Reunião de alinhamento", stage: "negotiation" },
  { id: 3, name: "Carlos Braga", company: "Gov Municipal", phone: "(31) 97777-3333", email: "carlos@gov.br", origin: "Site", interest: "Portal institucional", value: 120000, responsible: "Marcos", lastContact: "05/06/2026", nextAction: "Qualificar necessidades", stage: "qualify" },
  { id: 4, name: "Ana Ribeiro", company: "Fintech Alpha", phone: "(11) 96666-4444", email: "ana@fintech.com.br", origin: "Google Ads", interest: "BI e dashboards", value: 35000, responsible: "Rafael", lastContact: "04/06/2026", nextAction: "Ligar para agendar demo", stage: "contact" },
  { id: 5, name: "Pedro Moura", company: "E-commerce Plus", phone: "(41) 95555-5555", email: "pedro@ecommerceplus.com", origin: "Instagram", interest: "E-commerce", value: 28000, responsible: "Fernanda", lastContact: "03/06/2026", nextAction: "Primeiro contato por email", stage: "new" },
  { id: 6, name: "Larissa Campos", company: "Tech Startup XYZ", phone: "(11) 94444-6666", email: "larissa@xyz.com.br", origin: "LinkedIn", interest: "CRM customizado", value: 55000, responsible: "Daniel", lastContact: "09/06/2026", nextAction: "Fechar contrato", stage: "won" },
  { id: 7, name: "Ricardo Santos", company: "OldCo Ltda", phone: "(21) 93333-7777", email: "ricardo@oldco.com.br", origin: "Site", interest: "Sistema legado", value: 15000, responsible: "Carlos", lastContact: "01/06/2026", nextAction: "Arquivar", stage: "lost" },
];

export function CRM() {
  const [selected, setSelected] = useState<typeof leads[0] | null>(null);
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="p-6 overflow-y-auto h-full" style={{ scrollbarWidth: "none" }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium px-3 py-1 rounded-lg border" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", background: "var(--card)" }}>
            {leads.length} leads · R$ {leads.reduce((a, l) => a + l.value, 0).toLocaleString("pt-BR")} potencial
          </div>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition hover:opacity-90"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
          <Plus size={14} />Cadastrar lead
        </button>
      </div>

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: "none" }}>
        {stages.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage === stage.id);
          const totalValue = stageLeads.reduce((a, l) => a + l.value, 0);
          return (
            <div key={stage.id} className="flex-shrink-0 w-56 rounded-xl p-3" style={{ background: "var(--muted)" }}>
              <div className="mb-3 px-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold" style={{ color: stage.color }}>{stage.label}</span>
                  <span className="text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold text-white" style={{ background: stage.color, fontSize: 10 }}>{stageLeads.length}</span>
                </div>
                {totalValue > 0 && <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>R$ {totalValue.toLocaleString("pt-BR")}</div>}
              </div>
              <div className="space-y-2">
                {stageLeads.map((lead) => (
                  <div key={lead.id} onClick={() => setSelected(lead)}
                    className="rounded-lg p-3 border cursor-pointer shadow-sm hover:shadow-md transition-all"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                    <div className="font-semibold text-xs mb-0.5" style={{ color: "var(--foreground)" }}>{lead.name}</div>
                    <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>{lead.company}</div>
                    <div className="text-xs font-semibold mb-2" style={{ color: "#10B981" }}>R$ {lead.value.toLocaleString("pt-BR")}</div>
                    <div className="text-xs pt-2 border-t flex items-center justify-between" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                      <span>{lead.responsible}</span>
                      <span>{lead.lastContact.split("/")[0]}/{lead.lastContact.split("/")[1]}</span>
                    </div>
                  </div>
                ))}
                {stageLeads.length === 0 && (
                  <div className="rounded-lg p-3 text-center text-xs" style={{ color: "var(--muted-foreground)", border: "1px dashed var(--border)" }}>
                    Sem leads
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lead Detail */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ background: "var(--card)" }}>
            <div className="flex items-start justify-between px-6 py-5 border-b" style={{ borderColor: "var(--border)" }}>
              <div>
                <h3 className="font-bold" style={{ color: "var(--foreground)" }}>{selected.name}</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{selected.company}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ color: "var(--muted-foreground)" }}><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5" style={{ scrollbarWidth: "none" }}>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Telefone", selected.phone],
                  ["Email", selected.email],
                  ["Origem", selected.origin],
                  ["Interesse", selected.interest],
                  ["Valor estimado", `R$ ${selected.value.toLocaleString("pt-BR")}`],
                  ["Responsável", selected.responsible],
                  ["Último contato", selected.lastContact],
                  ["Próxima ação", selected.nextAction],
                ].map(([k, v]) => (
                  <div key={k as string} className="rounded-lg p-3" style={{ background: "var(--muted)" }}>
                    <div className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>{k as string}</div>
                    <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{v as string}</div>
                  </div>
                ))}
              </div>
              <div>
                <div className="font-semibold text-sm mb-3" style={{ color: "var(--foreground)" }}>Etapa no funil</div>
                <div className="flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                  {stages.filter(s => s.id !== "lost").map((s, i) => {
                    const stageIds = stages.map(s => s.id);
                    const currentIdx = stageIds.indexOf(selected.stage);
                    const thisIdx = stageIds.indexOf(s.id);
                    const active = selected.stage === s.id;
                    const passed = thisIdx < currentIdx;
                    return (
                      <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
                        <div className="text-xs px-2 py-1 rounded-lg font-medium flex-shrink-0" style={{ background: active ? s.color : passed ? `${s.color}30` : "var(--muted)", color: active ? "white" : passed ? s.color : "var(--muted-foreground)" }}>
                          {s.label}
                        </div>
                        {i < 5 && <ArrowRight size={10} style={{ color: "var(--muted-foreground)" }} />}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="font-semibold text-sm mb-3" style={{ color: "var(--foreground)" }}>Histórico</div>
                <div className="space-y-3">
                  {[
                    { text: `Lead cadastrado via ${selected.origin}`, date: "01/06/2026" },
                    { text: "Primeiro contato realizado por email", date: "03/06/2026" },
                    { text: "Reunião de qualificação realizada", date: "06/06/2026" },
                    { text: `Último contato em ${selected.lastContact}`, date: selected.lastContact },
                  ].map((h, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "var(--primary)" }} />
                      <div className="flex-1">
                        <div className="text-xs" style={{ color: "var(--foreground)" }}>{h.text}</div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{h.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border font-medium" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                <Phone size={13} />Ligar
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border font-medium" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                <Mail size={13} />Email
              </button>
              <button className="ml-auto px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                Avançar etapa
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" style={{ background: "var(--card)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold" style={{ color: "var(--foreground)" }}>Cadastrar Lead</h3>
              <button onClick={() => setShowModal(false)} style={{ color: "var(--muted-foreground)" }}><X size={16} /></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {[["Nome", "text", "Nome completo"], ["Empresa", "text", "Empresa"], ["Telefone", "tel", "(11) 9..."], ["Email", "email", "email@..."], ["Origem", "text", "LinkedIn, Site..."], ["Interesse", "text", "Tipo de serviço"]].map(([l, t, ph]) => (
                <div key={l as string}>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>{l as string}</label>
                  <input type={t as string} placeholder={ph as string} className="w-full px-3 py-2 rounded-lg text-sm border outline-none" style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }} />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Valor estimado (R$)</label>
                <input type="number" placeholder="0,00" className="w-full px-3 py-2 rounded-lg text-sm border outline-none" style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }} />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg text-sm border font-medium" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Cancelar</button>
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Cadastrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
