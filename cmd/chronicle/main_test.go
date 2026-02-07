package main

import (
	"testing"
	"time"
)

func TestFormatSize(t *testing.T) {
	tests := []struct {
		name  string
		bytes int64
		want  string
	}{
		{
			name:  "zero bytes",
			bytes: 0,
			want:  "0 B",
		},
		{
			name:  "small bytes",
			bytes: 512,
			want:  "512 B",
		},
		{
			name:  "exactly 1023 bytes",
			bytes: 1023,
			want:  "1023 B",
		},
		{
			name:  "exactly 1 KB",
			bytes: 1024,
			want:  "1.0 KB",
		},
		{
			name:  "kilobytes",
			bytes: 5120,
			want:  "5.0 KB",
		},
		{
			name:  "fractional KB",
			bytes: 1536,
			want:  "1.5 KB",
		},
		{
			name:  "just under 1 MB",
			bytes: 1024*1024 - 1,
			want:  "1024.0 KB",
		},
		{
			name:  "exactly 1 MB",
			bytes: 1024 * 1024,
			want:  "1.0 MB",
		},
		{
			name:  "several MB",
			bytes: 5 * 1024 * 1024,
			want:  "5.0 MB",
		},
		{
			name:  "fractional MB",
			bytes: int64(1.5 * 1024 * 1024),
			want:  "1.5 MB",
		},
		{
			name:  "large file",
			bytes: 100 * 1024 * 1024,
			want:  "100.0 MB",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := formatSize(tt.bytes)
			if got != tt.want {
				t.Errorf("formatSize(%d) = %q, want %q", tt.bytes, got, tt.want)
			}
		})
	}
}

func TestFormatAge(t *testing.T) {
	tests := []struct {
		name   string
		offset time.Duration
		want   string
	}{
		{
			name:   "just now (seconds ago)",
			offset: 30 * time.Second,
			want:   "just now",
		},
		{
			name:   "minutes ago",
			offset: 5 * time.Minute,
			want:   "5m ago",
		},
		{
			name:   "59 minutes ago",
			offset: 59 * time.Minute,
			want:   "59m ago",
		},
		{
			name:   "1 hour ago",
			offset: 90 * time.Minute,
			want:   "1h ago",
		},
		{
			name:   "hours ago",
			offset: 5 * time.Hour,
			want:   "5h ago",
		},
		{
			name:   "23 hours ago",
			offset: 23 * time.Hour,
			want:   "23h ago",
		},
		{
			name:   "1 day ago",
			offset: 25 * time.Hour,
			want:   "1d ago",
		},
		{
			name:   "several days ago",
			offset: 72 * time.Hour,
			want:   "3d ago",
		},
		{
			name:   "many days ago",
			offset: 30 * 24 * time.Hour,
			want:   "30d ago",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			testTime := time.Now().Add(-tt.offset)
			got := formatAge(testTime)
			if got != tt.want {
				t.Errorf("formatAge(now - %v) = %q, want %q", tt.offset, got, tt.want)
			}
		})
	}
}
