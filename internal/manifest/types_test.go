package manifest

import (
	"testing"
)

func TestValidate_ValidEdits(t *testing.T) {
	tests := []struct {
		name string
		edit Edit
	}{
		{"delete", Edit{Type: "delete", BlockID: "b1"}},
		{"collapse", Edit{Type: "collapse", BlockIDs: []string{"b1", "b2"}, Summary: "grouped"}},
		{"annotate", Edit{Type: "annotate", AfterBlockID: "b1", Content: "note"}},
		{"editText", Edit{Type: "editText", BlockID: "b1", NewContent: "updated"}},
		{"reorder", Edit{Type: "reorder", BlockIDs: []string{"b1", "b2"}}},
		{"reorder blockId/afterBlockId", Edit{Type: "reorder", BlockID: "b1", AfterBlockID: "b2"}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if err := tt.edit.Validate(); err != nil {
				t.Errorf("expected valid, got error: %v", err)
			}
		})
	}
}

func TestValidate_InvalidType(t *testing.T) {
	edit := Edit{Type: "invalid"}
	err := edit.Validate()
	if err == nil {
		t.Fatal("expected error for invalid type")
	}
	if err.Error() != `invalid edit type: "invalid"` {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestValidate_EmptyType(t *testing.T) {
	edit := Edit{}
	err := edit.Validate()
	if err == nil {
		t.Fatal("expected error for empty type")
	}
}

func TestValidate_MissingRequiredFields(t *testing.T) {
	tests := []struct {
		name string
		edit Edit
	}{
		{"delete missing blockId", Edit{Type: "delete"}},
		{"collapse missing blockIds", Edit{Type: "collapse", Summary: "s"}},
		{"collapse empty blockIds", Edit{Type: "collapse", BlockIDs: []string{}, Summary: "s"}},
		{"collapse missing summary", Edit{Type: "collapse", BlockIDs: []string{"b1"}}},
		{"annotate missing afterBlockId", Edit{Type: "annotate", Content: "c"}},
		{"annotate missing content", Edit{Type: "annotate", AfterBlockID: "b1"}},
		{"editText missing blockId", Edit{Type: "editText", NewContent: "c"}},
		{"editText missing newContent", Edit{Type: "editText", BlockID: "b1"}},
		{"reorder missing blockIds", Edit{Type: "reorder"}},
		{"reorder empty blockIds", Edit{Type: "reorder", BlockIDs: []string{}}},
		{"reorder blockId missing afterBlockId", Edit{Type: "reorder", BlockID: "b1"}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if err := tt.edit.Validate(); err == nil {
				t.Error("expected validation error, got nil")
			}
		})
	}
}
