package businessdomain

import (
	"context"
	"fmt"
	"slices"
	"system-backend/internal/model"
	"system-backend/internal/pkg/usermgnt"

	"gorm.io/gorm"
)

func (svc *BusinessDomainService) List(u *usermgnt.AccountInfo) ([]*BusinessDomainObject, error) {
	isSuperAdmin := slices.Contains(u.Roles, "super_admin")
	if isSuperAdmin {
		return svc.listAll()
	} else {
		return svc.listSelf(u)
	}
}

func (svc *BusinessDomainService) listAll() ([]*BusinessDomainObject, error) {
	ctx := context.TODO() // TODO: use upstream context
	ms, err := gorm.G[model.BusinessDomain](svc.db).Order("id").Find(ctx)
	if err != nil {
		return nil, err
	}
	return svc.queryBusinessDomains(ctx, ms)
}

func (svc *BusinessDomainService) listSelf(u *usermgnt.AccountInfo) ([]*BusinessDomainObject, error) {
	ctx := context.TODO() // TODO: use upstream context
	bdids, err := svc.cliAuthorization.GetMemberBDs(u.ID, u.Type)
	if err != nil {
		return nil, err
	}

	ms, err := gorm.G[model.BusinessDomain](svc.db).Order("id").Where("f_bd_id IN ?", bdids).Find(ctx)
	if err != nil {
		return nil, err
	}

	return svc.queryBusinessDomains(ctx, ms)

}

func (svc *BusinessDomainService) queryBusinessDomains(ctx context.Context, ms []model.BusinessDomain) ([]*BusinessDomainObject, error) {
	seenCreators := map[string]struct{}{}
	creatorAccounts := make([]*usermgnt.AccountInfo, 0)
	for _, m := range ms {
		if m.BDCreator == "" || m.BDCreator == "-" {
			continue
		}
		if _, ok := seenCreators[m.BDCreator]; ok {
			continue
		}
		seenCreators[m.BDCreator] = struct{}{}
		creatorAccounts = append(creatorAccounts, &usermgnt.AccountInfo{
			ID:   m.BDCreator,
			Type: usermgnt.AccountTypeUser,
		})
	}
	if len(creatorAccounts) > 0 {
		if err := svc.cliUserMgnt.GetAccountNames(ctx, creatorAccounts); err != nil {
			return nil, err
		}
	}
	nameByCreator := make(map[string]string, len(creatorAccounts))
	for _, a := range creatorAccounts {
		nameByCreator[a.ID] = a.Name
	}

	results := make([]*BusinessDomainObject, 0, len(ms))
	for _, m := range ms {
		prs, err := gorm.G[model.BDProductR](svc.db).Where("f_bd_id = ?", m.BDID).Find(ctx)
		if err != nil {
			return nil, err
		}

		products := make([]string, 0, len(prs))
		for _, pr := range prs {
			products = append(products, pr.PID)
		}

		creatorName := "-"
		creatorID := m.BDCreator
		if creatorID == "-" {
			creatorName = "-"
		} else if n, ok := nameByCreator[creatorID]; ok && n != "" {
			creatorName = n
		}

		results = append(results, &BusinessDomainObject{
			ID:          m.BDID,
			Name:        m.BDName,
			Description: m.BDDescription,
			Products:    products,
			CreateTime:  m.CreatedAt,
			CreatorInfo: BusinessDomainCreatorInfo{
				ID:   creatorID,
				Name: creatorName,
			},
		})
	}

	return results, nil
}

func (svc *BusinessDomainService) ResourceTypeInstanceList(limit, offset int, keyword string) ([]*BusinessDomainObject, int64, error) {
	ctx := context.TODO() // TODO: use upstream context
	query := gorm.G[model.BusinessDomain](svc.db).Where("1 = 1")
	if keyword != "" {
		query = query.Where("f_bd_name LIKE ?", fmt.Sprintf("%%%s%%", keyword))
	}

	cnt, err := query.Count(ctx, "id")
	if err != nil {
		return nil, 0, err
	}
	ms, err := query.Limit(limit).Offset(offset).Find(ctx)
	if err != nil {
		return nil, 0, err
	}

	result := make([]*BusinessDomainObject, 0, len(ms))
	for _, m := range ms {
		result = append(result, &BusinessDomainObject{
			ID:   m.BDID,
			Name: m.BDName,
		})
	}

	return result, cnt, nil
}
