import { isArray } from "lodash";

/**
 * Types
 */
export const ColumnValueType = {
    /**
     * JSON
     */
    JSON: "json",
    /**
     * String
     */
    String: "string",
    /**
     * Other
     */
    Other: "other",
};

/**
 * Column item types
 */
export const ColumnType = {
    /**
     * select column item
     */
    SelectFeilds: "selectFeilds",
    /**
     * insert column item
     */
    InsertFeilds: "insertFeilds",
    /**
     * insert value item
     */
    InsertValues: "InsertValues",
};

/**
 * Arithmetic operators
 */
type ArithmeticOperators =
    | "+" // Add
    | "-" // Subtract
    | "*" // Multiply
    | "/"
    | "DIV"
    | "div" // Divide
    | "%"
    | "MOD"
    | "mod"; // Modulo

/**
 * Comparison operators
 */
type ComparisonOperators =
    | "=" // Equal
    | "!="
    | "<>" // Not equal
    | ">" // Greater than
    | "<" // Less than
    | ">=" // Greater than or equal
    | "<=" // Less than or equal
    | "<=>" // Strictly compare whether two null values are equal, return 1 when both are NULL; return 0 when one is NULL
    | "IN"
    | "in" // In collection
    | "LIKE"
    | "like" // Fuzzy match
    | "REGEXP"
    | "regexp"
    | "RLIKE"
    | "rlike" // Regular expression match
    | "BETWEEN"
    | "between" // Between two values
    | "NOT IN"
    | "not in" // Not in collection
    | "IS NULL"
    | "is null" // Is null
    | "IS NOT NULL"
    | "is not null" // Is not null
    | "NOT BETWEEN"
    | "not between"; // Not between two values

/**
 * Logical operators
 */
type LogicalOperators =
    | "NOT"
    | "not"
    | "!" // Logical NOT
    | "AND"
    | "and" // Logical AND
    | "OR"
    | "or" // Logical OR
    | "XOR"
    | "xor"; // Logical XOR

/**
 * Bitwise operators
 */
type BitwiseOperators =
    | "&" // Bitwise AND
    | "|" // Bitwise OR
    | "^" // Bitwise XOR
    | "!" // Bitwise NOT
    | "<<" // Left shift
    | ">>"; // Right shift

/**
 * Condition object
 */
export interface Condition {
    field: string;
    value: string;
    valueType: string;
    operator:
        | ArithmeticOperators
        | ComparisonOperators
        | LogicalOperators
        | BitwiseOperators;
    logicalOperator?: LogicalOperators;
}

export class SQLTools {
    constructor() {}

    /**
     * Check if it is a truthy value
     * @param o Object to check
     * @returns true|false
     */
    isTruly(o: any) {
        return !!o;
    }

    /**
     * Escape data
     * @param value Data value
     * @param columnValueType Insert data type
     * @returns
     */
    escapeData(value: any, columnValueType: string) {
        if (columnValueType === ColumnValueType.String) {
            return `"${value}"`;
        } else if (columnValueType === ColumnValueType.JSON) {
            return `'${JSON.stringify(value)}'`;
        } else {
            return value;
        }
    }

    /**
     * Check condition attributes
     * @param field Field name
     * @param value Value
     */
    checkConditionAttr(field: string, value: any) {
        if (!this.isTruly(value)) {
            throw new Error(`clause ${field} is not get!`);
        } else if (!isArray(value)) {
            throw new Error(`clause ${field} is not array!`);
        }
    }

    /**
     * Where or update set clause factory function
     * @param conditions Clause object array
     * @returns a = 1
     * @returns a = 1 AND b = 2
     */
    clausesFactory(conditions: ReadonlyArray<Condition>) {
        if (!isArray(conditions)) {
            throw new Error(`conditions is not an array!`);
        }
        return conditions.reduce((pre, cur) => {
            const { field, value, operator, logicalOperator, valueType } = cur;
            if (!this.isTruly(field)) {
                throw new Error(`clause field is not get!`);
            }
            if (!this.isTruly(operator)) {
                throw new Error(`clause operator is not get!`);
            }
            return (pre =
                pre +
                ` ${field} ${operator} ${this.escapeData(value, valueType)}${
                    logicalOperator ? ` ${logicalOperator} ` : ""
                }`);
        }, "");
    }

    /**
     * Column item factory
     * @param columns Columns
     * @param type Parameter type
     * @param columnsType Column item types
     * @returns SelectFeilds => a,b,c
     * @returns InsertFeilds => (a,b,c)
     * @returns InsertValues => (a,b,c),(d,e,f)
     */
    columnsFactory(
        columns: ReadonlyArray<string> | ReadonlyArray<ReadonlyArray<string>>,
        type: string,
        columnsType: ReadonlyArray<string>
    ) {
        this.checkConditionAttr("columns", columns);
        if (type === ColumnType.SelectFeilds) {
            return columns.join(",").toString();
        } else if (type === ColumnType.InsertFeilds) {
            return `(${columns.join(",").toString()})`;
        } else if (type === ColumnType.InsertValues) {
            return columns
                .map((column: any, i: number) => {
                    if (isArray(column)) {
                        return `(${
                            column.map &&
                            column
                                .map((val: any, j: number) => {
                                    return this.escapeData(val, columnsType[j]);
                                })
                                .join(",")
                                .toString()
                        })`;
                    } else {
                        return this.escapeData(column, columnsType[i]);
                    }
                })
                .join(",")
                .toString();
        }
    }
}
