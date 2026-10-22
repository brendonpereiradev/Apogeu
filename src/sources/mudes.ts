import { MUDES_COURSES } from "../config";
import type { Job, Source } from "../types";
import { getText, match, text, titleCase } from "../util";

// Cada vaga é um <div class="vagas_destaque"> com tipo, curso, código, "BAIRRO - CIDADE" e bolsa.
async function search(course: string): Promise<Job[]> {
  const html = await getText(`https://mudes.org.br/resultado-vagas/?vaga=${course}&tipo=&local=&pesquisavaga=`);
  return html.split('<div class="vagas_destaque">').slice(1).map((card) => {
    const code = match(card, /C[oó]digo da Vaga:\s*<strong>(\d+)/);
    const type = text(match(card, /class="tiposup[^"]*">([\s\S]*?)<\/p>/)).replace(/^programa\s+/i, "");
    const curso = text(match(card, /class="curso">([\s\S]*?)<\/p>/));
    const place = text(match(card, /fa-map-marker-alt"><\/i>([\s\S]*?)<\/p>/));
    const [bairro, cidade] = place.includes(" - ") ? place.split(" - ").map((s) => s.trim()) : ["", place];
    const bolsa = text(match(card, /class="bolsa">([\s\S]*?)<\/p>/)).replace(/R\$\s*([\d.]+)/, (_, v) =>
      Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
    );
    return {
      id: `mudes:${code}`,
      source: "MUDES",
      title: `${titleCase(type || "Estágio")} em ${titleCase(curso)}${bairro ? ` – ${titleCase(bairro)}` : ""}`,
      company: "Fundação MUDES",
      city: titleCase(cidade),
      state: "RJ",
      workplaceType: "on-site",
      publishedDate: "",
      url: `https://mudes.org.br/descricao-vaga?codigoOferta=${code}`,
      salary: bolsa || undefined,
      level: type,
      prefiltered: true,
    } satisfies Job;
  }).filter((j) => j.id !== "mudes:");
}

export const mudes: Source = {
  name: "MUDES",
  fetch: async () => (await Promise.all(Object.keys(MUDES_COURSES).map(search))).flat(),
};
