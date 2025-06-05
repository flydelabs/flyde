import { CodeNode } from "@flyde/core";

export type SelectorType = "text" | "html" | "attribute" | "list" | "table";

export interface SelectorConfig {
  selector: string;
  type: SelectorType;
  attribute?: string;
  children?: {
    [key: string]: Omit<SelectorConfig, "children">;
  };
}

export const scrape: CodeNode = {
  id: "Scrape",
  menuDisplayName: "Scrape",
  namespace: "web",
  displayName: "Playwright Scraper",
  description:
    "Scrape data from websites using Playwright's powerful automation capabilities",
  icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`,
  inputs: {
    url: {
      defaultValue: "https://example.com",
      editorType: "string",
      description: "URL to scrape",
    },
    selectors: {
      defaultValue: {
        title: {
          selector: "h1",
          type: "text",
        },
        articles: {
          selector: ".article",
          type: "list",
          children: {
            title: { selector: "h2", type: "text" },
            link: { selector: "a", type: "attribute", attribute: "href" },
          },
        },
      },
      editorType: "json",
      description: "CSS selectors to extract data",
    },
    timeout: {
      defaultValue: 30000,
      editorType: "number",
      description: "Timeout in milliseconds",
    },
    userAgent: {
      defaultValue: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      editorType: "string",
      description: "User agent string",
    },
    viewport: {
      defaultValue: { width: 1920, height: 1080 },
      editorType: "json",
      description: "Browser viewport dimensions",
    },
  },
  outputs: {
    result: {
      description: "Scraped data",
    },
  },
  run: async (inputs, outputs, adv) => {
    // This is a placeholder for actual implementation
    // In a real implementation, you would:
    // 1. Import playwright
    // 2. Launch a browser
    // 3. Navigate to the URL
    // 4. Extract data using selectors
    // 5. Return the result

    throw new Error("Not implemented in this environment. This node requires server-side implementation with Playwright.");
  },
};
