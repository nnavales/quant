package main

import (
	"fmt"
	"log"
	"os"

	"github.com/nnavales/quant/api/cli"
	"github.com/nnavales/quant/api/config"
	"github.com/nnavales/quant/api/daemon"
)

func main() {
	cfg, err := config.ReadConfigFile()
	if err != nil {
		log.Fatal(err)
	}

	binName := cfg.Name + "-cli"

	args := os.Args[1:]

	if len(args) > 0 && args[0] == "daemon" {
		runDaemonCommand(args[1:])
		return
	}

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

func runDaemonCommand(args []string) {
	if len(args) == 0 {
		printDaemonHelp()
		return
	}

	var err error
	switch args[0] {
	case "install":
		err = daemon.Install()
	case "uninstall":
		err = daemon.Uninstall()
	case "start":
		err = daemon.Start()
	case "stop":
		err = daemon.Stop()
	case "status":
		err = daemon.Status()
	case "logs":
		err = daemon.Logs()
	case "help", "--help":
		printDaemonHelp()
		return
	default:
		fmt.Printf("unknown daemon command: %s\n", args[0])
		printDaemonHelp()
		os.Exit(1)
	}

	if err != nil {
		fmt.Printf("Error: %v\n", err)
		os.Exit(1)
	}
}

func printDaemonHelp() {
	fmt.Println("Usage: quant-cli daemon <command>")
	fmt.Println("")
	fmt.Println("Commands:")
	fmt.Println("  install      Install and start the background service")
	fmt.Println("  uninstall    Stop and remove the background service")
	fmt.Println("  start        Start the background service")
	fmt.Println("  stop         Stop the background service")
	fmt.Println("  status       Show service status")
	fmt.Println("  logs         Show service logs")
}
