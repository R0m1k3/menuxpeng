FROM python:3.12-alpine

LABEL org.opencontainers.image.title="menuxpeng" \
      org.opencontainers.image.description="Menu de liens pour le navigateur de la XPeng G6" \
      org.opencontainers.image.source="https://github.com/R0m1k3/menuxpeng"

ENV PYTHONUNBUFFERED=1 \
    MENU_HOST=0.0.0.0 \
    MENU_PORT=8420 \
    MENU_DATA=/data

RUN apk add --no-cache su-exec

WORKDIR /app
COPY server.py seed.json entrypoint.sh ./
COPY public ./public
RUN chmod +x entrypoint.sh && mkdir -p /data/icons

VOLUME ["/data"]
EXPOSE 8420

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8420/healthz || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["python3", "server.py"]
