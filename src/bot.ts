import type { Env } from "./index";
import { run, sendOpenJobs } from "./run";
import { addSubscriber, adminChat, fixedChats, isSubscribed, removeSubscriber } from "./subscribers";
import { sendMessage } from "./telegram";

const VAGAS_COOLDOWN = 10 * 60; // segundos entre dois /vagas (de qualquer pessoa)

export interface Update {
  message?: {
    text?: string;
    chat: { id: number; type: string; first_name?: string; last_name?: string; username?: string; title?: string };
  };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Menu que o Telegram mostra ao digitar "/" (registrado pela rota /setup). Novo comando: inclua aqui.
export const COMMANDS = [
  { command: "start", description: "Ver se seu cadastro está ativo" },
  { command: "parar", description: "Deixar de receber vagas" },
  { command: "vagas", description: "Buscar vagas novas agora" },
  { command: "ajuda", description: "Como o bot funciona e lista de comandos" },
];

const HELP =
  "Você recebe aqui vagas de turismo, recepção, secretariado e atendimento (estágio e nível inicial) em São Gonçalo, Niterói e região, às 08h e às 18h.\n\n" +
  COMMANDS.map((c) => `/${c.command} — ${c.description}`).join("\n");

// Webhook do Telegram: trata /start <convite> e /parar.
export async function handleUpdate(env: Env, update: Update): Promise<void> {
  const msg = update.message;
  if (!msg?.text || msg.chat.type !== "private") return;

  const chatId = String(msg.chat.id);
  const [command, arg = ""] = msg.text.trim().split(/\s+/, 2);
  const name = [msg.chat.first_name, msg.chat.last_name].filter(Boolean).join(" ") || "sem nome";
  const reply = (text: string) => sendMessage(env.TELEGRAM_TOKEN, chatId, text);
  const known = fixedChats(env.CHAT_IDS).includes(chatId) || (await isSubscribed(env.SEEN, chatId));

  switch (command.split("@")[0].toLowerCase()) {
    case "/start": {
      if (known) return reply(`Oi, ${esc(name)}! Seu cadastro já está ativo. ✅\n\n${HELP}`);
      if (!env.INVITE_CODE || arg !== env.INVITE_CODE) {
        return reply("Este bot é só para convidados. Peça o link de convite para quem te indicou. 🙂");
      }
      await addSubscriber(env.SEEN, chatId, { name, username: msg.chat.username, since: new Date().toISOString() });
      await reply(`Bem-vindo(a), ${esc(name)}! ✈️ Cadastro feito.\n\n${HELP}`);
      const admin = adminChat(env.CHAT_IDS);
      if (admin && admin !== chatId) {
        const user = msg.chat.username ? ` (@${esc(msg.chat.username)})` : "";
        await sendMessage(env.TELEGRAM_TOKEN, admin, `🆕 Novo cadastro: <b>${esc(name)}</b>${user} — chat ${chatId}`);
      }
      // As vagas abertas já foram enviadas a quem entrou antes; quem chega agora recebe todas uma vez.
      try {
        await reply("🔎 Buscando as vagas abertas agora para você, leva alguns segundos…");
        const n = await sendOpenJobs(env, chatId);
        if (n === 0) await reply("No momento não há vagas abertas no filtro. Assim que surgir alguma, você recebe aqui.");
      } catch (e) {
        console.error("vagas abertas no cadastro", e);
        await reply("Não consegui buscar as vagas abertas agora. As próximas chegam no horário normal (08h e 18h).");
      }
      return;
    }
    case "/vagas":
      if (!known) return reply("Este bot é só para convidados. Peça o link de convite para quem te indicou. 🙂");
      return searchNow(env, reply);
    case "/ajuda":
    case "/help":
      return reply(known ? HELP : "Este bot é só para convidados. Peça o link de convite para quem te indicou. 🙂");
    case "/parar": {
      if (fixedChats(env.CHAT_IDS).includes(chatId)) {
        return reply("Seu chat está fixo na configuração (CHAT_IDS); para sair, ele precisa ser removido de lá.");
      }
      if (!(await isSubscribed(env.SEEN, chatId))) return reply("Você não está cadastrado.");
      await removeSubscriber(env.SEEN, chatId);
      return reply("Pronto, você não vai mais receber vagas. Para voltar, use o link de convite de novo.");
    }
    default:
      if (known) return reply(HELP);
  }
}

const hhmm = (ms: number) =>
  new Date(ms).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });

// /vagas: faz a mesma busca dos horários fixos. As vagas novas vão para todos os cadastrados
// (para ninguém perder vaga); quem pediu também recebe o resultado quando não há novidade.
// Intervalo mínimo entre buscas para não sobrecarregar os sites nem estourar o limite grátis.
async function searchNow(env: Env, reply: (text: string) => Promise<void>) {
  const last = await env.SEEN.get("cooldown:vagas");
  if (last) {
    const next = Number(last) + VAGAS_COOLDOWN * 1000;
    return reply(`Fiz uma busca às ${hhmm(Number(last))}. Dá para buscar de novo a partir das ${hhmm(next)}. ⏳`);
  }
  await env.SEEN.put("cooldown:vagas", String(Date.now()), { expirationTtl: VAGAS_COOLDOWN });
  await reply("🔎 Buscando vagas agora, leva alguns segundos…");
  try {
    const r = await run(env);
    if (r.sent === 0) {
      const total = r.found === 1 ? "A 1 vaga aberta" : `As ${r.found} vagas abertas`;
      await reply(`Nenhuma vaga nova desde o último envio. ${r.found ? `${total} que combinam com o filtro já foram enviadas antes.` : ""}`.trim());
    }
  } catch (e) {
    console.error("/vagas", e);
    await reply("Não consegui buscar agora. Tente de novo mais tarde. 😕");
  }
}

// Aponta o webhook do bot para este Worker (rodar uma vez, pela rota /setup).
export async function setWebhook(env: Env, workerOrigin: string) {
  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: `${workerOrigin}/telegram`,
      secret_token: env.WEBHOOK_SECRET,
      allowed_updates: ["message"],
      drop_pending_updates: true,
    }),
  });
  const commands = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/setMyCommands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ commands: COMMANDS }),
  });
  // Botão "Menu" ao lado do campo de mensagem abre a mesma lista.
  const menu = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/setChatMenuButton`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ menu_button: { type: "commands" } }),
  });
  return { webhook: await res.json(), commands: await commands.json(), menu: await menu.json() };
}
