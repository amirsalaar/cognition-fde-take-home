# Everything runs in Docker. No host Node, database, or browser required.
COMPOSE := docker compose

.PHONY: up down logs test test-e2e verify evidence clean-stack

up: ## build and start app + postgres
	$(COMPOSE) up --build -d app
	@echo "Console: http://localhost:3000 (accounts in README.md)"

down: ## stop and remove containers, keep the database volume
	$(COMPOSE) down

logs: ## tail the local stack
	$(COMPOSE) logs -f

test: ## lint, typecheck, and Vitest in containers
	$(COMPOSE) run --build --rm test

test-e2e: ## Playwright workflow against the Compose stack
	$(COMPOSE) up --build -d app
	$(COMPOSE) run --build --rm e2e

verify: ## all required checks through Docker, including E2E
	$(MAKE) test
	$(MAKE) test-e2e
	@echo "verify: all checks passed"

evidence: ## run verify, then record factual evidence into docs/evidence.js
	$(MAKE) verify
	./scripts/generate-evidence.sh verified

clean-stack: ## remove containers AND the database volume (explicit opt-in)
	$(COMPOSE) down -v
