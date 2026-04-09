FROM node:20-alpine


RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json yarn.lock* ./


RUN yarn install


COPY . .


RUN yarn prisma generate


RUN yarn build

EXPOSE 3333

ENV NODE_ENV=production

CMD ["yarn", "start"]