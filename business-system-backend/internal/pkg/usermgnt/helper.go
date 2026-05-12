package usermgnt

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"system-backend/internal/config"

	"resty.dev/v3"
)

type UserMgnt struct {
	cli *resty.Client
}

type v1UserRow struct {
	ID      string   `json:"id"`
	Name    string   `json:"name"`
	Roles   []string `json:"roles"`
	Account string   `json:"account"`
}

type namesResponse struct {
	UserNames []struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	} `json:"user_names"`
	AppNames []struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	} `json:"app_names"`
}

func NewUserMgnt(app *config.AppConfig) *UserMgnt {
	return &UserMgnt{
		cli: resty.New().SetBaseURL(app.DepsConfig.UserMgntBaseURL),
	}
}

func (u *UserMgnt) Health() error {
	return nil
}

// AccountInfo loads one account by id and type (user: v1, app: v2/names).
func (h *UserMgnt) AccountInfo(ctx context.Context, id, accountType string) (*AccountInfo, error) {
	if id == "-" {
		return &AccountInfo{
			ID:    "-",
			Name:  "-",
			Type:  AccountTypeUser,
			Roles: []string{},
		}, nil
	}
	switch accountType {
	case AccountTypeUser:
		return h.fetchUserV1(ctx, id)
	case AccountTypeApp:
		names, err := h.postNames(ctx, []string{}, []string{id})
		if err != nil {
			return nil, err
		}
		for _, a := range names.AppNames {
			if a.ID == id {
				return &AccountInfo{ID: id, Type: AccountTypeApp, Name: a.Name, Roles: nil}, nil
			}
		}
		return nil, fmt.Errorf("app account not found")
	default:
		return nil, fmt.Errorf("invalid account type: %s", accountType)
	}
}

// GetAccountNames fills Name on each entry; Type must be set to user or app. Uses v2/names batch API.
func (h *UserMgnt) GetAccountNames(ctx context.Context, accounts []*AccountInfo) error {
	if len(accounts) == 0 {
		return nil
	}
	userSeen := map[string]struct{}{}
	appSeen := map[string]struct{}{}
	userIDs := make([]string, 0)
	appIDs := make([]string, 0)
	for _, a := range accounts {
		if a == nil || a.ID == "" || a.ID == "-" {
			continue
		}
		switch a.Type {
		case AccountTypeUser:
			if _, ok := userSeen[a.ID]; !ok {
				userSeen[a.ID] = struct{}{}
				userIDs = append(userIDs, a.ID)
			}
		case AccountTypeApp:
			if _, ok := appSeen[a.ID]; !ok {
				appSeen[a.ID] = struct{}{}
				appIDs = append(appIDs, a.ID)
			}
		}
	}
	if len(userIDs) == 0 && len(appIDs) == 0 {
		return nil
	}
	names, err := h.postNames(ctx, userIDs, appIDs)
	if err != nil {
		return err
	}
	userNameByID := map[string]string{}
	for _, u := range names.UserNames {
		userNameByID[u.ID] = u.Name
	}
	appNameByID := map[string]string{}
	for _, a := range names.AppNames {
		appNameByID[a.ID] = a.Name
	}
	for _, a := range accounts {
		if a == nil {
			continue
		}
		switch a.Type {
		case AccountTypeUser:
			if n, ok := userNameByID[a.ID]; ok {
				a.Name = n
			}
		case AccountTypeApp:
			if n, ok := appNameByID[a.ID]; ok {
				a.Name = n
			}
		}
	}
	return nil
}

// ResolveSubject resolves an OAuth subject (Hydra sub) to user or app using v2/names, then loads roles for users via v1.
func (h *UserMgnt) ResolveSubject(ctx context.Context, sub string) (*AccountInfo, error) {
	if sub == "" {
		return nil, ErrSubjectNotFound
	}
	if sub == "-" {
		return &AccountInfo{
			ID:    "-",
			Name:  "-",
			Type:  AccountTypeUser,
			Roles: []string{},
		}, nil
	}
	names, err := h.postNames(ctx, []string{sub}, []string{sub})
	if err != nil {
		return nil, err
	}
	var isUser, isApp bool
	var userName, appName string
	for _, u := range names.UserNames {
		if u.ID == sub {
			isUser = true
			userName = u.Name
			break
		}
	}
	for _, a := range names.AppNames {
		if a.ID == sub {
			isApp = true
			appName = a.Name
			break
		}
	}
	if isUser && isApp {
		// Extremely unlikely; prefer user for role semantics.
		isApp = false
	}
	switch {
	case isUser:
		info, err := h.fetchUserV1(ctx, sub)
		if err != nil {
			return nil, err
		}
		if userName != "" {
			info.Name = userName
		}
		return info, nil
	case isApp:
		return &AccountInfo{
			ID:    sub,
			Type:  AccountTypeApp,
			Name:  appName,
			Roles: nil,
		}, nil
	default:
		return nil, ErrSubjectNotFound
	}
}

func (h *UserMgnt) fetchUserV1(ctx context.Context, uid string) (*AccountInfo, error) {
	var result []v1UserRow
	uri := fmt.Sprintf(
		"/api/user-management/v1/users/%s/%s",
		url.PathEscape(uid),
		url.PathEscape(strings.Join([]string{"account", "name", "roles"}, ",")),
	)
	resp, err := h.cli.R().SetContext(ctx).SetResult(&result).Get(uri)
	if err != nil {
		return nil, err
	}
	if resp.IsError() {
		return nil, fmt.Errorf("get userinfo failed: status=%d body=%s", resp.StatusCode(), resp.String())
	}
	if len(result) == 0 {
		return nil, fmt.Errorf("userinfo not found")
	}
	row := result[0]
	return &AccountInfo{
		ID:    row.ID,
		Type:  AccountTypeUser,
		Name:  row.Name,
		Roles: row.Roles,
	}, nil
}

func (h *UserMgnt) postNames(ctx context.Context, userIDs, appIDs []string) (*namesResponse, error) {
	body := map[string]any{
		"method":   http.MethodGet,
		"user_ids": userIDs,
		"app_ids":  appIDs,
		"strict":   false,
	}
	resp, err := h.cli.R().
		SetContext(ctx).
		SetBody(body).
		SetHeader("Content-Type", "application/json").
		Post("/api/user-management/v2/names")
	if err != nil {
		return nil, err
	}
	if resp.IsError() {
		return nil, fmt.Errorf("post names failed: status=%d body=%s", resp.StatusCode(), resp.String())
	}
	var out namesResponse
	raw := resp.Bytes()
	if len(raw) == 0 {
		raw = []byte(resp.String())
	}
	if err := json.Unmarshal(raw, &out); err != nil {
		return nil, fmt.Errorf("unmarshal names response: %w", err)
	}
	return &out, nil
}
