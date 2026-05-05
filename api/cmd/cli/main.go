package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/nnavales/summit/api/cli"
	"github.com/nnavales/summit/api/config"
)

func main() {
	dir, err := config.AppDataDir()
	if err != nil {
		log.Fatal(err)
	}

	cfg, err := config.ReadConfigFile(filepath.Join(dir, "config.json"))
	if err != nil {
		log.Fatal(err)
	}

	binName := cfg.Name + "-cli"

	args := os.Args[1:]

	if len(args) == 0 || args[0] == "help" || args[0] == "--help" {
		if len(args) >= 2 && args[0] == "help" && args[1] != "help" && args[1] != "--help" {
			cli.PrintResourceHelp(binName, args[1])
		} else {
			cli.PrintHelp(binName)
		}
		return
	}

	if len(args) == 1 {
		if cli.ResourceExists(args[0]) {
			cli.PrintResourceHelp(binName, args[0])
			return
		}
		fmt.Printf("usage: %s <resource> <action> [<args>]\n", binName)
		return
	}

	if args[1] == "help" || args[1] == "--help" {
		cli.PrintResourceHelp(binName, args[0])
		return
	}

	key := args[0] + ":" + args[1]
	cmd, ok := cli.Commands[key]
	if !ok {
		fmt.Printf("%s %s %s: unknown command\n", binName, args[0], args[1])
		fmt.Printf("Run '%s help' for usage\n", binName)
		return
	}

	if err := cmd.Run(cfg, args[2:]); err != nil {
		fmt.Println(err)
	}
}
