package usermgnt

import "errors"

const (
	AccountTypeUser = "user"
	AccountTypeApp  = "app"
)

// AccountInfo describes an ISF account (user or application).
type AccountInfo struct {
	ID    string   `json:"id"`
	Type  string   `json:"type"`
	Name  string   `json:"name"`
	Roles []string `json:"roles,omitempty"`
}

// ErrSubjectNotFound is returned when a token subject cannot be resolved as user or app via user-management.
var ErrSubjectNotFound = errors.New("token subject not found in user management")
