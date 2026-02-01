FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-venv python3-pip \
    git ca-certificates build-essential socat curl \
  && rm -rf /var/lib/apt/lists/*

RUN useradd -m runner

# Create a venv for runner tooling (pytest/ruff/build/aider)
RUN python3 -m venv /opt/venv \
  && /opt/venv/bin/pip install --no-cache-dir -U pip \
  && /opt/venv/bin/pip install --no-cache-dir pytest ruff build aider-chat \
  && chmod -R a+rX /opt/venv

ENV PATH="/opt/venv/bin:${PATH}"

RUN corepack enable

COPY runner.sh /usr/local/bin/runner.sh
RUN chmod +x /usr/local/bin/runner.sh

USER runner
ENTRYPOINT ["/usr/local/bin/runner.sh"]
