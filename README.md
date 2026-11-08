# CineVerse

Plataforma gratuita e pública dedicada a descobrir séries. Este repositório contém a primeira versão da interface web.

## Tecnologias

- React + TypeScript
- Vite
- Tailwind CSS
- Lucide React

## Executar localmente

Requer Node.js 20 ou superior.

```bash
npm install
npm run dev
```

Para validar a versão de produção:

```bash
npm run build
npm run preview
```

## Publicar no Cloudflare Pages

1. Acesse o painel do Cloudflare e abra **Workers & Pages**.
2. Crie uma aplicação Pages conectada ao repositório GitHub `juliomaster087-hub/cineverse`.
3. Configure o comando de build como `npm run build`.
4. Configure o diretório de saída como `dist`.
5. Selecione a branch `main` e conclua a implantação.

A publicação só estará concluída depois que a implantação for executada e validada no painel.

## Próximas etapas

- Definir identidade visual e conteúdo editorial.
- Criar banco de dados e autenticação para administração.
- Implementar cadastro de séries, temporadas e episódios.
- Integrar hospedagem de vídeo com conteúdo próprio, licenciado ou de domínio público.
- Adicionar páginas de detalhes e reprodução de episódios.

## Direitos de conteúdo

O CineVerse só deve publicar vídeos que sejam próprios, licenciados ou disponibilizados legalmente para distribuição. O catálogo inicial usa títulos fictícios de demonstração e não inclui episódios de séries comerciais.
## Publicação de conteúdo

O catálogo público é alimentado pelo Cloudflare D1. O painel administrativo fica em `/admin` e publica séries e episódios usando links do YouTube. Use somente vídeos próprios, licenciados ou com autorização para distribuição.

### Estreias programadas

Cada episódio pode ser publicado imediatamente ou agendado para uma data e hora futuras. O horário é salvo como timestamp no banco de dados; a API calcula a disponibilidade usando o relógio do servidor. O site mostra a mesma estreia para todos e libera o player quando o horário chega.

### Segurança do painel

O backend do painel fica em `/admin/api` e falha fechado sem uma sessão válida do Cloudflare Access. Configure uma aplicação Access específica para o caminho `cineverse-1qv.pages.dev/admin*`, com política Allow restrita ao e-mail administrador e autenticação One-time PIN. Depois, configure as variáveis de produção `ACCESS_TEAM_DOMAIN` e `ACCESS_AUD` no Pages. `ADMIN_EMAIL` já está configurado no ambiente de produção e não fica no código-fonte.
