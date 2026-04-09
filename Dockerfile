FROM node:24-bookworm-slim

WORKDIR /app

RUN corepack enable
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile --ignore-scripts

COPY . .

RUN yarn prisma generate
RUN yarn build

EXPOSE 3333

CMD ["yarn", "start"]