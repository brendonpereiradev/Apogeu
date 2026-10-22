import { CATHO_PATHS } from "../config";
import type { Job, Source } from "../types";
import { decodeEntities, getText, match, parseBrDate, text } from "../util";

// Cada vaga é um <article class="offer ..."> na página de busca.
async function search(path: string): Promise<Job[]> {
  const html = await getText(`https://www.catho.com.br/vagas/${path}/`);
  return html.split('<article class="offer').slice(1).flatMap((card) => {
    const link = /<h2 class="title_offer">\s*<a href="(\/vagas\/[^"]+\/(\d+)[^"]*)" title="([^"]*)"/.exec(card);
    if (!link) return [];
    const place = text(match(card, /i_job_location"><\/span>([\s\S]*?)<\/p>/));
    const city = place.includes(" - ") ? place.slice(place.indexOf(" - ") + 3) : place;
    const job: Job = {
      id: `catho:${link[2]}`,
      source: "Catho",
      title: decodeEntities(link[3]).trim(),
      company: text(match(card, /<p class="mb-2">\s*<span class="text-12[^"]*">([\s\S]*?)<\/span>/)),
      city: city.replace(/\s*\(.*\)$/, "").trim(),
      state: "",
      workplaceType: /home office|remot/i.test(place) ? "remote" : "on-site",
      publishedDate: parseBrDate(match(card, /Publicada ([^<]+)</)),
      url: `https://www.catho.com.br${link[1]}`,
      salary: text(match(card, /i_salary"><\/span>\s*<strong>([\s\S]*?)<\/strong>/)) || undefined,
    };
    return [job];
  });
}

export const catho: Source = {
  name: "Catho",
  fetch: async () => (await Promise.all(CATHO_PATHS.map(search))).flat(),
};
