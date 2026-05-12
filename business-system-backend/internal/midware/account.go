package midware

import (
	"log"
	"net/http"
	"strings"
	"system-backend/internal/cerror"
	"system-backend/internal/pkg/usermgnt"

	"github.com/gin-gonic/gin"
)

const (
	KeyAccountContext = "mw.account.record.context"
)

type AccountContext struct {
	UserInfo *usermgnt.AccountInfo
}

func AccountMiddleware(
	userMgnt *usermgnt.UserMgnt,
) gin.HandlerFunc {
	return func(c *gin.Context) {
		actx := &AccountContext{}
		accountID := c.GetHeader("x-account-id")
		accountType := strings.TrimSpace(strings.ToLower(c.GetHeader("x-account-type")))

		if accountID != "" {
			if accountType == "" {
				cerror.
					New(cerror.ErrCodeUnauthorized).
					SetHttpCode(http.StatusUnauthorized).
					WithMessage("both account type and account id must be provided.").
					GinFailed(c)
				return
			}
			if accountType != usermgnt.AccountTypeUser && accountType != usermgnt.AccountTypeApp {
				cerror.
					New(cerror.ErrCodeBadRequest).
					SetHttpCode(http.StatusBadRequest).
					WithMessage("invalid x-account-type: must be user or app").
					GinFailed(c)
				return
			}

			userInfo, err := userMgnt.AccountInfo(c.Request.Context(), accountID, accountType)
			if err != nil {
				if accountType == usermgnt.AccountTypeApp {
					log.Printf("account middleware: failed to resolve app account %s: %v", accountID, err)
					actx.UserInfo = &usermgnt.AccountInfo{
						ID:    accountID,
						Type:  usermgnt.AccountTypeApp,
						Name:  "-",
						Roles: nil,
					}
				} else {
					cerror.
						New(cerror.ErrCodeUnauthorized).
						SetHttpCode(http.StatusUnauthorized).
						SetErr(err).
						WithMessage("invalid user_id").
						GinFailed(c)
					return
				}
			} else {
				actx.UserInfo = userInfo
			}
		}

		c.Set(KeyAccountContext, actx)
		c.Next()
	}
}
