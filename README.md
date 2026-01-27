# Sandbox Orchestrator + Pluggable Runtimes (“Lanes”)

**Moat:** _“Speed is nothing without precision.”_

This repository/design describes a **bounded execution sandbox + verification framework** that is **extensible** via pluggable runtimes (“lanes”). We intentionally avoid a “run anything” universal sandbox in the MVP because that becomes complex quickly and tends to sacrifice correctness.

---

## Why this exists

### Problem
- A “universal” sandbox that can run anything is **very complex**.
- Many tasks that feel small still cause unnecessary back-and-forth between **Eng / Product / GTM**, and take longer than expected.
- We need confidence and repeatability; fast execution without verification is not useful.

### Goal
Build an **extensible sandbox verification framework** where we start with **1–2 lanes** we can guarantee are correct and safe, then expand lane-by-lane.

---

## Requirements

### Must-haves
- **Bounded execution**: each lane has strict scope and a verification contract.
- **Precision-first**: changes must be provably correct (or fail closed).
- **Local execution**: code must not be shared with us; execution happens in the user's environment.
- **Hot reload-like behavior**: PM can iterate quickly (edit → run → compare) without restarting the sandbox.
- **Extensible**: new lanes can be added without redesigning the system.

---

## Core principle

> You don’t need to test everything in one environment. You need:  
> **a Sandbox Orchestrator + Pluggable Runtimes (“lanes”).**

---

## MVP lanes (examples)

### Lane A — Prompt Engineering Sandbox (RepoA)
Primary goal: enable PMs to iteratively improve prompts with rapid feedback + strong verification gates.

### Lane B — Backend/Frontend Change (RepoB)
Small/mid tickets that are low dependency and reliably verifiable (build/lint/unit tests).

### Lane C — Docs Update from Recent Code (RepoB)
Generate/update docs from current repo state with verification (doc build, lint, link check, etc).

> The MVP can launch with Lane A + one of (Lane B / Lane C), depending on what yields the most value fastest.

---

## Prompt Engineering Lane (RepoA) — Architecture

### Bootstrap
- **[Bootstrap]** Retrieve the initial prompt from **RepoA**, pinned to a **Git commit**.
- This becomes the **baseline prompt** for the session.

### Sandbox engine (local, Docker)
The local runner spins up a Docker container containing:

- **Sandbox UI** (dev playground) with an **Output panel** showing what the end-user would see.
  - Playground controls:
    - edit prompt
    - edit context
    - run
    - compare
    - verify
  - Rendered output view:
    - “what the user sees” panel (preview)
- **Backend API** (optional but recommended):
  - runs prompt execution
  - stores session state (overlay)
  - exposes verification endpoints
- **Prompt runtime**
  - templating / variable interpolation
  - tool mocks (or record/replay, optional)
  - adapters for running against production-shaped (or production) data
- **Repo mount**
  - RepoA mounted into the container at `/workspace`
  - ideally **read-only**, with controlled write only during explicit save

Runner prints something like:

# zeno
