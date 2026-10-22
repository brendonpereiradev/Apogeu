import { CITIES, EXCLUDE_LEVEL, EXCLUDE_TITLE, INCLUDE_REMOTE, MAX_AGE_DAYS, TOURISM_WORDS } from "./config";
import type { Job } from "./types";
import { normalize } from "./util";

const CITY_SET = new Set(CITIES.map(normalize));
const EXCLUDE = EXCLUDE_TITLE.map(normalize);
const TOURISM = TOURISM_WORDS.map(normalize);
const LEVEL_RE = new RegExp(`(^|[^a-z0-9])(${EXCLUDE_LEVEL.map(normalize).join("|")})($|[^a-z0-9])`);

export function accept(j: Job, now = Date.now()): boolean {
  const title = normalize(j.title);
  const company = normalize(j.company);
  if (!j.prefiltered && !TOURISM.some((x) => title.includes(x) || company.includes(x))) return false;
  if (EXCLUDE.some((x) => title.includes(x))) return false;
  if (LEVEL_RE.test(title) || LEVEL_RE.test(normalize(j.level ?? ""))) return false;
  if (j.publishedDate && Date.parse(j.publishedDate) < now - MAX_AGE_DAYS * 86_400_000) return false;
  if (j.workplaceType === "remote") return INCLUDE_REMOTE;
  if (j.state && j.state !== "RJ") return false;
  return CITY_SET.has(normalize(j.city));
}

// A mesma vaga costuma aparecer em mais de um site: junta pelo título + empresa + cidade
// (menos quando a empresa é confidencial, que não dá para distinguir).
export function dedupe(jobs: Job[]): Job[] {
  // A MUDES republica as vagas dela no Catho, Vagas.com e InfoJobs (às vezes com o código no título,
  // às vezes como "Confidencial"). Se a própria MUDES respondeu, essas cópias saem.
  const mudesCodes = new Set(jobs.filter((j) => j.id.startsWith("mudes:")).map((j) => j.id.slice(6)));
  const isMudesCopy = (j: Job) =>
    mudesCodes.size > 0 &&
    !j.id.startsWith("mudes:") &&
    (normalize(j.company).includes("mudes") || [...j.title.matchAll(/\b(\d{5})\b/g)].some((m) => mudesCodes.has(m[1])));

  const seen = new Set<string>();
  return jobs.filter((j) => {
    if (isMudesCopy(j)) return false;
    const company = normalize(j.company);
    if (!company || company.includes("confidencial")) return true;
    const key = `${normalize(j.title)}|${company}|${normalize(j.city)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
