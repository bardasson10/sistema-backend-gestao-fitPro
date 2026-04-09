FROM node:24-bookworm-slim

WORKDIR /app

RUN corepack enable

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn prisma generate
RUN yarn build

EXPOSE 3333

CMD ["yarn", "start"]