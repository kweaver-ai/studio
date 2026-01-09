import { Connection } from "mysql2";
import { SQLTools, ColumnType, Condition, ColumnValueType } from "./sqltools";

/**
 * const o = new SQL(database_relate, "table_name");
 */
class SQL extends SQLTools {
    /**
     * Database connection
     */
    connection: Connection;
    /**
     * Table name
     */
    table: string;

    constructor(connection: Connection, table: string) {
        super();
        if (!this.isTruly(connection)) {
            throw new Error("the connection to database is not get!");
        } else if (!this.isTruly(table)) {
            throw new Error("the table name of the database is not get!");
        } else {
            this.connection = connection;
            this.table = table;
        }
    }

    /**
     * Query
     * const selectRet = o.select("key", "value");
     * => select * from table where key == 'value';
     * @param conditions Query conditions
     * @param fields Fields to select
     * @param checkExist Whether to check existence only
     * @returns Promise
     */
    public async select(
        conditions: ReadonlyArray<Condition>,
        fields: ReadonlyArray<string> | "*" = "*",
        checkExist = false
    ) {
        let whereClause, selectFeilds;
        try {
            if (fields !== "*") {
                this.checkConditionAttr("fields", fields);
                selectFeilds = this.columnsFactory(
                    fields,
                    ColumnType.SelectFeilds,
                    []
                );
            } else {
                selectFeilds = fields;
            }
            this.checkConditionAttr("conditions", conditions);
            if (conditions.length) {
                whereClause = this.clausesFactory(conditions);
            }
        } catch (error) {
            return Promise.reject({
                code: "",
                message: error,
            });
        }
        return this.connection.query(
            `SELECT ${checkExist ? "1" : selectFeilds} FROM ${this.table} ${
                whereClause ? "WHERE" : ""
            } ${whereClause}${checkExist ? "LIMIT 1" : ""};`
        );
    }

    /**
     * Insert statement
     * @param fields Fields [k1,k2]
     * @param fieldsType Field types [k1type,k2type]
     * @param values Values [[k1v1, k2v1], [k1v2, k2v2], ...]
     * @returns Promise
     * const insertRet = o.insert([k1,k2],[[k1v1, k2v1], [k1v2, k2v2], ...]);
     * => insert into t_oem_config(k1,k2) values (k1v1, k2v1),(k1v2, k2v2);
     */
    public async insert(
        fields: ReadonlyArray<string>,
        fieldsType: ReadonlyArray<string>,
        values: ReadonlyArray<ReadonlyArray<string>>
    ) {
        let insertFeilds, insertValues;
        try {
            this.checkConditionAttr("fields", fields);
            this.checkConditionAttr("values", values);
            insertFeilds = this.columnsFactory(
                fields,
                ColumnType.InsertFeilds,
                fieldsType
            );
            insertValues = this.columnsFactory(
                values,
                ColumnType.InsertValues,
                fieldsType
            );
        } catch (error) {
            return Promise.reject({
                code: "",
                message: error,
            });
        }
        return this.connection.query(
            `INSERT INTO ${this.table}${insertFeilds} VALUES ${insertValues};`
        );
    }

    /**
     * Update statement
     * @param whereConditions Where conditions
     * @param updateSetConditions Update set conditions
     * @returns Promise
     */
    public async update(
        whereConditions: ReadonlyArray<Condition>,
        updateSetConditions: ReadonlyArray<Condition>
    ) {
        let whereClause, updateSetClause;
        try {
            this.checkConditionAttr("whereConditions", whereConditions);
            this.checkConditionAttr("updateSetConditions", updateSetConditions);
            whereClause = this.clausesFactory(whereConditions);
            updateSetClause = this.clausesFactory(updateSetConditions);
        } catch (error) {
            return Promise.reject({
                code: "",
                message: error,
            });
        }
        return this.connection.query(
            `UPDATE ${this.table} SET ${updateSetClause} WHERE ${whereClause}`
        );
    }

    /**
     * Delete statement
     * const deleteRet = o.delete("key", "value");
     * @param field Field name
     * @param value Value
     */
    public async delete(
        field: string,
        value: string,
        valueType: string = ColumnValueType.Other
    ) {
        if (!this.isTruly(field)) {
            return Promise.reject({
                code: "",
                message: "the field is not get!",
            });
        } else if (!this.isTruly(value)) {
            return Promise.reject({
                code: "",
                message: "the value is not get!",
            });
        } else {
            const whereClause = this.clausesFactory([
                {
                    field,
                    value,
                    valueType,
                    operator: "=",
                },
            ]);
            return this.connection.query(
                `DELETE FROM ${this.table} WHERE ${whereClause};`
            );
        }
    }
}

export { SQL };
