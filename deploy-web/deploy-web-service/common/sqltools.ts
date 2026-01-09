import { isArray } from "lodash";

/**
 * type
 */
export const ColumnValueType = {
    /**
     * JSON
     */
    JSON: "json",
    /**
     * string
     */
    String: "string",
    /**
     * other
     */
    Other: "other",
};

/**
 * Column Type
 */
export const ColumnType = {
    /**
     * select Feilds
     */
    SelectFeilds: "selectFeilds",
    /**
     * insert Feilds
     */
    InsertFeilds: "insertFeilds",
    /**
     * insert Values
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
    | "<=>" // Strict comparison of two null values for equality. Returns 1 if both operands are NULL; returns 0 if one operand is NULL.
    | "IN"
    | "in" // In set
    | "LIKE"
    | "like" // Fuzzy match
    | "REGEXP"
    | "regexp"
    | "RLIKE"
    | "rlike" // Regular expression match
    | "BETWEEN"
    | "between" // Between two values
    | "NOT IN"
    | "not in" // Not in set
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
     * isTruly
     * @param o object
     * @returns true|false
     */
    isTruly(o: any) {
        return !!o;
    }

    /**
     * escape data
     * @param value data
     * @param columnValueType data type
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
     * check condition params
     * @param field field
     * @param value value
     */
    checkConditionAttr(field: string, value: any) {
        if (!this.isTruly(value)) {
            throw new Error(`clause ${field} is not get!`);
        } else if (!isArray(value)) {
            throw new Error(`clause ${field} is not array!`);
        }
    }

    /**
     * where or update set factory function
     * @param conditions
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
     * column factory
     * @param columns columns
     * @param type params type
     * @param columnsType columns type
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
