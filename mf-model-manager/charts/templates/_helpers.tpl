{{- define "mfModelManager.imageRegistry" -}}
{{- $globalImage := (.Values.global | default dict).image | default dict -}}
{{- if $globalImage.registry -}}
{{- $globalImage.registry -}}
{{- else -}}
{{- .Values.image.registry -}}
{{- end -}}
{{- end -}}

{{- define "mfModelManager.replicaCount" -}}
{{- $global := .Values.global | default dict -}}
{{- if hasKey $global "replicaCount" -}}
{{- $global.replicaCount -}}
{{- else -}}
{{- .Values.replicaCount -}}
{{- end -}}
{{- end -}}

{{- define "mfModelManager.depServices" -}}
{{- $localDeps := .Values.depServices | default dict -}}
{{- $globalDeps := (.Values.global | default dict).depServices | default dict -}}
{{- toYaml (mergeOverwrite (deepCopy $localDeps) $globalDeps) -}}
{{- end -}}

{{- define "mfModelManager.image" -}}
{{- $imageRegistry := include "mfModelManager.imageRegistry" . | trimSuffix "/" -}}
{{- $repository := .Values.image.repository | trimPrefix "/" -}}
{{- if $imageRegistry -}}
{{- printf "%s/%s:%s" $imageRegistry $repository .Values.image.tag -}}
{{- else -}}
{{- printf "%s:%s" $repository .Values.image.tag -}}
{{- end -}}
{{- end -}}
