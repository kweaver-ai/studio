import fetch from "node-fetch";
import { fetchParse, formatHeaders, configData } from "./tools/index.js";
import { isIPV6 } from "../common/ip";
import { UserSysRoles } from "./tools/roles.ts";

/**
 * code to token
 * @param {*} conf Configuration file
 * @param {*} code code
 */
const code2Token = async (conf, code, prefix) => {
    const {
        hydra: { publicHost, publicPort },
        studioweb: { host, port, scheme, oauthClientID, oauthClientSecret },
    } = conf;
    return await fetchParse(`http://${publicHost}:${publicPort}/oauth2/token`, {
        timeout: 0,
        method: "POST",
        headers: formatHeaders(oauthClientID, oauthClientSecret),
        body:
            `grant_type=authorization_code` +
            `&code=${code}` +
            `&redirect_uri=${encodeURIComponent(
                `${scheme}://${
                    isIPV6(host) ? `[${host}]` : host
                }:${port}${prefix}/interface/studioweb/oauth/login/callback`
            )}`,
    });
};

/**
 * refresh token
 * @param {*} conf Configuration file
 * @param {*} refresh_token Refresh token
 * @returns
 */
const tokenRefresh = async (conf, refresh_token) => {
    const {
        hydra: { publicHost, publicPort },
        studioweb: { oauthClientID, oauthClientSecret },
    } = conf;
    return await fetchParse(`http://${publicHost}:${publicPort}/oauth2/token`, {
        timeout: 0,
        method: "POST",
        headers: formatHeaders(oauthClientID, oauthClientSecret),
        body: `grant_type=refresh_token` + `&refresh_token=${refresh_token}`,
    });
};

/**
 * token to userid
 * @param {*} conf Configuration file
 * @param {*} token token
 */
const token2Userid = async (conf, token) => {
    const {
        hydra: { administrativeHost, administrativePort },
        studioweb: { oauthClientID, oauthClientSecret },
    } = conf;
    return await fetchParse(
        `http://${administrativeHost}:${administrativePort}/admin/oauth2/introspect`,
        {
            timeout: 0,
            method: "POST",
            headers: formatHeaders(oauthClientID, oauthClientSecret),
            body: `token=${token}`,
        }
    );
};

/**
 * userid to userinfo
 * @param {*} userid User id
 */
const userid2Userinfo = async (userid) => {
    const { protocol, host, port } =
        configData.Module2Config["user-management"];
    const fields =
        "roles,enabled,priority,csf_level,parent_deps,name,account,frozen,authenticated,email,telephone,third_attr,third_id,auth_type,groups,oss_id,custom_attr,created_at";
    const { text: result } = await fetchParse(
        `${protocol}://${host}:${port}/api/user-management/v1/users/${userid}/${fields}`,
        {
            timeout: 0,
            method: "GET",
        }
    );
    const {
        id,
        csf_level,
        created_at,
        account,
        name,
        email,
        frozen,
        oss_id,
        priority,
        telephone,
        third_id,
        roles,
        auth_type,
    } = result[0];
    const userInfo = {
        id,
        user: {
            createTime: created_at,
            csfLevel: csf_level,
            displayName: name,
            email,
            freezeStatus: frozen,
            loginName: account,
            ossInfo: { ossId: oss_id },
            priority,
            telNumber: telephone,
            thirdId: third_id,
            roles: roles.map((role) => {
                return { id: UserSysRoles[role] };
            }),
            userType: userAuthTypeMap[auth_type],
        },
    };
    return userInfo;
};

const userAuthTypeMap = {
    local: 1,
    domain: 2,
    third: 3,
};

/**
 * revoke token
 * @param {*} conf Configuration file
 * @param {*} token token
 */
const revokeToken = async (conf, token) => {
    const {
        hydra: { publicHost, publicPort },
        studioweb: { oauthClientID, oauthClientSecret },
    } = conf;
    return await fetchParse(
        `http://${publicHost}:${publicPort}/oauth2/revoke`,
        {
            timeout: 0,
            method: "POST",
            headers: formatHeaders(oauthClientID, oauthClientSecret),
            body: `token=${token}`,
        }
    );
};

/**
 * revoke user
 * @param {*} serviceConfig Service configuration
 * @param {*} id_token id—token
 * @param {*} state state
 * @param {*} studioclustersid
 * @param {*} sessionID
 */
const revokeUser = async (
    serviceConfig,
    id_token,
    state,
    studioclustersid,
    sessionID,
    prefix
) => {
    const {
        studioweb: { host, port, scheme },
        hydra: { publicHost, publicPort },
    } = serviceConfig;

    const redirectUri =
        `http://${publicHost}:${publicPort}/oauth2/sessions/logout` +
        `?post_logout_redirect_uri=${scheme}://${
            isIPV6(host) ? `[${host}]` : host
        }:${port}${prefix}/interface/studioweb/oauth/logout/callback` +
        `&id_token_hint=${id_token}` +
        `&state=${state}`;

    return await fetch(redirectUri, {
        timeout: 0,
        method: "GET",
        credentials: "include",
        headers: {
            sessionID,
            Cookie: `clustersid=${studioclustersid}`,
        },
    });
};

export {
    code2Token,
    token2Userid,
    userid2Userinfo,
    revokeToken,
    revokeUser,
    tokenRefresh,
};
