import { useState, useEffect, useCallback } from "react";
import { Plus, X, Loader2, Pencil, Trash2, ExternalLink, TrendingUp, Users } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { socialChannelsApi, socialSnapshotsApi, contentApi, type SocialChannel, type SocialSnapshot } from "../../lib/api";

const platformIcons: Record<string, string> = { Instagram: "📸", YouTube: "▶️", LinkedIn: "💼", TikTok: "🎵", Facebook: "👍", X: "✖️" };
const platformColors: Record<string, string> = { Instagram: "#E1306C", YouTube: "#FF0000", LinkedIn: "#0077B5", TikTok: "#000000", Facebook: "#1877F2", X: "#000000" };
const PLATFORMS = ["Instagram", "YouTube", "LinkedIn", "TikTok", "Facebook", "X"];

const emptyForm = { platform: "Instagram", handle: "", profile_url: "", notes: "" };

export function SocialMedia() {
  const [channels, setChannels] = useState<SocialChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SocialChannel | null>(null);
  const [snapshots, setSnapshots] = useState<SocialSnapshot[]>([]);
  const [snapLoading, setSnapLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newFollowers, setNewFollowers] = useState("");
  const [savingSnap, setSavingSnap] = useState(false);
  const [postCounts, setPostCounts] = useState<Record<string, number>>({});

  const loadChannels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await socialChannelsApi.list();
      setChannels(data);
      const content = await contentApi.list();
      const counts: Record<string, number> = {};
      for (const c of content) {
        if (c.status === "Publicado" && c.platform) counts[c.platform] = (counts[c.platform] ?? 0) + 1;
      }
      setPostCounts(counts);
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível carregar as redes sociais.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadChannels(); }, [loadChannels]);

  const loadSnapshots = useCallback(async (channelId: number) => {
    setSnapLoading(true);
    try {
      setSnapshots(await socialSnapshotsApi.list(channelId));
    } catch { /* silencioso */ }
    finally { setSnapLoading(false); }
  }, []);

  function openChannel(c: SocialChannel) {
    setSelected(c);
    setConfirmDelete(false);
    setNewFollowers("");
    loadSnapshots(c.id);
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEditModal(c: SocialChannel) {
    setEditingId(c.id);
    setForm({ platform: c.platform, handle: c.handle ?? "", profile_url: c.profile_url ?? "", notes: c.notes ?? "" });
    setShowModal(true);
  }

  async function handleSaveChannel() {
    if (!form.platform) return;
    setSaving(true);
    try {
      if (editingId) {
        const updated = await socialChannelsApi.update(editingId, form as any);
        if (selected?.id === editingId) setSelected(updated);
      } else {
        await socialChannelsApi.create(form);
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowModal(false);
      await loadChannels();
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível salvar o canal.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteChannel() {
    if (!selected) return;
    setDeleting(true);
    try {
      await socialChannelsApi.remove(selected.id);
      setSelected(null);
      setConfirmDelete(false);
      await loadChannels();
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível excluir o canal.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleAddSnapshot() {
    if (!selected || !newFollowers) return;
    setSavingSnap(true);
    try {
      await socialSnapshotsApi.create(selected.id, Number(newFollowers));
      setNewFollowers("");
      await loadSnapshots(selected.id);
      await loadChannels();
      const fresh = await socialChannelsApi.list();
      const updated = fresh.find((c) => c.id === selected.id);
      if (updated) setSelected(updated);
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível registrar a contagem.");
    } finally {
      setSavingSnap(false);
    }
  }

  const totalFollowers = channels.reduce((a, c) => a + c.followers_count, 0);
  const chartData = snapshots.map((s) => ({
    date: new Date(s.recorded_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    seguidores: s.followers_count,
  }));

  return (
    <div className="p-6 overflow-y-auto h-full" style={{ scrollbarWidth: "none" }}>
      {error && (
        <div className="mb-4 text-sm rounded-lg px-4 py-2.5" style={{ background: "#FEF2F2", color: "#991B1B" }}>{error}</div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="text-sm font-medium px-3 py-1 rounded-lg border" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", background: "var(--card)" }}>
          {loading ? "Carregando..." : `${channels.length} canais · ${totalFollowers.toLocaleString("pt-BR")} seguidores no total`}
        </div>
        <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition hover:opacity-90" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
          <Plus size={14} />Novo canal
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm py-8 justify-center" style={{ color: "var(--muted-foreground)" }}>
          <Loader2 size={16} className="animate-spin" />Carregando...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {channels.map((c) => (
          <div key={c.id} onClick={() => openChannel(c)}
            className="rounded-xl border p-5 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "var(--muted)" }}>
                {platformIcons[c.platform] ?? "🌐"}
              </div>
              <div>
                <div className="font-bold text-sm" style={{ color: "var(--foreground)" }}>{c.platform}</div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{c.handle || "—"}</div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t text-xs" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-1" style={{ color: "var(--foreground)" }}>
                <Users size={12} /><strong>{c.followers_count.toLocaleString("pt-BR")}</strong> seguidores
              </div>
              <div style={{ color: "var(--muted-foreground)" }}>{postCounts[c.platform] ?? 0} posts publicados</div>
            </div>
          </div>
        ))}
        {!loading && channels.length === 0 && (
          <div className="col-span-full text-center py-12 text-sm" style={{ color: "var(--muted-foreground)" }}>Nenhum canal cadastrado ainda.</div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl overflow-y-auto" style={{ background: "var(--card)", scrollbarWidth: "none" }}>
            <div className="flex items-start justify-between px-6 py-5 border-b sticky top-0 z-10" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
              <div className="flex items-center gap-3">
                <div className="text-2xl">{platformIcons[selected.platform] ?? "🌐"}</div>
                <div>
                  <h3 className="font-bold" style={{ color: "var(--foreground)" }}>{selected.platform}</h3>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{selected.handle || "—"}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => openEditModal(selected)} title="Editar" className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-muted" style={{ color: "var(--muted-foreground)" }}><Pencil size={14} /></button>
                <button onClick={() => setConfirmDelete(true)} title="Excluir" className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-muted" style={{ color: "#EF4444" }}><Trash2 size={14} /></button>
                <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-muted" style={{ color: "var(--muted-foreground)" }}><X size={16} /></button>
              </div>
            </div>

            {confirmDelete && (
              <div className="px-6 py-3 flex items-center justify-between gap-3" style={{ background: "#FEF2F2" }}>
                <span className="text-xs font-medium" style={{ color: "#991B1B" }}>Excluir esse canal?</span>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setConfirmDelete(false)} className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: "white", color: "var(--foreground)" }}>Cancelar</button>
                  <button onClick={handleDeleteChannel} disabled={deleting} className="text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-60" style={{ background: "#EF4444", color: "white" }}>
                    {deleting && <Loader2 size={11} className="animate-spin" />}Excluir
                  </button>
                </div>
              </div>
            )}

            <div className="p-6 space-y-5">
              <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: `${platformColors[selected.platform] ?? "#64748B"}12` }}>
                <div>
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>Seguidores atuais</div>
                  <div className="text-2xl font-extrabold" style={{ color: "var(--foreground)" }}>{selected.followers_count.toLocaleString("pt-BR")}</div>
                </div>
                {selected.profile_url && (
                  <a href={selected.profile_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: "var(--card)", color: "var(--primary)" }}>
                    Ver perfil <ExternalLink size={11} />
                  </a>
                )}
              </div>

              {selected.notes && (
                <div className="rounded-lg p-3" style={{ background: "var(--muted)" }}>
                  <div className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>Notas</div>
                  <div className="text-sm" style={{ color: "var(--foreground)" }}>{selected.notes}</div>
                </div>
              )}

              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={{ color: "var(--foreground)" }}>
                  <TrendingUp size={13} />Crescimento de seguidores
                </div>
                {snapLoading && <div className="text-xs flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}><Loader2 size={11} className="animate-spin" />Carregando...</div>}
                {!snapLoading && chartData.length >= 2 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                      <Line type="monotone" dataKey="seguidores" stroke={platformColors[selected.platform] ?? "#06B6D4"} strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  !snapLoading && <div className="text-xs text-center py-6" style={{ color: "var(--muted-foreground)" }}>Registre pelo menos 2 contagens pra ver o gráfico de crescimento.</div>
                )}
                <div className="flex gap-2 mt-3">
                  <input
                    type="number" placeholder="Contagem atual de seguidores" value={newFollowers}
                    onChange={(e) => setNewFollowers(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg text-sm border outline-none"
                    style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                  />
                  <button onClick={handleAddSnapshot} disabled={savingSnap || !newFollowers} className="px-3 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                    {savingSnap && <Loader2 size={12} className="animate-spin" />}Registrar
                  </button>
                </div>
                <p className="text-xs mt-1.5" style={{ color: "var(--muted-foreground)" }}>Anota a contagem toda vez que checar o perfil (ex: toda segunda-feira) pra ver o crescimento real ao longo do tempo.</p>
              </div>

              <div className="rounded-lg p-3" style={{ background: "var(--muted)" }}>
                <div className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>Posts publicados nessa rede</div>
                <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{postCounts[selected.platform] ?? 0} (via módulo Conteúdo)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" style={{ background: "var(--card)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold" style={{ color: "var(--foreground)" }}>{editingId ? "Editar Canal" : "Novo Canal"}</h3>
              <button onClick={() => { setShowModal(false); setForm(emptyForm); setEditingId(null); }} style={{ color: "var(--muted-foreground)" }}><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Rede</label>
                <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}>
                  {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>@usuário / nome do canal</label>
                <input value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })} placeholder="@decairestech"
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Link do perfil</label>
                <input value={form.profile_url} onChange={(e) => setForm({ ...form, profile_url: e.target.value })} placeholder="https://instagram.com/..."
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Notas</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Estratégia, público-alvo..."
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none resize-none"
                  style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }} />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => { setShowModal(false); setForm(emptyForm); setEditingId(null); }} className="flex-1 py-2 rounded-lg text-sm border font-medium" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Cancelar</button>
              <button onClick={handleSaveChannel} disabled={saving} className="flex-1 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                {saving && <Loader2 size={13} className="animate-spin" />}
                {editingId ? "Salvar alterações" : "Cadastrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
