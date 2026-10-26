import type { Env } from "./index";
import { fixedChats, removeSubscriber } from "./subscribers";
import { sendMessage, TelegramError } from "./telegram";

// Fila de mensagens no KV ("q:<ordem>" → { chat, text }). Cada execução tem 50 requisições externas
// no plano grátis e as buscas gastam quase todas: toda mensagem entra na fila antes de ser enviada,
// sai dela só depois que o Telegram aceitou, e o que não couber sai no cron de envio (a cada 5 min).

const PREFIX = "q:";
const TTL = 3 * 86_400; // mensagem que não sai em 3 dias é descartada

export interface Outgoing {
  chat: string;
  text: string;
}

export interface Queued extends Outgoing {
  key: string;
}

let seq = 0;

// A chave começa pela hora, com zeros à esquerda, para a listagem do KV sair na ordem de entrada.
export async function enqueue(kv: KVNamespace, messages: Outgoing[]): Promise<Queued[]> {
  const stamp = String(Date.now()).padStart(15, "0");
  const queued = messages.map((m) => ({ ...m, key: `${PREFIX}${stamp}-${String(seq++ % 1e6).padStart(6, "0")}-${m.chat}` }));
  await Promise.all(queued.map((m) => kv.put(m.key, JSON.stringify({ chat: m.chat, text: m.text }), { expirationTtl: TTL })));
  return queued;
}

// Envia na ordem e para no primeiro erro que pode passar sozinho (limite de requisições, rede,
// Telegram fora ou pedindo calma): essa mensagem e as seguintes ficam na fila.
// Erro que não passa (mensagem recusada, chat que bloqueou o bot) tira a mensagem da fila.
export async function deliver(env: Env, messages: Queued[]): Promise<{ sent: number; pending: number; errors: string[] }> {
  const errors: string[] = [];
  const blocked = new Set<string>();
  let sent = 0;
  let i = 0;
  for (; i < messages.length; i++) {
    const m = messages[i];
    if (blocked.has(m.chat)) {
      await env.SEEN.delete(m.key);
      continue;
    }
    try {
      await sendMessage(env.TELEGRAM_TOKEN, m.chat, m.text);
      sent++;
    } catch (e) {
      errors.push(String(e));
      if (!(e instanceof TelegramError) || e.status === 429 || e.status >= 500) break;
      // Quem bloqueou o bot (403) sai da lista, menos os chats fixos.
      if (e.status === 403) {
        blocked.add(m.chat);
        if (!fixedChats(env.CHAT_IDS).includes(m.chat)) await removeSubscriber(env.SEEN, m.chat);
      }
    }
    await env.SEEN.delete(m.key);
  }
  return { sent, pending: messages.length - i, errors };
}

// Cron de envio: manda o que sobrou na fila. Fila vazia custa só uma listagem do KV.
export async function drainQueue(env: Env) {
  const keys: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await env.SEEN.list({ prefix: PREFIX, cursor });
    keys.push(...page.keys.map((k) => k.name));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  if (keys.length === 0) return { sent: 0, pending: 0, errors: [] };
  const values = await Promise.all(keys.map((k) => env.SEEN.get<Outgoing>(k, "json")));
  const messages = keys.flatMap((key, i) => (values[i] ? [{ ...values[i], key }] : []));
  return deliver(env, messages);
}
