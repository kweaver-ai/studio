{{- define "mfModelManagerNginx.imageRegistry" -}}
{{- $globalImage := (.Values.global | default dict).image | default dict -}}
{{- if $globalImage.registry -}}
{{- $globalImage.registry -}}
{{- else -}}
{{- .Values.image.registry -}}
{{- end -}}
{{- end -}}

{{- define "mfModelManagerNginx.replicaCount" -}}
{{- $global := .Values.global | default dict -}}
{{- if hasKey $global "replicaCount" -}}
{{- $global.replicaCount -}}
{{- else -}}
{{- .Values.replicaCount -}}
{{- end -}}
{{- end -}}

{{- define "mfModelManagerNginx.ingressClassName" -}}
{{- $global := .Values.global | default dict -}}
{{- if hasKey $global "ingressClassName" -}}
{{- $global.ingressClassName -}}
{{- else -}}
{{- "class-443" -}}
{{- end -}}
{{- end -}}

{{- define "mfModelManagerNginx.image" -}}
{{- $imageRegistry := include "mfModelManagerNginx.imageRegistry" . | trimSuffix "/" -}}
{{- $repository := .Values.image.repository | trimPrefix "/" -}}
{{- if $imageRegistry -}}
{{- printf "%s/%s:%s" $imageRegistry $repository .Values.image.tag -}}
{{- else -}}
{{- printf "%s:%s" $repository .Values.image.tag -}}
{{- end -}}
{{- end -}}
