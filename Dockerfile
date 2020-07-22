FROM node:12

#Create app directory
WORKDIR /usr/src/app

ENV APP_PORT='7300'
ENV MONGODB_HOST='ds251507.mlab.com'
ENV MONGODB_USER='mohammed'
ENV MONGODB_PASSWORD='mohBaba1'
ENV MONGODB_PORT='51507'
ENV MONGODB_DATABASE_NAME='orderapp'
ENV ODA_SECRET_KEY='odasecretkeyforauthentication'
ENV SLING_KEY='Bearer sling_7jp4qqd8yk7pnb1gcy0w2nrmu4w8oshani0ne8a0gjmbaa1vufwvnj'
ENV REDIS_HOST='3.8.151.108'
ENV REDIS_PORT='6379'
ENV REDIS_PASSWORD='4Xn4HwNUbtzoVxAYxkiYIO9102'

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 7300

CMD ["npm", "start"]