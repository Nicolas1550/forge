import { Pool } from 'pg';
const globalForPg = globalThis as unknown as {forgePool?:Pool};
export function db():Pool{
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL no configurada en .env.local');
  if (!globalForPg.forgePool) globalForPg.forgePool = new Pool({
    connectionString:process.env.DATABASE_URL,
    max:6, idleTimeoutMillis:30000,connectionTimeoutMillis:12000,
    application_name:'forge-nextjs'
  });
  return globalForPg.forgePool;
}
export async function isDatabaseReady():Promise<boolean>{
  const res=await db().query("SELECT COUNT(*)::int AS n FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'forge_%'");
  return Number(res.rows[0].n)===13;
}
