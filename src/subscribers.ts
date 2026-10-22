// Quem recebe as vagas: os chats fixos de CHAT_IDS (o primeiro é o administrador)
// mais quem se cadastrou pelo link de convite, guardado no KV como "sub:<chat id>".

const PREFIX = "sub:";

export interface Subscriber {
  name: string;
  username?: string;
  since: string;
}

export const fixedChats = (chatIds: string) => chatIds.split(",").map((s) => s.trim()).filter(Boolean);

export const adminChat = (chatIds: string) => fixedChats(chatIds)[0];

export async function isSubscribed(kv: KVNamespace, chatId: string) {
  return (await kv.get(PREFIX + chatId)) !== null;
}

export async function addSubscriber(kv: KVNamespace, chatId: string, sub: Subscriber) {
  await kv.put(PREFIX + chatId, JSON.stringify(sub));
}

export async function removeSubscriber(kv: KVNamespace, chatId: string) {
  await kv.delete(PREFIX + chatId);
}

export async function listSubscribers(kv: KVNamespace): Promise<string[]> {
  const ids: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await kv.list({ prefix: PREFIX, cursor });
    ids.push(...page.keys.map((k) => k.name.slice(PREFIX.length)));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return ids;
}

export async function recipients(kv: KVNamespace, chatIds: string): Promise<string[]> {
  return [...new Set([...fixedChats(chatIds), ...(await listSubscribers(kv))])];
}
