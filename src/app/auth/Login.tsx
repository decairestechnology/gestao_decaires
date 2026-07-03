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
  const { loginWithEmail, loginWithGoogle } = useAuth();
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

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err?.message ?? mapAuthError(err?.code ?? ""));
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

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>ou</span>
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-lg border transition hover:bg-black/5 disabled:opacity-60"
          style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
        >
          <svg width="16" height="16" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l6-6C34.5 5.5 29.5 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5c11.3 0 20.5-9.2 20.5-20.5 0-1.4-.1-2.7-.4-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.9 18.9 13.5 24 13.5c3.1 0 5.9 1.2 8 3.1l6-6C34.5 7 29.5 5 24 5c-7.6 0-14.1 4.3-17.7 10.7z"/>
            <path fill="#4CAF50" d="M24 44.5c5.4 0 10.3-1.8 14-5l-6.5-5.5c-2 1.5-4.6 2.5-7.5 2.5-5.2 0-9.7-3.4-11.3-8.1l-6.6 5C9.9 40.1 16.4 44.5 24 44.5z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.6l6.5 5.5c-.5.4 6.9-5 6.9-15.6 0-1.4-.1-2.7-.4-4z"/>
          </svg>
          Entrar com Google
        </button>
      </div>
    </div>
  );
}
