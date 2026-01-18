import { File } from "multer";

declare global {
  namespace Express {
    interface MulterFiles {
      avatar?: Express.Multer.File[];
      content?: Express.Multer.File[];
      documents?: Express.Multer.File[];
      logo?: Express.Multer.File[];
    }

    interface Request {
      files?: MulterFiles;
    }
  }
}
