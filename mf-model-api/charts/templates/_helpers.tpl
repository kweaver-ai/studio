{{- define "mfModelApi.imageRegistry" -}}
{{- $globalImage := (.Values.global | default dict).image | default dict -}}
{{- if $globalImage.registry -}}
{{- $globalImage.registry -}}
{{- else -}}
{{- .Values.image.registry -}}
{{- end -}}
{{- end -}}

{{- define "mfModelApi.replicaCount" -}}
{{- $global := .Values.global | default dict -}}
{{- if hasKey $global "replicaCount" -}}
{{- $global.replicaCount -}}
{{- else -}}
{{- .Values.replicaCount -}}
{{- end -}}
{{- end -}}

{{- define "mfModelApi.depServices" -}}
{{- $localDeps := .Values.depServices | default dict -}}
{{- $globalDeps := (.Values.global | default dict).depServices | default dict -}}
{{- toYaml (mergeOverwrite (deepCopy $localDeps) $globalDeps) -}}
{{- end -}}

{{- define "mfModelApi.image" -}}
{{- $imageRegistry := include "mfModelApi.imageRegistry" . | trimSuffix "/" -}}
{{- $repository := .Values.image.repository | trimPrefix "/" -}}
{{- if $imageRegistry -}}
{{- printf "%s/%s:%s" $imageRegistry $repository .Values.image.tag -}}
{{- else -}}
{{- printf "%s:%s" $repository .Values.image.tag -}}
{{- end -}}
{{- end -}}
