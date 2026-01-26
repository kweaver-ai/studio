import http from "http";
import cors from "cors";
import * as fs from "fs";
import * as path from "path";
import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import cookieParser from "cookie-parser";
import { test } from "../handlers/test";
import { jsonOnly } from "../handlers/middleware";
import { resgisterRouting } from "./routingTables";
import {
    createRedisStore,
    configData,
    storeInstaceType,
    server,
    tenantMode,
} from "../handlers/tools";
import RedisStore from "connect-redis";
import logger from "../common/logger";
import { registryClient } from "./helper";

export async function main() {
    await registryClient();

    try {
        let timer = null;
        const redisInstance = await createRedisStore();
        const storeInstace = new RedisStore({
            client: redisInstance,
            prefix: "deploy-web-app-sess:",
            ttl: 60 * 60 * 24, // Session time - set the interval to clear expired sessions, unit: seconds
        });

        redisInstance
            .ping()
            .then(() => {
                timer && clearInterval(timer);
                timer = null;
                if (server.getStoreType() !== storeInstaceType.Redis) {
                    createServer(storeInstace);
                    server.setStoreType(storeInstaceType.Redis);
                }
            })
            .catch(() => {});

        redisInstance.on("error", () => {
            if (server.getStoreType() !== storeInstaceType.Default) {
                createServer();
                server.setStoreType(storeInstaceType.Default);
            }
            if (!timer) {
                timer = setInterval(() => {
                    redisInstance
                        .ping()
                        .then(() => {
                            timer && clearInterval(timer);
                            timer = null;
                            if (
                                server.getStoreType() !== storeInstaceType.Redis
                            ) {
                                createServer(storeInstace);
                                server.setStoreType(storeInstaceType.Redis);
                            }
                        })
                        .catch(() => {});
                }, 5000);
            }
        });
    } catch (e) {
        createServer();
        server.setStoreType(storeInstaceType.Default);
    }
}

export async function createServer(storeInstace = undefined) {
    const app = express();

    logger.info(
        "Local storage session type:",
        storeInstace ? storeInstaceType.Redis : storeInstaceType.Default
    );
    app.get("/health/ready", test) // k8s probe
        .get("/health/alive", test) // k8s probe
        .use(
            session({
                secret: "eisoo", // Used to sign cookies related to session id
                name: "clustersid",
                store: storeInstace, // Local storage for session (text file)
                // resave: false, // required: force lightweight session keep alive (touch)
                // saveUninitialized: false, // Whether to automatically save uninitialized sessions
                httpOnly: true,
            })
        )
        .use(cookieParser())
        .use(jsonOnly)
        .use(bodyParser.json({ limit: "5MB" }))
        .use(bodyParser.json({ type: "application/vnd.apache.thrift.json" }))
        .use(bodyParser.urlencoded({ extended: false, limit: "5MB" }))
        .options("*", cors());

    // Register routes
    resgisterRouting(app);

    server.getServer() && server.getServer().close();

    const newServer = http.createServer(app);
    newServer.timeout = 0;
    newServer.listen(18080);
    server.setServer(newServer);
}
