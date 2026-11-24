# Votação CANTA. Talentos

Site de votação dos talentos da CANTA, desenvolvido com [Lovable](https://lovable.dev).

## Entrega do código

Este repositório público é uma cópia do código entregue em 24/11/2026, não uma conexão de sincronização automática com o Lovable. Não inclui credenciais, registros de eleitores ou dependências instaladas. As mídias são referenciadas pelos arquivos `.asset.json` e continuam hospedadas no Lovable.

Site público: https://cantatalentos-votacao.lovable.app

O GitHub disponibiliza o código; o site e a votação são hospedados no Lovable. GitHub Pages oferece hospedagem estática e não executa as funções de servidor necessárias para identificação, persistência dos votos e apuração. Para outra hospedagem, é necessário um serviço compatível com TanStack Start e configuração própria dos serviços.

A configuração dos serviços é fornecida por variáveis de ambiente; veja `.env.example`. As credenciais privadas ficam apenas no servidor. A votação usa identificação por nome e e-mail corporativo e não comprova a propriedade do e-mail.

## O que o site faz hoje

- **Feed único** com as 17 inscrições ativas, em ordem, com mídia na proporção original e sem recorte.
- **Duas visualizações**: *Feed* (lista grande) e *Geral* (miniaturas, três por linha, com nome do projeto, nome do participante, categoria e botão de votar; clicar na miniatura abre o projeto inteiro).
- **Filtro por categoria** com rolagem lateral fluida e uma barrinha arrastável sempre visível.
- **Cardápio de detalhes** com mídia limitada em altura, botões "Acesse aqui", nome do participante, categoria, descrição completa e barra de rolagem vertical desenhada na lateral direita.
- **Votação identificada** por nome e e-mail corporativo, com retirada de voto e votação novamente, totais espelhados na planilha de apuração.

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
