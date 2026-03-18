# 接收构建参数，使用内部镜像仓库（解决网络问题）
ARG GO_BUILD_IMAGE=golang:1.24.11
ARG BASE_IMAGE=ubuntu:24.04

# 构建阶段
FROM ${GO_BUILD_IMAGE} AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o oss-gateway main.go

# 运行阶段
FROM ${BASE_IMAGE}

# Ubuntu 使用 apt-get 安装依赖
RUN apt-get update && apt-get install -y ca-certificates tzdata && rm -rf /var/lib/apt/lists/*

WORKDIR /root/

COPY --from=builder /app/oss-gateway .

EXPOSE 8080

CMD ["./oss-gateway"]
