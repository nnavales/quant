.PHONY: all dev sidecar-dev client-sidecar release clean test api cli version help

# Version and build flags
APP_VERSION ?= 0.1.0
LDFLAGS = -ldflags="-s -w -X main.version=$(APP_VERSION)"

# Paths
BIN_DIR = bin
API_MAIN = ./api/cmd/api/main.go
CLI_MAIN = ./api/cmd/cli/main.go
SIDECAR_DIR = app/src-tauri/binaries

# Multi-platform sidecar targets (GOOS/GOARCH:Tauri-target-triple)
SIDECAR_TARGETS = \
	linux/amd64:x86_64-unknown-linux-gnu \
	windows/amd64:x86_64-pc-windows-msvc \
	darwin/amd64:x86_64-apple-darwin \
	darwin/arm64:aarch64-apple-darwin

# Detect current platform target triple via rustc
CURRENT_TARGET := $(shell rustc -vV 2>/dev/null | sed -n 's|host: ||p')

# Linux display flags for Tauri/WebKit
DISPLAY_FLAGS :=
ifeq ($(shell uname -s),Linux)
	DISPLAY_FLAGS = WEBKIT_DISABLE_COMPOSITING_MODE=1 GDK_BACKEND=x11
endif

all: help

# ─── DEV MODE ──────────────────────────────────────────────────────
# Fast iteration. External API (air) + Tauri client. No sidecars.
# Environment variables are injected from Makefile — no .env required.

dev:
	@bash -c "$(DISPLAY_FLAGS) APP_ENV=dev air & \
		cd app && $(DISPLAY_FLAGS) APP_ENV=dev bun run tauri dev"

# ─── SIDECAR DEV MODE ──────────────────────────────────────────────
# Simulate production behavior locally. Embedded API as sidecar.

# Build sidecar binaries for the CURRENT platform only.
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
		CGO_ENABLED=0 go build $(LDFLAGS) -o $(SIDECAR_DIR)/summit-api-$$target$$ext $(API_MAIN); \
		CGO_ENABLED=0 go build $(LDFLAGS) -o $(SIDECAR_DIR)/summit-cli-$$target$$ext $(CLI_MAIN)
	@echo "Done: sidecar binaries in $(SIDECAR_DIR)/"

# Run Tauri dev with sidecar spawn enabled (SIDECAR=1 forces sidecar in dev).
client-sidecar:
	@cd app && $(DISPLAY_FLAGS) APP_ENV=dev SIDECAR=1 bun run tauri dev

# ─── RELEASE MODE ──────────────────────────────────────────────────
# Deterministic, no env dependency. Multi-platform sidecars + bundle.

# Build sidecar binaries for ALL platforms.
sidecar:
	@mkdir -p $(SIDECAR_DIR)
	@for entry in $(SIDECAR_TARGETS); do \
		goos_arch=$${entry%:*}; \
		target=$${entry#*:}; \
		goos=$${goos_arch%/*}; \
		goarch=$${goos_arch#*/}; \
		ext=""; \
		if [ "$$goos" = "windows" ]; then ext=".exe"; fi; \
		echo "Building sidecar for $${target}"; \
		CGO_ENABLED=0 GOOS=$$goos GOARCH=$$goarch go build $(LDFLAGS) -o $(SIDECAR_DIR)/summit-api-$${target}$${ext} $(API_MAIN); \
		CGO_ENABLED=0 GOOS=$$goos GOARCH=$$goarch go build $(LDFLAGS) -o $(SIDECAR_DIR)/summit-cli-$${target}$${ext} $(CLI_MAIN); \
	done
	@echo "Done: all sidecar binaries in $(SIDECAR_DIR)/"

release: clean sidecar
	@cd app && bun run tauri build

# ─── VERSIONING ────────────────────────────────────────────────────

# Bump version across all config files. Usage: make version VERSION=0.2.0
version:
	@if [ -z "$(VERSION)" ]; then \
		echo "Usage: make version VERSION=0.2.0"; \
		exit 1; \
	fi
	@./scripts/bump-version.sh $(VERSION)

# ─── UTILITIES ─────────────────────────────────────────────────────

api-run:
	@mkdir -p $(BIN_DIR)
	@go build -o $(BIN_DIR)/summit $(API_MAIN)
	@./$(BIN_DIR)/summit

cli:
	@mkdir -p $(BIN_DIR)
	@go build -o $(BIN_DIR)/summit-cli $(CLI_MAIN)
	@./$(BIN_DIR)/summit-cli

test:
	@go test ./...

# Remove old binaries, stale sidecars, and previous bundles.
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
	@echo "  RELEASE  → make release"
