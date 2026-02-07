package chronicle

import "embed"

//go:embed web/dist/*
var WebDistFS embed.FS

//go:embed web/dist-export/export.html
var ExportTemplate []byte
