import { VAGASCOM_PATHS } from "../config";
import type { Job, Source } from "../types";
import { decodeEntities, getText, match, parseBrDate, text } from "../util";

// Cada vaga é um <li class="vaga ..."> com título, empresa, nível, local ("Cidade / UF") e data.
async function search(path: string): Promise<Job[]> {
  const html = await getText(`https://www.vagas.com.br/vagas-de-${path}`);
  return html.split('<li class="vaga').slice(1).flatMap((card) => {
    const link = /title="([^"]+)"[^>]*href="(\/vagas\/v(\d+)[^"]*)"/.exec(card);
    if (!link) return [];
    const place = text(match(card, /class="vaga-local">([\s\S]*?)<div/));
    const [city, state] = place.split("/").map((s) => s.trim());
    const job: Job = {
      id: `vagascom:${link[3]}`,
      source: "Vagas.com",
      title: decodeEntities(link[1]).trim(),
      company: text(match(card, /class="emprVaga">([\s\S]*?)<\/span>/)),
      city: city ?? "",
      state: state ?? "",
      workplaceType: /remot|home office/i.test(place) ? "remote" : "on-site",
      publishedDate: parseBrDate(text(match(card, /class="data-publicacao">([\s\S]*?)<\/span>/))),
      url: `https://www.vagas.com.br${link[2]}`,
      level: text(match(card, /class="nivelVaga">([\s\S]*?)<\/span>/)),
    };
    return [job];
  });
}

export const vagascom: Source = {
  name: "Vagas.com",
  fetch: async () => (await Promise.all(VAGASCOM_PATHS.map(search))).flat(),
};
