// Aplica a cor de destaque escolhida nas variáveis CSS que controlam botões,
// links e realces em todo o sistema (var(--primary) é usada em quase todo componente).
export function applyAccentColor(color: string) {
  const root = document.documentElement;
  root.style.setProperty("--primary", color);
  root.style.setProperty("--ring", color);
  root.style.setProperty("--sidebar-primary", color);
}
