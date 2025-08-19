FROM node:18

WORKDIR /app
COPY . .

RUN npm install
RUN npm install pm2 -g

ENV PM2_PUBLIC_KEY=e36zh0v3ct8crhs
ENV PM2_SECRET_KEY=miaf24verkn9na9

EXPOSE 3000

CMD ["npm", "start"]

