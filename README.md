# Votação CANTA. Talentos

Site de votação dos talentos da CANTA, desenvolvido com [Lovable](https://lovable.dev).

## Entrega do código

Este repositório privado é uma cópia do código entregue em 24/11/2026, não uma conexão de sincronização automática com o Lovable. Não inclui credenciais, registros de eleitores ou dependências instaladas. As mídias são referenciadas pelos arquivos `.asset.json` e continuam hospedadas no Lovable.

A configuração dos serviços é fornecida por variáveis de ambiente; veja `.env.example`. As credenciais privadas ficam apenas no servidor. A votação usa identificação por nome e e-mail corporativo e não comprova a propriedade do e-mail.

## Build with Lovable

Abra seu projeto no [editor Lovable](https://lovable.dev) para continuar criando.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Sincronização automática**: pode ser configurada separadamente em Configurações do projeto → Git; essa opção cria outro repositório.
- **Código próprio**: esta entrega pode ser clonada para desenvolvimento e hospedagem externos, com configuração própria dos serviços.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone https://github.com/lorenza-nogueira/canta-talentos-votacao.git
cd canta-talentos-votacao
bun install
bun run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
