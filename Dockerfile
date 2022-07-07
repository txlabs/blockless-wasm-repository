FROM node:18


WORKDIR /usr/src/app


COPY package.json ./
COPY yarn.lock ./

RUN yarn install --frozen-lockfile
RUN yarn build

# Bundle app source
COPY build build
COPY client/build client/build

EXPOSE 3000
CMD [ "yarn", "start" ]