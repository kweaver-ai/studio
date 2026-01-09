interface Cache {
    [index: string]: any;
}

class Store {
    cache: Cache = {};

    constructor() {}

    /**
     * get data
     * @param dataName data name
     * @returns
     */
    getData(dataName: string) {
        return this.cache[dataName];
    }

    /**
     * update data
     * @param dataName data name
     * @param data data
     */
    updateData(dataName: string, data: any) {
        this.cache[dataName] = data;
    }

    /**
     * delete data
     * @param dataName data name
     */
    deleteData(dataName: string) {
        this.cache[dataName] = null;
        delete this.cache[dataName];
    }
}

export const store = new Store();
