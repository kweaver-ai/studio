import { env } from "process";
import { configData } from "../handlers/tools/index";
import * as db from "mysql2/promise";

/**
 * Example
 * host: rdsHost
 * password: rdsPassword
 * port: 3330
 * user: anyshare
 * dbName: deploy
 */
const {
    rds: {
        host: RDSHOST,
        password: RDSPWD,
        port: RDSPORT,
        user: RDSUSER,
        dbName: RDSDBNAME,
    },
} = configData.Module2Config;

// Database configuration retrieved from CMS
const DBConfig = {
    // Host address
    host: RDSHOST,
    // Host port
    port: RDSPORT,
    // Username
    user: RDSUSER,
    // Password
    password: RDSPWD,
    // Maximum number of connections
    connectionLimit: 15,
};

/**
 * Connection pool creation function
 * @param {*} database Database name
 * @returns
 */
function poolFactory(database) {
    return db.createPool({
        ...DBConfig,
        database,
    });
}

const _deploy = poolFactory("deploy");
const _anyshare = poolFactory("anyshare");
const _sharemgnt = poolFactory("sharemgnt_db");

// Compatible with GoldenDB and Mysql
// _deploy.getConnection = async () => _deploy.promise()
// _anyshare.getConnection = async () => _anyshare.promise()
// _sharemgnt.getConnection = async () => _sharemgnt.promise()

export const deploy = _deploy;
export const anyshare = _anyshare;
export const sharemgnt = _sharemgnt;

// Need to clear after program execution is complete
const pool = [deploy, anyshare, sharemgnt];

/**
 * Destroy all connection pools
 */
export const destoryDatabasePool = () => {
    try {
        pool.reduce(async (pre, dbPool) => {
            return pre.then(() => {
                return dbPool.end();
            });
        }, Promise.resolve(true));
    } catch (error) {
        return Promise.reject(error);
    }
};
