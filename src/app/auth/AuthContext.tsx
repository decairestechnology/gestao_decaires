import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "../../lib/firebase";

// Lista de e-mails autorizados a entrar com Google.
// Login por e-mail/senha não precisa disso — só quem o admin criar no Firebase Console consegue logar.
const ALLOWED_EMAILS = (import.meta.env.VITE_ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean);

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function loginWithEmail(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    const email = result.user.email?.toLowerCase() ?? "";

    if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(email)) {
      await signOut(auth);
      throw new Error(
        "Esse e-mail não tem acesso ao sistema. Fale com o administrador para ser adicionado."
      );
    }
  }

  async function logout() {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginWithEmail, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  return ctx;
}
