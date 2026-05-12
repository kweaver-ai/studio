package usermgnt

import "context"

// UserMgntInterface 定义用户管理服务接口
type UserMgntInterface interface {
	// Health 健康检查
	Health() error
	// AccountInfo 按类型获取账号信息
	AccountInfo(ctx context.Context, id, accountType string) (*AccountInfo, error)
	// GetAccountNames 批量解析名称（v2/names）
	GetAccountNames(ctx context.Context, accounts []*AccountInfo) error
	// ResolveSubject 从 OAuth token sub 解析为 user 或 app（Auth 中间件）
	ResolveSubject(ctx context.Context, sub string) (*AccountInfo, error)
}

// 确保 UserMgnt 实现了 UserMgntInterface
var _ UserMgntInterface = (*UserMgnt)(nil)
