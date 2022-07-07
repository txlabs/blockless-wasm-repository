FROM node:18

WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./

RUN yarn install --frozen-lockfile

# Bundle app source
RUN mkdir ./build
COPY ./build ./build
RUN mkdir -p ./client/build
COPY ./client/build ./client/build

EXPOSE 3000
CMD [ "yarn", "start" ]