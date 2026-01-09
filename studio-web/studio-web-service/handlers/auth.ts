import { isArray } from "lodash";
import { isIPV6 } from "../common/ip";
import { Roles } from "../core/roles";
import {
    fetchParse,
    configData,
    getRealIP,
    URLPrefixFormatter,
    URL_PREFIX_MODE,
} from "./tools/index.js";
import {
    code2Token,
    token2Userid,
    userid2Userinfo,
    revokeUser,
    revokeToken,
    tokenRefresh,
} from "./oauth.js";
import { getLocale } from "./tools/locale";
import { Level, LoginOps, loginLog } from "./tools/log";
import logger from "../common/logger";
import {
    SystemRoleType,
    getIsDefaultAccountName,
} from "../handlers/tools/roles";
import { loginErr } from "./assets/error.js";
import { encodeBase64Fn } from "./tools/sso.js";

/**
 * Login interface
 */
const login = async (req: any, res: any) => {
    try {
        const {
            lang,
            state,
            integrated,
            "x-forwarded-prefix": forwardedPrefix,
            product,
        } = req.query;
        const prefix = URLPrefixFormatter(
            forwardedPrefix,
            URL_PREFIX_MODE.tail
        );
        const { studioclustersid } = req.cookies;
        req.session.regenerate(() => {});
        const {
            hydra,
            "studio-web": studioweb,
            "deploy-manager": deployManager,
        } = configData.Module2Config!;
        const { oauthClientID, oauthClientSecret } = studioweb;

        const { host, port, scheme = "https" } = configData.accessAddr;
        req.session.state = state;
        req.session.lang = lang;
        req.session.integrated = integrated;
        const redirectUri =
            `${scheme}://${isIPV6(host) ? `[${host}]` : host}:${port}${
                prefix ? prefix : ""
            }/oauth2/auth` +
            `?redirect_uri=${scheme}://${
                isIPV6(host) ? `[${host}]` : host
            }:${port}${
                prefix ? prefix : ""
            }/interface/studioweb/oauth/login/callback` +
            `&x-forwarded-prefix=${prefix ? prefix : ""}` +
            `&client_id=${oauthClientID}` +
            `&scope=openid+offline+all` +
            `&response_type=code` +
            `&state=${state}` +
            `&lang=${lang}` +
            `&product=${product}`;
        req.session.serviceConfig = {
            hydra,
            studioweb: {
                oauthClientID,
                oauthClientSecret,
                host,
                port,
                scheme,
            },
        };

        res.cookie("studio.origin_uri", redirectUri, { secure: true });
        res.redirect(301, redirectUri);
    } catch (err) {
        logger.info(`requst failed: ${req.originalUrl};`);
        logger.info(`error message: ${err}`);
        logger.info(`original service: deploy-service;oauth2-ui`);
        res.set("Content-Type", "application/json");
        res.status(500);
        res.json(err);
    } finally {
        res.end();
    }
};

/**
 * Login success callback
 */
const oauthLoginCallback = async (req: any, res: any) => {
    const { code, state, error = "" } = req.query;
    const forwardedPrefix = req.cookies && req.cookies["X-Forwarded-Prefix"];
    const prefix = URLPrefixFormatter(forwardedPrefix, URL_PREFIX_MODE.tail);
    const { serviceConfig, state: states, lang } = req.session;

    if (state !== states) {
        const newPathname = `${
            prefix ? prefix : ""
        }/studio/?error=different_state`;
        if (req.session.integrated === "true") {
            res.status(200).send(`
            <html>
                <head>
                    <script>
                    // Only redirect inside iframe
                    window.parent.location.href = '${newPathname}&redirect=true';
                    </script>
                </head>
                <body></body>
            </html>
        `);
        } else {
            res.status(200).send(`
            <html>
                <head>
                    <script>
                    window.top.location.href = '${newPathname}';
                    </script>
                </head>
                <body></body>
            </html>
        `);
        }
    } else if (error) {
        const newPathname = `${prefix ? prefix : ""}/studio/?error=${error}`;
        if (req.session.integrated === "true") {
            res.status(200).send(`
            <html>
                <head>
                    <script>
                    // Only redirect inside iframe
                    window.parent.location.href = '${newPathname}&redirect=true';
                    </script>
                </head>
                <body></body>
            </html>
        `);
        } else {
            res.status(200).send(`
            <html>
                <head>
                    <script>
                    window.top.location.href = '${newPathname}';
                    </script>
                </head>
                <body></body>
            </html>
        `);
        }
    } else {
        try {
            const {
                text: { access_token, id_token, refresh_token },
            } = await code2Token(serviceConfig, code, prefix);
            // token to userid
            const {
                text: { sub: userid },
            } = await token2Userid(serviceConfig, access_token);
            // userid to userinfo
            const userInfo = await userid2Userinfo(userid);

            req.session.user = userInfo;
            req.session.token = { access_token, id_token, refresh_token };
            req.session.clustertoken = access_token;
            res.cookie("studio.oauth2_token", access_token, { secure: true });
            res.cookie("studio.id_token", id_token, { secure: true });
            res.cookie("studio.refresh_token", refresh_token, { secure: true });

            if (!getIsDefaultAccountName(userInfo)) {
                res.cookie("client.oauth2_token", access_token, {
                    secure: true,
                });
                res.cookie("id_token", id_token, { secure: true });
                res.cookie("client.oauth2_refresh_token", refresh_token, {
                    secure: true,
                });
            }

            const config = configData.Module2Config!["user-management"];
            const result = await fetchParse(
                `${config.protocol}://${config.host}:${config.port}/api/user-management/v1/users/${userid}/roles`,
                {}
            );
            const { oauth2_authentication_session } = req.cookies;

            if (result && result.text) {
                const { "deploy-manager": deployManager, eacp } =
                    configData.Module2Config!;
                try {
                    // Record login log
                    logger.info("Recording audit-log login log");
                    await loginLog(req, {
                        userId: userid,
                        level: Level.INFO,
                        opType: LoginOps.LOGIN,
                        msg: getLocale(lang, [
                            "登录 工作站 成功",
                            "登入 工作站 成功",
                            "Log in to Studio successfully",
                        ]),
                        exMsg: "",
                    });
                    logger.info("Finished recording audit-log login log");
                    logger.info("Recording observability login log");
                    // Record observability log
                    // getRealIP
                    const payload = {
                        id: userid,
                        udid: "",
                        client_type: "console_web",
                        ip: getRealIP(req.headers),
                    };
                    await fetchParse(
                        `${eacp.protocol}://${eacp.privateHttpHost}:${eacp.privateHttpPort}/api/eacp/v1/auth1/login-log`,
                        {
                            timeout: 6 * 1000,
                            method: "POST",
                            body: JSON.stringify(payload),
                        }
                    );
                    logger.info("Finished recording observability login log");
                } catch (err) {
                    logger.error(err);
                }
                logger.info("Login successful");
                const previousUrl = req.cookies["studio.previous_url"];
                const newPathname =
                    previousUrl && req.session.integrated
                        ? previousUrl
                        : `${prefix ? prefix : ""}/studio/home`;
                if (req.session.integrated === "true") {
                    res.status(200).send(`
                    <html>
                        <head>
                            <script>
                            // Only redirect inside iframe
                            window.parent.location.href = '${newPathname}';
                            </script>
                        </head>
                        <body></body>
                    </html>
                `);
                } else {
                    res.status(200).send(`
                    <html>
                        <head>
                            <script>
                            window.top.location.href = '${newPathname}';
                            </script>
                        </head>
                        <body></body>
                    </html>
                `);
                }
            } else if (oauth2_authentication_session) {
                logger.error("Client checked remember password");
                const newPathname = `${
                    prefix ? prefix : ""
                }/studio/?error=keep_me_logged_in`;
                if (req.session.integrated === "true") {
                    res.status(200).send(`
                    <html>
                        <head>
                            <script>
                            // Only redirect inside iframe
                            window.parent.location.href = '${newPathname}&redirect=true';
                            </script>
                        </head>
                        <body></body>
                    </html>
                `);
                } else {
                    res.status(200).send(`
                    <html>
                        <head>
                            <script>
                            window.top.location.href = '${newPathname}';
                            </script>
                        </head>
                        <body></body>
                    </html>
                `);
                }
            }
        } catch (err) {
            logger.info(`requst failed: ${req.originalUrl};`);
            logger.info(`error message: ${err}`);
            logger.info(`original service: hydra;oauth2-ui`);
            res.status(
                err.status ||
                    parseInt(
                        String(err.status_code || err.code).substring(0, 3)
                    ) ||
                    500
            );
            res.set("Content-Type", "application/json");
            res.json(err);
        }
    }
    res.end();
};

/**
 * Logout success callback
 */
const oauthLogoutCallback = async (req: any, res: any) => {
    const stateq = req.query.state;

    if (!stateq) {
        res.set("Content-Type", "application/json");
        res.status(403).json(null);
    } else {
        res.set("Content-Type", "application/json");
        res.status(200).json(null);
    }
    res.end();
};

/**
 * Logout interface
 */
const logout = async (req: any, res: any) => {
    const {
        clustertoken: tokens,
        serviceConfig,
        state,
        token,
        user: userInfo,
    } = req.session;
    const tokenc = req.cookies["studio.oauth2_token"];
    const { studioclustersid } = req.cookies;
    const forwardedPrefix = req.cookies && req.cookies["X-Forwarded-Prefix"];
    const prefix = URLPrefixFormatter(forwardedPrefix, URL_PREFIX_MODE.tail);

    let ret = null;
    try {
        if (!tokens) {
            res.status(200);
        } else if (tokens !== tokenc) {
            res.status(403);
        } else {
            const { id_token, access_token } = token;
            await revokeToken(serviceConfig, access_token);
            await revokeUser(
                serviceConfig,
                id_token,
                state,
                studioclustersid,
                req.sessionID,
                prefix
            );
            req.session.destroy((err) => {});
            res.clearCookie("studioclustersid");
            res.clearCookie("studio.oauth2_token");
            res.clearCookie("studio.id_token");
            res.clearCookie("studio.refresh_token");

            if (!getIsDefaultAccountName(userInfo)) {
                res.clearCookie("client.oauth2_token");
                res.clearCookie("id_token");
                res.clearCookie("client.oauth2_refresh_token");
            }

            res.status(200);
        }
    } catch (err) {
        logger.info(`requst failed: ${req.originalUrl};`);
        logger.info(`error message: ${err}`);
        logger.info(`original service: deploy-service;oauth2-ui`);
        res.set("Content-Type", "application/json");
        res.status(500);
        ret = err;
    } finally {
        res.json(ret);
        res.end();
    }
};

/**
 * Get user information
 */
const getUserInfoByToken = async (req: any, res: any) => {
    let ret;
    try {
        const { user, clustertoken: tokens } = req.session;
        const tokenc = req.cookies["studio.oauth2_token"];
        if (tokens !== tokenc) {
            ret = null;
            res.status(403);
        } else {
            ret = user;
            res.status(200);
        }
    } catch (err) {
        res.status(500);
        ret = err;
    } finally {
        res.set("Content-Type", "application/json");
        res.json(ret);
        res.end();
    }
};

const getUserInfoByQueryToken = async (req: any, res: any) => {
    let ret;
    try {
        const { studioclustersid } = req.cookies;
        req.session.regenerate(() => {});
        const {
            hydra,
            "studio-web": studioweb,
            "deploy-manager": deployManager,
        } = configData.Module2Config!;
        const { oauthClientID, oauthClientSecret } = studioweb;
        const { host, port, scheme = "https" } = configData.accessAddr;
        req.session.serviceConfig = {
            hydra,
            studioweb: {
                oauthClientID,
                oauthClientSecret,
                host,
                port,
                scheme,
            },
        };
        const access_token = req.cookies["studio.oauth2_token"];
        const refresh_token = req.cookies["studio.refresh_token"];
        const {
            text: { sub: userid },
        } = await token2Userid(req.session.serviceConfig, access_token);
        // userid to userinfo
        const userInfo = await userid2Userinfo(userid);
        req.session.user = userInfo;
        req.session.token = { access_token, refresh_token };
        req.session.clustertoken = access_token;
        req.session.integrated = "true";

        if (!getIsDefaultAccountName(userInfo)) {
            res.cookie("client.oauth2_token", access_token, {
                secure: true,
            });
            res.cookie("client.oauth2_refresh_token", refresh_token, {
                secure: true,
            });
        }

        ret = userInfo;
        res.status(200);
    } catch (err) {
        res.status(403);
        ret = err;
    } finally {
        res.set("Content-Type", "application/json");
        res.json(ret);
        res.end();
    }
};

/**
 * Update token
 */
const refreshToken = async (req: any, res: any) => {
    const { serviceConfig, token, user: userInfo } = req.session;
    if (!token) {
        res.set("Content-Type", "application/json");
        res.status(500);
        res.json("token refresh failed");
        res.end();
    } else {
        let ret = null;
        try {
            const { refresh_token: refreshTokens } = token;
            const {
                text: { access_token, id_token, refresh_token },
            } = await tokenRefresh(serviceConfig, refreshTokens);
            req.session.token = { access_token, id_token, refresh_token };
            req.session.clustertoken = access_token;
            res.cookie("studio.oauth2_token", access_token, { secure: true });
            res.cookie("studio.id_token", id_token, { secure: true });
            res.cookie("studio.refresh_token", refresh_token, { secure: true });

            if (!getIsDefaultAccountName(userInfo)) {
                res.cookie("client.oauth2_token", access_token, {
                    secure: true,
                });
                res.cookie("id_token", id_token, { secure: true });
                res.cookie("client.oauth2_refresh_token", refresh_token, {
                    secure: true,
                });
            }
            res.status(200);
        } catch (err) {
            logger.info(`requst failed: ${req.originalUrl};`);
            logger.info(`error message: ${err}`);
            logger.info(`original service: hydra;oauth2-ui`);
            ret = err;
            res.status(500);
        } finally {
            res.set("Content-Type", "application/json");
            res.json(ret);
            res.end();
        }
    }
};

/**
 * Single sign-on interface
 */
const loginBySSO = async (req: any, res: any) => {
    try {
        logger.info("Start single sign-on");
        const {
            credential,
            "x-forwarded-prefix": forwardedPrefix,
            redirect_url,
        } = req.query;

        const prefix = URLPrefixFormatter(
            forwardedPrefix,
            URL_PREFIX_MODE.tail
        );
        const { studioclustersid } = req.cookies;
        req.session.regenerate(() => {});
        const {
            hydra,
            "studio-web": studioweb,
            "deploy-manager": deployManager,
        } = configData.Module2Config!;
        const { oauthClientID, oauthClientSecret } = studioweb;
        logger.info("Start getting access address");
        const { host, port, scheme = "https" } = configData.accessAddr;
        logger.info("Successfully got access address");

        const payload = {
            client_id: oauthClientID,
            redirect_uri: `${scheme}://${host}:${port}${prefix}/interface/studioweb/oauth/login/callback`,
            response_type: "code",
            scope: "offline openid all",
            credential: JSON.parse(credential.replace(/\'/g, '"')),
            udids: [],
        };
        logger.info("payload", payload);
        logger.info("Start getting code based on third-party authentication");
        const {
            text: { code },
        } = await fetchParse(
            `${scheme}://${host}:${port}${prefix}/api/authentication/v1/sso`,
            {
                timeout: 6 * 1000,
                method: "POST",
                body: JSON.stringify(payload),
            }
        );
        logger.info(
            "Successfully got code based on third-party authentication, code is",
            code
        );
        const serviceConfig = {
            hydra,
            studioweb: {
                oauthClientID,
                oauthClientSecret,
                host,
                port,
                scheme,
            },
        };
        const {
            text: { access_token, id_token, refresh_token },
        } = await code2Token(serviceConfig, code, prefix);
        // token to userid
        const {
            text: { sub: userid },
        } = await token2Userid(serviceConfig, access_token);
        // userid to userinfo
        const userInfo = await userid2Userinfo(userid);
        logger.info("Successfully got userinfo", userInfo);

        req.session.serviceConfig = serviceConfig;
        req.session.integrated = "false";
        req.session.user = userInfo;
        req.session.token = { access_token, id_token, refresh_token };
        req.session.clustertoken = access_token;
        res.cookie("studio.oauth2_token", access_token, { secure: true });
        res.cookie("studio.id_token", id_token, { secure: true });
        res.cookie("studio.refresh_token", refresh_token, { secure: true });

        if (!getIsDefaultAccountName(userInfo)) {
            res.cookie("client.oauth2_token", access_token, {
                secure: true,
            });
            res.cookie("id_token", id_token, { secure: true });
            res.cookie("client.oauth2_refresh_token", refresh_token, {
                secure: true,
            });
        }
        const config = configData.Module2Config!["user-management"];
        const result = await fetchParse(
            `${config.protocol}://${config.host}:${config.port}/api/user-management/v1/users/${userid}/roles`,
            {}
        );
        const { oauth2_authentication_session } = req.cookies;

        if (result && result.text) {
            const { "deploy-manager": deployManager, eacp } =
                configData.Module2Config!;
            try {
                // record login log
                logger.info("record audit-log login log");
                await loginLog(req, {
                    userId: userid,
                    level: Level.INFO,
                    opType: LoginOps.LOGIN,
                    msg: "login studio successfully",
                    exMsg: "",
                });
                logger.info("record audit-log login log completed");
                logger.info("recording observability login log");
                // recording observability login log
                // getRealIP
                const payload = {
                    id: userid,
                    udid: "",
                    client_type: "console_web",
                    ip: getRealIP(req.headers),
                };
                await fetchParse(
                    `${eacp.protocol}://${eacp.privateHttpHost}:${eacp.privateHttpPort}/api/eacp/v1/auth1/login-log`,
                    {
                        timeout: 6 * 1000,
                        method: "POST",
                        body: JSON.stringify(payload),
                    }
                );
                logger.info("Finished recording observability login log");
            } catch (err) {
                logger.error(err);
            }
            logger.info("Login successful");
            res.redirect(301, redirect_url);
        } else if (oauth2_authentication_session) {
            logger.error("Client checked remember password");
            const newPathname = `${
                prefix ? prefix : ""
            }/studio/?error=keep_me_logged_in`;

            res.redirect(301, newPathname);
        }
    } catch (err) {
        logger.info(`requst failed: ${req.originalUrl};`);
        logger.error(`error message: ${err}`);
        logger.info(`original service: hydra;oauth2-ui;authentication`);
        res.status(
            err.status ||
                parseInt(String(err.status_code || err.code).substring(0, 3)) ||
                500
        );

        res.set("Content-Type", "text/html; charset=utf-8");
        res.send(`
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                .container {width: 400px; margin: 125px auto 0 auto; text-align: center; }
                .text { color: rgba(0, 0, 0, 0.65); font-size: 13px; text-align: center; line-height: 20px; }
                .text-tip { color: rgba(0, 0, 0, 0.65); font-size: 13px; text-align: center; line-height: 20px; padding: 8px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <img width="200" src="${loginErr}"/>
                <div class="text-tip">Error!</div>
                <div class="text">Internal Error.</div>
            </div>
        </body>
        </html>
                `);
    } finally {
        res.end();
    }
};

/**
 * Single sign-on interface (internal company credentials)
 */
const loginByInternalSSO = async (req: any, res: any) => {
    try {
        logger.info("Start single sign-on");
        const {
            "x-forwarded-prefix": forwardedPrefix,
            redirect_url,
            product,
            refreshToken,
            token,
        } = req.query;

        const prefix = URLPrefixFormatter(
            forwardedPrefix,
            URL_PREFIX_MODE.tail
        );
        const { studioclustersid } = req.cookies;
        req.session.regenerate(() => {});
        const {
            hydra,
            "studio-web": studioweb,
            "deploy-manager": deployManager,
        } = configData.Module2Config!;
        const { oauthClientID, oauthClientSecret } = studioweb;
        logger.info("Start getting access address");
        const { host, port, scheme = "https" } = configData.accessAddr;
        logger.info("Successfully got access address");
        logger.info(`Verify if ${product} token is valid`);
        const {
            text: { sub: productuserid },
        } = await token2Userid({ hydra, studioweb: {} }, token);
        if (!productuserid || productuserid === "undefined") {
            throw new Error(`Failed to verify ${product} token`);
        }
        logger.info(
            `Successfully verified ${
                product || "dip"
            } token, user ID is ${productuserid}`
        );
        logger.info(
            `Start getting login credentials based on refresh token, refresh token is ${refreshToken}`
        );
        const {
            text: { ticket },
        } = await fetchParse(
            `${scheme}://${host}:${port}${prefix}/api/authentication/v1/ticket`,
            {
                timeout: 6 * 1000,
                method: "POST",
                body: JSON.stringify({
                    refresh_token: encodeBase64Fn(refreshToken),
                    client_id: oauthClientID,
                }),
            }
        );

        logger.info(`Successfully got login credentials`);

        const payload = {
            client_id: oauthClientID,
            redirect_uri: `${scheme}://${host}:${port}${prefix}/interface/studioweb/oauth/login/callback`,
            response_type: "code",
            scope: "offline openid all",
            credential: {
                id: "aishu",
                params: {
                    ticket: encodeBase64Fn(ticket),
                },
            },
            udids: [],
        };
        logger.info("payload", payload);
        logger.info("Start getting code based on login credentials");
        const {
            text: { code },
        } = await fetchParse(
            `${scheme}://${host}:${port}${prefix}/api/authentication/v1/sso`,
            {
                timeout: 6 * 1000,
                method: "POST",
                body: JSON.stringify(payload),
            }
        );
        logger.info(
            "Successfully got code based on third-party authentication, code is",
            code
        );
        const serviceConfig = {
            hydra,
            studioweb: {
                oauthClientID,
                oauthClientSecret,
                host,
                port,
                scheme,
            },
        };
        const {
            text: { access_token, id_token, refresh_token },
        } = await code2Token(serviceConfig, code, prefix);
        // Token to user ID
        const {
            text: { sub: userid },
        } = await token2Userid(serviceConfig, access_token);
        // User ID to user info
        const userInfo = await userid2Userinfo(userid);
        logger.info("Successfully got user info", userInfo);

        req.session.serviceConfig = serviceConfig;
        req.session.integrated = "false";
        req.session.user = userInfo;
        req.session.token = { access_token, id_token, refresh_token };
        req.session.clustertoken = access_token;
        res.cookie("studio.oauth2_token", access_token, { secure: true });
        res.cookie("studio.id_token", id_token, { secure: true });
        res.cookie("studio.refresh_token", refresh_token, { secure: true });

        if (!getIsDefaultAccountName(userInfo)) {
            res.cookie("client.oauth2_token", access_token, {
                secure: true,
            });
            res.cookie("id_token", id_token, { secure: true });
            res.cookie("client.oauth2_refresh_token", refresh_token, {
                secure: true,
            });
        }
        const config = configData.Module2Config!["user-management"];
        const result = await fetchParse(
            `${config.protocol}://${config.host}:${config.port}/api/user-management/v1/users/${userid}/roles`,
            {}
        );

        if (result && result.text) {
            const { "deploy-manager": deployManager, eacp } =
                configData.Module2Config!;
            try {
                // Record login log
                logger.info("Record audit-log login log");
                await loginLog(req, {
                    userId: userid,
                    level: Level.INFO,
                    opType: LoginOps.LOGIN,
                    msg: "Successfully logged in to Studio",
                    exMsg: "",
                });
                logger.info("Finished recording audit-log login log");
                logger.info("Record observability login log");
                // Record observability log
                // getRealIP
                const payload = {
                    id: userid,
                    udid: "",
                    client_type: "console_web",
                    ip: getRealIP(req.headers),
                };
                await fetchParse(
                    `${eacp.protocol}://${eacp.privateHttpHost}:${eacp.privateHttpPort}/api/eacp/v1/auth1/login-log`,
                    {
                        timeout: 6 * 1000,
                        method: "POST",
                        body: JSON.stringify(payload),
                    }
                );
                logger.info("Finished recording observability login log");
            } catch (err) {
                logger.error(err);
            }
            logger.info("Login successful");
            res.redirect(301, redirect_url);
        } else {
            res.status(500);

            // Use static HTML instead of template engine
            res.set("Content-Type", "text/html; charset=utf-8");
            res.send(`
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    .container {width: 400px; margin: 125px auto 0 auto; text-align: center; }
                    .text { color: rgba(0, 0, 0, 0.65); font-size: 13px; text-align: center; line-height: 20px; }
                    .text-tip { color: rgba(0, 0, 0, 0.65); font-size: 13px; text-align: center; line-height: 20px; padding: 8px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <img width="200" src="${loginErr}"/>
                    <div class="text-tip">Error!</div>
                    <div class="text">Internal Error.</div>
                </div>
            </body>
            </html>
                    `);
        }
    } catch (err) {
        logger.info(`requst failed: ${req.originalUrl};`);
        logger.error(`error message: ${err}`);
        logger.info(`original service: hydra;oauth2-ui;authentication`);
        res.status(
            err.status ||
                parseInt(String(err.status_code || err.code).substring(0, 3)) ||
                500
        );

        // Use static HTML instead of template engine
        res.set("Content-Type", "text/html; charset=utf-8");
        res.send(`
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                .container {width: 400px; margin: 125px auto 0 auto; text-align: center; }
                .text { color: rgba(0, 0, 0, 0.65); font-size: 13px; text-align: center; line-height: 20px; }
                .text-tip { color: rgba(0, 0, 0, 0.65); font-size: 13px; text-align: center; line-height: 20px; padding: 8px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <img width="200" src="${loginErr}"/>
                <div class="text-tip">Error!</div>
                <div class="text">Internal Error.</div>
            </div>
        </body>
        </html>
                `);
    } finally {
        res.end();
    }
};

module.exports = {
    login,
    logout,
    oauthLoginCallback,
    oauthLogoutCallback,
    getUserInfoByToken,
    refreshToken,
    getUserInfoByQueryToken,
    loginBySSO,
    loginByInternalSSO,
};
