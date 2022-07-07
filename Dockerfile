FROM node:18


WORKDIR /usr/src/app


COPY package.json ./
COPY yarn.lock ./
COPY client/ client/
COPY server/ server/

RUN yarn install --frozen-lockfile
RUN yarn build

# Bundle app source
COPY ./build ./
COPY ./client/build ./client

EXPOSE 3000
CMD [ "yarn", "start" ]