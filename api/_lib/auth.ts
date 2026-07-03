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
