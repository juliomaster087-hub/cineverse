# CineVerse Auto Media — configuração dos provedores

O Studio envia o arquivo diretamente para o armazenamento selecionado pelo Media Manager. Os segredos dos provedores nunca devem ser colocados no repositório, em D1 ou em mensagens de chat.

## Provedores suportados nesta primeira versão

- **Cloudflare R2**: até 10 GiB de armazenamento na franquia gratuita publicada; saída de dados sem cobrança.
- **Tigris Standard**: até 5 GiB de armazenamento na franquia gratuita publicada; saída de dados sem cobrança.

O Media Manager distribui os arquivos pelo provedor com menor ocupação proporcional e recusa um upload se nenhum provedor tiver espaço livre suficiente. Os limites do código são tetos máximos da franquia; o responsável pela conta pode configurar um limite menor no segredo.

A aplicação acompanha somente os arquivos enviados pelo CineVerse. Se a conta já tiver outros arquivos, o limite configurado precisa ser reduzido para refletir o espaço que realmente resta. Limites gratuitos, condições e políticas podem mudar; confira-os antes de ativar cada conta.

## Configuração segura

Um responsável pela conta deve criar os buckets, habilitar acesso público de leitura para os vídeos licenciados e gerar chaves S3 com permissões mínimas de leitura e gravação. Não compartilhe essas chaves no chat nem as salve no GitHub.

No Cloudflare Pages, em **Settings → Environment variables**, adicione `MEDIA_STORAGE_PROVIDERS` como variável **secret** para Production. O valor é um array JSON. Exemplo ilustrativo, com marcadores que precisam ser substituídos no próprio painel:

```json
[
  {
    "id": "r2-main",
    "type": "r2",
    "label": "Cloudflare R2",
    "endpoint": "https://ACCOUNT_ID.r2.cloudflarestorage.com",
    "bucket": "cineverse-videos",
    "region": "auto",
    "accessKeyId": "R2_ACCESS_KEY_ID",
    "secretAccessKey": "R2_SECRET_ACCESS_KEY",
    "publicBaseUrl": "https://PUBLIC_VIDEO_DOMAIN",
    "freeLimitBytes": 10737418240
  },
  {
    "id": "tigris-main",
    "type": "tigris",
    "label": "Tigris",
    "endpoint": "https://t3.storage.dev",
    "bucket": "cineverse-videos",
    "region": "auto",
    "accessKeyId": "TIGRIS_ACCESS_KEY_ID",
    "secretAccessKey": "TIGRIS_SECRET_ACCESS_KEY",
    "publicBaseUrl": "https://PUBLIC_VIDEO_DOMAIN/BUCKET_PATH",
    "freeLimitBytes": 5368709120
  }
]
```

Os valores `publicBaseUrl` precisam ser os endereços públicos reais dos buckets, configurados pelo provedor. A aplicação acrescenta `/cineverse/<uuid>.<extensão>` ao final do endereço.

## CORS dos buckets

Configure CORS no bucket para aceitar a origem do site `https://cineverse-1qv.pages.dev`, método `PUT`, e cabeçalhos necessários para upload. Para leitura pública de vídeos, configure a política pública somente para os objetos de mídia licenciados. Não habilite listagem pública do bucket.

## Proteção contra cobranças

- O código limita os uploads a 2 GiB por arquivo.
- O código não permite que o limite configurado ultrapasse a franquia gratuita publicada para cada tipo de provedor.
- O sistema não tenta outro provedor se todos estiverem sem espaço.
- Isso não substitui os controles de cobrança da conta: consumo de outros projetos, requisições, mudanças de plano ou alterações de preço podem gerar custos. O responsável deve desativar qualquer cobrança automática/overage que não aceite.

## Limites conhecidos

A primeira versão oferece upload S3 compatível por URL pré-assinada, reprodução MP4/WebM/MOV por URL pública e distribuição entre R2 e Tigris. Ela não é armazenamento ilimitado, não faz transcodificação adaptativa e não monitora todas as requisições de leitura dos provedores. Antes de abrir o catálogo ao público, faça um teste com um vídeo autorizado e confirme reprodução, CORS e consumo no painel de cada provedor.
