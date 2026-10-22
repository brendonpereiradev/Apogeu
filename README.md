<h1 align="center">Apogeu</h1>

<p align="center">
  Bot do Telegram que reúne vagas de turismo e hotelaria de vários sites e envia as novas duas vezes por dia.
</p>

<p align="center">
  <img src="assets/logo.png" alt="Logotipo do Apogeu" width="180" />
</p>

<p align="center">
  <a href="https://t.me/ApogeuCVBot" target="_blank"><strong>@ApogeuCVBot</strong></a>
</p>

---

## Sobre o projeto

Apogeu é um Cloudflare Worker escrito em TypeScript que procura vagas de turismo (estágio, júnior e cargos de entrada) em São Gonçalo, Niterói, Itaboraí, Maricá, Rio Bonito, Tanguá, Rio de Janeiro e vagas remotas. As buscas rodam às 08h e às 18h, no horário de Brasília, e as vagas que ainda não foram enviadas chegam pelo bot **@ApogeuCVBot**.

O Worker consulta sete fontes, aplica um filtro comum de cidade, área e nível, e remove as vagas repetidas entre sites. O acesso é restrito a convidados: quem abre o link de convite fica cadastrado e passa a receber as mensagens. Cadastros, vagas já enviadas e avisos ficam no Cloudflare KV.

---

## Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| Busca em várias fontes | Consulta CIEE, MUDES, Gupy, Catho, Vagas.com, InfoJobs e Sólides em paralelo. |
| Filtro comum | Aceita apenas cidades do RJ configuradas ou vagas remotas, exige termos de turismo no título ou na empresa e descarta cargos fora da área. |
| Filtro de nível | Remove vagas de nível pleno, sênior, coordenação, gerência e similares. |
| Vagas recentes | Ignora vagas publicadas há mais de 14 dias, quando a fonte informa a data. |
| Remoção de repetidas | Junta a mesma vaga publicada em mais de um site e retira cópias da MUDES republicadas em outros portais. |
| Envio sem repetição | Lembra as vagas enviadas por 60 dias para não mandar a mesma vaga duas vezes. |
| Agendamento | Executa às 08h e às 18h pelo cron do Cloudflare Workers. |
| Busca sob demanda | O comando `/vagas` faz a busca na hora, com intervalo mínimo de 10 minutos entre buscas. |
| Cadastro por convite | Cadastra quem abre o link de convite e avisa o administrador a cada novo cadastro. |
| Saída automática | Remove da lista quem bloqueou o bot, no envio seguinte. |
| Aviso de fontes com problema | Avisa o administrador quando uma fonte dá erro ou volta vazia, no máximo uma vez por dia por fonte. |
| Modo de teste | A rota `/run` permite ver as vagas sem enviar e mandar uma mensagem de teste. |

---

## Stack

- **TypeScript**: código do Worker, das fontes e do bot, com verificação de tipos em modo estrito.
- **Cloudflare Workers**: execução do código, rotas HTTP e agendamento por cron.
- **Cloudflare KV**: armazenamento de cadastros, vagas enviadas, intervalo do `/vagas` e avisos de fontes.
- **Wrangler**: execução local, cadastro de segredos e publicação.
- **Telegram Bot API**: envio das mensagens, webhook dos comandos e menu do bot.
- **APIs públicas e páginas HTML**: leitura das vagas em cada fonte, sem dependências externas de raspagem.

---

## Infraestrutura Cloudflare

O projeto roda inteiro no plano gratuito da Cloudflare.

- **Cron Triggers:** disparam a busca às 11h e às 21h UTC (08h e 18h em Brasília).
- **Worker:** recebe o webhook do Telegram em `/telegram`, expõe as rotas protegidas `/run` e `/setup` e faz as consultas às fontes.
- **KV (`SEEN`):** guarda `sub:<chat id>` para os cadastrados, o id de cada vaga enviada (60 dias), `warn:<fonte>` (1 dia) e `cooldown:vagas` (10 minutos).
- **Fluxo de entrega:** cron ou `/vagas` → Worker → fontes de vagas → filtro → KV → Telegram.

O plano gratuito permite 50 requisições externas por execução. Cada termo ou caminho em `src/config.ts` gera 1 requisição (hoje cerca de 37), e cada mensagem enviada a cada pessoa gera mais 1.

---

## Estrutura do projeto

```text
Apogeu/
├── assets/
│   ├── logo.png                         # Logotipo do bot
│   └── logo.svg                         # Logotipo em vetor
├── src/
│   ├── sources/
│   │   ├── index.ts                     # Lista das fontes e ordem de prioridade
│   │   ├── ciee.ts                      # CIEE: API pública, área Turismo/Lazer
│   │   ├── mudes.ts                     # MUDES: página de resultado por curso
│   │   ├── gupy.ts                      # Gupy: API pública por termo
│   │   ├── catho.ts                     # Catho: página de busca (HTML)
│   │   ├── vagascom.ts                  # Vagas.com: página de busca (HTML)
│   │   ├── infojobs.ts                  # InfoJobs: página de busca (HTML)
│   │   └── solides.ts                   # Sólides: API pública por termo
│   ├── bot.ts                           # Comandos do Telegram e registro do webhook
│   ├── config.ts                        # Buscas, cidades, palavras de turismo, exclusões e níveis
│   ├── filter.ts                        # Filtro comum e remoção de vagas repetidas
│   ├── index.ts                         # Cron e rotas HTTP do Worker
│   ├── run.ts                           # Coleta, envio e avisos de fontes com problema
│   ├── subscribers.ts                   # Cadastro de usuários no KV
│   ├── telegram.ts                      # Formatação e envio das mensagens
│   ├── types.ts                         # Tipos de vaga e de fonte
│   └── util.ts                          # Requisições, textos e datas
├── LICENSE                              # Licença MIT
├── package.json                         # Dependências de desenvolvimento
├── tsconfig.json                        # Configuração do TypeScript
├── wrangler.toml                        # Worker, cron e namespace KV
└── README.md                            # Apresentação do projeto
```

---

## Arquitetura

O Worker está dividido em quatro partes:

1. **Fontes (`src/sources/`)**: cada fonte lê uma API pública ou uma página de busca e devolve as vagas em um formato único (`Job`), com título, empresa, cidade, modalidade, data e link.
2. **Filtro (`src/filter.ts`)**: aplica as regras de `src/config.ts` a todas as fontes e junta as vagas repetidas. A ordem das fontes em `src/sources/index.ts` define qual versão da vaga é mantida.
3. **Execução (`src/run.ts`)**: busca todas as fontes em paralelo, separa as vagas ainda não enviadas, envia para cada cadastrado e grava os ids no KV. Um erro no envio para uma pessoa não interrompe os demais.
4. **Bot (`src/bot.ts` e `src/index.ts`)**: recebe os comandos pelo webhook, valida o cabeçalho secreto do Telegram e responde na hora, deixando a busca do `/vagas` para depois da resposta.

As fontes que leem HTML (Catho, Vagas.com, InfoJobs e MUDES) deixam de funcionar quando o site muda o layout. Nesse caso, o relatório da execução mostra a fonte com erro ou sem vagas, e o administrador recebe um aviso.

---

## Configuração local

Os segredos ficam no arquivo `.dev.vars`, fora do Git:

| Variável | Descrição |
|---|---|
| `TELEGRAM_TOKEN` | Token do bot, gerado pelo @BotFather. |
| `CHAT_IDS` | Chats fixos, separados por vírgula. O primeiro é o administrador e recebe os avisos. |
| `RUN_KEY` | Chave que protege as rotas `/run` e `/setup`. |
| `INVITE_CODE` | Código do link de convite. |
| `WEBHOOK_SECRET` | Segredo que o Telegram envia no cabeçalho de cada atualização. |

As buscas de cada fonte, as cidades aceitas, as palavras de turismo, as exclusões e o limite de idade das vagas ficam em `src/config.ts`.

---

## Como compilar e executar

### Pré-requisitos

- Node.js e npm.
- Conta na Cloudflare com um namespace KV criado e vinculado em `wrangler.toml`.
- Bot do Telegram criado pelo @BotFather.

### Passo a passo

1. Clone o repositório:

   ```bash
   git clone https://github.com/brendonpereiradev/Apogeu.git
   cd Apogeu
   ```

2. Instale as dependências:

   ```bash
   npm ci
   ```

3. Crie o arquivo `.dev.vars` com as variáveis da seção anterior:

   ```text
   TELEGRAM_TOKEN=...
   CHAT_IDS=...
   RUN_KEY=...
   INVITE_CODE=...
   WEBHOOK_SECRET=...
   ```

4. Inicie o Worker localmente:

   ```bash
   npx wrangler dev
   ```

5. Abra `http://localhost:8787/run?key=RUN_KEY&dry=1` para ver as vagas encontradas sem enviar.

### Comandos disponíveis

| Comando | Descrição |
|---|---|
| `npx wrangler dev` | Executa o Worker localmente em `http://localhost:8787`. |
| `npx tsc` | Verifica os tipos do projeto. |
| `npx wrangler secret put <NOME>` | Cadastra um segredo no Worker publicado. |
| `npx wrangler deploy` | Publica o Worker na Cloudflare. |

### Rotas

| Rota | Descrição |
|---|---|
| `GET /run?key=RUN_KEY&dry=1` | Mostra as vagas e o resumo por fonte, sem enviar. |
| `GET /run?key=RUN_KEY` | Busca e envia as vagas novas. |
| `GET /run?key=RUN_KEY&ping=1` | Envia uma mensagem de teste para o administrador. |
| `GET /setup?key=RUN_KEY` | Aponta o webhook do Telegram para o Worker e registra o menu de comandos. |
| `POST /telegram` | Webhook que recebe os comandos do bot. |

### Publicação

1. Cadastre os cinco segredos:

   ```bash
   npx wrangler secret put TELEGRAM_TOKEN
   npx wrangler secret put CHAT_IDS
   npx wrangler secret put RUN_KEY
   npx wrangler secret put INVITE_CODE
   npx wrangler secret put WEBHOOK_SECRET
   ```

2. Publique o Worker:

   ```bash
   npx wrangler deploy
   ```

3. Depois do primeiro deploy, ou ao trocar o token do bot, abra uma vez `https://<seu-worker>.workers.dev/setup?key=RUN_KEY` para registrar o webhook.

---

## Fluxo de uso

1. **Convide a pessoa:** envie o link `https://t.me/ApogeuCVBot?start=<INVITE_CODE>`.
2. **Cadastro:** ao abrir o link e tocar em **Iniciar**, a pessoa fica cadastrada e o administrador recebe um aviso de novo cadastro. O `/start` sem o código é recusado.
3. **Recebimento:** às 08h e às 18h, as vagas novas chegam em mensagens com título, empresa, local, data, salário (quando informado) e link.
4. **Busca na hora:** o comando `/vagas` faz a mesma busca dos horários fixos. As vagas novas vão para todos os cadastrados; quem pediu é avisado quando não há novidade.
5. **Saída:** `/parar` cancela o cadastro. Para invalidar o link atual, troque o segredo `INVITE_CODE`.

### Comandos do bot

| Comando | Descrição |
|---|---|
| `/vagas` | Busca vagas novas agora. |
| `/start` | Mostra se o cadastro está ativo. |
| `/ajuda` | Explica o funcionamento e lista os comandos. |
| `/parar` | Deixa de receber vagas. |

Com cerca de 37 requisições usadas nas buscas, sobra espaço para algumas pessoas dentro do limite de 50 por execução (por exemplo, 4 pessoas × 3 mensagens).

---

## Licença e termos

Distribuído sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE).

As dependências de terceiros mantêm suas próprias licenças. As vagas, marcas e conteúdos exibidos pertencem aos respectivos sites e empresas, e o acesso às fontes depende da disponibilidade e dos termos de uso de cada site.
