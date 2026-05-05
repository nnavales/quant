.PHONY: all build run clean help

include .env
export

APP_VERSION ?= dev
LDFLAGS=-ldflags="-s -w -X main.version=$(APP_VERSION)"

BIN_DIR=bin
BUILD_DIR=build

API_MAIN=./api/cmd/api/main.go
CLI_MAIN=./api/cmd/cli/main.go

PLATFORMS=linux/amd64 windows/amd64 darwin/amd64 darwin/arm64

all: help

api-run:
	@mkdir -p $(BIN_DIR)
	@go build -o $(BIN_DIR)/summit $(API_MAIN)
	@./$(BIN_DIR)/summit

cli:
	@mkdir -p $(BIN_DIR)
	@go build -o $(BIN_DIR)/summit-cli $(CLI_MAIN)
	@./$(BIN_DIR)/summit-cli

client: 
	@cd app && WEBKIT_DISABLE_COMPOSITING_MODE=1 GDK_BACKEND=x11 bun run tauri dev 

test:
	@go test ./...

dev: 
	@bash -c "APP_ENV=dev air & cd app && APP_ENV=dev WEBKIT_DISABLE_COMPOSITING_MODE=1 GDK_BACKEND=x11 bun run tauri dev"

dev-release:
	@bash -c "air & cd app && WEBKIT_DISABLE_COMPOSITING_MODE=1 GDK_BACKEND=x11 bunx tauri dev --release"

build:
	@mkdir -p $(BUILD_DIR)
	@for platform in $(PLATFORMS); do \
		GOOS=$${platform%/*}; \
		GOARCH=$${platform#*/}; \
		out_api=$(BUILD_DIR)/summit-api-$$GOOS-$$GOARCH; \
		out_cli=$(BUILD_DIR)/summit-cli-$$GOOS-$$GOARCH; \
		if [ $$GOOS = "windows" ]; then \
			out_api=$$out_api.exe; \
			out_cli=$$out_cli.exe; \
		fi; \
		echo "Building API $$out_api"; \
		CGO_ENABLED=0 GOOS=$$GOOS GOARCH=$$GOARCH go build $(LDFLAGS) -o $$out_api $(API_MAIN); \
		echo "Building CLI $$out_cli"; \
		CGO_ENABLED=0 GOOS=$$GOOS GOARCH=$$GOARCH go build $(LDFLAGS) -o $$out_cli $(CLI_MAIN); \
	done

clean:
	rm -rf $(BIN_DIR) $(BUILD_DIR)

help:
	@echo "Targets:"
	@echo "  api            Run API"
	@echo "  cli            Run CLI"
	@echo "  client         Run Tauri client"
	@echo "  dev            Dev mode (air + client)"
	@echo "  dev-release    Dev release mode"
	@echo "  test           Run tests"
	@echo "  build			Build multi-platform binaries"
	@echo "  clean          Remove all build artifacts"
