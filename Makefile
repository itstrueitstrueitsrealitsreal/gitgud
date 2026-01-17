.PHONY: build up down logs restart clean help

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build Docker images
	docker-compose build

up: ## Start containers
	docker-compose up -d

down: ## Stop containers
	docker-compose down

logs: ## View logs
	docker-compose logs -f

restart: ## Restart containers
	docker-compose restart

clean: ## Remove containers, volumes, and images
	docker-compose down -v --rmi all

rebuild: ## Rebuild and restart containers
	docker-compose up -d --build

dev: ## Start in development mode (without Docker)
	@echo "Starting backend..."
	cd backend && npm run dev &
	@echo "Starting frontend..."
	cd frontend && npm run dev

stop-dev: ## Stop development servers
	pkill -f "npm run dev" || true
	pkill -f "tsx watch" || true
	pkill -f "vite" || true
