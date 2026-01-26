import * as fs from "fs";
import * as path from "path";
import logger from "../common/logger";

/**
 * get default oemconfig
 */
export const getOemconfig = async (req, res) => {
    try {
        const { product, section } = req.query;

        // Validate required parameters
        if (!product || !section) {
            res.status(400);
            res.set("Content-Type", "application/json");
            logger.error("Both product and section parameters are required");
            res.json({
                cause: "Missing required parameters",
                message: "Both product and section parameters are required",
            });
            res.end();
            return;
        }

        // Build file path
        const filePath = path.resolve(
            __dirname,
            "./default-oemconfigs",
            product,
            `${section}.section.json`
        );

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            res.status(404);
            res.set("Content-Type", "application/json");
            logger.error(`File not found: ${product}/${section}.section.json`);
            res.json({
                cause: "File does not exist",
                message: `File not found: ${product}/${section}.section.json`,
            });
            res.end();
            return;
        }

        // Read and parse JSON file
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const jsonData = JSON.parse(fileContent);

        // Return JSON data
        res.status(200);
        res.set("Content-Type", "application/json");
        res.json(jsonData);
        res.end();
    } catch (error) {
        // Handle JSON parsing errors or other errors
        res.status(500);
        res.set("Content-Type", "application/json");
        logger.error("Internal error");
        res.json({
            cause: "Server error",
            message:
                error.message ||
                "An error occurred while reading the configuration file",
        });
        res.end();
    }
};
