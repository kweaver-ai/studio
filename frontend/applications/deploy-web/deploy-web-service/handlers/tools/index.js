import * as yaml from "yaml";
import fetch from "node-fetch";
import * as https from "https";
import * as http from "http";
import * as path from "path";
import * as ini from "ini";
import * as fs from "fs";
import { lookup } from "dns/promises";
import { isArray } from "lodash";
import { Redis } from "ioredis";

/**
 * Redis connection type
 */
const RedisConnectType = {
    /**
     * Sentinel
     */
    Sentinel: "sentinel",
    /**
     * Standalone mode
     */
    Standalone: "standalone",
    /**
     * Master-slave mode (normal mode)
     */
    MasterSlave: "master-slave",
    /**
     * Cluster mode
     */
    Cluster: "cluster",
};

/**
 * read conf file
 * @param {*} filename filename
 */
const iniFileReader = (filename) => {
    try {
        const filepath = path.resolve(__dirname, filename);
        const serviceFile = fs.readFileSync(filepath, "utf-8");
        return ini.parse(serviceFile);
    } catch (err) {
        return {};
    }
};

// /**
//  * Get namespace
//  * @returns
//  */
// const getNamespace = () => {
//     const filepath = path.resolve(
//         "/var/run/secrets/kubernetes.io/serviceaccount/namespace"
//     );
//     const content = fs.readFileSync(filepath, "utf-8");
//     return content.replace(/\s/g, "");
// };

/**
 * read yaml file
 * @param {*} filename filename
 */
const yamlFileReader = (filename) => {
    try {
        const filepath = path.resolve(__dirname, filename);
        const serviceFile = fs.readFileSync(filepath, "utf-8");
        return yaml.parse(serviceFile);
    } catch (err) {
        return {};
    }
};

/**
 * format header
 * @param {*} clientID client id
 * @param {*} clientSecret client secret
 */
const formatHeaders = (clientID, clientSecret) => {
    return clientID && clientSecret
        ? {
              "cache-control": "no-cache",
              "content-type": "application/x-www-form-urlencoded",
              authorization: `Basic ${Buffer.from(
                  `${encodeURIComponent(clientID)}:${encodeURIComponent(
                      clientSecret
                  )}`
              ).toString("base64")}`,
          }
        : {
              "cache-control": "no-cache",
              "content-type": "application/x-www-form-urlencoded",
          };
};

const fetchParse = async (url, args, code = 0) => {
    return await new Promise(async (resolve, reject) => {
        try {
            const fetchRet = await fetch(url, args);
            const fetchText = new Function(
                "console",
                "Error",
                "res",
                "req",
                "require",
                "Buffer",
                "exports",
                "__filename",
                "process",
                "setInterval",
                "setImmediate",
                "setTimeout",
                "TextDecoder",
                "TextEncoder",
                "URL",
                "URLSearchParams",
                "return " + (await fetchRet.text())
            )(
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
            );
            if (fetchRet.status < 400) {
                resolve({ text: fetchText, status: fetchRet.status });
            } else {
                reject({ ...fetchText, status: fetchRet.status });
            }
        } catch (error) {
            reject(code ? { ...error, code } : error);
        }
    });
};

/**
 * skip https verfiy
 */
const agent = new https.Agent({
    rejectUnauthorized: false,
});

const conf = iniFileReader("/sysvol/conf/service_access.conf");

class Config {
    constructor() {
        this._oauthClientID = "";
        this._oauthClientSecret = "";
        this.updateModule2Config();
        this.updateAccessAddr();
    }

    updateAccessAddr() {
        this._accessAddr = yamlFileReader(
            "/etc/globalConfig/depservice/accessAddr.yaml"
        );
    }

    updateModule2Config(client_id = "", client_secret = "") {
        // Only read rds and redis configurations
        this.globalConfig = yamlFileReader(
            "/etc/globalConfig/depservice/depServices.yaml"
        );
        client_id && (this._oauthClientID = client_id);
        client_secret && (this._oauthClientSecret = client_secret);
        this.module2Config = {
            "proton-application": {
                protocol: "http",
                host: "127.0.0.1",
                port: 18880,
            },
            "deploy-auth": {
                protocol: "http",
                host: "deploy-auth",
                port: 80,
            },
            ossgatewaymanager: {
                protocol: "http",
                privateHost: "ossgatewaymanager-private",
                privatePort: "9002",
                publicHost: "ossgatewaymanager-public",
                publicPort: "9000",
            },
            // Compatible with ossgateway (current interface name)
            ossgateway: {
                protocol: "http",
                host: "ossgatewaymanager-private",
                port: "9002",
                publicHost: "ossgatewaymanager-public",
                publicPort: "9000",
            },
            license: {
                protocol: "http",
                host: "license-host",
                port: "8090",
            },
            log: {
                protocol: "http",
                host: "log",
                port: "9993",
            },
            "audit-log": {
                protocol: "http",
                host: "audit-log-private",
                port: "30569",
                publicHost: "audit-log-public",
                publicPort: "30569",
            },
            eacp: {
                protocol: "http",
                privateHttpHost: "eacp-private",
                privateHttpPort: "9998",
                publicHttpHost: "eacp-public",
                publicHttpPort: "9998",
                thriftHost: "eacp-thrift",
                thriftPort: "9992",
            },
            "deploy-manager": this.deploymanger,
            "deploy-service": this.deploymanger,
            nodemgnt: {
                protocol: "http",
                host: "nodemgnt-host",
                port: "8090",
            },
            ShareMgnt: {
                host: "sharemgnt",
                port: "9600",
            },
            EACP: {
                host: "eacp-thrift",
                port: "9992",
            },
            "user-management": {
                protocol: "http",
                publicHost: "user-management-public",
                publicPort: "30980",
                privateHost: "user-management-private",
                privatePort: "30980",
                host: "user-management-private",
                port: "30980",
            },
            "site-mgmt": {
                protocol: "http",
                host: "site-mgmt",
                port: "8000",
            },
            "proton-exporter": {
                protocol: "http",
                host: "proton-exporter",
                port: 8080,
            },
            "deploy-web": {
                protocol: "http",
                oauthOn:
                    this.oauth && this.oauth.oauthOn
                        ? this.oauth.oauthOn
                        : false,
                oauthClientID:
                    this.oauth && this.oauth.oauthClientID
                        ? this.oauth.oauthClientID
                        : "",
                oauthClientSecret:
                    this.oauth && this.oauth.oauthClientSecret
                        ? this.oauth.oauthClientSecret
                        : "",
            },
            hydra: {
                protocol: "http",
                administrativeHost: "hydra-admin",
                administrativePort: "4445",
                publicHost: "hydra-public",
                publicPort: "4444",
            },
            rds: {
                dbName:
                    this.globalConfig["rds"] && this.globalConfig["rds"].dbName
                        ? this.globalConfig["rds"].dbName
                        : "deploy",
                host:
                    this.globalConfig["rds"] && this.globalConfig["rds"].host
                        ? this.globalConfig["rds"].host
                        : "127.0.0.1",
                port:
                    this.globalConfig["rds"] && this.globalConfig["rds"].port
                        ? this.globalConfig["rds"].port
                        : 3330,
                user:
                    this.globalConfig["rds"] && this.globalConfig["rds"].user
                        ? this.globalConfig["rds"].user
                        : "anyshare",
                password:
                    this.globalConfig["rds"] &&
                    this.globalConfig["rds"].password
                        ? this.globalConfig["rds"].password
                        : "",
            },
            redis: {
                /*
                connectInfo:
                    host: xxx,
                    port: xxx,
                    username: xxx,
                    password: xxx,
                connectType: standalone
                */
                /*
                connectInfo:
                    masterHost: xxx,
                    masterPort: xxx,
                    password: xxx,
                    slaveHost: xxx,
                    slavePort: xxx,
                    username: xxx,
                connectType: master-slave
                */
                /*
                connectInfo:
                    masterGroupName: xxx,
                    sentinelHost: xxx,
                    sentinelPort: xxx,
                    sentinelPassword: xxx,
                    sentinelUsername: xxx,
                    username: xxx,
                    password: xxx,
                connectType: sentinel
                */
                connectInfo:
                    this.globalConfig["redis"] &&
                    this.globalConfig["redis"].connectInfo
                        ? {
                              ...this.globalConfig["redis"].connectInfo,
                          }
                        : {},
                connectType:
                    this.globalConfig["redis"] &&
                    this.globalConfig["redis"].connectType
                        ? this.globalConfig["redis"].connectType
                        : "",
            },
        };
    }

    get oauth() {
        return {
            oauthOn: false,
            oauthClientID: this._oauthClientID,
            oauthClientSecret: this._oauthClientSecret,
        };
    }

    get accessAddr() {
        return this._accessAddr;
    }

    get deploymanger() {
        return {
            protocol: "http",
            HttpHost: "deploy-service",
            HttpPort: "9703",
            host: "deploy-service",
            port: "9703",
        };
    }

    /**
     * module port protocol map
     */
    get Module2Config() {
        return this.module2Config;
    }
}

const configData = new Config();

const httpsRequest = async (option, data) => {
    return new Promise((resolve, reject) => {
        const requests = https.request(option, (res) => {
            res.setEncoding("utf8");
            res.on("data", (data) => {
                if (
                    (res.statusCode >= 200 && res.statusCode < 300) ||
                    res.statusCode === 304
                ) {
                    resolve(JSON.parse(data));
                } else {
                    reject(JSON.parse(data));
                }
            });
        });
        requests.on("error", (err) => {
            reject(err);
        });
        data && requests.write(data);
        requests.end();
    });
};

const httpRequest = async (option, data) => {
    return new Promise((resolve, reject) => {
        const requests = http.request(option, (res) => {
            res.setEncoding("utf8");
            res.on("data", (data) => {
                if (
                    (res.statusCode >= 200 && res.statusCode < 300) ||
                    res.statusCode === 304
                ) {
                    resolve(JSON.parse(data));
                } else {
                    reject(JSON.parse(data));
                }
            });
        });
        requests.on("error", (err) => {
            reject(err);
        });
        data && requests.write(data);
        requests.end();
    });
};

const delDir = (path = "") => {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach((file) => {
            const currentPath = path + "/" + file;
            if (fs.statSync(currentPath).isDirectory()) {
                delDir(currentPath); // Recursively delete folder
            } else {
                fs.unlinkSync(currentPath); // Delete file
            }
        });
        fs.rmdirSync(path);
    }
};

function getUTCTime(dateString) {
    let y, M, d, h, m, s;

    // (ISO 8601 standard) Example: 2017-12-14 , 2017-12-11T14:50:55+08:00
    if (
        dateString.match(
            /^\d{4}(-?\d{2}){2}([\sT]\d{2}:\d{2}:\d{2}([\+\-\s]\d{2}:\d{2})?)?/
        )
    ) {
        const {
            date = "1970-01-01",
            time = "00:00:00",
            zone = "+00:00",
        } = dateString
            .match(
                /^(\d{4}(-?\d{2}){2})|([\sT]\d{2}:\d{2}:\d{2})|([\+\-\s]\d{2}:\d{2})/g
            )
            .reduce((prev, currentValue, index) => {
                return {
                    ...prev,
                    date: currentValue.match(/\d{4}(-?\d{2}){2}/)
                        ? currentValue
                        : prev["date"],
                    time: currentValue.match(/[\sT]\d{2}:\d{2}:\d{2}/)
                        ? currentValue
                        : prev["time"],
                    zone: currentValue.match(/[\+\-\s]\d{2}:\d{2}/)
                        ? currentValue
                        : prev["zone"],
                };
            }, {});
        // zone specifies time zone, which can be: Z (UTC), +hh:mm, -hh:mm
        const [hh, mm] = zone.split(":");
        const [, t = "00:00:00"] = time.split(/[\sT]/);

        [y = 0, M = 0, d = 0] = date.split("-").map(Number);
        [h = 0, m = 0, s = 0] = t.split(":").map(Number);
        h = h - Number(hh);
        m = m - Number(mm);
    } else {
        let [fullDate, time] = dateString.split(/\s+/);

        [h = 0, m = 0, s = 0] = time ? time.split(":").map(Number) : [];
        if (fullDate.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
            [M = 0, d = 0, y = 0] = fullDate.split("/").map(Number);
        } else if (fullDate.match(/\d{4}(-\d{1,2}){2}/)) {
            [y = 0, M = 0, d = 0] = fullDate.split("-").map(Number);
        } else if (fullDate.match(/\d{4}(\.\d{1,2}){2}/)) {
            [y = 0, M = 0, d = 0] = fullDate.split(".").map(Number);
        }
    }

    return Date.UTC(y, M - 1, d, h, m, s);
}

/**
 * get clentID
 */
const getServiceConfigBase = () => {
    return (host, port) => {
        const { hydra, "deploy-web": deployweb } = configData.Module2Config;
        const { oauthClientID, oauthClientSecret } = deployweb;
        return {
            hydra,
            deployweb: {
                oauthClientID,
                oauthClientSecret,
                host: host,
                port: port,
            },
        };
    };
};

let getServiceConfig = () => ({});
try {
    getServiceConfig = getServiceConfigBase();
} catch (err) {}

function createSentinels(sentinelHost, sentinelPort) {
    return isArray(sentinelHost)
        ? sentinelHost.map((host, index) => {
              return {
                  host,
                  port: isArray(sentinelPort)
                      ? sentinelPort[index]
                      : sentinelPort,
              };
          })
        : [
              {
                  host: sentinelHost,
                  port: sentinelPort, // Redis port
              },
          ];
}

async function getIPFamily(hostname) {
    const { family } = await lookup(hostname);
    const familyLowerCase = String(family).toLowerCase();
    if (
        familyLowerCase === "ipv4" ||
        familyLowerCase === "v4" ||
        familyLowerCase === "4"
    ) {
        return 4;
    } else if (
        familyLowerCase === "ipv6" ||
        familyLowerCase === "v6" ||
        familyLowerCase === "6"
    ) {
        return 6;
    } else {
        return family;
    }
}

async function createRedisStore() {
    const { connectType, connectInfo } = configData.Module2Config.redis;
    let redisConnectInfo = null;
    if (connectType === RedisConnectType.Sentinel) {
        const {
            sentinelHost,
            sentinelPort,
            masterGroupName,
            sentinelPassword,
            sentinelUsername,
            username,
            password,
        } = connectInfo;

        redisConnectInfo = {
            sentinels: createSentinels(sentinelHost, sentinelPort),
            sentinelUsername: sentinelUsername, // needs Redis >= 6
            sentinelPassword: sentinelPassword,
            username: username, // needs Redis >= 6
            password: password,
            name: masterGroupName,
            family: await getIPFamily(sentinelHost),
        };
    } else if (connectType === RedisConnectType.MasterSlave) {
        const {
            masterHost,
            masterPort,
            password,
            slaveHost,
            slavePort,
            username,
        } = connectInfo;
        // Session involves write operations, system unavailable after master goes down
        redisConnectInfo = {
            host: masterHost,
            port: masterPort,
            username,
            password,
            family: await getIPFamily(masterHost),
        };
    } else if (connectType === RedisConnectType.Standalone) {
        const { host, port, username, password } = connectInfo;

        redisConnectInfo = {
            host,
            port,
            username,
            password,
            family: await getIPFamily(host),
        };
    } else if (connectType === RedisConnectType.Cluster) {
        const { host, port: clusterPort, username, password } = connectInfo;

        const hostArray = host.split(",");
        const redisConnectHosts = hostArray.map((hostInfo) => {
            const [host, port] = hostInfo.split(":");
            return { host, port: port || clusterPort };
        });

        return new Redis.Cluster(redisConnectHosts, {
            redisOptions: {
                username, // Cluster account
                password, // Cluster password
            },
        });
    } else {
        throw new Error("redis connect type is not support!");
    }

    return new Redis(redisConnectInfo);
}

/**
 * get client ip
 * @param {*} headers headers
 * @returns ip
 */
const getRealIP = (headers) => {
    return headers["x-real-ip"]
        ? headers["x-real-ip"]
        : headers["X-Forwarded-For"]
        ? headers["X-Forwarded-For"]
        : "";
};

/**
 * URL prefix mode
 */
const URL_PREFIX_MODE = {
    // Remove header separator
    head: "head",
    // Remove tail separator
    tail: "tail",
    // Remove separators at both ends
    edge: "edge",
};

/**
 * Format URL prefix
 * @param prefix URL prefix
 * @returns /a/b => /a/b/
 */
const URLPrefixFormatter = (prefix, mode = "") => {
    if (!prefix || prefix === "/") {
        return "";
    } else {
        const list = prefix.split("/");
        const paths = list.filter((p) => p);
        if (mode === URL_PREFIX_MODE.edge) {
            return `${paths.join("/")}`;
        } else if (mode === URL_PREFIX_MODE.head) {
            return `${paths.join("/")}/`;
        } else if (mode === URL_PREFIX_MODE.tail) {
            return `/${paths.join("/")}`;
        } else {
            return `/${paths.join("/")}/`;
        }
    }
};

class Server {
    constructor() {
        this.server = null;
        this.storeType = "";
    }
    getServer() {
        return this.server;
    }
    setServer(newServer) {
        this.server = newServer;
    }

    getStoreType() {
        return this.storeType;
    }

    setStoreType(newStoreType) {
        this.storeType = newStoreType;
    }
}

const server = new Server();

const storeInstaceType = {
    Redis: "redis",
    Default: "default",
};

/**
 * Get instance mode
 */
const tenantMode = (() => {
    const globalConfig = yamlFileReader(
        "/etc/globalConfig/depservice/depServices.yaml"
    );
    return (
        globalConfig &&
        globalConfig["deploy-installer"] &&
        globalConfig["deploy-installer"].mode
    );
})();

export {
    iniFileReader,
    formatHeaders,
    // getNamespace,
    fetchParse,
    agent,
    httpRequest,
    delDir,
    URL_PREFIX_MODE,
    URLPrefixFormatter,
    httpsRequest,
    getServiceConfig,
    getServiceConfigBase,
    createRedisStore,
    createSentinels,
    getUTCTime,
    getRealIP,
    configData,
    server,
    storeInstaceType,
    yamlFileReader,
    tenantMode,
};
