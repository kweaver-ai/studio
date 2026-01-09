variable "VERSION" {
    default = "0.1.0-debug"
}

variable "TAG" {
    default = "debug.latest"
}

variable "DEVOPS_PAT" {}

variable "REGISTRY" {
    default = "acr.aishu.cn"
}


target "mqsdk" {
    dockerfile = "docker/Dockerfile.mqsdk"
    target = "result"
    output = [ "result/mqsdk" ]
}

target "chart" {
    dockerfile = "docker/Dockerfile.chart"
    target = "result"
    output = [ "result/chart" ]
    args = {
        VERSION = "${VERSION}"
        TAG = "${TAG}"
    }
}


target "image" {
    dockerfile = "docker/Dockerfile.service"
    target = "result"
    tags = [
        "${REGISTRY}/ict/business-system-backend:${TAG}"
    ]
    args = {
        DEVOPS_PAT = "${DEVOPS_PAT}"
    }
}

target "test" {
    dockerfile = "docker/Dockerfile.service"
    target = "tester"
    args = {
        DEVOPS_PAT = "${DEVOPS_PAT}"
    }
}

group "default" {
    targets = [ "image", "chart" ]
}

// opensource back

target "opensource-image" {
    dockerfile = "docker/opensource.dockerfile"
    target = "image-result"
    tags = [
        "${REGISTRY}/ict/business-system-backend:${VERSION}"
    ]
}
target "opensource-chart" {
    dockerfile = "docker/opensource.dockerfile"
    target = "chart-result"
    tags = [
        "${REGISTRY}/ict/business-system-backend:${VERSION}"
    ]
    output = [ "result/chart" ]
}

group "opensource" {
    targets = [ "opensource-image", "opensource-chart" ]
}
