# Mnemônix

Plataforma de exercícios de mnemônica para estudos, números, baralho e prática pessoal. Inclui Sistema Maior, Sistema Dominic, Palácio da Memória, sequências de números, baralho e recuperação ativa. Cada modalidade tem cinco níveis.

## Desenvolvimento

```sh
npm ci
npm run build
npm test
```

Para testar somente os treinos locais, rode `python3 -m http.server 8000 --directory public`. Para usar as funções Vercel, rode `vercel dev` com um banco de desenvolvimento.

## Hospedagem e e-mails

- `DATABASE_URL` é a conexão Neon usada em produção. O aplicativo migra o esquema existente com DDL aditivo e importa o perfil antigo na primeira carga. A versão anterior continua com suas tabelas de origem e pode ser restaurada pela Vercel.
- Em prévias, contas e escrita só são habilitadas com `MNEMONIX_PREVIEW_DATABASE_URL`, apontando para um banco isolado. O modo visitante funciona sem banco.
- Configure `MNEMONIX_EMAIL_FROM` e `RESEND_API_KEY` com um remetente autorizado, ou use `MNEMONIX_SMTP_HOST`, `MNEMONIX_SMTP_PORT`, `MNEMONIX_SMTP_USER` e `MNEMONIX_SMTP_PASSWORD` com TLS. Para outro endereço do app, configure `MNEMONIX_APP_URL` com a origem HTTPS correspondente. As chaves ficam somente no servidor. Se o e-mail estiver desativado, o cadastro novo permanece fechado.
- Antes de lançar, confirme o recebimento real de um e-mail de cadastro e de recuperação. Verifique uma conta anterior e o progresso sincronizado em dois navegadores. As solicitações de direitos entram em `mnemonix_privacy_requests` para atendimento pelo responsável. Revise a identificação e o canal público do controlador antes da divulgação comercial.

Veja [a auditoria e as decisões de implementação](AUDITORIA.md).
