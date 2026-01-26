import { Languages } from "../../core/customname";

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
