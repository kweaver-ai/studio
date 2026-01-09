import {
    login,
    logout,
    refreshToken,
    oauthLoginCallback,
    oauthLogoutCallback,
    getUserInfoByToken,
} from "../handlers/auth";
import { interfaceProxy } from "../handlers/proxyroutes";
import { getOemconfig } from "../handlers/oemconfig";

export const resgisterRouting = (app) => {
    app.get("/interface/deployweb/login", login);
    app.get("/interface/deployweb/oauth/login/callback", oauthLoginCallback);
    // interfaceProxy is for authentication, the routes written above this line are authenticated
    app.all("/interface/deployweb/*", interfaceProxy);
    app.post("/interface/deployweb/logout", logout);
    app.get("/interface/deployweb/refreshtoken", refreshToken);
    app.get("/interface/deployweb/oauth/logout/callback", oauthLogoutCallback);
    app.get(
        "/interface/deployweb/oauth/getUserInfoByToken",
        getUserInfoByToken
    );
    app.get("/api/deploy-web-service/v1/oemconfig", getOemconfig);
};
