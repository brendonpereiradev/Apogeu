import { CIEE_AREAS } from "../config";
import type { Job, Source } from "../types";
import { getJson } from "../util";

interface CieeJob {
  codigoVaga: string;
  tipoVaga: string;
  nomeEmpresa: string;
  areaProfissional: string;
  bolsaAuxilio?: number | string | null;
  tipoAuxilioBolsa?: string | null;
  local: { bairro?: string; cidade?: string; uf?: string };
}

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

async function search(area: number): Promise<Job[]> {
  const url = `https://api.ciee.org.br/vagas/vitrine-vaga/publicadas?page=0&size=200&sort=codigoVaga,desc&idAreaProfissional=${area}`;
  const body = await getJson<{ content?: CieeJob[] }>(url);
  return (body.content ?? []).map((j) => {
    const bolsa = Number(j.bolsaAuxilio);
    const kind = j.tipoVaga === "APRENDIZ" ? "Jovem Aprendiz" : "Estágio";
    return {
      id: `ciee:${j.codigoVaga}`,
      source: "CIEE",
      title: `${kind} em ${j.areaProfissional}${j.local.bairro ? ` – ${j.local.bairro}` : ""}`,
      company: j.nomeEmpresa?.trim() ?? "",
      city: j.local.cidade ?? "",
      state: j.local.uf ?? "",
      workplaceType: "on-site",
      publishedDate: "",
      url: `https://portal.ciee.org.br/quero-uma-vaga/?codigoVaga=${j.codigoVaga}`,
      salary: bolsa > 0 ? `Bolsa ${brl(bolsa)}${j.tipoAuxilioBolsa === "Mensal" ? "/mês" : ""}` : undefined,
      level: kind,
      prefiltered: true,
    } satisfies Job;
  });
}

export const ciee: Source = {
  name: "CIEE",
  fetch: async () => (await Promise.all(CIEE_AREAS.map(search))).flat(),
};
