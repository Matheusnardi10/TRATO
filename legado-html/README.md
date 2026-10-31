# Trato — Do orçamento ao lucro, tudo em um só lugar

Front-end **completo e funcional** de uma plataforma SaaS de gestão para
profissionais autônomos (fotógrafos, eletricistas, técnicos de ar-condicionado,
designers, social media, pintores, pedreiros, marceneiros, freelancers e
prestadores de serviços gerais).

Todo o ciclo do negócio está implementado e conectado de verdade pelo
LocalStorage:

```
CLIENTE → ORÇAMENTO → APROVAÇÃO → CONTRATO → SERVIÇO
        → AGENDA → CUSTOS → PAGAMENTOS → LUCRO → RELATÓRIOS
```

Nome e logo são **provisórios** — troque em `js/data.js` (`Data.BRAND`) e as
cores em `css/style.css` (`:root`).

---

## 1. Como executar

**Opção A — sem instalar nada (mais simples)**

Dois cliques em `index.html` (ou botão direito → *Abrir com* → seu navegador).
Não há módulos ES (`import`/`export`), então o projeto funciona direto em `file://`.

**Opção B — com servidor local (recomendado no VS Code)**

1. Instale a extensão **Live Server** (Ritwick Dey).
2. Clique com o botão direito em `index.html` → **Open with Live Server**.
3. URL local: `http://127.0.0.1:5500/index.html`

Ou pelo terminal:

```bash
cd trato
python -m http.server 5500
# depois acesse http://localhost:5500
```

**Nenhum comando `npm install` é necessário.** Não há dependências para instalar.

### Conta de demonstração

| E-mail | Senha |
|---|---|
| `demo@trato.app` | `123456` |

Você também pode criar uma conta nova em *Criar conta*. Se algo parecer
estranho durante os testes, use **menu do usuário → Restaurar dados de
demonstração** para voltar ao estado inicial.

---

## 2. Estrutura de pastas

```
trato/
├── index.html                  Landing page
├── README.md
│
├── pages/
│   ├── login.html               Login
│   ├── cadastro.html             Cadastro (dados + escolha do nicho)
│   ├── onboarding.html           Configuração do negócio + conclusão
│   ├── dashboard.html            Painel principal
│   │
│   ├── clientes.html             Lista de clientes
│   ├── cliente-detalhe.html      Dados + histórico (orçamentos/contratos/serviços/pagamentos)
│   │
│   ├── orcamentos.html           Lista de orçamentos
│   ├── orcamento-novo.html       Criação/edição — campos dinâmicos por nicho
│   ├── orcamento-detalhe.html    Documento, PDF, WhatsApp, geração de contrato
│   ├── aprovacao-orcamento.html  Página pública — cliente aceita/recusa
│   │
│   ├── contratos.html            Lista de contratos
│   ├── contrato-detalhe.html     Cláusulas editáveis, aditivos, aceite, PDF
│   │
│   ├── agenda.html               Mês / semana / dia, detecção de conflito
│   │
│   ├── servicos.html             Lista de serviços
│   ├── servico-detalhe.html      7 abas: geral, custos, execução, documentos, agenda, pagamentos, rentabilidade
│   │
│   ├── financeiro.html           Indicadores, fluxo de caixa, categorias, pagamentos
│   ├── relatorios.html           7 relatórios + exportação CSV
│   └── configuracoes.html        Perfil, negócio, nicho, preferências, segurança
│
├── css/
│   ├── style.css                 Tokens (cores, fontes, sombras), reset, botões, badges
│   ├── layout.css                Sidebar, header, grids, telas de autenticação
│   ├── components.css            Cards, KPIs, modais, toasts, alertas, dropdowns, abas, gráfico
│   ├── forms.css                 Inputs, validação, cards de nicho, filtros
│   ├── tables.css                Tabelas de dados
│   ├── pages.css                 Estilos de login/cadastro/onboarding/dashboard
│   ├── landing.css                Landing page
│   ├── agenda.css                Grade do calendário (mês/semana) e timeline do dia
│   └── print.css                  Layout de impressão de orçamentos e contratos (PDF via navegador)
│
├── js/
│   ├── utils.js                   Formatação (R$, datas), validação, máscaras, LocalStorage, seletores
│   ├── data.js                    Mock data + 9 nichos + campos dinâmicos + modelos de contrato
│   ├── store.js                   Persistência genérica no LocalStorage + sessão
│   ├── services.js                Toda a regra de negócio e cálculos (ver seção 4)
│   ├── components.js              Sidebar, header, modais, toasts, badges, estados vazios
│   ├── chart.js                   Gráfico em SVG puro (sem biblioteca externa)
│   ├── app.js                     Inicialização das páginas e proteção de rota
│   │
│   ├── landing.js / auth.js / cadastro.js / onboarding.js
│   ├── dashboard.js
│   ├── clientes.js / cliente-detalhe.js
│   ├── orcamentos.js / orcamento-novo.js / orcamento-detalhe.js / aprovacao-orcamento.js
│   ├── contratos.js / contrato-detalhe.js
│   ├── agenda.js
│   ├── servicos.js / servico-detalhe.js
│   ├── financeiro.js
│   ├── relatorios.js
│   └── configuracoes.js
│
└── assets/
    ├── icons/favicon.svg
    └── images/logo.svg
```

Ordem de carregamento dos scripts (sempre a mesma nas páginas internas):
`utils → data → store → services → components → (chart, quando há gráfico) → app → script da página`

---

## 3. Tecnologias

- HTML5, CSS3 e JavaScript puro (ES5+), sem framework.
- **Nenhuma biblioteca externa de JavaScript.** O gráfico é SVG desenhado por
  `js/chart.js`. A geração de PDF usa `window.print()` com uma folha de
  estilos dedicada (`css/print.css`) — o navegador salva como PDF sem precisar
  de biblioteca. A exportação de relatórios gera um `.csv` real via `Blob`.
- Fontes Google (Inter, Sora, IBM Plex Mono) via CDN — sem internet, o
  navegador usa a fonte do sistema e o layout continua funcionando.
- Dados em LocalStorage (chaves com prefixo `trato.`).

---

## 4. Arquitetura (pensada para o backend futuro)

As telas nunca acessam o LocalStorage diretamente — elas chamam *services*:

`AuthService`, `ClientService`, `BudgetService`, `ContractService`,
`ServiceService`, `ExpenseService`, `ScheduleService`, `PaymentService`,
`NotificationService`, `DashboardService`, `FinanceService`, `ReportService`.

Cada service usa o `Store`, que hoje grava no navegador. Quando a API Java/Spring
Boot existir, basta trocar o corpo dos métodos do `Store` (ou dos services) por
`fetch('/api/...')` — as telas não mudam.

Cálculos ficam isolados no objeto `Calc` (`js/services.js`):

```
custo total            = soma de todas as categorias de despesa
valor final             = custo / (1 - margem/100)     → custo 500 + margem 40% = R$ 833,33
lucro                   = valor − custo real            → lucro estimado R$ 333,33
margem                  = lucro / valor × 100
lucro por hora          = lucro / horas trabalhadas
previsto x realizado    = custo real − custo previsto
valor total do contrato = valor base + soma dos aditivos
```

### Os dados são realmente conectados

- Criar um **cliente** → ele aparece na lista de clientes de um **orçamento novo**.
- Aprovar um **orçamento** (pela página pública `aprovacao-orcamento.html` ou
  pela simulação em `orcamento-detalhe.html`) → o status muda de verdade e uma
  notificação é criada.
- Gerar o **contrato** a partir do orçamento aprovado → ele nasce com as
  cláusulas do nicho já preenchidas e fica vinculado ao cliente e ao orçamento.
- Criar um **serviço** a partir do contrato (ou direto pela agenda) → ele entra
  na agenda automaticamente e já nasce com um **pagamento pendente** vinculado.
- Registrar uma **despesa** no serviço → o custo real é recalculado na hora e a
  rentabilidade do serviço muda.
- Registrar um **recebimento** → o pagamento muda de status e o **financeiro**
  reflete o novo saldo.
- O **dashboard** e os **relatórios** leem tudo isso ao vivo — nada é calculado
  uma vez e "congelado".

---

## 5. Funcionalidades implementadas

**Landing, autenticação e onboarding**
Landing completa (hero com o cálculo real de um serviço, seção problema com
conversa informal, fluxo em 6 etapas, diferenciais, "WhatsApp em breve"),
login com sessão simulada e "lembrar acesso", cadastro em etapas com máscara de
telefone e força de senha, grade de 9 nichos, onboarding com upload de logo.

**Clientes** — cadastro, edição, exclusão (com aviso se houver vínculos),
busca, filtros por status, página de detalhe com histórico completo em abas
(orçamentos, contratos, serviços, pagamentos).

**Orçamentos** — lista com busca e filtros por status, criação/edição com
**campos dinâmicos por nicho** (9 nichos: fotógrafo, eletricista, técnico de
ar-condicionado, pintor, pedreiro, marceneiro, técnico/manutenção, designer,
social media, prestador de serviços gerais e "outro"), cálculo automático de
custo total, margem e lucro (editar a margem recalcula o valor; editar o valor
recalcula a margem), documento para impressão/PDF, envio por WhatsApp
(`wa.me`), duplicação, exclusão de rascunhos.

**Fluxo de aprovação** — página pública `aprovacao-orcamento.html` (sem
login) onde o cliente vê o orçamento e clica em **ACEITAR** ou **RECUSAR**; o
status é atualizado de verdade e o profissional é notificado. Também é
possível simular a resposta do cliente direto da tela de detalhe.

**Contratos — o principal diferencial** — geração automática a partir do
orçamento aprovado, com o modelo e as cláusulas do nicho já preenchidos;
edição das cláusulas em modo de texto; fluxo completo de status (rascunho →
aguardando aceite → ativo → concluído/cancelado); **aditivos** com 5 tipos
(alteração de data, valor, prazo, inclusão de serviço, outras condições) que
somam ao valor total do contrato; criação de serviço direto do contrato;
impressão/PDF.

**Agenda** — visões mês, semana e dia; cada serviço mostra cliente, valor e
lucro estimado; **detecção real de conflito de horário** (mesmo dia e hora),
com aviso na criação e destaque visual no calendário; criação de agendamento
vinculável a um contrato existente.

**Serviços** — lista com filtros por status; página de detalhe com **7 abas**:
visão geral (status, vínculos), custos (registrar despesas por categoria),
execução (horas trabalhadas, status rápido), documentos (links para orçamento
e contrato), agenda (editar data/hora/local com checagem de conflito),
pagamentos (registrar recebimento) e rentabilidade (previsto x realizado,
lucro por hora).

**Financeiro** — indicadores por período (dia/semana/mês/ano/tudo), fluxo de
caixa dos últimos 14 dias, despesas por categoria, lista de pagamentos com
registro de recebimento.

**Relatórios** — faturamento (gráfico), serviços mais rentáveis, clientes por
movimentação, categorias de custo, orçamentos por status, previsto x
realizado, lucro por hora — todos com **exportação para CSV** real.

**Configurações** — dados pessoais, dados do negócio (com logo), troca de
nicho (com aviso de que orçamentos e contratos já criados não mudam),
preferências de notificação, alteração de senha.

**Notificações** — geradas automaticamente para orçamento aprovado, contrato
gerado/aguardando aceite/aceito, conflito de agenda, pagamento atrasado e
pagamento recebido — sem duplicar a cada recarregamento da página.

**Componentes reutilizáveis** — sidebar, header, modais, toasts, badges,
estados vazios, dropdowns, abas, tooltips, KPIs e gráfico, usados de forma
consistente em todas as 19 páginas.

---

## 6. Verificação feita

Como este ambiente não tem um navegador disponível, construí um **DOM mínimo
em Node** (parser de HTML + seletor CSS + eventos) só para rodar os scripts de
cada página de verdade e simular cliques, digitação e envio de formulários —
não é apenas leitura de código.

- **Sintaxe**: todos os 26 arquivos JavaScript, sem erros.
- **Links**: todos os `href`/`src` das 19 páginas apontam para arquivos existentes.
- **Chamadas de método**: toda chamada a `XxxService.metodo()` usada nas
  páginas corresponde a um método realmente definido em `services.js`.
- **Carregamento de todas as páginas** com sessão ativa: nenhum erro de runtime.
- **Fluxo completo ponta a ponta**, testado com cliques e formulários reais:
  criar cliente → criar orçamento → aprovar pela página pública → gerar
  contrato → criar serviço a partir do contrato → registrar despesa (custo
  real atualizado automaticamente) → registrar recebimento (pagamento muda
  para "pago") → dashboard reflete tudo.
- **Conflito de agenda**: criar serviço no mesmo dia/horário de outro já
  existente bloqueia com aviso e exige confirmação explícita.
- **Aditivos e cláusulas**: adicionar aditivo soma ao valor do contrato;
  editar cláusulas persiste o novo texto.
- **Ciclo de status do contrato**: rascunho → aguardando → ativo → concluído.
- **Casos de borda**: todas as listas e o dashboard funcionam com dados
  zerados (estado vazio) e também quando um cliente é excluído mas ainda
  referenciado em orçamentos/contratos/serviços antigos (não quebra, mostra
  "Cliente removido"); a agenda navega normalmente por meses sem nenhum
  serviço; um orçamento do nicho "Prestador de serviços gerais" gera contrato
  normalmente; um serviço criado direto pela agenda (sem contrato de origem)
  abre todas as abas sem erro.
- **Notificações automáticas**: rodar a checagem várias vezes seguidas não
  duplica notificações (uso de chave única por evento).
- Um bug real foi encontrado nesse processo (uso de `TIPOS_ADITIVO` antes da
  declaração em `contrato-detalhe.js`, quebrando a impressão do contrato de
  exemplo) e corrigido, além da limpeza de um trecho de código morto (rótulos
  "em breve" no menu, que não fazem mais sentido agora que todos os módulos
  estão implementados).

---

## 7. Regras que continuam valendo (por design)

- **Sem backend, sem banco de dados, sem autenticação real** — login e
  aprovação são simulados no navegador, com dados no LocalStorage.
- **Sem IA e sem integração real com WhatsApp** — o envio de orçamento usa um
  link `wa.me` (abre o WhatsApp com uma mensagem pronta, mas não há API por
  trás); o registro de despesas pelo WhatsApp continua sendo apenas uma tela
  visual "em breve", como pedido.
- **Contratos são modelos personalizáveis** — o rodapé de cada documento deixa
  claro que não têm validade jurídica garantida e não substituem orientação
  de um profissional do direito.
- **Desktop only** — otimizado para 1366×768 e 1440×900, sem layout mobile.
