import { configData, fetchParse, getUTCTime } from "./index";
import { v4 as uuidv4 } from "uuid";

/**
 * Log level
 */
export const Level = {
    ALL: 0, // All
    INFO: 1, // Info
    WARN: 2, // Warning
};

// Login operations
export const LoginOps = {
    ALL: 0, // All operations
    LOGIN: 1, // Login operation
    LOGOUT: 2, // Logout operation
    AUTHENICATION: 3, // Authentication operation
    OTHER: 127, // Other operations
};

/**
 * Log type
 */
export const LogType = {
    // Management log
    Management: "management",
    // Login log
    Login: "login",
    // Operation log
    Operation: "operation",
};

/**
 * User type
 */
export const UserType = {
    // Authenticated user
    AuthenticatedUser: "authenticated_user",
    // Anonymous user
    AnonymousUser: "anonymous_user",
    // App account
    App: "app",
    // Internal service
    InternalService: "internal_service",
};

const log = async (
    req,
    { logType, level, opType, msg = "", exMsg = "", userId }
) => {
    const { "audit-log": auditLog } = configData.Module2Config;
    const { headers } = req;

    const tzoffset = new Date().getTimezoneOffset() * 60000; //offset in milliseconds
    const localISOTime =
        new Date(Date.now() - tzoffset).toISOString().slice(0, 19) + "+08:00";

    const clientIP = headers["x-real-ip"]
        ? headers["x-real-ip"]
        : headers["X-Forwarded-For"]
        ? headers["X-Forwarded-For"]
        : "";

    const payload = {
        user_id: userId,
        user_type: UserType.AuthenticatedUser,
        level,
        op_type: opType,
        date: getUTCTime(localISOTime) * 1000,
        ip: clientIP,
        mac: "",
        msg: msg.trim(),
        ex_msg: exMsg.trim(),
        user_agent: "",
        additional_info: "",
        out_biz_id: uuidv4(),
    };
    return await fetchParse(
        `${auditLog.protocol}://${auditLog.host}:${auditLog.port}/api/audit-log/v1/log/${logType}`,
        {
            timeout: 6 * 1000,
            method: "POST",
            body: JSON.stringify(payload),
        }
    );
};

export const loginLog = async (req, params) => {
    return await log(req, {
        ...params,
        logType: LogType.Login,
    });
};
