import path from "path";
import fs from "fs";
import env from "../configs/variables";
import logger from "./logger";
import authLocale from "../locales/en/auth.json";
import userLocale from "../locales/en/user.json";
import commonLocale from "../locales/en/common.json";

// Define the schema based on default locale
type I18nSchema = {
  auth: typeof authLocale;
  user: typeof userLocale;
  common: typeof commonLocale;
};

// Helper type to generate dot notation keys
type PathImpl<T, K extends keyof T> = K extends string
  ? T[K] extends Record<string, any>
    ? T[K] extends Array<any>
      ? K | `${K}.${PathImpl<T[K], Exclude<keyof T[K], keyof any[]>>}`
      : K | `${K}.${PathImpl<T[K], keyof T[K]>}`
    : K
  : never;

type Path<T> = PathImpl<T, keyof T> | keyof T;

export type I18nKey = Path<I18nSchema>;

class I18n {
  private locales: Record<string, any> = {};
  private defaultLocale = "en";
  private isMultiLanguage = env.IS_MULTI_LANGUAGE;

  constructor() {
    this.loadLocales();
  }

  private loadLocales() {
    try {
      const localesPath = path.join(__dirname, "../locales");
      if (fs.existsSync(localesPath)) {
        const languages = fs.readdirSync(localesPath);
        languages.forEach((lang) => {
          const langPath = path.join(localesPath, lang);
          if (fs.lstatSync(langPath).isDirectory()) {
            this.locales[lang] = {};
            const files = fs.readdirSync(langPath);
            files.forEach((file) => {
              if (file.endsWith(".json")) {
                const fileName = path.basename(file, ".json");
                const content = fs.readFileSync(
                  path.join(langPath, file),
                  "utf-8",
                );
                try {
                  this.locales[lang][fileName] = JSON.parse(content);
                } catch (e) {
                  logger.error(`Error parsing locale file: ${lang}/${file}`, e);
                }
              }
            });
          }
        });
      }
    } catch (error) {
      logger.error("Error loading locales", error);
    }
  }

  public str(
    key: I18nKey,
    params?: Record<string, string | number>,
    lang: string = this.defaultLocale,
  ): string {
    if (!this.isMultiLanguage) {
      lang = this.defaultLocale;
    }

    const strKey = key as string; // Cast because I18nKey is strict but implementation logic is generic
    const keys = strKey.split(".");
    if (keys.length < 2) return strKey;

    const [namespace, ...nestedKeys] = keys;
    let value = this.locales[lang]?.[namespace];

    for (const k of nestedKeys) {
      if (value && typeof value === "object") {
        value = value[k];
      } else {
        value = undefined;
        break;
      }
    }

    // Fallback to default locale if missing in requested lang
    if (value === undefined && lang !== this.defaultLocale) {
      value = this.locales[this.defaultLocale]?.[namespace];
      for (const k of nestedKeys) {
        if (value && typeof value === "object") {
          value = value[k];
        } else {
          value = undefined;
          break;
        }
      }
    }

    if (value === undefined) {
      return strKey;
    }

    if (params) {
      Object.keys(params).forEach((paramKey) => {
        value = value.replace(
          new RegExp(`{{${paramKey}}}`, "g"),
          String(params[paramKey]),
        );
      });
    }

    return value;
  }
}

export default new I18n();
