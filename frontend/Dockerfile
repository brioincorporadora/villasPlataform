# Usando a imagem oficial do Node.js
FROM node:20-alpine AS deps

# Definir o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copiar os arquivos package.json e package-lock.json (se houver)
COPY ./package.json ./package-lock.json* /app/

# Instalar as dependências
RUN npm ci --legacy-peer-deps

# Copiar o código do projeto para dentro do contêiner
COPY . /app/

# Expor a porta onde o Next.js vai rodar
EXPOSE 3000

# Rodar o Next.js no modo de desenvolvimento
CMD ["npm", "run", "dev"]
