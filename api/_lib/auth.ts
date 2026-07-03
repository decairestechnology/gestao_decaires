import { jwtVerify, createRemoteJWKSet } from "jose";

const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID;

const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

export interface AuthUser {
  uid: string;
  email: string | null;
  name: string | null;
}

/**
 * Nome amigável pra gravar como "responsável"/"autor": prioriza o nome de exibição
 * do Firebase; se a pessoa ainda não configurou um nome, usa a parte antes do @
 * do e-mail (em vez do e-mail inteiro, que fica feio nas telas).
 */
export function niceName(user: AuthUser): string {
  return user.name || user.email?.split("@")[0] || "Equipe";
}

/**
 * Confere o token de login (Firebase ID token) que o front manda no header Authorization.
 * Retorna os dados do usuário se for válido, ou null se não for.
 */
export async function verifyAuth(authHeader: string | undefined): Promise<AuthUser | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
    });
    return {
      uid: payload.sub as string,
      email: (payload.email as string) ?? null,
      name: (payload.name as string) ?? null,
    };
  } catch {
    return null;
  }
}
