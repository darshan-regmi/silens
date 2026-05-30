declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_NOTION_API_TOKEN: string;
      EXPO_PUBLIC_NOTION_DATABASE_ID: string;
      EXPO_PUBLIC_NOTION_API_VERSION: string;
      EXPO_PUBLIC_NOTION_BASE_URL: string;
    }
  }
}

export {};
