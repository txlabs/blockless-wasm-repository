FROM node:18

WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./
RUN yarn install --frozen-lockfile

# Bundle app source

COPY ./build ./build
COPY ./client .

EXPOSE 3000
CMD [ "yarn", "start" ]