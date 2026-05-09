.PHONY: help install start \
        backend-start frontend-start \
        docker-start docker-stop docker-build docker-logs \
        lint type-check

SHELL := /bin/bash

# ── Self-documenting help ─────────────────────────────────────────────────────

help: ## Show this help message
	@printf '\nSafeSight.AI — available targets:\n\n'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'
	@printf '\n'

# ── Setup ─────────────────────────────────────────────────────────────────────

install: ## Install all dependencies and initialise env files
	@bash scripts/install.sh

# ── Local development ─────────────────────────────────────────────────────────

start: ## Start the full application (backend + frontend) via start script
	@bash scripts/start.sh

backend-start: ## Start the FastAPI backend (port 8000, hot-reload)
	@cd SafeSight_server && \
	  venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --reload

frontend-start: ## Start the Next.js frontend dev server (port 3000)
	@cd SafeSight_client && npm run dev

# ── Docker ────────────────────────────────────────────────────────────────────

docker-start: ## Build images and start all services with Docker Compose
	@docker compose up --build -d
	@echo ""
	@echo "  Services started:"
	@echo "    Frontend  →  http://localhost:3000"
	@echo "    Backend   →  http://localhost:7860"
	@echo "    API Docs  →  http://localhost:7860/docs"
	@echo ""
	@echo "  Run 'make docker-logs' to follow logs, 'make docker-stop' to stop."

docker-stop: ## Stop and remove Docker Compose services
	@docker compose down

docker-build: ## Rebuild Docker images without cache
	@docker compose build --no-cache

docker-logs: ## Tail logs from all Docker services
	@docker compose logs -f

# ── Code quality ──────────────────────────────────────────────────────────────

lint: ## Run ESLint on the frontend
	@cd SafeSight_client && npm run lint

type-check: ## Run TypeScript type-checking on the frontend
	@cd SafeSight_client && npx tsc --noEmit
