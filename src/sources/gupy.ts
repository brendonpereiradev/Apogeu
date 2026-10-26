import { GUPY_RJ_TERMS, GUPY_TERMS } from "../config";
import type { Job, Source } from "../types";
import { getJson } from "../util";

interface GupyJob {
  id: number;
  name: string;
  careerPageName?: string;
  city?: string;
  state?: string;
  workplaceType?: string;
  publishedDate?: string;
  jobUrl: string;
}

const WORKPLACE: Record<string, Job["workplaceType"]> = { "on-site": "on-site", hybrid: "hybrid", remote: "remote" };

async function search(term: string, state = ""): Promise<Job[]> {
  const filter = state ? `&state=${encodeURIComponent(state)}` : "";
  const url = `https://portal.gupy.io/api/job-search/jobs?jobName=${encodeURIComponent(term)}&limit=100&offset=0${filter}`;
  const body = await getJson<{ data?: GupyJob[] }>(url);
  return (body.data ?? []).map((j) => ({
    id: `gupy:${j.id}`,
    source: "Gupy",
    title: j.name.trim(),
    company: (j.careerPageName ?? "").trim(),
    city: j.city ?? "",
    state: j.state === "Rio de Janeiro" ? "RJ" : j.state ? "outro" : "",
    workplaceType: WORKPLACE[j.workplaceType ?? ""] ?? "",
    publishedDate: j.publishedDate ?? "",
    url: j.jobUrl,
  }));
}

export const gupy: Source = {
  name: "Gupy",
  fetch: async () =>
    (
      await Promise.all([...GUPY_TERMS.map((t) => search(t)), ...GUPY_RJ_TERMS.map((t) => search(t, "Rio de Janeiro"))])
    ).flat(),
};
