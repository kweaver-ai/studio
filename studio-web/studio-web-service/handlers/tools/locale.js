import { Languages } from "../../core/customname";

/**
 * Get translation based on language
 * @param {*} lang Environment language
 * @param {*} param1 [Simplified Chinese, Traditional Chinese, English]
 * @returns
 */
export const getLocale = (lang, [zhcn, zhtw, enus]) => {
    switch (lang) {
        case Languages.ZHCN:
            return zhcn;
        case Languages.ZHTW:
            return zhtw;
        default:
            return enus;
    }
};
