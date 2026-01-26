import { ColumnValueType } from "../common/sqltools";

export const TableName = "custom_name";

export const Keys = {
    // Shared name
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
    // Query client part nouns
    Anyshare: "anyshare",
    // Query mobile part nouns
    Mobile: "mobile",
};

export const languagesList = ["zh-cn", "zh-tw", "en-us"];

export const Names = {
    // Information bar
    InformationBar: "informationBar",
    // Favorites
    Favorite: "favorite",
    // Collect (verb meaning, corresponds to cancel collection)
    StoreUp: "storeUp",
    // Cancel collection (verb)
    CancelCollection: "cancelCollection",
    // Collection (noun, mobile)
    Collection: "collection",
    // Already collected
    HaveCollected: "haveCollected",
    // Cancel collection (tip)
    DeleteCollectionTip: "deleteCollectionTip",
    // Cancel collection failed (tip)
    CancelCollectionFailureTip: "cancelCollectionFailureTip",
    // Collection failed (tip)
    FailureCollectionTip: "failureCollectionTip",
    // Collection successful (tip)
    SuccessfulCollectionTip: "successfulCollectionTip",
    // Empty collection tip (Add your frequently used documents to favorites for quick access here)
    EmptyCollectionTip: "emptyCollectionTip",
    // No documents have been added to favorites yet
    EmptyCollectionTitle: "emptyCollectionTitle",
    // Your frequently used or followed document collections
    EmptyCollectionSuggest: "emptyCollectionSuggest",
    // Add your frequently used or followed documents to favorites to get updates in time
    DocumentSuggest: "documentSuggest",
    // Display document update dynamics in favorites
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
     * key
     */
    name: string;
    /**
     * value
     */
    value: JSON;
    /**
     * other value
     */
    [index: string]: any;
}

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
