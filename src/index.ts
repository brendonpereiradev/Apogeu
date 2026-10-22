import { handleUpdate, setWebhook, type Update } from "./bot";
import { run } from "./run";
import { adminChat } from "./subscribers";
import { sendMessage } from "./telegram";

export interface Env {
  SEEN: KVNamespace;
  TELEGRAM_TOKEN: string;
  CHAT_IDS: string; // chats fixos, separados por vírgula; o primeiro é o administrador (recebe avisos)
  RUN_KEY: string; // protege as rotas /run e /setup
  INVITE_CODE: string; // link de convite: t.me/<bot>?start=<INVITE_CODE>
  WEBHOOK_SECRET: string; // o Telegram manda no cabeçalho de cada update
}

export default {
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      run(env).then((r) => console.log(`encontradas=${r.found} enviadas=${r.sent}`, JSON.stringify(r.report))),
    );
  },

  // POST /telegram            → webhook do bot (comandos)
  // GET /setup?key=...        → aponta o webhook do Telegram para este Worker e registra o menu
  // GET /run?key=...          → busca e envia agora
  // GET /run?key=...&dry=1    → só mostra o que seria enviado
  // GET /run?key=...&ping=1   → manda uma mensagem de teste para o administrador
  async fetch(req: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(req.url);
    if (url.pathname === "/telegram" && req.method === "POST") {
      if (!env.WEBHOOK_SECRET || req.headers.get("X-Telegram-Bot-Api-Secret-Token") !== env.WEBHOOK_SECRET) {
        return new Response("forbidden\n", { status: 403 });
      }
      // Responde na hora e processa depois (o /vagas leva alguns segundos); erro não volta ao
      // Telegram, senão ele reenvia o mesmo update várias vezes.
      const update = await req.json<Update>();
      ctx.waitUntil(handleUpdate(env, update).catch((e) => console.error("webhook", e)));
      return new Response("ok");
    }
    if (url.pathname !== "/run" && url.pathname !== "/setup") return new Response("ApogeuCVBot ok\n");
    if (!env.RUN_KEY || url.searchParams.get("key") !== env.RUN_KEY) return new Response("forbidden\n", { status: 403 });
    if (url.pathname === "/setup") return Response.json(await setWebhook(env, url.origin));
    if (url.searchParams.has("ping")) {
      await sendMessage(env.TELEGRAM_TOKEN, adminChat(env.CHAT_IDS), "✅ Bot de vagas funcionando.");
      return new Response("ping enviado\n");
    }
    const result = await run(env, { dryRun: url.searchParams.has("dry") });
    return Response.json(result);
  },
} satisfies ExportedHandler<Env>;
