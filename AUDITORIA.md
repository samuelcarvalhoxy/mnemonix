# Auditoria do Mnemônix

A comparação incluiu o GitHub, a versão de produção, as rotas públicas, a configuração da Vercel e a estrutura do banco de produção. A checagem do banco consultou nomes e tipos de colunas, sem ler cadastros ou progresso.

| Área | Situação observada | Mudança |
| --- | --- | --- |
| Código e deploy | A branch principal continha uma página local do Sistema Maior. A Vercel atendia uma versão posterior com autenticação, PWA e Neon que não estava versionada na branch. | O código da nova versão articula interface, API, testes e configuração Vercel no mesmo repositório. |
| Catálogo | O treino era centrado no Sistema Maior, sem uma jornada por finalidade e por nível. | Seis modalidades com instruções próprias, cinco níveis e catálogo filtrável. Duas sessões com pelo menos 80% no nível atual liberam o próximo. |
| Experiência | O fluxo de produção exigia acesso antes de treinar. | Treino gratuito como visitante, fluxo de entrada centralizado e tela de resultado com revisão item a item. |
| Conta e privacidade | O cadastro de produção não passava por confirmação do endereço. A recuperação usava perguntas de múltipla escolha. | Cadastro pendente até confirmação por link, recuperação por e-mail, limitação de tentativas, aceite versionado e opção facultativa para ofertas internas. |
| Dados | A produção já armazenava contas, associações personalizadas e estatísticas. | O esquema aditivo mantém registros, senha e sessões compatíveis. As associações e estatísticas antigas são lidas do perfil de origem. Progresso novo tem sincronização com operações idempotentes. |
| Idioma e acessibilidade | O fluxo anterior não tinha uma organização comum para as novas modalidades. | Navegação responsiva em pt-BR, ícones com rótulos, contraste, foco visível, diálogo nativo e tratamento para movimento reduzido. |
| Preparação comercial | Remetente transacional ausente na configuração do projeto. | A confirmação e a recuperação estão implementadas. A liberação depende do provedor e do teste de entrega. A minuta de privacidade requer identificação e contato do controlador antes da divulgação. |

As referências de estudo incluem o [Sistema Dominic](https://en.wikipedia.org/wiki/Dominic_system) e o texto da [LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm). A plataforma não possui checkout nem cobrança nesta versão.
