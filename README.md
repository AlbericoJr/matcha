# Matcha

Compare seu currículo com uma vaga, identifique pontos de alinhamento e organize as evidências mais relevantes para cada candidatura.

<p align="center">
  <img src="./img/print.png" alt="Tela do Matcha: análise de compatibilidade entre currículo e vaga" width="900">
</p>

## Sobre o projeto

O Matcha é uma aplicação web que ajuda você a revisar seu currículo com base nos requisitos de uma vaga. A análise pode ser feita localmente, sem enviar os textos, ou com uma opção semântica de IA configurada no servidor.

As estimativas servem como apoio à revisão: não representam a pontuação de um sistema ATS, não comprovam competências e não predizem o resultado de uma candidatura.

## Funcionalidades

- Comparação local de palavras-chave e sinônimos, sem necessidade de configurar uma API.
- Importação de currículos em PDF com texto selecionável. A extração acontece no navegador; arquivos de até 8 MB e 60 páginas são aceitos.
- Importação de vagas públicas do Greenhouse e Lever, além da opção de colar a descrição manualmente.
- Relatório com compatibilidade estimada, termos encontrados e não localizados e indicadores de estrutura do currículo.
- Análise semântica opcional usando a OpenAI Responses API.
- Versão personalizada que destaca evidências do currículo original, com opções para copiar o texto ou imprimi-lo/salvá-lo como PDF.
- Interface responsiva, sem cadastro.

## Tecnologias

- React 19 e TypeScript
- Vite
- Node.js para a API e a publicação da versão de produção
- PDF.js para extrair texto de arquivos PDF no navegador

## Requisitos

- Node.js 20.19.0 ou superior
- npm

## Executar localmente

Instale as dependências e inicie a aplicação:

```bash
npm install
npm run dev
```

Abra [http://127.0.0.1:5173](http://127.0.0.1:5173). No modo de desenvolvimento, o Vite encaminha as chamadas da API para o servidor local em `127.0.0.1:3000`.

## Configurar a análise com IA

A análise local funciona sem chave. Para habilitar a análise semântica, crie um arquivo `.env` na raiz do projeto e configure:

```env
OPENAI_API_KEY=sua_chave
OPENAI_MODEL=gpt-4.1-mini
```

`OPENAI_MODEL` é opcional; esse é o modelo padrão. Reinicie o servidor depois de alterar o arquivo. Mantenha a chave somente no `.env` ou nas variáveis privadas do ambiente de hospedagem — nunca a inclua no código do navegador ou no repositório.

O uso da análise com IA envia o texto da vaga e do currículo ao servidor da aplicação e à OpenAI. A requisição é enviada com `store: false`, e a aplicação não mantém currículos em banco de dados. Consulte também as políticas do provedor de IA antes de enviar informações pessoais.

## Build e produção

Gere a versão de produção e inicie o servidor Node.js:

```bash
npm run build
npm start
```

Por padrão, a aplicação fica disponível em [http://127.0.0.1:3000](http://127.0.0.1:3000). O servidor publica os arquivos gerados em `dist`. Para hospedagem, use um ambiente compatível com Node.js e configure `HOST` e `PORT` conforme necessário. Por exemplo, em uma plataforma de hospedagem, defina `HOST=0.0.0.0` e forneça a porta esperada pela plataforma.

## Privacidade e limites

- Na análise local, os textos permanecem no navegador e a comparação é feita sem uma chamada à API.
- O PDF é processado no navegador. Arquivos digitalizados como imagem precisam de OCR, que não é fornecido pelo Matcha.
- A importação busca somente vagas públicas do Greenhouse e Lever; ela não acessa contas privadas nem envia candidaturas.
- A opção de IA encaminha os textos ao serviço configurado. Não envie informações que você não queira compartilhar com esse provedor.
- O servidor aplica limites de tamanho e frequência às requisições.
- Revise o resultado e confirme as informações antes de usar o currículo em uma candidatura. O Matcha não cria experiências ou competências e não substitui sua avaliação.

## Estrutura do projeto

```text
.
├── img/
│   └── print.png
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   └── styles.css
├── index.html
├── server.ts
├── package.json
├── tsconfig*.json
└── vite.config.ts
```
