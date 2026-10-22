export interface Job {
  id: string; // "<fonte>:<id na fonte>", usado para não reenviar
  source: string; // nome exibido na mensagem
  title: string;
  company: string;
  city: string;
  state: string; // sigla (RJ) ou vazio quando a fonte não informa
  workplaceType: "on-site" | "hybrid" | "remote" | "";
  publishedDate: string; // ISO ou vazio quando a fonte não informa
  url: string;
  salary?: string;
  level?: string; // nível informado pela fonte (ex.: "Estágio")
  // A busca na fonte já é por curso/área de turismo: dispensa a checagem de palavras de turismo.
  prefiltered?: boolean;
}

export interface Source {
  name: string;
  fetch(): Promise<Job[]>;
}
