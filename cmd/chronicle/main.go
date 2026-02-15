package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"sort"
	"strconv"
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
	branch  = ""
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
	case "dump-fixtures":
		cmdDumpFixtures(os.Args[2:])
	case "version":
		if branch != "" {
			fmt.Printf("claude-chronicle %s (commit: %s, built: %s, branch: %s)\n", version, commit, date, branch)
		} else {
			fmt.Printf("claude-chronicle %s (commit: %s, built: %s)\n", version, commit, date)
		}
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
  serve           Start the web viewer
  list            List discovered sessions
  export          Export a session to a static HTML file
  dump-fixtures   Generate JSON fixtures from real sessions for smoke tests
  version         Print version information

Run 'chronicle <command> -help' for command-specific options.
`)
}

func cmdServe(args []string) {
	flagSet := flag.NewFlagSet("serve", flag.ExitOnError)
	addr := flagSet.String("addr", ":8080", "Listen address")
	dev := flagSet.Bool("dev", false, "Development mode (proxy to Vite)")
	devURL := flagSet.String("dev-url", "http://localhost:5173", "Vite dev server URL")
	strict := flagSet.Bool("strict", false, "Fail if the requested port is unavailable")
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

	ln, err := acquireListener(*addr, *strict)
	if err != nil {
		log.Fatalf("Failed to bind port: %v", err)
	}

	server := api.NewServer(webFS, *dev, *devURL, api.BuildInfo{
		Version: version,
		Commit:  commit,
		Date:    date,
		Branch:  branch,
	})

	startSessionWarmup()

	// Start filesystem watcher for real-time updates
	if err := server.StartWatching(session.ClaudeProjectsDir()); err != nil {
		log.Printf("Warning: filesystem watching unavailable: %v", err)
	} else {
		log.Println("Filesystem watcher started")
	}
	defer server.Close()

	log.Printf("Claude Chronicle server starting on %s", ln.Addr())

	// Auto-open browser using the actual bound port
	if !*dev {
		go openBrowser("http://localhost:" + portFromAddr(ln.Addr().String()))
	}

	if err := server.Serve(ln); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}

// startSessionWarmup primes discovery cache so first UI load is less likely
// to block on a full filesystem scan.
func startSessionWarmup() {
	go func() {
		start := time.Now()
		if _, err := session.DiscoverSessions(); err != nil {
			log.Printf("Session warm-up skipped: %v", err)
			return
		}
		log.Printf("Session warm-up completed in %s", time.Since(start).Round(time.Millisecond))
	}()
}

// parsePort extracts the numeric port from an address string like ":8080" or "localhost:8080".
func parsePort(addr string) (int, error) {
	_, portStr, err := net.SplitHostPort(addr)
	if err != nil {
		return 0, fmt.Errorf("invalid address %q: %w", addr, err)
	}
	port, err := strconv.Atoi(portStr)
	if err != nil {
		return 0, fmt.Errorf("invalid port %q: %w", portStr, err)
	}
	return port, nil
}

// portFromAddr extracts just the port portion from an address like "[::]:8080" or "0.0.0.0:8080".
func portFromAddr(addr string) string {
	_, port, err := net.SplitHostPort(addr)
	if err != nil {
		return addr
	}
	return port
}

// acquireListener tries to bind the requested address. If strict is false and the port is
// busy, it increments the port up to maxAttempts times.
func acquireListener(addr string, strict bool) (net.Listener, error) {
	const maxAttempts = 10

	ln, err := net.Listen("tcp", addr)
	if err == nil {
		return ln, nil
	}
	if strict {
		return nil, fmt.Errorf("port %s is unavailable (strict mode): %w", addr, err)
	}

	port, parseErr := parsePort(addr)
	if parseErr != nil {
		return nil, fmt.Errorf("cannot auto-find port: %w", parseErr)
	}

	host, _, _ := net.SplitHostPort(addr)

	for i := 1; i < maxAttempts; i++ {
		nextPort := port + i
		nextAddr := net.JoinHostPort(host, strconv.Itoa(nextPort))
		ln, err = net.Listen("tcp", nextAddr)
		if err == nil {
			log.Printf("Port %s in use, using %s", addr, nextAddr)
			return ln, nil
		}
	}

	return nil, fmt.Errorf("could not find an available port after %d attempts starting from %s", maxAttempts, addr)
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

func cmdDumpFixtures(args []string) {
	flagSet := flag.NewFlagSet("dump-fixtures", flag.ExitOnError)
	dir := flagSet.String("dir", "", "Session directory (default: Claude projects dir)")
	out := flagSet.String("out", filepath.Join("web", "src", "test", "fixtures", "smoke"), "Output directory for JSON fixtures")
	max := flagSet.Int("max", 50, "Maximum number of fixtures to generate")
	flagSet.Parse(args)

	sessionDir := *dir
	if sessionDir == "" {
		sessionDir = session.ClaudeProjectsDir()
	}

	// Collect all .jsonl files
	type fileEntry struct {
		path    string
		modTime time.Time
		size    int64
	}
	var files []fileEntry

	filepath.Walk(sessionDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if !info.IsDir() && filepath.Ext(path) == ".jsonl" {
			files = append(files, fileEntry{
				path:    path,
				modTime: info.ModTime(),
				size:    info.Size(),
			})
		}
		return nil
	})

	if len(files) == 0 {
		log.Fatalf("No .jsonl files found in %s", sessionDir)
	}

	// Sort by mod time descending (newest first)
	sort.Slice(files, func(i, j int) bool {
		return files[i].modTime.After(files[j].modTime)
	})

	// Limit count
	if len(files) > *max {
		files = files[:*max]
	}

	// Create output directory
	if err := os.MkdirAll(*out, 0755); err != nil {
		log.Fatalf("Error creating output directory: %v", err)
	}

	const maxFileSize = 10 * 1024 * 1024 // 10 MB
	const maxMessages = 200
	const keepEdge = 100 // keep first N + last N when truncating

	generated := 0
	for _, f := range files {
		if f.size > maxFileSize {
			continue
		}

		parsed, err := session.ParseFile(f.path)
		if err != nil {
			log.Printf("Skipping %s: %v", filepath.Base(f.path), err)
			continue
		}

		// Truncate long sessions: keep first 100 + last 100 messages
		if len(parsed.Messages) > maxMessages {
			first := parsed.Messages[:keepEdge]
			last := parsed.Messages[len(parsed.Messages)-keepEdge:]
			truncated := make([]session.Message, 0, keepEdge*2)
			truncated = append(truncated, first...)
			truncated = append(truncated, last...)
			parsed.Messages = truncated
		}

		// Use the session ID (filename without extension) as the fixture name
		baseName := strings.TrimSuffix(filepath.Base(f.path), ".jsonl")
		outPath := filepath.Join(*out, baseName+".json")

		data, err := json.Marshal(parsed)
		if err != nil {
			log.Printf("Skipping %s: marshal error: %v", baseName, err)
			continue
		}

		if err := os.WriteFile(outPath, data, 0644); err != nil {
			log.Printf("Error writing %s: %v", outPath, err)
			continue
		}

		generated++
	}

	fmt.Printf("Generated %d fixtures in %s\n", generated, *out)
}
