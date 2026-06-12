# Imagem base com glibc (node:20-slim) — o sqlite3 tem binários pré-compilados
# para esta plataforma, evitando ter que compilar do zero.
FROM node:20-slim

ENV NODE_ENV=production

WORKDIR /app

# Instala apenas as dependências de runtime, aproveitando cache de camadas:
# só reinstala se package*.json mudar.
COPY package*.json ./
RUN npm ci --omit=dev

# Copia o restante do código (node_modules, data/ e .env ficam de fora via .dockerignore).
COPY . .

# Entrypoint roda migrations (e seed opcional) antes de iniciar a API.
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

# Verifica a saúde batendo no healthcheck da API.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["./docker-entrypoint.sh"]
