import multer from "multer";
import type { FileFilterCallback } from "multer";
import path from "path";
import fs from "../utils/fs";
import allowedTypes from "../utils/fileTypes";
import ApiError from "../utils/ApiError";
import httpStatus from "http-status";

export default function userUploadMiddleware(UPLOADS_FOLDER: string) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        fs.createFolder(UPLOADS_FOLDER);
      } catch (error) {
        console.error("Error creating upload folder:", error);
      }
      cb(null, UPLOADS_FOLDER);
    },
    filename: (req, file, cb) => {
      const fileExt = path.extname(file.originalname);
      const filename =
        file.originalname
          .replace(fileExt, "")
          .toLowerCase()
          .split(" ")
          .join("-") +
        "-" +
        Date.now();

      cb(null, filename + fileExt);
    },
  });

  const upload = multer({
    storage,
    limits: {
      fileSize: 20 * 1024 * 1024, // 20MB
    },
    fileFilter: (req, file, cb: FileFilterCallback) => {
      const field: string = file.fieldname;
      const allowed: string[] | undefined = allowedTypes[field];

      if (!allowed) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Invalid Type: ${field}`);
      }

      const isValid = allowed.some((t: string) =>
        t.endsWith("/*")
          ? file.mimetype.startsWith(t.replace("/*", ""))
          : file.mimetype === t
      );

      if (!isValid) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Invalid file type for ${field}`
        );
      }

      cb(null, true);
    },
  });

  return upload;
}
