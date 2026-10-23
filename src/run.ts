import { accept, dedupe } from "./filter";
import type { Env } from "./index";
import { SOURCES } from "./sources";
import { adminChat, fixedChats, recipients, removeSubscriber } from "./subscribers";
import { buildMessages, sendMessage, TelegramError } from "./telegram";
import type { Job } from "./types";

const SEEN_TTL = 60 * 86_400; // lembra vagas enviadas por 60 dias
const WARN_TTL = 86_400; // avisa no máximo 1 vez por dia sobre cada fonte com problema
const FAIL_TTL = 2 * 86_400; // falha anterior só conta se for de até ~2 dias atrás (as execuções são 2 por dia)

interface SourceReport {
  raw: number; // vagas lidas na fonte, antes do filtro
  accepted: number;
  error?: string;
}

async function collect(): Promise<{ jobs: Job[]; report: Record<string, SourceReport> }> {
  const results = await Promise.allSettled(SOURCES.map((s) => s.fetch()));
  const report: Record<string, SourceReport> = {};
  const jobs: Job[] = [];
  results.forEach((r, i) => {
    const name = SOURCES[i].name;
    if (r.status === "rejected") {
      report[name] = { raw: 0, accepted: 0, error: String(r.reason) };
      return;
    }
    const ok = r.value.filter((j) => accept(j));
    report[name] = { raw: r.value.length, accepted: ok.length };
    jobs.push(...ok);
  });
  // Uma mesma vaga pode vir de duas buscas da mesma fonte: fica a primeira ocorrência de cada id.
  const byId = new Map<string, Job>();
  for (const j of jobs) if (!byId.has(j.id)) byId.set(j.id, j);
  return { jobs: dedupe([...byId.values()]), report };
}

// Uma fonte que dá erro ou volta vazia provavelmente mudou o site: avisa o primeiro chat.
// Só avisa na segunda execução seguida com problema, porque bloqueios de um horário só são comuns.
async function warnBroken(env: Env, chatId: string, report: Record<string, SourceReport>) {
  for (const [name, r] of Object.entries(report)) {
    const failKey = `fail:${name}`;
    if (!r.error && r.raw > 0) {
      await env.SEEN.delete(failKey);
      continue;
    }
    if (!(await env.SEEN.get(failKey))) {
      await env.SEEN.put(failKey, "1", { expirationTtl: FAIL_TTL });
      continue;
    }
    const key = `warn:${name}`;
    if (await env.SEEN.get(key)) continue;
    const why = r.error ? `erro: ${r.error}` : "nenhuma vaga lida (o site pode ter mudado)";
    await sendMessage(env.TELEGRAM_TOKEN, chatId, `⚠️ Fonte <b>${name}</b> com problema — ${why.replace(/</g, "&lt;")}`);
    await env.SEEN.put(key, "1", { expirationTtl: WARN_TTL });
  }
}

// Erro com um chat não pode travar o envio para os outros. Quem bloqueou o bot (403) sai da lista.
async function deliver(env: Env, chatId: string, text: string, errors: string[]) {
  try {
    await sendMessage(env.TELEGRAM_TOKEN, chatId, text);
  } catch (e) {
    errors.push(String(e));
    if (e instanceof TelegramError && e.status === 403 && !fixedChats(env.CHAT_IDS).includes(chatId)) {
      await removeSubscriber(env.SEEN, chatId);
    }
  }
}

// Para quem acabou de se cadastrar: manda só para esse chat todas as vagas abertas agora
// (inclusive as já enviadas aos outros), sem marcar nada como visto.
export async function sendOpenJobs(env: Env, chatId: string): Promise<number> {
  const { jobs } = await collect();
  if (jobs.length === 0) return 0;
  for (const text of buildMessages(jobs, "abertas")) await sendMessage(env.TELEGRAM_TOKEN, chatId, text);
  return jobs.length;
}

// Nos horários fixos, sem vaga nova, avisa todos que a busca rodou e diz quando é a próxima.
function noNewsMessage(): string {
  const hour = Number(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo", hour: "numeric", hourCycle: "h23" }));
  const next = hour >= 8 && hour < 18 ? "18h" : "08h";
  return `🔎 Nenhuma vaga nova de turismo desde o último envio. Próxima busca às ${next}.`;
}

// Busca em todas as fontes e envia as vagas novas para todos os cadastrados.
// announceEmpty: manda o aviso de "nenhuma vaga nova" (só nos horários fixos; o /vagas responde por conta própria).
export async function run(env: Env, opts: { dryRun?: boolean; announceEmpty?: boolean } = {}) {
  const { jobs, report } = await collect();

  const seen = await Promise.all(jobs.map((j) => env.SEEN.get(j.id)));
  const fresh = jobs.filter((_, i) => seen[i] === null);

  const chats = await recipients(env.SEEN, env.CHAT_IDS);
  const sendErrors: string[] = [];
  if (!opts.dryRun) {
    if (fresh.length > 0) {
      for (const text of buildMessages(fresh)) {
        for (const chatId of chats) await deliver(env, chatId, text, sendErrors);
      }
      await Promise.all(fresh.map((j) => env.SEEN.put(j.id, "1", { expirationTtl: SEEN_TTL })));
    } else if (opts.announceEmpty) {
      const text = noNewsMessage();
      for (const chatId of chats) await deliver(env, chatId, text, sendErrors);
    }
    const admin = adminChat(env.CHAT_IDS);
    if (admin) await warnBroken(env, admin, report);
  }

  return { found: jobs.length, sent: opts.dryRun ? 0 : fresh.length, recipients: chats.length, sendErrors, report, fresh };
}
