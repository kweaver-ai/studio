package config

import (
	"os"
	"strings"
)

// LocalConfig provides default configuration for local development
// These values will be used if environment variables are not set
// Priority: Environment Variables > LocalConfig > Default in struct tags
//
// 🔧 HOW TO MODIFY LOCAL CONFIGURATION:
// 1. Edit this file (internal/config/local.go)
// 2. Modify the values in GetLocalConfig() function below
// 3. Restart the service
//
// 📝 Example: Change database password
//
//	DBPassword: "your_new_password",
type LocalConfig struct {
	// Server
	Port string
	Name string

	// Database - 修改这里配置数据库连接信息
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBType     string

	// Redis - Cluster Mode
	RedisClusterMode string // standalone, master-slave, sentinel

	// Redis - Standalone
	RedisHost     string
	RedisPort     string
	RedisUser     string
	RedisPassword string
	RedisDB       int

	// Redis - Master-Slave Read
	RedisReadHost     string
	RedisReadPort     string
	RedisReadUser     string
	RedisReadPassword string

	// Redis - Master-Slave Write
	RedisWriteHost     string
	RedisWritePort     string
	RedisWriteUser     string
	RedisWritePassword string

	// Redis - Sentinel
	RedisSentinelAddrs    []string
	RedisSentinelMaster   string
	RedisSentinelUser     string
	RedisSentinelPassword string

	// Crypto
	CryptoAESKey string

	// Log
	LogLevel     string
	LogFormat    string
	LogEnableSQL bool
}

// GetLocalConfig returns the local development configuration
// 🔧 修改数据库和 Redis 连接信息请编辑这个函数
func GetLocalConfig() *LocalConfig {
	return &LocalConfig{
		// Server Configuration
		Port: "8080",
		Name: "oss-gateway",

		// ==========================================
		// 数据库配置 - 修改这里的值
		// ==========================================
		DBHost:     "localhost", // 数据库地址
		DBPort:     "3306",      // 数据库端口
		DBUser:     "root",      // 数据库用户名
		DBPassword: "",          // 数据库密码 ⬅️ 修改这里
		DBName:     "adp",       // 数据库名称
		DBType:     "MYSQL",     // 数据库类型: MYSQL, DM8, KDB9
		// ==========================================
		// Redis 配置 - 修改这里的值
		// 服务内部会根据 RedisClusterMode 的值自动选择使用哪些配置
		// ==========================================
		RedisClusterMode: "standalone", // 模式: standalone, master-slave, sentinel

		// Redis Standalone Mode (单机模式)
		RedisHost:     "localhost", // Redis 地址
		RedisPort:     "6379",      // Redis 端口
		RedisUser:     "",          // Redis 用户名（可选）
		RedisPassword: "",          // Redis 密码（可选）
		RedisDB:       2,           // Redis 数据库编号

		// Redis Master-Slave Mode (主从模式)
		RedisReadHost:      "localhost", // 读节点地址
		RedisReadPort:      "6379",      // 读节点端口
		RedisReadUser:      "",          // 读节点用户名（可选）
		RedisReadPassword:  "",          // 读节点密码（可选）
		RedisWriteHost:     "localhost", // 写节点地址
		RedisWritePort:     "6379",      // 写节点端口
		RedisWriteUser:     "",          // 写节点用户名（可选）
		RedisWritePassword: "",          // 写节点密码（可选）

		// Redis Sentinel Mode (哨兵模式)
		RedisSentinelAddrs:    []string{"localhost:26379", "localhost:26380", "localhost:26381"}, // 哨兵地址列表
		RedisSentinelMaster:   "mymaster",                                                        // 主节点名称
		RedisSentinelUser:     "",                                                                // 哨兵用户名（可选）
		RedisSentinelPassword: "",                                                                // 哨兵密码（可选）

		// ==========================================
		// 加密密钥 (必须是32字节)
		// ==========================================
		CryptoAESKey: "k8WVs8pfQae0LhUgevDvPXiYPqYZ8HRM",

		// ==========================================
		// 日志配置
		// ==========================================
		LogLevel:     "debug", // 日志级别: debug, info, warn, error
		LogFormat:    "text",  // 日志格式: text, json
		LogEnableSQL: true,    // 是否打印 SQL 日志
	}
}

// ApplyLocalConfig applies local configuration to environment if not already set
// This allows developers to modify local config without setting environment variables
func ApplyLocalConfig() {
	local := GetLocalConfig()

	// Helper function to set env if not exists
	setEnvIfEmpty := func(key, value string) {
		if value != "" && os.Getenv(key) == "" {
			os.Setenv(key, value)
		}
	}

	// Apply Server Config
	setEnvIfEmpty("PORT", local.Port)
	setEnvIfEmpty("NAME", local.Name)

	// Apply Database Config
	setEnvIfEmpty("RDSHOST", local.DBHost)
	setEnvIfEmpty("RDSPORT", local.DBPort)
	setEnvIfEmpty("RDSUSER", local.DBUser)
	setEnvIfEmpty("RDSPASS", local.DBPassword)
	setEnvIfEmpty("RDSDBNAME", local.DBName)
	setEnvIfEmpty("DB_TYPE", local.DBType)

	// Apply Redis Config
	setEnvIfEmpty("REDISCLUSTERMODE", local.RedisClusterMode)
	setEnvIfEmpty("REDISHOST", local.RedisHost)
	setEnvIfEmpty("REDISPORT", local.RedisPort)
	setEnvIfEmpty("REDISUSER", local.RedisUser)
	setEnvIfEmpty("REDISPASS", local.RedisPassword)

	// Redis DB 固定使用 2 号库
	os.Setenv("REDIS_DB", "2")

	// Master-Slave Mode (主从模式)
	setEnvIfEmpty("REDISREADHOST", local.RedisReadHost)
	setEnvIfEmpty("REDISREADPORT", local.RedisReadPort)
	setEnvIfEmpty("REDISREADUSER", local.RedisReadUser)
	setEnvIfEmpty("REDISREADPASS", local.RedisReadPassword)
	setEnvIfEmpty("REDISWRITEHOST", local.RedisWriteHost)
	setEnvIfEmpty("REDISWRITEPORT", local.RedisWritePort)
	setEnvIfEmpty("REDISWRITEUSER", local.RedisWriteUser)
	setEnvIfEmpty("REDISWRITEPASS", local.RedisWritePassword)

	// Sentinel Mode (哨兵模式)
	if len(local.RedisSentinelAddrs) > 0 && os.Getenv("REDIS_SENTINEL_ADDRS") == "" {
		os.Setenv("REDIS_SENTINEL_ADDRS", strings.Join(local.RedisSentinelAddrs, ","))
	}
	setEnvIfEmpty("SENTINELMASTER", local.RedisSentinelMaster)
	setEnvIfEmpty("SENTINELUSER", local.RedisSentinelUser)
	setEnvIfEmpty("SENTINELPASS", local.RedisSentinelPassword)

	// Apply Crypto Config
	setEnvIfEmpty("CRYPTO_AES_KEY", local.CryptoAESKey)

	// Apply Log Config
	setEnvIfEmpty("LOG_LEVEL", local.LogLevel)
	setEnvIfEmpty("LOG_FORMAT", local.LogFormat)
	if local.LogEnableSQL && os.Getenv("LOG_ENABLE_SQL") == "" {
		os.Setenv("LOG_ENABLE_SQL", "true")
	}
}
