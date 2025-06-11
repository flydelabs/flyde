import {
  CodeNode,
  createInputGroup,
} from "@flyde/core";
import axios from "axios";

export interface FirecrawlErrorResponse {
  error: {
    message: string;
    code?: string;
    status?: number;
  };
}

export const Firecrawl: CodeNode = {
  id: "Firecrawl",
  menuDisplayName: "Firecrawl",
  namespace: "webscraping",
  icon: `fire`,
  displayName: "Firecrawl {{action}}",
  description: "Turn websites into LLM-ready data",
  inputs: {
    authentication: {
      group: createInputGroup("Authentication", ["apiKey"], {
        collapsible: true,
        defaultCollapsed: true,
      }),
    },
    apiKey: {
      editorType: "secret",
      editorTypeData: {
        defaultName: "FIRECRAWL_API_KEY",
      },
      description: "Firecrawl API Key",
    },
    action: {
      defaultValue: "scrape",
      label: "Action",
      typeConfigurable: true,
      description: "Action to perform with Firecrawl",
      editorType: "select",
      editorTypeData: {
        options: [
          { label: "Scrape URL", value: "scrape" },
          { label: "Crawl Website", value: "crawl" },
          { label: "Extract Structured Data", value: "extractJson" },
        ],
      },
    },
    url: {
      defaultValue: "",
      editorType: "string",
      description: "URL to scrape or crawl",
    },
    maxPages: {
      defaultValue: 10,
      editorType: "number",
      description: "Maximum number of pages to crawl",
      condition: "action === 'crawl'",
    },
    wait: {
      defaultValue: true,
      editorType: "boolean",
      description: "Whether to wait for JavaScript to load",
    },
    extractionPrompt: {
      defaultValue: "",
      editorType: "longtext",
      description: "Prompt for structured data extraction",
      condition: "action === 'extractJson'",
    },
    additionalOptions: {
      group: createInputGroup(
        "Additional Options",
        ["wait", "maxPages", "extractionPrompt"],
        {
          collapsible: true,
          defaultCollapsed: true,
        }
      ),
    },
  },
  outputs: {
    result: {
      description: "Operation result data",
    },
  },
  run: async (inputs, outputs, adv) => {
    const { apiKey, action, url, maxPages, wait, extractionPrompt } = inputs;

    if (!apiKey) {
      throw new Error("Firecrawl API key is required");
    }

    if (!url) {
      throw new Error("URL is required");
    }

    const headers = {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    };

    const baseUrl = "https://api.firecrawl.dev/v1";

    let endpoint = "";
    const method = "POST";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = { url };

    try {
      switch (action) {
        case "scrape":
          endpoint = "/scrape";
          if (wait !== undefined) {
            data.wait = wait;
          }
          break;

        case "crawl":
          endpoint = "/crawl";
          if (maxPages) {
            data.maxPages = maxPages;
          }
          if (wait !== undefined) {
            data.wait = wait;
          }
          break;

        case "extractJson":
          endpoint = "/extract-json";
          if (extractionPrompt) {
            data.prompt = extractionPrompt;
          }
          if (wait !== undefined) {
            data.wait = wait;
          }
          break;

        default:
          throw new Error(`Unsupported action: ${action}`);
      }

      const res = await axios({
        method,
        url: baseUrl + endpoint,
        headers,
        data,
      });

      outputs.result.next(res.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as FirecrawlErrorResponse;
        adv.onError(
          `Firecrawl API Error ${error.response.status}: ${errorData.error?.message || error.response.statusText
          }`
        );
        return;
      }
      adv.onError(`Error: ${(error as Error).message}`);
    }
  }
};

