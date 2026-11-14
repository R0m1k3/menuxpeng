FROM python:3.12-alpine

LABEL org.opencontainers.image.title="menuxpeng" \
      org.opencontainers.image.description="Menu de liens pour le navigateur de la XPeng G6" \
      org.opencontainers.image.source="https://github.com/R0m1k3/menuxpeng"

ENV PYTHONUNBUFFERED=1 \
    MENU_HOST=0.0.0.0 \
    MENU_PORT=8420 \
    MENU_DATA=/data

WORKDIR /app
COPY server.py seed.json ./
COPY public ./public

RUN adduser -D -u 1000 menu && mkdir -p /data/icons && chown -R menu:menu /data
USER menu

VOLUME ["/data"]
EXPOSE 8420

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8420/healthz || exit 1

CMD ["python3", "server.py"]
