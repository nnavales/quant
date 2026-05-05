package cli

import (
	"fmt"
	"sort"
)

var resourceDescriptions = map[string]string{
	"account":     "Manage accounts",
	"asset":       "Manage assets (net worth)",
	"backup":      "Export and import data",
	"category":    "Manage categories",
	"subcategory": "Manage subcategories",
	"channel":     "Manage channels",
	"daemon":      "Manage background service",
	"historical":  "Manage historical entries",
	"installment": "Manage installment groups",
	"networth":    "Net worth summary",
	"economic":    "Economic indicators",
	"dashboard":   "Dashboard KPIs and metrics",
	"config":      "User configuration",
}

func ResourceExists(name string) bool {
	_, ok := resourceDescriptions[name]
	return ok
}

func PrintHelp(binName string) {
	fmt.Printf("Usage:  %s <resource> <command> [<args>]\n\n", binName)
	fmt.Println("Personal finance CLI")
	fmt.Println()

	resources := make([]string, 0, len(resourceDescriptions))
	for r := range resourceDescriptions {
		resources = append(resources, r)
	}
	sort.Strings(resources)

	fmt.Println("Resources:")
	for _, r := range resources {
		fmt.Printf("  %-12s %s\n", r, resourceDescriptions[r])
	}

	fmt.Printf("\nRun '%s help <resource>' for command details\n", binName)
	fmt.Println()
	fmt.Println("Create and update commands accept arguments as:")
	fmt.Println("  key=value          Field-value pairs")
	fmt.Println("  --body <json>      JSON body string")
	fmt.Println("  --file <path>      JSON file path")
	fmt.Println()
	fmt.Println("Examples:")
	fmt.Printf("  %s transaction create description=\"Groceries\" date=2026-05-13 type=expense ...\n", binName)
	fmt.Printf("  %s transaction create --body '{\"description\":\"Groceries\",\"date\":\"2026-05-13\",...}'\n", binName)
}

func PrintResourceHelp(binName, resource string) {
	desc, ok := resourceDescriptions[resource]
	if !ok {
		fmt.Printf("Unknown resource: %s\n", resource)
		PrintHelp(binName)
		return
	}

	if resource == "daemon" {
		fmt.Printf("Usage:  %s daemon <command>\n\n", binName)
		fmt.Printf("%s\n\n", desc)
		fmt.Println("Commands:")
		fmt.Println("  install      Install and start the background service")
		fmt.Println("  uninstall    Stop and remove the background service")
		fmt.Println("  start        Start the background service")
		fmt.Println("  stop         Stop the background service")
		fmt.Println("  status       Show service status")
		fmt.Println("  logs         Show service logs")
		return
	}

	fmt.Printf("Usage:  %s %s <command> [<args>]\n\n", binName, resource)
	fmt.Printf("%s\n\n", desc)
	fmt.Println("Commands:")

	type cmdEntry struct {
		action      string
		description string
		flags       string
	}
	var cmds []cmdEntry
	for _, cmd := range Commands {
		if cmd.Resource == resource {
			cmds = append(cmds, cmdEntry{cmd.Action, cmd.Description, cmd.Flags})
		}
	}
	sort.Slice(cmds, func(i, j int) bool {
		return cmds[i].action < cmds[j].action
	})

	maxLen := 0
	for _, cmd := range cmds {
		if len(cmd.action) > maxLen {
			maxLen = len(cmd.action)
		}
	}
	if maxLen < 8 {
		maxLen = 8
	}

	for _, cmd := range cmds {
		fmt.Printf("  %-*s %s\n", maxLen+2, cmd.action, cmd.description)
		if cmd.flags != "" {
			fmt.Printf("  %-*s Flags: %s\n", maxLen+2, "", cmd.flags)
		}
	}

	hasBody := false
	for _, cmd := range Commands {
		if cmd.Resource == resource && cmd.HasBody {
			hasBody = true
			break
		}
	}
	if hasBody {
		fmt.Println()
		fmt.Println("Arguments:")
		fmt.Println("  key=value          Field-value pairs")
		fmt.Println("  --body <json>      JSON body string")
		fmt.Println("  --file <path>      JSON file path")
	}
}
