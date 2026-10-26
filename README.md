<p align="center">
  <img src="assets/apogeu-banner.svg" width="560" alt="Apogeu, vagas de turismo e recepção">
</p>

<p align="center">
  Bot do Telegram que reúne vagas de turismo, hotelaria e recepção de vários sites e envia as novas duas vezes por dia.
</p>

---

## Sobre o projeto

Apogeu é um Cloudflare Worker em TypeScript que procura vagas de turismo, recepção, secretariado e atendimento (estágio, júnior e cargos de entrada) em cidades do Rio de Janeiro e vagas remotas. As buscas rodam às 08h e às 18h (horário de Brasília) e as vagas ainda não enviadas chegam pelo bot **@ApogeuCVBot**.

Cada fonte em `src/sources/` devolve as vagas em um formato único; `src/filter.ts` aplica as regras de `src/config.ts` e remove as repetidas; `src/run.ts` registra as vagas no Cloudflare KV e coloca as mensagens numa fila (`src/queue.ts`), também no KV, de onde saem para cada cadastrado. O acesso é por convite: quem abre o link `https://t.me/ApogeuCVBot?start=<INVITE_CODE>` fica cadastrado. O projeto roda no plano gratuito da Cloudflare, que limita cada execução a 50 requisições externas: as buscas gastam a maior parte, e a mensagem que não couber fica na fila até o cron de envio, que roda a cada 5 minutos.

---

## Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| Busca em várias fontes | Consulta CIEE, MUDES, Gupy, Catho, Vagas.com, InfoJobs e Sólides em paralelo. |
| Filtros | Aceita só cidades configuradas ou vagas remotas de turismo ou recepção, de nível de entrada e publicadas há até 14 dias. |
| Fila de envio | Mensagem só sai da fila depois que o Telegram aceita; o que não coube numa execução é enviado nos minutos seguintes. |
| Sem repetição | Junta a mesma vaga publicada em mais de um site e lembra as enviadas por 60 dias. |
| Comandos do bot | `/vagas` busca na hora, `/start` mostra o cadastro, `/ajuda` explica o uso e `/parar` cancela o recebimento. |
| Avisos ao administrador | Avisa novos cadastros e fontes com erro ou sem resultado, no máximo uma vez por dia por fonte. |
| Modo de teste | A rota `/run` mostra as vagas sem enviar e manda mensagens de teste. |

---

## Stack

- **TypeScript**: código do Worker, das fontes e do bot, em modo estrito.
- **Cloudflare Workers**: rotas HTTP e agendamento por cron.
- **Cloudflare KV**: cadastros, vagas enviadas e avisos.
- **Telegram Bot API**: envio das mensagens e webhook dos comandos.
- **Wrangler**: execução local, segredos e publicação.

---

## Como executar

### Pré-requisitos

- Node.js e npm.
- Conta na Cloudflare com um namespace KV vinculado em `wrangler.toml`.
- Bot do Telegram criado pelo @BotFather.

### Passo a passo

1. Clone o repositório e instale as dependências:

   ```bash
   git clone https://github.com/brendonpereiradev/Apogeu.git
   cd Apogeu
   npm ci
   ```

2. Crie o arquivo `.dev.vars` com os segredos:

   | Variável | Descrição |
   |---|---|
   | `TELEGRAM_TOKEN` | Token do bot, gerado pelo @BotFather. |
   | `CHAT_IDS` | Chats fixos, separados por vírgula. O primeiro é o administrador. |
   | `RUN_KEY` | Chave que protege as rotas `/run` e `/setup`. |
   | `INVITE_CODE` | Código do link de convite. |
   | `WEBHOOK_SECRET` | Segredo que o Telegram envia em cada atualização. |

3. Inicie o Worker e abra `http://localhost:8787/run?key=RUN_KEY&dry=1` para ver as vagas sem enviar:

   ```bash
   npx wrangler dev
   ```

Para publicar, cadastre os cinco segredos com `npx wrangler secret put <NOME>`, rode `npx wrangler deploy` e abra uma vez `https://<seu-worker>.workers.dev/setup?key=RUN_KEY` para registrar o webhook.

### Comandos disponíveis

| Comando | Descrição |
|---|---|
| `npx wrangler dev` | Executa o Worker localmente. |
| `npx tsc` | Verifica os tipos. |
| `npx wrangler secret put <NOME>` | Cadastra um segredo no Worker publicado. |
| `npx wrangler deploy` | Publica o Worker na Cloudflare. |

---

## Licença

Distribuído sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE).

As vagas, marcas e conteúdos exibidos pertencem aos respectivos sites e empresas.
