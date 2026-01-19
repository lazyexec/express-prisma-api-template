import { Request, Response, NextFunction } from "express";
import i18n from "../utils/i18n";
import env from "../configs/variables";

const i18nMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (env.IS_MULTI_LANGUAGE) {
    const headerLang = req.headers["accept-language"] || req.headers["x-lang"];
    const queryLang = req.query.lang as string;
    let lang = "en";
    if (queryLang) {
      lang = queryLang;
    } else if (typeof headerLang === "string") {
      lang = headerLang.split(",")[0].trim().split("-")[0];
    }

    req.language = lang;
  } else {
    req.language = "en";
  }

  // Attach helper
  req.str = (key, params) => i18n.t(key, params, req.language);

  next();
};

export default i18nMiddleware;
