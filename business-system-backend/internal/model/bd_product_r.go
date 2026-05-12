package model

import "gorm.io/gorm"

type BDProductR struct {
	gorm.Model
	BDID     string `gorm:"column:f_bd_id"`
	PID      string `gorm:"column:f_product_id"`
	CreateBy     string `gorm:"column:f_create_by"`
	CreateByType string `gorm:"column:f_create_by_type;not null;default:user"`
}

func (BDProductR) TableName() string {
	return "t_bd_product_r"
}
