FROM node:9.11 as build-deps

WORKDIR /app

COPY ./package.json ./yarn.lock ./
RUN yarn
ADD ./landing/ ./landing
ADD ./public/ ./public
ADD ./views/ ./views
ADD ./src/ ./src
ADD ./webpack.config.js ./gulpfile.js ./
RUN yarn build:landing
RUN yarn build
RUN mkdir publish && cp -r ./public ./dist ./views ./publish/


FROM node:9.11-alpine
WORKDIR /app
ADD ./package.json ./yarn.lock ./
RUN yarn --prod
COPY --from=build-deps /app/publish /app/
CMD ["node", "./dist/index.js"]
EXPOSE 8081