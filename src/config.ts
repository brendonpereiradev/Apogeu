// ---------------------------------------------------------------------------
// Buscas por fonte. O plano gratuito da Cloudflare permite 50 requisições por
// execução: cada item abaixo é 1 requisição (somando tudo, hoje ~38).
// ---------------------------------------------------------------------------

// Gupy: busca pelo título da vaga.
export const GUPY_TERMS = [
  "turismo",
  "estágio turismo",
  "estágio hotelaria",
  "trainee hotelaria",
  "agente de viagens",
  "consultor de viagens",
  "viagens",
  "hotel",
  "hotelaria",
  "hospedagem",
  "pousada",
  "eventos",
];

// CIEE: área profissional "Turismo/Lazer" (estágio, nível superior).
export const CIEE_AREAS = [37];

// MUDES: códigos de curso no filtro "Selecione o Curso".
export const MUDES_COURSES = {
  1026: "Gestão de Turismo",
  1033: "Tecnologia em Gestão de Turismo",
  1300: "Gestão em Turismo e Hospitalidade",
  43: "Turismo",
  795: "Tecnologia em Turismo e Hotelaria",
  1027: "Gestão de Hotelaria",
  652: "Hotelaria",
  726: "Gestão de Eventos",
};

// Catho: caminho "<área>/<cidade>" de catho.com.br/vagas/...
export const CATHO_PATHS = [
  "turismo/rio-de-janeiro-rj",
  "estagio-turismo/rio-de-janeiro-rj",
  "hotelaria/rio-de-janeiro-rj",
  "turismo/niteroi-rj",
  "turismo/sao-goncalo-rj",
];

// Vagas.com: final de vagas.com.br/vagas-de-...
export const VAGASCOM_PATHS = [
  "turismo-em-rio-de-janeiro",
  "hotelaria-em-rio-de-janeiro",
  "turismo-em-niteroi",
  "turismo-em-sao-goncalo",
];

// InfoJobs: páginas de busca por área e cidade.
export const INFOJOBS_PATHS = [
  "vagas-de-emprego-turismo-em-rio-de-janeiro,-rj.aspx",
  "vagas-de-emprego-hotelaria-em-rio-de-janeiro,-rj.aspx",
];

// Sólides: termo → quantas páginas (14 vagas cada, mais novas primeiro).
export const SOLIDES_TERMS: Record<string, number> = {
  turismo: 2,
  hotelaria: 1,
  "agente de viagens": 1,
  "estágio turismo": 1,
};

// ---------------------------------------------------------------------------
// Filtros (valem para todas as fontes)
// ---------------------------------------------------------------------------

// Cidades aceitas (comparação sem acento e sem maiúsculas). Estado tem que ser RJ.
export const CITIES = [
  "São Gonçalo",
  "Niterói",
  "Itaboraí",
  "Maricá",
  "Rio Bonito",
  "Tanguá",
  "Rio de Janeiro",
];

// Vagas 100% remotas também entram (qualquer cidade).
export const INCLUDE_REMOTE = true;

// A vaga só entra se o título ou o nome da empresa tiver um destes trechos.
// (Não vale para CIEE e MUDES, que já buscam pelo curso/área de turismo.)
export const TOURISM_WORDS = [
  "turismo",
  "turistic",
  "viagem",
  "viagens",
  "hotel",
  "hoteleir",
  "hospitality",
  "hospedagem",
  "pousada",
  "resort",
  "evento",
  "cruzeiro",
  "passage",
  "aereo",
  "aerea",
  "aeroporto",
  "parque",
  "bondinho",
  "cvc",
];

// Vagas com qualquer um destes trechos no título são descartadas (fora da área).
export const EXCLUDE_TITLE = [
  "banco de talentos",
  "pcd",
  "cozinh",
  "copeir",
  "garcom",
  "barman",
  "estoquista",
  "almoxarifado",
  "manutencao",
  "eletricista",
  "limpeza",
  "servicos gerais",
  "arrumador",
  "camareir",
  "governanta",
  "lavanderia",
  "mensageiro",
  "steward",
  "maitre",
  "hostess",
  "bartender",
  "porteiro",
  "manobrista",
  "controller",
  "contab",
  "mecanic",
  "motorista",
  "vigilante",
  "seguranca",
  "tecnico",
  "operador",
  "operacoes leves",
  "call center",
  "telemarketing",
  "teleatendimento",
  "sac",
  "vendedor externo",
  "fraude",
  "cartao",
  "disponibilidade para viag",
];

// Níveis acima de júnior/estágio (palavras inteiras no título ou no nível da vaga).
export const EXCLUDE_LEVEL = [
  "senior",
  "sr",
  "pleno",
  "pl",
  "ii",
  "iii",
  "iv",
  "gerente",
  "gerencia",
  "coordenador",
  "coordenadora",
  "coordenacao",
  "supervisor",
  "supervisora",
  "especialista",
  "lider",
  "lideranca",
  "head",
  "diretor",
  "diretora",
  "diretoria",
  "gestor",
  "gestora",
];

// Ignora vagas publicadas há mais de N dias (quando a fonte informa a data).
export const MAX_AGE_DAYS = 14;
