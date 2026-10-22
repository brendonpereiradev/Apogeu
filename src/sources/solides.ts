import { SOLIDES_TERMS } from "../config";
import type { Job, Source } from "../types";
import { getJson, normalize, titleCase } from "../util";

interface SolidesJob {
  id: string | number;
  title: string;
  companyName?: string;
  city?: { name?: string } | null;
  state?: { code?: string } | null;
  createdAt?: string;
  jobType?: string; // "presencial" | "remoto" | "hibrido"
  homeOffice?: boolean;
  seniority?: unknown[];
}

const WORKPLACE: Record<string, Job["workplaceType"]> = { presencial: "on-site", hibrido: "hybrid", remoto: "remote", "home office": "remote" };

// Só vagas com id numérico têm página própria no portal; as outras abrem a busca pelo título.
const jobUrl = (j: SolidesJob) =>
  /^\d+$/.test(String(j.id))
    ? `https://vagas.solides.com.br/vaga/${j.id}`
    : `https://vagas.solides.com.br/vagas/${normalize(j.title).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

const levelText = (s: unknown[] = []) =>
  s.map((x) => (typeof x === "string" ? x : (x as { name?: string })?.name ?? "")).join(", ");

async function page(term: string, n: number): Promise<Job[]> {
  // A API recusa take maior que 14 (devolve erro 500).
  const url = `https://vagas.solides.com.br/api/vacancies?page=${n}&take=14&title=${encodeURIComponent(term)}&locations=`;
  const body = await getJson<{ data?: { data?: SolidesJob[] } | SolidesJob[] }>(url);
  const list = Array.isArray(body.data) ? body.data : (body.data?.data ?? []);
  return list.map((j) => ({
    id: `solides:${j.id}`,
    source: "Sólides",
    title: j.title.trim(),
    company: (j.companyName ?? "").trim(),
    city: titleCase(j.city?.name ?? ""),
    state: j.state?.code ?? "",
    workplaceType: j.homeOffice ? "remote" : (WORKPLACE[normalize(j.jobType ?? "")] ?? ""),
    publishedDate: j.createdAt ? `${j.createdAt.slice(0, 10)}T12:00:00.000Z` : "",
    url: jobUrl(j),
    level: levelText(j.seniority),
  }));
}

export const solides: Source = {
  name: "Sólides",
  fetch: async () => {
    const pages = Object.entries(SOLIDES_TERMS).flatMap(([term, n]) => Array.from({ length: n }, (_, i) => page(term, i + 1)));
    return (await Promise.all(pages)).flat();
  },
};
