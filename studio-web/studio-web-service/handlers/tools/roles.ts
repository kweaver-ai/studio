// dip5.0 version only has super administrator, organization administrator and organization audit administrator
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
     * Share Approver
     */
    SharedApprove = "f58622b2-ad03-11e8-aa06-000c29358ad6",

    /**
     * Document Approver
     */
    DocApprove = "fb648fac-ad03-11e8-aa06-000c29358ad6",

    /**
     * Classification Approver
     */
    CsfApprove = "01a78ac2-ad04-11e8-aa06-000c29358ad6",
}

/**
 * User Role
 */
export enum UserRole {
    /**
     * Super Administrator
     */
    Super = "super_admin",

    /**
     * System Administrator
     */
    Admin = "sys_admin",

    /**
     * Security Administrator
     */
    Security = "sec_admin",

    /**
     * Audit Administrator
     */
    Audit = "audit_admin",

    /**
     * Organization Administrator
     */
    OrgManager = "org_manager",

    /**
     * Organization Auditor
     */
    OrgAudit = "org_audit",

    /**
     * Normal User
     */
    NormalUser = "normal_user",
}

/**
 * Mapping of system role IDs to user roles
 */
export const SysUserRoles = {
    [SystemRoleType.Supper]: UserRole.Super,
    [SystemRoleType.Admin]: UserRole.Admin,
    [SystemRoleType.Securit]: UserRole.Security,
    [SystemRoleType.Audit]: UserRole.Audit,
    [SystemRoleType.OrgManager]: UserRole.OrgManager,
    [SystemRoleType.OrgAudit]: UserRole.OrgAudit,
};

// Built-in account names (separation of powers)
export const defaultAccountNames = ["system", "admin", "security", "audit"];

export const getIsDefaultAccountName = (userInfo) => {
    const username =
        userInfo && typeof userInfo !== "string"
            ? userInfo.user["loginName"] || userInfo.user["displayName"]
            : userInfo;
    return defaultAccountNames.includes(username);
};

/**
 * Mapping of system role IDs to user roles
 */
export const UserSysRoles = {
    [UserRole.Super]: SystemRoleType.Supper,
    [UserRole.Admin]: SystemRoleType.Admin,
    [UserRole.Security]: SystemRoleType.Securit,
    [UserRole.Audit]: SystemRoleType.Audit,
    [UserRole.OrgManager]: SystemRoleType.OrgManager,
    [UserRole.OrgAudit]: SystemRoleType.OrgAudit,
};
