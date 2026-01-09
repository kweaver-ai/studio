import * as fs from "fs";
import multer from "multer";
import * as path from "path";

const createFolder = function (folder) {
    try {
        fs.accessSync(folder);
    } catch (e) {
        fs.mkdirSync(folder);
    }
};

const uploadFolder = path.resolve("/AnyShare/tmp", "../tmp");
createFolder(uploadFolder);

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         // Save path
//         const folder = path.resolve(__dirname, uploadFolder, Date.now().toString())
//         createFolder(folder)
//         cb(null, folder);
//     },
//     filename: (req, file, cb) => {
//         // Save name
//         cb(null, file.originalname);
//     }
// });

const storage = multer.memoryStorage();

// Customize upload behavior through storage options
export const multerUtil = multer({ storage });
