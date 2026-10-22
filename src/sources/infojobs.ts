import { INFOJOBS_PATHS } from "../config";
import type { Job, Source } from "../types";
import { getText, match, text } from "../util";

const WORKPLACE: Record<string, Job["workplaceType"]> = { presencial: "on-site", hibrido: "hybrid", "home office": "remote", remoto: "remote" };

// Cada vaga é um <div id="vacancyNNN" ... data-href="/vaga-de-..."> na página de busca.
async function search(path: string): Promise<Job[]> {
  const html = await getText(`https://www.infojobs.com.br/${path}`);
  return html.split('<div id="vacancy').slice(1).flatMap((card) => {
    const id = match(card, /data-id="(\d+)"/);
    const href = match(card, /data-href="([^"]+)"/);
    if (!id || !href) return [];
    // A empresa vem num <a>; o selo de "verificada" logo depois tem HTML dentro de atributos, por isso o corte antes dele.
    const company = text(match(card, /<div class="text-body">\s*<a[^>]*>([\s\S]*?)(?:<span onclick|<\/a>)/));
    const place = text(match(card, /<div class="mb-8">([^<]*)</));
    const [city, state] = place.split(" - ").map((s) => s.trim());
    const mode = text(match(card, /#buildings"\s*\/>\s*<\/svg>([^<]*)</)).toLowerCase();
    const date = match(card, /class="js_date" data-value="([^"]+)"/); // "2026/10/21 11:28:00", horário de Brasília
    const job: Job = {
      id: `infojobs:${id}`,
      source: "InfoJobs",
      title: text(match(card, /js_vacancyTitle">([\s\S]*?)<\/h2>/)),
      company,
      city: city ?? "",
      state: state ?? "",
      workplaceType: WORKPLACE[mode.normalize("NFD").replace(/[̀-ͯ]/g, "")] ?? "",
      publishedDate: date ? new Date(date.replace(/\//g, "-").replace(" ", "T") + "-03:00").toISOString() : "",
      url: `https://www.infojobs.com.br${href}`,
      salary: text(match(card, /#money"\s*\/>\s*<\/svg>([^<]*)</)) || undefined,
    };
    return [job];
  });
}

export const infojobs: Source = {
  name: "InfoJobs",
  fetch: async () => (await Promise.all(INFOJOBS_PATHS.map(search))).flat(),
};
