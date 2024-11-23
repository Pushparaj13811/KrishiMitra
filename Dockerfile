FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --only=production

COPY . .

EXPOSE 3000

RUN npm install -g nodemon

CMD ["npm", "run", "start"]
