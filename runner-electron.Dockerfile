FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    git ca-certificates \
    xvfb \
    x11vnc \
    fluxbox \
    dbus-x11 \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    libxss1 \
    libgconf-2-4 \
    libxshmfence1 \
    libglu1-mesa \
  && rm -rf /var/lib/apt/lists/*

RUN useradd -m runner

RUN corepack enable

COPY runner.sh /usr/local/bin/runner.sh
RUN chmod +x /usr/local/bin/runner.sh

USER runner
ENTRYPOINT ["/usr/local/bin/runner.sh"]
