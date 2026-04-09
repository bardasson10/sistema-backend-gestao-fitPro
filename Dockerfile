FROM node:18-alpine

# Instala dependências básicas do sistema (necessárias para alguns pacotes node e prisma)
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copia os arquivos de dependência
# O asterisco no yarn.lock* evita erro caso o arquivo não exista (embora deva existir)
COPY package.json yarn.lock* ./

# Instalamos sem o frozen-lockfile para garantir que ele consiga resolver as dependências
RUN yarn install

# Agora copiamos o resto dos arquivos
COPY . .

# Gera o prisma
RUN yarn prisma generate

# Build
RUN yarn build

EXPOSE 3000

CMD ["yarn", "start"]