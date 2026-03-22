{{- define "this-app.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}



{{- define "this-app.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}



{{- define "this-app.labels" -}}
app: {{ include "this-app.name" . }}
{{- end -}}



{{- define "this-app.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
    {{ default (include "this-app.name" .) .Values.serviceAccount.name }}
{{- else -}}
    {{ default "default" .Values.serviceAccount.name }}
{{- end -}}
{{- end -}}



{{- define "this-app.namespace" -}}
{{- .Release.Namespace -}}
{{- end -}}


{{- define "this-app.image" -}}
{{- $imageRegistry := include "mergedGlobalValues.imageRegistry" . -}}
{{- if $imageRegistry -}}
{{- printf "%s/%s:%s" $imageRegistry .Values.image.repository .Values.image.tag -}}
{{- else -}}
{{- printf "%s:%s" .Values.image.repository .Values.image.tag -}}
{{- end -}}
{{- end -}}

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

{{- define "mergedGlobalValues.ingressClassName" -}}
{{- $global := .Values.global | default dict -}}
{{- if hasKey $global "ingressClassName" -}}
{{- $global.ingressClassName -}}
{{- else -}}
{{- index (.Values.depServices | default dict) "class-443" "ingressClass" | default "nginx" -}}
{{- end -}}
{{- end -}}
