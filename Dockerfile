FROM node:18 as base
WORKDIR /app

FROM base as build
COPY package.json ./
COPY tsconfig.json ./
COPY src ./src
RUN yarn install
RUN yarn run build

FROM build as deploy
COPY --from=build /app/package.json ./
COPY --from=build /app/dist ./
RUN yarn install --prod=true

VOLUME [ "/app/config" ]

CMD ["yarn", "node", "index.js"]