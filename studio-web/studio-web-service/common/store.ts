interface Cache {
    [index: string]: any;
}

class Store {
    cache: Cache = {};

    constructor() {}

    /**
     * Get data
     * @param dataName Data name
     * @returns
     */
    getData(dataName: string) {
        return this.cache[dataName];
    }

    /**
     * Update data
     * @param dataName Data name
     * @param data Data
     */
    updateData(dataName: string, data: any) {
        this.cache[dataName] = data;
    }

    /**
     * Delete data
     * @param dataName Data name
     */
    deleteData(dataName: string) {
        this.cache[dataName] = null;
        delete this.cache[dataName];
    }
}

export const store = new Store();
