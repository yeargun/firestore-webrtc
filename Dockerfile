FROM node
WORKDIR /var/www/app
COPY . .
RUN npm install --force
RUN npm run build
ENTRYPOINT npm run preview