# Imagem base com glibc (node:20-slim) — o sqlite3 tem binários pré-compilados
# para esta plataforma, evitando ter que compilar do zero.
# Imagem base
FROM node:20-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

# Instala ferramentas essenciais para compilar o sqlite3 nativamente no Debian Bookworm
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

# Instala as dependências de produção e FORÇA a compilação local do sqlite3
RUN npm ci --omit=dev --build-from-source=sqlite3

# Copia o restante do código
COPY . .

# Permissão para o entrypoint
RUN chmod +x docker-entrypoint.sh

#ENTRYPOINT ["./docker-entrypoint.sh"]

EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "start"]