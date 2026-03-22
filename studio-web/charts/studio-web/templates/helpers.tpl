{{/*
Expand the name of the chart.
*/}}
{{- define "template.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "template.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "template.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "template.labels" -}}
helm.sh/chart: {{ include "template.chart" . }}
{{ include "template.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "template.selectorLabels" -}}
app.kubernetes.io/name: {{ include "template.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "template.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (printf "%s-%s" (include "template.fullname" .) .Release.Namespace) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/* ========== Universal Global Values Merge Helpers ========== */}}

{{- define "mergedGlobalValues.imageRegistry" -}}
{{- $globalImage := (.Values.global | default dict).image | default dict -}}
{{- if $globalImage.registry -}}
{{- $globalImage.registry -}}
{{- else -}}
{{- .Values.image.registry -}}
{{- end -}}
{{- end -}}

{{- define "mergedGlobalValues.replicaCount" -}}
{{- $global := .Values.global | default dict -}}
{{- if hasKey $global "replicaCount" -}}
{{- $global.replicaCount -}}
{{- else -}}
{{- .Values.replicaCount -}}
{{- end -}}
{{- end -}}

{{- define "mergedGlobalValues.depServices" -}}
{{- $localDeps := .Values.depServices | default dict -}}
{{- $globalDeps := (.Values.global | default dict).depServices | default dict -}}
{{- toYaml (mergeOverwrite (deepCopy $localDeps) $globalDeps) -}}
{{- end -}}

{{- define "mergedGlobalValues.accessAddress" -}}
{{- $localAccess := .Values.accessAddress | default dict -}}
{{- $globalAccess := (.Values.global | default dict).accessAddress | default dict -}}
{{- toYaml (mergeOverwrite (deepCopy $localAccess) $globalAccess) -}}
{{- end -}}

{{- define "mergedGlobalValues.ingressClassName" -}}
{{- $global := .Values.global | default dict -}}
{{- if hasKey $global "ingressClassName" -}}
{{- $global.ingressClassName -}}
{{- else -}}
{{- index (.Values.depServices | default dict) "class-443" "ingressClass" | default "nginx" -}}
{{- end -}}
{{- end -}}
