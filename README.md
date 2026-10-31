# Trato

Gestão de orçamentos, contratos, agenda, serviços e financeiro para quem
presta serviço por conta própria (fotógrafos, eletricistas, técnicos de
ar-condicionado, pintores, pedreiros, marceneiros, designers, social media,
freelancers e prestadores de serviços gerais).

Este repositório é a versão **completa** do Trato migrada da versão
original (HTML + CSS + JavaScript puro + LocalStorage) para uma aplicação
**Angular 18** com backend **Spring Boot 3 + PostgreSQL**. Todos os 13
módulos (login/cadastro/onboarding, dashboard, clientes, orçamentos,
contratos, agenda, serviços, financeiro, relatórios, configurações e
notificações) hoje vivem em Angular e falam com o backend — nenhuma tela
depende mais da versão em `legado-html/`, que fica só como referência.

```
trato/
├── legado-html/     versão original (HTML/CSS/JS/LocalStorage) — backup, não usada pelo Angular
├── frontend/        aplicação Angular 18 (completa)
└── backend/         API Spring Boot 3 + PostgreSQL (completa)
```

## ⚠️ Honestidade sobre o que foi testado neste ambiente

O ambiente onde este projeto foi escrito **não tem acesso ao registry do
npm nem ao Maven Central** (apenas a alguns poucos domínios liberados), ou
seja, **`npm install`/`ng build` e `mvn compile`/`mvn spring-boot:run` não
puderam ser executados aqui**. O que foi feito, em vez disso, para chegar
o mais próximo possível de "compila e funciona" sem poder rodar o
compilador real:

- Todo arquivo `.java` foi conferido com um script que balanceia chaves,
  e revisado manualmente (imports, assinaturas de método, tipos).
- Todo `import` relativo e todo `templateUrl` do Angular foram conferidos
  por script — apontam para arquivos que realmente existem.
- Toda rota em `app.routes.ts` foi conferida contra o nome de classe
  exportado pelo componente correspondente.
- Todas as fórmulas de negócio (custo total, margem, lucro, lucro por
  hora, diferença previsto×real) foram conferidas linha a linha contra o
  `js/services.js`/`js/data.js` originais.

**O primeiro `npm install` / `mvn clean package` na sua máquina, com
acesso normal à internet, é o teste real.** Se algo não compilar, por
favor copie o erro exato — é mais rápido corrigir um erro real do que
adivinhar um que não aconteceu.

---

## Pré-requisitos

- **Node.js 18+** e **npm** (para o frontend Angular)
- **Java 21** e **Maven 3.9+** (para o backend Spring Boot)
- **PostgreSQL 14+** rodando localmente

## Como rodar o backend

```bash
# 1. Crie o banco (uma vez só)
psql -U postgres -c "CREATE DATABASE trato;"

# 2. Confira usuário/senha em backend/src/main/resources/application.properties
#    (por padrão: postgres / postgres, banco "trato" em localhost:5432)

# 3. Rode
cd backend
mvn spring-boot:run
```

O Spring Boot sobe em **`http://localhost:8080`**. Na primeira execução, o
`DataSeeder` popula o banco com o usuário de demonstração, clientes,
orçamentos, serviços, despesas, pagamentos e um contrato de exemplo (com
cláusulas e um aditivo) — equivalente ao `Data.seed()` do projeto
original, para nenhuma tela abrir vazia. Só roda se o banco estiver
vazio, então reiniciar o backend não duplica dados.

As tabelas são criadas automaticamente (`spring.jpa.hibernate.ddl-auto=update`),
não é preciso rodar nenhum script SQL manualmente.

## Como rodar o frontend

```bash
cd frontend
npm install
npm start          # equivalente a "ng serve"
```

Abra **`http://localhost:4200`**. O frontend espera o backend em
`http://localhost:8080/api` (configurado em `src/environments/environment.ts`).

## Credenciais e portas

```
URL frontend:  http://localhost:4200
URL backend:   http://localhost:8080/api
Banco:         trato (PostgreSQL, localhost:5432)
E-mail:        demo@trato.app
Senha:         123456
```

---

## Envio do contrato por e-mail para o cliente aprovar

Na tela do contrato, **"Enviar por e-mail"** manda ao e-mail do contratante um
link `http://localhost:4200/aprovar-contrato/<token>`. O cliente abre sem login,
lê o contrato, marca "Li e concordo" e clica em **Aprovar contrato** — o
contrato passa na hora para **ativo** no Trato e você recebe uma notificação.

Todos os e-mails saem da conta do sistema, **sistematrato@gmail.com** (já
configurada em `application.properties`). Só falta a *senha de app* do Google,
que nunca vai para o código — passe na variável `MAIL_PASSWORD`:

```bash
MAIL_PASSWORD=<senha-de-app> mvn spring-boot:run
```

Sem `MAIL_PASSWORD` nada é enviado: o link aparece no log do backend e no botão
**"Copiar link"** da tela do contrato (dá para testar o fluxo inteiro local).
Em produção, ajuste `TRATO_FRONTEND_URL` para o endereço público do frontend.

## Módulos disponíveis

Todos os módulos abaixo têm tela em Angular e endpoint no Spring Boot —
nenhum abre vazio (o `DataSeeder` garante dados de exemplo) e nenhum
botão é decorativo.

| Módulo | Rota Angular | Endpoints principais |
|---|---|---|
| Login / Cadastro / Onboarding | `/login` `/cadastro` `/onboarding` | `POST /api/auth/login`, `/cadastro`; `PUT /api/usuarios/{id}` |
| Dashboard | `/app/dashboard` | `GET /api/dashboard/resumo-mes`, `/historico`, `/alertas` |
| Clientes | `/app/clientes` | `GET/POST/PUT/DELETE /api/clientes` |
| Orçamentos | `/app/orcamentos`, `/app/orcamentos/novo`, `/app/orcamentos/:id` | `GET/POST/PUT/DELETE /api/orcamentos`, `/enviar`, `/aprovar`, `/recusar` |
| Contratos | `/app/contratos`, `/app/contratos/:id` | `GET/DELETE /api/contratos`, `/gerar-de-orcamento/{id}`, `/enviar-aceite`, `/marcar-aceito`, `/concluir`, `/cancelar`, `/clausulas`, `/aditivos`, `/criar-servico` |
| Agenda | `/app/agenda` | `GET/POST/PUT/DELETE /api/agendamentos`, `/conflito` (reaproveita os mesmos Serviços — ver nota abaixo) |
| Serviços | `/app/servicos`, `/app/servicos/:id` | `GET/POST/PUT/DELETE /api/servicos`, `/status`, `/despesas`, `/pagamento`, `/pagamento/recebimento` |
| Financeiro | `/app/financeiro` | `GET /api/financeiro/resumo`, `/despesas-por-categoria`, `/fluxo-caixa`, `/pagamentos` |
| Relatórios | `/app/relatorios` | `GET /api/relatorios/servicos-mais-rentaveis`, `/clientes-por-movimentacao`, `/orcamentos-por-status`, `/previsto-x-realizado`, `/lucro-por-hora` |
| Configurações | `/app/configuracoes` | `PUT /api/usuarios/{id}/perfil`, `/negocio`, `/senha` |
| Notificações | sininho no header, em todas as telas | `GET /api/notificacoes`, `/nao-lidas`, `PATCH /{id}/lida`, `POST /marcar-todas-lidas` |

### Decisões de simplificação (declaradas, não escondidas)

Para manter a arquitetura simples (sem over-engineering), duas entidades
que o enunciado lista como possíveis **não foram criadas como tabelas
separadas** — os dados existem, só que reaproveitando o que já existia:

- **Agendamento**: não existe uma tabela `agendamentos` separada. Um
  agendamento é o próprio `Servico` (que já tem `data`/`hora`) — exatamente
  como no app original (`js/services.js` → `ScheduleService` operava sobre
  `Servico`, nunca sobre uma entidade própria). O `AgendaController` expõe
  esses mesmos serviços sob `/api/agendamentos`, mais a verificação de
  conflito de horário.
- **MovimentacaoFinanceira**: não existe uma tabela de lançamentos
  própria. O módulo Financeiro é um agregador de leitura sobre o que já
  existe: `Pagamento` (receitas) e `Despesa` (despesas) — evitando um
  livro-caixa duplicado que teria que ser mantido em sincronia com os dois.

## Arquitetura (resumo)

- **Frontend**: Angular 18, *standalone components* (sem NgModules),
  Angular Router com lazy loading por feature, Reactive Forms, HttpClient,
  `signal()` para estado simples (usuário logado, toasts, modais). Pastas:
  `core/` (models, services HTTP, guards, interceptors), `shared/`
  (layout — sidebar/header — e UI como toast e gráfico), `features/` (uma
  pasta por módulo de negócio). As folhas de estilo originais (`style.css`,
  `layout.css`, `components.css`, `agenda.css`, `print.css` etc.) são
  carregadas como estilos globais em `angular.json`, preservando 100% da
  identidade visual (sidebar, cores, cards, tabelas, botões, gráficos)
  sem reescrever CSS.
- **Backend**: Spring Boot 3, camadas `entity` → `repository` →
  `service` → `controller`, Bean Validation, PostgreSQL via Spring Data
  JPA, Lombok. Sem Spring Security completo: o "login" é um endpoint
  simples (`POST /api/auth/login`) que confere e-mail/senha (hash BCrypt)
  no banco e devolve os dados do usuário; as chamadas seguintes se
  identificam mandando o id do usuário no header `X-Usuario-Id` (ver
  `core/interceptors/auth.interceptor.ts` no frontend e
  `UsuarioAtualResolver` no backend). **Isto não é seguro para produção**
  — é o nível de simplicidade pedido para este projeto de estudo. Sem
  NgRx, sem microsserviços, sem CQRS/Kafka/Redis/Kubernetes.
- **Cálculos financeiros no servidor**: custo total do orçamento, margem,
  custo real do serviço (soma das despesas), lucro previsto/realizado e
  status do pagamento (pendente/parcial/pago/atrasado) são **sempre
  recalculados no backend**, nunca aceitos prontos do frontend — ver os
  comentários em `OrcamentoService.java`, `ServicoService.java` e
  `FinanceiroService.java`.
- **Modelos de contrato do advogado**: ficam em
  `backend/src/main/resources/contratos/modelos_contratos.json` (15 cláusulas
  comuns + campos e cláusulas próprias de cada um dos 12 nichos, com base
  legal). `ModeloContratoService` só lê o JSON e monta o texto
  (`{{chave}}`, `{{defaults.x}}`, `{{campo ? 'A' : 'B'}}` e condições
  `chave == 'valor'`); para alterar um texto jurídico basta editar o JSON.
  Ao gerar o contrato, o sistema pré-preenche o que já sabe (cliente,
  orçamento, perfil do prestador); o usuário completa o formulário na tela
  do contrato e o texto é remontado. O **envio para aceite fica bloqueado
  enquanto houver campos obrigatórios pendentes** (inclui CPF/CNPJ com dígito
  verificador válido, validado em `DocumentoValidador`). O valor por extenso
  é gerado em `Extenso`. Os dados do CONTRATADO vêm de Configurações →
  Negócio (CPF/CNPJ, endereço e cidade). Os modelos são minutas: o próprio
  JSON recomenda revisão por advogado inscrito na OAB.
  Atenção: salvar os dados refaz as cláusulas e substitui edições manuais
  feitas no texto; e, com `ddl-auto=update`, colunas já existentes (ex.: o
  tamanho de `clausulas_contrato.texto`) não são alteradas — se o banco já
  existia, apague-o e deixe recriar.
- **Notificações automáticas**: calculadas a cada listagem por
  `NotificacaoService.checarAutomaticas` (pagamento atrasado, serviço
  amanhã, conflito de agenda, orçamento/contrato aguardando), nunca
  duplicadas — cada uma tem uma `chave` única que impede reinserção.

## Testes manuais sugeridos (fluxo completo)

1. **Login → Dashboard**: entre com `demo@trato.app` / `123456` e confira
   que os KPIs e o gráfico aparecem com dados reais.
2. **Clientes → Novo cliente → Salvar**: cadastre um cliente e confira que
   ele aparece na listagem.
3. **Cliente → Novo orçamento → custos/margem → Salvar**: crie um
   orçamento, altere custos e margem (o valor final recalcula sozinho) e
   confira que aparece na lista de orçamentos.
4. **Orçamento aprovado → Gerar contrato**: aprove o orçamento e clique no
   ícone 📄 na listagem — abre o contrato já com as cláusulas do nicho
   preenchidas.
5. **Contrato ativo → Criar serviço**: marque o contrato como aceito e
   clique em "Criar serviço".
6. **Serviço → Registrar custo real → lucro realizado atualiza**: abra o
   serviço, registre um custo por categoria e confira que custo real,
   diferença e lucro realizado mudam.
7. **Agenda → Novo agendamento → visualizar no calendário**: crie um
   agendamento e veja-o no mês/semana; tente criar outro na mesma
   data/hora e confira o aviso de conflito.
8. **Financeiro → registrar/ver pagamento → valores atualizam**: no
   serviço, registre um recebimento e confira que o módulo Financeiro
   reflete o novo saldo/a receber.
9. **Relatórios → ver dados e exportar CSV**: abra cada aba de relatório e
   use "Exportar CSV".
10. **Atualizar o navegador**: dê F5 em qualquer tela — a sessão continua
    válida (localStorage) e os dados continuam no PostgreSQL.

## Regras que continuam valendo

- Sem IA, sem integração real com WhatsApp.
- Pensado para desktop (1366×768 / 1440×900) — abaixo disso a interface
  continua utilizável, mas não é o alvo deste projeto.
- Todo o texto da interface em português do Brasil.
