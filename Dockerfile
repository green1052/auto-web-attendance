FROM node:18 as base
RUN npm install -g yarn
WORKDIR /app

FROM base as build
COPY package.json ./
COPY yarn.lock ./
COPY src ./src
RUN yarn install --frozen-lockfile
RUN yarn run build

FROM build as deploy
COPY --from=build package.json ./
COPY --from=build /app/dist ./
RUN yarn install --prod=true
ENV NODE_ENV=production

VOLUME [ "/app/config" ]

CMD ["yarn", "node", "index.js"]