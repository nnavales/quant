.PHONY: all build run clean help

all: help

build:
	@mkdir -p ./bin
	@go build -o ./bin/summit ./api/cmd/main.go

api: build
	@./bin/summit 

client: 
	@cd app && WEBKIT_DISABLE_COMPOSITING_MODE=1 GDK_BACKEND=x11 bun run tauri dev 

clean:
	@rm -rf ./bin/*

test:
	@go test ./...

dev: 
	@bash -c "air & cd app && WEBKIT_DISABLE_COMPOSITING_MODE=1 GDK_BACKEND=x11 bun run tauri dev"

dev-release:
	@bash -c "air & cd app && WEBKIT_DISABLE_COMPOSITING_MODE=1 GDK_BACKEND=x11 bunx tauri dev --release"

help:
	@echo "Usage: make [OPTION]..."
	@echo ""
	@echo "  build		Build the Go backend"
	@echo "  run     	Build and run the Go backend"
	@echo "  clean   	Remove all build artifacts from bin/"
	@echo "  test    	Run all tests"
	@echo "  dev		Runs backend with live reloading mode"
	@echo "  help    	Show this help message"

