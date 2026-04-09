FROM node:24-bookworm-slim

WORKDIR /app

RUN corepack enable

ARG DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres?schema=public
ENV DATABASE_URL=${DATABASE_URL}

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile --ignore-scripts

COPY . .

RUN yarn prisma generate
RUN yarn build

EXPOSE 3333

CMD ["yarn", "start"]