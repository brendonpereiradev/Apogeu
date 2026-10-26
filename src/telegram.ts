import type { Job } from "./types";

const MAX_LEN = 3800; // limite do Telegram é 4096

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const MODE: Record<string, string> = { "on-site": "Presencial", hybrid: "Híbrido", remote: "Remoto" };

function formatJob(j: Job): string {
  const date = j.publishedDate ? new Date(j.publishedDate).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "";
  const city = j.workplaceType === "remote" ? "" : j.city;
  const where = [city, MODE[j.workplaceType]].filter(Boolean).join(" · ");
  const lines = [`<b>${esc(j.title)}</b>`];
  if (j.company) lines.push(`🏢 ${esc(j.company)}`);
  lines.push(`📍 ${esc(where)}${date ? `  ·  📅 ${date}` : ""}`);
  if (j.salary) lines.push(`💰 ${esc(j.salary)}`);
  lines.push(`🔗 <a href="${esc(j.url)}">Ver vaga</a> (${esc(j.source)})`);
  return lines.join("\n");
}

export function buildMessages(jobs: Job[], kind: "novas" | "abertas" = "novas"): string[] {
  const header =
    kind === "novas"
      ? `✈️ <b>${jobs.length} ${jobs.length === 1 ? "vaga nova" : "vagas novas"} de turismo e recepção</b>`
      : `📋 <b>${jobs.length} ${jobs.length === 1 ? "vaga aberta" : "vagas abertas"} agora</b>`;
  const messages: string[] = [];
  let current = header;
  for (const j of jobs) {
    const block = formatJob(j);
    if (current.length + block.length + 2 > MAX_LEN) {
      messages.push(current);
      current = block;
    } else {
      current += "\n\n" + block;
    }
  }
  messages.push(current);
  return messages;
}

export class TelegramError extends Error {
  constructor(
    readonly chatId: string,
    readonly status: number,
    body: string,
  ) {
    super(`Telegram ${chatId}: HTTP ${status} ${body}`);
  }
}

export async function sendMessage(token: string, chatId: string, text: string): Promise<void> {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
  });
  if (!res.ok) throw new TelegramError(chatId, res.status, await res.text());
}
