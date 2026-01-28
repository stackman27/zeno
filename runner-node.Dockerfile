FROM node:20-slim

RUN useradd -m -u 1000 runner
RUN apt-get update && apt-get install -y --no-install-recommends \
    git ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable

COPY runner.sh /usr/local/bin/runner.sh
RUN chmod +x /usr/local/bin/runner.sh

USER runner
ENTRYPOINT ["/usr/local/bin/runner.sh"]
