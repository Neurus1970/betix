# ─── Betix Makefile ───────────────────────────────────────────────────────────
# Interfaz unificada para buildear, testear y operar los microservicios de Betix.
# Uso: make <target>   |   make help
# ──────────────────────────────────────────────────────────────────────────────

# Carga .env.dev si existe (variables de entorno para desarrollo local)
-include .env.dev
export

# Versiones de cada servicio (leídas desde los archivos VERSION)
VERSION_CORE     := $(shell cat core/VERSION | tr -d '[:space:]')
VERSION_API      := $(shell cat src/VERSION | tr -d '[:space:]')
VERSION_FRONTEND := $(shell cat frontend/VERSION | tr -d '[:space:]')

# Registry ECR (sobreescribir con: make push ECR=123456789.dkr.ecr.us-east-1.amazonaws.com)
ECR ?= local

IMAGE_CORE     := betix-core
IMAGE_API      := betix-api
IMAGE_FRONTEND := betix-frontend

.PHONY: help up down logs \
        test test-core test-api \
        build build-core build-api build-frontend \
        push push-core push-api push-frontend \
        k8s-apply k8s-status k8s-delete \
        version bump-core bump-api bump-frontend \
        lint

# ─── Help ─────────────────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "Betix — comandos disponibles"
	@echo "────────────────────────────────────────────────────────────"
	@echo "  Desarrollo local"
	@echo "    make up               Levanta los 3 servicios (docker-compose)"
	@echo "    make down             Baja todos los servicios"
	@echo "    make logs             Tail de logs en tiempo real"
	@echo ""
	@echo "  Tests"
	@echo "    make test             Todos los tests (core + api)"
	@echo "    make test-core        pytest del microservicio Python"
	@echo "    make test-api         Jest + Cucumber del API Node.js"
	@echo "    make lint             ESLint sobre el código Node.js"
	@echo ""
	@echo "  Build de imágenes Docker"
	@echo "    make build            Build de las 3 imágenes con su versión"
	@echo "    make build-core       Build solo betix-core:<version>"
	@echo "    make build-api        Build solo betix-api:<version>"
	@echo "    make build-frontend   Build solo betix-frontend:<version>"
	@echo ""
	@echo "  Push a ECR (requiere: make push ECR=<registry>)"
	@echo "    make push             Push de las 3 imágenes"
	@echo "    make push-core        Push solo betix-core"
	@echo "    make push-api         Push solo betix-api"
	@echo "    make push-frontend    Push solo betix-frontend"
	@echo ""
	@echo "  Kubernetes (requiere minikube corriendo)"
	@echo "    make k8s-apply        Aplica todos los manifests"
	@echo "    make k8s-status       Estado de los pods y servicios"
	@echo "    make k8s-delete       Elimina todos los recursos K8s"
	@echo ""
	@echo "  Versionado"
	@echo "    make version          Muestra versión actual de cada servicio"
	@echo "    make bump-core     v=X.Y.Z   Actualiza core/VERSION"
	@echo "    make bump-api      v=X.Y.Z   Actualiza src/VERSION"
	@echo "    make bump-frontend v=X.Y.Z   Actualiza frontend/VERSION"
	@echo "────────────────────────────────────────────────────────────"
	@echo ""

# ─── Desarrollo local ─────────────────────────────────────────────────────────
up:
	docker-compose up --build

down:
	docker-compose down

logs:
	docker-compose logs -f

# ─── Tests ────────────────────────────────────────────────────────────────────
test: test-core test-api

test-core:
	python3 -m pytest core/tests/ -v

test-api:
	npm test

lint:
	npm run lint

# ─── Build ────────────────────────────────────────────────────────────────────
build: build-core build-api build-frontend

build-core:
	@echo "Building $(IMAGE_CORE):$(VERSION_CORE)"
	docker build -f core/Dockerfile -t $(IMAGE_CORE):$(VERSION_CORE) -t $(IMAGE_CORE):latest .

build-api:
	@echo "Building $(IMAGE_API):$(VERSION_API)"
	docker build -f Dockerfile -t $(IMAGE_API):$(VERSION_API) -t $(IMAGE_API):latest .

build-frontend:
	@echo "Building $(IMAGE_FRONTEND):$(VERSION_FRONTEND)"
	docker build -f frontend/Dockerfile -t $(IMAGE_FRONTEND):$(VERSION_FRONTEND) -t $(IMAGE_FRONTEND):latest .

# ─── Push ─────────────────────────────────────────────────────────────────────
push: push-core push-api push-frontend

push-core: build-core
	docker tag $(IMAGE_CORE):$(VERSION_CORE) $(ECR)/$(IMAGE_CORE):$(VERSION_CORE)
	docker tag $(IMAGE_CORE):latest          $(ECR)/$(IMAGE_CORE):latest
	docker push $(ECR)/$(IMAGE_CORE):$(VERSION_CORE)
	docker push $(ECR)/$(IMAGE_CORE):latest

push-api: build-api
	docker tag $(IMAGE_API):$(VERSION_API) $(ECR)/$(IMAGE_API):$(VERSION_API)
	docker tag $(IMAGE_API):latest         $(ECR)/$(IMAGE_API):latest
	docker push $(ECR)/$(IMAGE_API):$(VERSION_API)
	docker push $(ECR)/$(IMAGE_API):latest

push-frontend: build-frontend
	docker tag $(IMAGE_FRONTEND):$(VERSION_FRONTEND) $(ECR)/$(IMAGE_FRONTEND):$(VERSION_FRONTEND)
	docker tag $(IMAGE_FRONTEND):latest              $(ECR)/$(IMAGE_FRONTEND):latest
	docker push $(ECR)/$(IMAGE_FRONTEND):$(VERSION_FRONTEND)
	docker push $(ECR)/$(IMAGE_FRONTEND):latest

# ─── Kubernetes ───────────────────────────────────────────────────────────────
k8s-apply:
	kubectl apply -f k8s/namespace.yaml
	kubectl apply -f k8s/

k8s-status:
	kubectl get all -n betix

k8s-delete:
	kubectl delete -f k8s/

# ─── Versionado ───────────────────────────────────────────────────────────────
version:
	@echo "core:     $(VERSION_CORE)"
	@echo "api:      $(VERSION_API)"
	@echo "frontend: $(VERSION_FRONTEND)"

bump-core:
	@test -n "$(v)" || (echo "Uso: make bump-core v=X.Y.Z" && exit 1)
	@echo "$(v)" > core/VERSION
	@echo "core/VERSION → $(v)"

bump-api:
	@test -n "$(v)" || (echo "Uso: make bump-api v=X.Y.Z" && exit 1)
	@echo "$(v)" > src/VERSION
	@echo "src/VERSION → $(v)"

bump-frontend:
	@test -n "$(v)" || (echo "Uso: make bump-frontend v=X.Y.Z" && exit 1)
	@echo "$(v)" > frontend/VERSION
	@echo "frontend/VERSION → $(v)"
