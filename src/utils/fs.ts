import fs from "fs";
import env from "../configs/variables";
import path from "path";

const createFolder = (folderPath: string) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
};

const deleteFolder = (folderPath: string) => {
  if (fs.existsSync(folderPath)) {
    fs.rmdirSync(folderPath, { recursive: true });
  }
};

const sanitizePath = (path: string) => {
  return path.replace(/\\/g, "/").replace("public", "");
};

const deleteLocalFile = async (fileUrl?: string) => {
  if (!fileUrl) return;
  const relativePath = fileUrl
    .replace(env.BACKEND_URL, "")
    .replace("/public", "");
  const absolutePath = path.join(process.cwd(), "public", relativePath);

  try {
    fs.unlinkSync(absolutePath);
  } catch (err: any) {
    if (err.code !== "ENOENT") {
      console.error("Failed to delete file:", absolutePath, err);
    }
  }
};
export default {
  createFolder,
  deleteFolder,
  sanitizePath,
  deleteLocalFile,
};
