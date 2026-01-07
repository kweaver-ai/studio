ARG VERSION="0.1.0-opensource.alpha"

#### image-build ####

FROM ubuntu:22.04 AS runtime

FROM golang:1.25.5 AS goenv
ENV CGO_ENABLED=1
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download


FROM goenv AS builder
RUN --mount=type=bind,target=/app,readwrite \
    go build  -o /build-result/business-system .


FROM goenv AS tester
RUN --mount=type=bind,target=/app,readwrite \
    go test -v ./... -coverprofile=coverage.out -covermode=atomic && \
    go tool cover -func=coverage.out


FROM runtime AS image-result
ENV TZ=Asia/Shanghai LANG=en_US.UTF-8
COPY --from=builder /build-result /app
WORKDIR /app
ENTRYPOINT ["./business-system"]

#### chart-build ####

FROM mikefarah/yq:latest AS yq-work
ARG VERSION
COPY ./helm /src

WORKDIR /work

RUN true \
    && cp -r /src/business-system-service ./ \
    && yq -i '.version = "'${VERSION}'"' ./business-system-service/Chart.yaml \
    && yq -i '.image.tag = "'${VERSION}'"' ./business-system-service/values.yaml


FROM alpine/helm AS helm-work
COPY --from=yq-work /work /src

WORKDIR /work

RUN true \
    && helm package /src/business-system-service

FROM scratch AS chart-result
COPY --from=helm-work /work/*.tgz /