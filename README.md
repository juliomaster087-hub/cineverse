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