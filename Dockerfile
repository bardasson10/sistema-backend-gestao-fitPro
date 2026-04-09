FROM node:20

WORKDIR /app

RUN corepack enable

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

RUN yarn prisma generate
RUN yarn build

EXPOSE 3333

ENV NODE_ENV=production

CMD ["yarn", "start"]