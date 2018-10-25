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
RUN mkdir publish && mkdir publish/landing
RUN unalias mv
RUN mv  ./landing/index.html ./landing/img ./landing/dist ./publish/landing/
RUN yarn build
RUN mv ./src ./public ./views ./dist ./node_modules ./publish/


FROM node:9.11-alpine
WORKDIR /app
COPY --from=build-deps /app/publish /app/
CMD ["node", "./dist/index.js"]
EXPOSE 8081