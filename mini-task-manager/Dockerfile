# Lab 07: node:22-alpine — actively maintained base with fixed OpenSSL libs
# (node:20-alpine upstream digest is stale and its frozen Alpine repos do not
# carry the libcrypto3/libssl3 fixes). App requires node >= 20 (package.json).
FROM node:22-alpine

ENV NODE_ENV=production \
    PORT=3000

# TEMPORARY Lab 07 rollback-demo: arm the dormant BREAK_AFTER_SEC hook so the
# demo image fails post-switch. Reverted right after the demonstration.
ENV BREAK_AFTER_SEC=90

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Lab 07: remediate Trivy HIGH/CRITICAL findings with real fixes (no suppression).
# 1. Upgrade Alpine OpenSSL libs (fixes libcrypto3/libssl3 CVEs).
# 2. Remove the Node-bundled npm/npx: build-time tools whose transitive deps
#    (tar, cross-spawn, glob, minimatch, ...) carry CVEs. The runtime needs
#    only `node` (see CMD/HEALTHCHECK and package.json "start").
RUN apk upgrade --no-cache openssl \
 && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

COPY src ./src

EXPOSE 3000

HEALTHCHECK --interval=5s --timeout=3s --start-period=5s --retries=10 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "src/server.js"]
