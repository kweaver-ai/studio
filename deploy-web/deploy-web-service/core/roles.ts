import { isArray } from "lodash";

/**
 * User Roles
 */
export const Roles = {
    /**
     * Super Admin
     */
    SuperAdmin: "super_admin",

    /**
     * System Admin
     */
    SystemAdmin: "sys_admin",

    /**
     * Security Admin
     */
    Security: "sec_admin",

    /**
     * Audit Admin
     */
    Audit: "audit_admin",

    /**
     * Organization Manager
     */
    OrgManager: "org_manager",

    /**
     * Organization Auditor
     */
    OrgAudit: "org_audit",

    /**
     * Normal User
     */
    NormalUser: "normal_user",
};

export const getFirstPagePathname = (result) => {
    if (
        [Roles.SuperAdmin, Roles.SystemAdmin].some((item) => {
            // Compatible with old API, old API returns object directly, new API returns multiple objects in array
            return isArray(result.text)
                ? result.text[0].roles.includes(item)
                : result.text.roles.includes(item);
        })
    ) {
        return "/deploy/information-security/auth/user-org";
    } else if (
        [Roles.Security, Roles.OrgManager].some((item) => {
            // Compatible with old API, old API returns object directly, new API returns multiple objects in array
            return isArray(result.text)
                ? result.text[0].roles.includes(item)
                : result.text.roles.includes(item);
        })
    ) {
        return "/deploy/information-security/auth/user-org";
    } else {
        return "/deploy/information-security/audit/auditlog";
    }
};
