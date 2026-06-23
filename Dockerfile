FROM node:22-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

RUN python3 -m venv /opt/piper-venv \
    && /opt/piper-venv/bin/python -m pip install --no-cache-dir piper-tts==1.4.2

COPY . .

RUN mkdir -p /app/piper-data \
    && /opt/piper-venv/bin/python -m piper.download_voices \
       --data-dir /app/piper-data en_US-lessac-low

ENV NODE_ENV=production \
    PIPER_PYTHON=/opt/piper-venv/bin/python \
    PIPER_MODEL_PATH=/app/piper-data/en_US-lessac-low.onnx

EXPOSE 3000

CMD ["node", "server.js"]
