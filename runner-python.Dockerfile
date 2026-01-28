FROM python:3.12-slim

RUN useradd -m -u 1000 runner
RUN apt-get update && apt-get install -y --no-install-recommends \
    git ca-certificates build-essential socat \
  && rm -rf /var/lib/apt/lists/*

RUN python -m pip install --no-cache-dir -U pip \
  && pip install --no-cache-dir pytest ruff build

COPY runner.sh /usr/local/bin/runner.sh
RUN chmod +x /usr/local/bin/runner.sh

USER runner
ENTRYPOINT ["/usr/local/bin/runner.sh"]
