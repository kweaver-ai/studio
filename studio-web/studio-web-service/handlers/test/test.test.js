import { test } from '../test';
import { res } from '../mockPath/db.mock';

describe('test', () => {
    it('Parameters are {}, res', () => {
        test({}, res)
        expect(res.status.mock.calls[0][0]).toBe(200)
    });
});