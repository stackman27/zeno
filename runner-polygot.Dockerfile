FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv \
    git ca-certificates build-essential \
  && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1000 runner

RUN python3 -m pip install --no-cache-dir -U pip \
  && pip3 install --no-cache-dir pytest ruff build

RUN corepack enable

COPY runner.sh /usr/local/bin/runner.sh
RUN chmod +x /usr/local/bin/runner.sh

USER runner
ENTRYPOINT ["/usr/local/bin/runner.sh"]
