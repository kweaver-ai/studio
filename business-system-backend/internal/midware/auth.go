package midware

import (
	"errors"
	"net/http"
	"system-backend/internal/cerror"
	"system-backend/internal/pkg/auditlog"
	"system-backend/internal/pkg/authorization"
	"system-backend/internal/pkg/hydra"
	"system-backend/internal/pkg/usermgnt"

	"github.com/gin-gonic/gin"
)

const (
	KeyAuthContext = "mw.auth.record.context"
)

type AuthContext struct {
	UserInfo *usermgnt.AccountInfo
	Token    string
	Operator *auditlog.Toperator
}

func AuthMiddleware(
	auth *authorization.Authorization,
	hydra *hydra.Hydra,
	userMgnt *usermgnt.UserMgnt,
) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			cerror.
				New(cerror.ErrCodeUnauthorized).
				SetHttpCode(http.StatusUnauthorized).
				WithMessage("invalid token").
				WithCause("Authorization header is empty").
				GinFailed(c)
			return
		}
		token := authHeader[len("Bearer "):]

		info, err := hydra.Introspect(token)
		if err != nil {
			cerror.
				New(cerror.ErrCodeUnauthorized).
				SetHttpCode(http.StatusUnauthorized).
				SetErr(err).
				WithMessage("invalid token").
				GinFailed(c)
			return
		}
		if !info.Active {
			cerror.
				New(cerror.ErrCodeUnauthorized).
				SetHttpCode(http.StatusUnauthorized).
				WithMessage("invalid token").
				WithCause("token is not active").
				GinFailed(c)
			return
		}

		userInfo, err := userMgnt.ResolveSubject(c.Request.Context(), info.Sub)
		if err != nil {
			msg := "invalid user_id"
			if errors.Is(err, usermgnt.ErrSubjectNotFound) {
				msg = "invalid token subject"
			}
			cerror.
				New(cerror.ErrCodeUnauthorized).
				SetHttpCode(http.StatusUnauthorized).
				SetErr(err).
				WithMessage(msg).
				GinFailed(c)
			return
		}

		opType := "authenticated_user"
		if userInfo.Type == usermgnt.AccountTypeApp {
			opType = "authenticated_app"
		}
		operator := auditlog.Toperator{
			ID:   userInfo.ID,
			Name: userInfo.Name,
			Type: opType,
			Agent: auditlog.ToperatorAgent{
				IP:   c.ClientIP(),
				Mac:  c.GetHeader("X-Request-MAC"),
				Type: "unknown",
			},
		}

		c.Set(KeyAuthContext, &AuthContext{
			UserInfo: userInfo,
			Operator: &operator,
			Token:    token,
		})
		c.Next()
	}
}
