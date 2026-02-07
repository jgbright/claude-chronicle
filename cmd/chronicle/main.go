package main

import (
	"flag"
	"fmt"
	"io/fs"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"sort"
	"strings"
	"text/tabwriter"
	"time"

	chronicle "github.com/jgbright/claude-chronicle"
	"github.com/jgbright/claude-chronicle/internal/api"
	"github.com/jgbright/claude-chronicle/internal/export"
	"github.com/jgbright/claude-chronicle/internal/manifest"
	"github.com/jgbright/claude-chronicle/internal/session"
)

var (
	version = "dev"
	commit  = "none"
	date    = "unknown"
)

func main() {
	if len(os.Args) < 2 {
		printUsage()
		os.Exit(1)
	}

	switch os.Args[1] {
	case "serve":
		cmdServe(os.Args[2:])
	case "list":
		cmdList(os.Args[2:])
	case "export":
		cmdExport(os.Args[2:])
	case "version":
		fmt.Printf("claude-chronicle %s (commit: %s, built: %s)\n", version, commit, date)
	default:
		fmt.Fprintf(os.Stderr, "Unknown command: %s\n", os.Args[1])
		printUsage()
		os.Exit(1)
	}
}

func printUsage() {
	fmt.Fprintf(os.Stderr, `Claude Chronicle - Share your Claude Code sessions

Usage:
  chronicle <command> [options]

Commands:
  serve     Start the web viewer
  list      List discovered sessions
  export    Export a session to a static HTML file
  version   Print version information

Run 'chronicle <command> -help' for command-specific options.
`)
}

func cmdServe(args []string) {
	flagSet := flag.NewFlagSet("serve", flag.ExitOnError)
	addr := flagSet.String("addr", ":8080", "Listen address")
	dev := flagSet.Bool("dev", false, "Development mode (proxy to Vite)")
	devURL := flagSet.String("dev-url", "http://localhost:5173", "Vite dev server URL")
	flagSet.Parse(args)

	var webFS fs.FS
	if *dev {
		log.Println("Running in development mode")
		webFS = nil // Not used in dev mode
	} else {
		var err error
		webFS, err = getWebFS()
		if err != nil {
			log.Fatalf("Failed to load embedded web assets: %v", err)
		}
	}

	server := api.NewServer(webFS, *dev, *devURL)
	log.Printf("Claude Chronicle server starting on %s", *addr)

	// Auto-open browser
	if !*dev {
		go openBrowser("http://localhost" + *addr)
	}

	if err := server.ListenAndServe(*addr); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}

func cmdList(args []string) {
	flag.NewFlagSet("list", flag.ExitOnError).Parse(args)

	sessions, err := session.DiscoverSessions()
	if err != nil {
		log.Fatalf("Error discovering sessions: %v", err)
	}

	sort.Slice(sessions, func(i, j int) bool {
		return sessions[i].ModTime.After(sessions[j].ModTime)
	})

	w := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)
	fmt.Fprintf(w, "ID\tPROJECT\tMODIFIED\tSIZE\n")
	for _, s := range sessions {
		size := formatSize(s.SizeBytes)
		age := formatAge(s.ModTime)
		shortID := s.ID
		if len(shortID) > 8 {
			shortID = shortID[:8]
		}
		fmt.Fprintf(w, "%s\t%s\t%s\t%s\n", shortID+"...", s.ProjectName, age, size)
	}
	w.Flush()
}

func cmdExport(args []string) {
	flagSet := flag.NewFlagSet("export", flag.ExitOnError)
	sessionID := flagSet.String("session", "", "Session ID to export")
	filePath := flagSet.String("file", "", "Path to JSONL session file (bypasses discovery)")
	theme := flagSet.String("theme", "claude", "Theme (claude or copilot)")
	output := flagSet.String("o", "", "Output file path")
	flagSet.Parse(args)

	if *sessionID == "" && *filePath == "" {
		fmt.Fprintf(os.Stderr, "Error: -session or -file is required\n")
		flagSet.Usage()
		os.Exit(1)
	}

	var parsed *session.ParsedSession
	var m *manifest.Manifest

	if *filePath != "" {
		// Direct file mode — bypass discovery and manifests
		var err error
		parsed, err = session.ParseFile(*filePath)
		if err != nil {
			log.Fatalf("Error parsing session file: %v", err)
		}
		// Populate info from file metadata
		fi, err := os.Stat(*filePath)
		if err != nil {
			log.Fatalf("Error reading file info: %v", err)
		}
		base := filepath.Base(*filePath)
		name := strings.TrimSuffix(base, filepath.Ext(base))
		parsed.Info = session.SessionInfo{
			ID:          name,
			ProjectName: "export",
			FilePath:    *filePath,
			ModTime:     fi.ModTime(),
			SizeBytes:   fi.Size(),
		}
	} else {
		// Discovery mode
		info, err := session.FindSession(*sessionID)
		if err != nil {
			log.Fatalf("Error finding session: %v", err)
		}
		if info == nil {
			log.Fatalf("Session not found: %s", *sessionID)
		}

		parsed, err = session.ParseFile(info.FilePath)
		if err != nil {
			log.Fatalf("Error parsing session: %v", err)
		}
		parsed.Info = *info

		// Load manifest
		m, _ = manifest.Load(*sessionID)
	}

	data := &export.ExportData{
		Session:  parsed,
		Manifest: m,
		Theme:    *theme,
	}

	html, err := export.GenerateHTML(chronicle.ExportTemplate, data)
	if err != nil {
		log.Fatalf("Error generating export: %v", err)
	}

	outPath := *output
	if outPath == "" {
		id := parsed.Info.ID
		if len(id) > 8 {
			id = id[:8]
		}
		outPath = fmt.Sprintf("chronicle-%s.html", id)
	}

	if err := os.WriteFile(outPath, html, 0644); err != nil {
		log.Fatalf("Error writing output: %v", err)
	}

	fmt.Printf("Exported to %s (%s)\n", outPath, formatSize(int64(len(html))))
}

func getWebFS() (fs.FS, error) {
	return fs.Sub(chronicle.WebDistFS, "web/dist")
}

func formatSize(bytes int64) string {
	if bytes < 1024 {
		return fmt.Sprintf("%d B", bytes)
	}
	if bytes < 1024*1024 {
		return fmt.Sprintf("%.1f KB", float64(bytes)/1024)
	}
	return fmt.Sprintf("%.1f MB", float64(bytes)/(1024*1024))
}

func openBrowser(url string) {
	time.Sleep(500 * time.Millisecond)
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	case "darwin":
		cmd = exec.Command("open", url)
	default:
		cmd = exec.Command("xdg-open", url)
	}
	cmd.Run()
}

func formatAge(t time.Time) string {
	d := time.Since(t)
	if d < time.Minute {
		return "just now"
	}
	if d < time.Hour {
		return fmt.Sprintf("%dm ago", int(d.Minutes()))
	}
	if d < 24*time.Hour {
		return fmt.Sprintf("%dh ago", int(d.Hours()))
	}
	return fmt.Sprintf("%dd ago", int(d.Hours()/24))
}
