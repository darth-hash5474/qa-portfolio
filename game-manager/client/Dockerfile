# Build the React app. react-scripts 4 needs Node 16; newer versions fail on its webpack 4.
FROM node:16-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# Not npm ci: the committed lock file is out of sync with package.json
RUN npm install --no-audit --no-fund
COPY . .
# Baked into the bundle at build time, so it is the address the browser uses to reach the server
ARG REACT_APP_API_URL=http://localhost:5000
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build

# Serve the static build
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
