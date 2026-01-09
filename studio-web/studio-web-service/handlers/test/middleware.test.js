const { jsonOnly } = require("../middleware");
import { res } from "../mockPath/db.mock";

describe("jsonOnly", () => {
    it("Parameters are {}, res, () => { }", () => {
        jsonOnly({}, res, () => {});
    });
});
