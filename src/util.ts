const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

async function get(url: string, accept: string): Promise<Response> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: accept, "Accept-Language": "pt-BR" } });
  if (!res.ok) throw new Error(`${new URL(url).hostname}: HTTP ${res.status}`);
  return res;
}

export const getText = async (url: string) => (await get(url, "text/html")).text();
export const getJson = async <T>(url: string) => (await get(url, "application/json")).json() as Promise<T>;

export const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

const NAMED: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export const decodeEntities = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") return String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return NAMED[e.toLowerCase()] ?? m;
  });

// Remove tags, decodifica entidades e junta espaços.
export const text = (html: string) => decodeEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();

export const match = (s: string, re: RegExp) => re.exec(s)?.[1] ?? "";

const SMALL_WORDS = new Set(["de", "da", "do", "das", "dos", "e", "em"]);

// "RIO DE JANEIRO" → "Rio de Janeiro"
export const titleCase = (s: string) =>
  s
    .toLowerCase()
    .split(/(\s+|\/|-|\()/)
    .map((w, i) => (i > 0 && SMALL_WORDS.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join("");

const DAY = 86_400_000;

// Converte datas no estilo dos sites ("Há 2 dias", "ontem", "07/10", "25/09/2026") para ISO.
export function parseBrDate(raw: string, now = Date.now()): string {
  const s = normalize(raw);
  if (!s) return "";
  if (s.includes("hoje") || /\bha \d+ (hora|minuto)/.test(s)) return new Date(now).toISOString();
  if (s.includes("ontem")) return new Date(now - DAY).toISOString();
  const days = /\bha (\d+) dias?/.exec(s);
  if (days) return new Date(now - Number(days[1]) * DAY).toISOString();
  const d = /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/.exec(s);
  if (d) {
    const today = new Date(now);
    let year = d[3] ? Number(d[3].length === 2 ? "20" + d[3] : d[3]) : today.getUTCFullYear();
    let date = Date.UTC(year, Number(d[2]) - 1, Number(d[1]), 12);
    if (!d[3] && date > now + DAY) date = Date.UTC(year - 1, Number(d[2]) - 1, Number(d[1]), 12); // "07/12" lido em janeiro
    return new Date(date).toISOString();
  }
  return "";
}
