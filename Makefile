.PHONY: all dev sidecar-dev client-sidecar prod-test release clean test api cli version help

APP_VERSION ?= 0.1.0
LDFLAGS = -ldflags="-s -w -X main.version=$(APP_VERSION)"

BIN_DIR = bin
API_MAIN = ./api/cmd/api/main.go
CLI_MAIN = ./api/cmd/cli/main.go
SIDECAR_DIR = app/src-tauri/binaries

SIDECAR_TARGETS = \
	linux/amd64:x86_64-unknown-linux-gnu \
	windows/amd64:x86_64-pc-windows-msvc \
	darwin/amd64:x86_64-apple-darwin \
	darwin/arm64:aarch64-apple-darwin

CURRENT_TARGET := $(shell rustc -vV 2>/dev/null | sed -n 's|host: ||p')

DISPLAY_FLAGS :=
ifeq ($(shell uname -s),Linux)
	DISPLAY_FLAGS = WEBKIT_DISABLE_COMPOSITING_MODE=1 GDK_BACKEND=x11
endif

all: help

dev:
	@bash -c "$(DISPLAY_FLAGS) APP_ENV=dev air & \
		cd app && $(DISPLAY_FLAGS) APP_ENV=dev bun run tauri dev"

sidecar-dev:
	@mkdir -p $(SIDECAR_DIR)
	@if [ -z "$(CURRENT_TARGET)" ]; then \
		echo "Error: could not detect target triple. Is rustc installed?"; \
		exit 1; \
	fi
	@target="$(CURRENT_TARGET)"; \
		ext=""; \
		if echo "$$target" | grep -q "windows"; then ext=".exe"; fi; \
		echo "Building sidecar for $$target"; \
		CGO_ENABLED=0 go build $(LDFLAGS) -o $(SIDECAR_DIR)/quant-api-$$target$$ext $(API_MAIN); \
		CGO_ENABLED=0 go build $(LDFLAGS) -o $(SIDECAR_DIR)/quant-cli-$$target$$ext $(CLI_MAIN)
	@echo "Done: sidecar binaries in $(SIDECAR_DIR)/"

client-sidecar:
	@cd app && $(DISPLAY_FLAGS) APP_ENV=dev SIDECAR=1 bun run tauri dev

version:
	@if [ -z "$(VERSION)" ]; then \
		echo "Usage: make version VERSION=0.2.0"; \
		exit 1; \
	fi
	@./scripts/bump-version.sh $(VERSION)

api:
	@mkdir -p $(BIN_DIR)
	@go build -o $(BIN_DIR)/quant $(API_MAIN)
	@./$(BIN_DIR)/quant

cli:
	@mkdir -p $(BIN_DIR)
	@go build -o $(BIN_DIR)/quant-cli $(CLI_MAIN)


client:
	@cd app && $(DISPLAY_FLAGS) bun run tauri dev

test:
	@go test ./...

clean:
	rm -rf $(BIN_DIR)
	rm -rf tmp
	rm -rf $(SIDECAR_DIR)
	rm -rf app/dist
	rm -rf app/src-tauri/target/release/bundle

help:
	@echo "Build & Execution Strategy"
	@echo ""
	@echo "  make dev              DEV mode: external API + hot reload"
	@echo "  make sidecar-dev      Build sidecar binary for current platform"
	@echo "  make client-sidecar   SIDECAR mode: Tauri spawns embedded API"
	@echo "  make prod-test        PROD simulation: build + run release binary"
	@echo "  make release          RELEASE mode: build distributable artifacts"
	@echo "  make clean            Remove all build artifacts"
	@echo "  make api              Build and run API binary"
	@echo "  make cli              Build and run CLI binary"
	@echo "  make test             Run Go tests"
	@echo "  make version VERSION=0.2.0  Bump version in all config files"
	@echo ""
	@echo "Modes:"
	@echo "  DEV      → make dev"
	@echo "  SIDECAR  → make sidecar-dev && make client-sidecar"
	@echo "  PROD     → make prod-test"
	@echo "  RELEASE  → make release"
