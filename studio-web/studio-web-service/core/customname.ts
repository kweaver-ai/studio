import { ColumnValueType } from "../common/sqltools";

export const TableName = "custom_name";

export const Keys = {
    // Share name
    Name: "name",
    // Configuration JSON
    Value: "value",
};

export const Languages = {
    // Simplified Chinese
    ZHCN: "zh-cn",
    // Traditional Chinese
    ZHTW: "zh-tw",
    // American English
    ENUS: "en-us",
};
export const sections = {
    // Query all
    ALL: "all",
    // Query client-side part of terms
    Anyshare: "anyshare",
    // Query mobile part of terms
    Mobile: "mobile",
};

export const languagesList = ["zh-cn", "zh-tw", "en-us"];

export const Names = {
    // Information bar
    InformationBar: "informationBar",
    // Favorites
    Favorite: "favorite",
    // Collect (verb, corresponds to cancel collection)
    StoreUp: "storeUp",
    // Cancel collection (verb)
    CancelCollection: "cancelCollection",
    // Collection (noun, mobile)
    Collection: "collection",
    // Already collected
    HaveCollected: "haveCollected",
    // Cancel collection (tip)
    DeleteCollectionTip: "deleteCollectionTip",
    // Failed to cancel collection (tip)
    CancelCollectionFailureTip: "cancelCollectionFailureTip",
    // Failed to collect (tip)
    FailureCollectionTip: "failureCollectionTip",
    // Successfully collected (tip)
    SuccessfulCollectionTip: "successfulCollectionTip",
    // Empty collection tip (Add your frequently used documents to favorites for quick access here)
    EmptyCollectionTip: "emptyCollectionTip",
    // No documents have been added to favorites yet
    EmptyCollectionTitle: "emptyCollectionTitle",
    // Collection of documents you frequently use or follow
    EmptyCollectionSuggest: "emptyCollectionSuggest",
    // Add documents you frequently use or follow to favorites to get updates promptly
    DocumentSuggest: "documentSuggest",
    // Display document update dynamics of favorites
    DocumentDynamics: "documentDynamics",
};

export const Anyshare = [
    Names.InformationBar,
    Names.Favorite,
    Names.DocumentDynamics,
    Names.DocumentSuggest,
    Names.EmptyCollectionSuggest,
    Names.EmptyCollectionTitle,
    Names.HaveCollected,
];

export const Mobile = [Names.Collection, , Names.EmptyCollectionTip];

/**
 * Payload
 */
export interface Payload {
    /**
     * Key
     */
    name: string;
    /**
     * Value
     */
    value: JSON;
    /**
     * Other properties
     */
    [index: string]: any;
}

/**
 * Format update list
 * @param {*} updateList Update list
 * @returns [whereConditions, updateSetConditions]
 */
export const formatUpdatePayload = (updateList: ReadonlyArray<Payload>) => {
    return updateList.map((item: Payload) => {
        return [
            [
                {
                    field: Keys.Name,
                    value: item[Keys.Name] as string,
                    valueType: ColumnValueType.String,
                    operator: "=",
                },
            ],
            [
                {
                    field: Keys.Value,
                    value: item[Keys.Value] as JSON,
                    valueType: ColumnValueType.JSON,
                    operator: "=",
                },
            ],
        ];
    });
};

/**
 * Format insert data
 * @param {*} insertList Insert data
 * @returns [fields, fieldsType, values]
 */
export const formatInsertPayload = (insertList: ReadonlyArray<Payload>) => {
    const values = insertList.map((item: Payload) => {
        return [item[Keys.Name], item[Keys.Value]];
    });
    return [
        [Keys.Name, Keys.Value],
        [ColumnValueType.String, ColumnValueType.JSON],
        values,
    ];
};
