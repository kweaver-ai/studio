// DIP 5.0 version only has Super Administrator, Organization Administrator, and Organization Auditor
export enum SystemRoleType {
    /*
     * Super Administrator
     */
    Supper = "7dcfcc9c-ad02-11e8-aa06-000c29358ad6",

    /**
     * System Administrator
     */
    Admin = "d2bd2082-ad03-11e8-aa06-000c29358ad6",

    /**
     * Security Administrator
     */
    Securit = "d8998f72-ad03-11e8-aa06-000c29358ad6",

    /**
     * Audit Administrator
     */
    Audit = "def246f2-ad03-11e8-aa06-000c29358ad6",

    /**
     * Organization Administrator
     */
    OrgManager = "e63e1c88-ad03-11e8-aa06-000c29358ad6",

    /**
     * Portal Administrator
     */
    PortalManager = "6da85392c000-60aa-8e11-30da-88c1e36e",

    /**
     * Organization Auditor
     */
    OrgAudit = "f06ac18e-ad03-11e8-aa06-000c29358ad6",

    /**
     * Shared Approve
     */
    SharedApprove = "f58622b2-ad03-11e8-aa06-000c29358ad6",

    /**
     * Document Approve
     */
    DocApprove = "fb648fac-ad03-11e8-aa06-000c29358ad6",

    /**
     * Csf Approve
     */
    CsfApprove = "01a78ac2-ad04-11e8-aa06-000c29358ad6",
}

/**
 * user role
 */
export enum UserRole {
    /**
     * supper
     */
    Super = "super_admin",

    /**
     * sys_admin
     */
    Admin = "sys_admin",

    /**
     * security admin
     */
    Security = "sec_admin",

    /**
     * audit admin
     */
    Audit = "audit_admin",

    /**
     * orgManager admin
     */
    OrgManager = "org_manager",

    /**
     * orgAudit admin
     */
    OrgAudit = "org_audit",

    /**
     * normal user
     */
    NormalUser = "normal_user",
}

/**
 * system role id & user role mapping
 */
export const SysUserRoles = {
    [SystemRoleType.Supper]: UserRole.Super,
    [SystemRoleType.Admin]: UserRole.Admin,
    [SystemRoleType.Securit]: UserRole.Security,
    [SystemRoleType.Audit]: UserRole.Audit,
    [SystemRoleType.OrgManager]: UserRole.OrgManager,
    [SystemRoleType.OrgAudit]: UserRole.OrgAudit,
};

/**
 * user role & system role id mapping
 */
export const UserSysRoles = {
    [UserRole.Super]: SystemRoleType.Supper,
    [UserRole.Admin]: SystemRoleType.Admin,
    [UserRole.Security]: SystemRoleType.Securit,
    [UserRole.Audit]: SystemRoleType.Audit,
    [UserRole.OrgManager]: SystemRoleType.OrgManager,
    [UserRole.OrgAudit]: SystemRoleType.OrgAudit,
};
