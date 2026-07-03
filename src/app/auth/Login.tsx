import { useState, type FormEvent } from "react";
import { Loader2, LogIn } from "lucide-react";
import { useAuth } from "./AuthContext";

function mapAuthError(code: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-mail ou senha incorretos.";
    case "auth/too-many-requests":
      return "Muitas tentativas. Aguarde um pouco e tente novamente.";
    case "auth/popup-closed-by-user":
      return "Login com Google cancelado.";
    default:
      return "Não foi possível entrar. Tente novamente.";
  }
}

export function Login() {
  const { loginWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      setError(mapAuthError(err?.code ?? ""));
    } finally {
      setLoading(false);
    }
  }


  return (
    <div
      className="flex items-center justify-center h-screen"
      style={{ background: "var(--background)", fontFamily: "'Manrope', 'Inter', system-ui, sans-serif" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8 shadow-lg border"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold mb-3 shadow"
            style={{ background: "linear-gradient(135deg, #06B6D4, #7C3AED)" }}
          >
            DC
          </div>
          <h1 className="font-bold text-lg" style={{ color: "var(--foreground)" }}>
            DeCaires Technology
          </h1>
          <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
            Entre para acessar o sistema de gestão
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--foreground)" }}>
              E-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border outline-none"
              style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }}
              placeholder="voce@decaires.com.br"
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--foreground)" }}>
              Senha
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border outline-none"
              style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-xs rounded-lg px-3 py-2" style={{ background: "#FEF2F2", color: "#991B1B" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-lg transition hover:opacity-90 disabled:opacity-60"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}