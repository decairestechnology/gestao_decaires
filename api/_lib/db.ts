import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não configurada");
}

// Cliente HTTP do Neon — ideal pra funções serverless (sem gerenciamento de conexão persistente)
export const sql = neon(process.env.DATABASE_URL);
