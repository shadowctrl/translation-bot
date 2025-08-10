FROM node:24-alpine
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile
COPY . .
RUN yarn build
RUN addgroup -g 1001 -S nodejs
RUN adduser -S botuser -u 1001
RUN chown -R botuser:nodejs /app
USER botuser
CMD ["yarn", "start"]