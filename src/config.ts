// ---------------------------------------------------------------------------
// Buscas por fonte. O plano gratuito da Cloudflare permite 50 requisições por
// execução: cada item abaixo é 1 requisição (somando tudo, hoje 41). O envio pelo
// Telegram também conta (1 por mensagem, para cada cadastrado), então deixe folga.
// ---------------------------------------------------------------------------

// Gupy: busca pelo título da vaga (o termo pega também títulos maiores: "viagens" já traz
// "agente de viagens", "hotel" já traz "hotelaria").
export const GUPY_TERMS = ["turismo", "viagens", "hotel", "hospedagem", "pousada", "eventos"];

// Gupy, só no estado do RJ: termos comuns no Brasil todo, em que as 100 vagas da busca
// sem filtro seriam quase todas de fora.
export const GUPY_RJ_TERMS = ["recepcionista", "recepção", "secretária", "atendente"];

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
  "recepcionista/rio-de-janeiro-rj",
  "recepcionista/niteroi-rj",
  "recepcionista/sao-goncalo-rj",
];

// Vagas.com: final de vagas.com.br/vagas-de-...
export const VAGASCOM_PATHS = [
  "turismo-em-rio-de-janeiro",
  "hotelaria-em-rio-de-janeiro",
  "turismo-em-niteroi",
  "turismo-em-sao-goncalo",
  "recepcionista-em-rio-de-janeiro", // traz também atendente
];

// InfoJobs: páginas de busca por área e cidade.
export const INFOJOBS_PATHS = [
  "vagas-de-emprego-turismo-em-rio-de-janeiro,-rj.aspx",
  "vagas-de-emprego-hotelaria-em-rio-de-janeiro,-rj.aspx",
  "vagas-de-emprego-recepcionista-em-rio-de-janeiro,-rj.aspx",
  "vagas-de-emprego-secretaria-em-rio-de-janeiro,-rj.aspx",
];

// Sólides: termo → quantas páginas (14 vagas cada, mais novas primeiro). Não filtra por cidade,
// por isso recepção fica de fora (as 14 vagas de "recepcionista" vêm do Brasil todo).
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

// A vaga só entra se o título ou o nome da empresa tiver um destes trechos de turismo,
// ou se o título tiver um dos trechos de RECEPTION_WORDS.
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

// Recepção, secretariado e atendimento. Só o título conta: empresas como "Secretaria
// Municipal de Saúde" trariam vagas de qualquer área.
export const RECEPTION_WORDS = ["recepcion", "recepcao", "front desk", "secretari", "atendente"];

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
  // atendente de comida (mesma linha de cozinha/garçom acima)
  "atendente de restaurante",
  "atendente restaurante",
  "lanchonete",
  "fast food",
  "padaria",
  "balconista",
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
