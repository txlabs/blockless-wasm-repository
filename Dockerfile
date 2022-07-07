FROM node:18

WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./
COPY ./client/package.json ./client/package.json
COPY ./server/package.json ./server/package.json
RUN yarn install

# Bundle app source

COPY ./build/server ./build/server
COPY ./client/build ./client/build

EXPOSE 3000
CMD [ "yarn", "start" ]