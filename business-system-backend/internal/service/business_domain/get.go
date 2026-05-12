package businessdomain

import (
	"context"
	"errors"
	"net/http"
	"slices"
	"system-backend/internal/cerror"
	"system-backend/internal/model"
	"system-backend/internal/pkg/usermgnt"

	"gorm.io/gorm"
)

func (svc *BusinessDomainService) Get(u *usermgnt.AccountInfo, bdid string) (*BusinessDomainObject, error) {
	ctx := context.TODO() // TODO: use upstream context
	isSuperAdmin := slices.Contains(u.Roles, "super_admin")
	if !isSuperAdmin {
		roles, err := svc.cliAuthorization.CheckBDMember(bdid, u.ID, u.Type)
		if err != nil {
			return nil, err
		}

		if len(roles) == 0 {
			return nil, cerror.
				New(cerror.ErrCodeForbidden).
				SetHttpCode(http.StatusForbidden).
				WithMessage("insufficient permissions or not found")
		}
	}

	bd, err := gorm.G[model.BusinessDomain](svc.db).Where("f_bd_id = ?", bdid).First(ctx)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, cerror.
				New(cerror.ErrCodeNotFound).
				SetHttpCode(http.StatusNotFound).
				SetErr(err).
				WithMessage("business_domain not found")
		}
		return nil, err
	}

	prs, err := gorm.G[model.BDProductR](svc.db).Where("f_bd_id = ?", bd.BDID).Find(ctx)
	if err != nil {
		return nil, err
	}

	products := make([]string, 0, len(prs))
	for _, pr := range prs {
		products = append(products, pr.PID)
	}

	creatorName := "-"
	if bd.BDCreator != "" && bd.BDCreator != "-" {
		accts := []*usermgnt.AccountInfo{{ID: bd.BDCreator, Type: usermgnt.AccountTypeUser}}
		if err := svc.cliUserMgnt.GetAccountNames(ctx, accts); err != nil {
			return nil, err
		}
		if accts[0].Name != "" {
			creatorName = accts[0].Name
		}
	}

	return &BusinessDomainObject{
		ID:          bd.BDID,
		Name:        bd.BDName,
		Description: bd.BDDescription,
		Products:    products,
		CreateTime:  bd.CreatedAt,
		CreatorInfo: BusinessDomainCreatorInfo{
			ID:   bd.BDCreator,
			Name: creatorName,
		},
	}, nil
}
