import {
  createInputGroup,
  CodeNode,
} from "@flyde/core";
import axios from "axios";

export interface TavilyErrorResponse {
  error: {
    message: string;
    type?: string;
    code?: string;
  };
}

export const Tavily: CodeNode = {
  id: "Tavily",
  menuDisplayName: "Tavily",
  namespace: "search",
  icon: `<svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9.22746 0.509739L12.091 5.0427C12.5507 5.77123 12.0281 6.7203 11.1669 6.7203H9.99556V13.5069H8.30225V0C8.6572 0 9.01216 0.169913 9.22746 0.509739Z" fill="currentColor" opacity="0.5"/>
<path d="M4.51534 5.04329L7.37884 0.509753C7.47683 0.352979 7.61327 0.223855 7.7752 0.134641C7.93713 0.0454272 8.11917 -0.000915425 8.30405 1.37007e-05V13.5069C8.25521 13.5045 8.20631 13.5034 8.15741 13.5035C7.58134 13.5035 7.04774 13.6844 6.61074 13.9934V6.72031H5.43938C4.57818 6.72031 4.05448 5.77124 4.51475 5.04329H4.51534Z" fill="currentColor"/>
<path d="M17.2797 17.9882H10.1532C10.582 17.5252 10.8333 16.9254 10.8625 16.2949H24C24 16.6499 23.83 17.0048 23.4908 17.2201L18.9567 20.0831C18.2287 20.5433 17.2791 20.0202 17.2791 19.159L17.2797 17.9882Z" fill="currentColor"/>
<path d="M18.9567 12.5068L23.4897 15.3703C23.8301 15.585 23.9994 15.94 23.9994 16.295H10.8625C10.8915 15.6904 10.7156 15.0938 10.3633 14.6016H17.2803V13.4315C17.2803 12.5702 18.2287 12.0465 18.9567 12.5068Z" fill="currentColor" opacity="0.5"/>
<path d="M4.45596 19.8789L0.320435 24.015C0.450457 24.1462 0.611806 24.2419 0.789196 24.2933C0.966585 24.3446 1.15414 24.3498 1.33409 24.3083L6.56474 23.1271C7.40442 22.938 7.70584 21.8969 7.09718 21.2883L6.26914 20.4602L9.38577 17.3436C9.69171 17.0375 9.86358 16.6225 9.86358 16.1897C9.86358 15.757 9.69171 15.3419 9.38577 15.0358L9.34271 14.9922L4.45596 19.8789Z" fill="currentColor" opacity="0.5"/>
<path d="M3.87574 18.0654L6.99178 14.9488C7.14335 14.7972 7.32329 14.677 7.52133 14.595C7.71936 14.5129 7.93162 14.4707 8.14597 14.4707C8.36033 14.4707 8.57258 14.5129 8.77062 14.595C8.96865 14.677 9.14859 14.7972 9.30016 14.9488L9.34322 14.9919L4.45705 19.878L0.320948 24.0141C0.189818 23.8841 0.0940548 23.7228 0.042732 23.5454C-0.00859082 23.368 -0.0137739 23.1804 0.0276738 23.0005L1.20834 17.7698C1.39745 16.9296 2.43904 16.6287 3.04771 17.2374L3.87574 18.0654Z" fill="currentColor"/>
</svg>
`,
  displayName: "Tavily {{action}}",
  description: "AI-powered search capabilities",
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
        defaultName: "TAVILY_API_KEY",
      },
      description: "Tavily API Key",
    },
    action: {
      defaultValue: "search",
      label: "Action",
      typeConfigurable: true,
      description: "Action to perform with Tavily",
      editorType: "select",
      editorTypeData: {
        options: [
          { label: "Search", value: "search" },
          { label: "Question Answer", value: "questionAnswer" },
        ],
      },
    },
    query: {
      defaultValue: "",
      editorType: "string",
      description: "Search query or question",
    },
    searchDepth: {
      defaultValue: "basic",
      editorType: "select",
      editorTypeData: {
        options: ["basic", "advanced"],
      },
      description: "Depth of search (basic or advanced)",
    },
    maxResults: {
      defaultValue: 5,
      editorType: "number",
      description: "Maximum number of results to return",
    },
    includeDomains: {
      defaultValue: [],
      editorType: "json",
      description: "Array of domains to include in search",
    },
    excludeDomains: {
      defaultValue: [],
      editorType: "json",
      description: "Array of domains to exclude from search",
    },
    searchOptions: {
      group: createInputGroup(
        "Search Options",
        ["searchDepth", "maxResults", "includeDomains", "excludeDomains"],
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
    const {
      apiKey,
      action,
      query,
      searchDepth,
      maxResults,
      includeDomains,
      excludeDomains,
    } = inputs;

    if (!apiKey) {
      throw new Error("Tavily API key is required");
    }

    if (!query) {
      throw new Error("Query is required");
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    const baseUrl = "https://api.tavily.com/v1";

    let endpoint = "";
    const method = "POST";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = { query };

    try {
      switch (action) {
        case "search":
          endpoint = "/search";

          if (searchDepth) {
            data.search_depth = searchDepth;
          }

          if (maxResults) {
            data.max_results = maxResults;
          }

          if (
            includeDomains &&
            Array.isArray(includeDomains) &&
            includeDomains.length > 0
          ) {
            data.include_domains = includeDomains;
          }

          if (
            excludeDomains &&
            Array.isArray(excludeDomains) &&
            excludeDomains.length > 0
          ) {
            data.exclude_domains = excludeDomains;
          }
          break;

        case "questionAnswer":
          endpoint = "/question";

          if (searchDepth) {
            data.search_depth = searchDepth;
          }

          if (
            includeDomains &&
            Array.isArray(includeDomains) &&
            includeDomains.length > 0
          ) {
            data.include_domains = includeDomains;
          }

          if (
            excludeDomains &&
            Array.isArray(excludeDomains) &&
            excludeDomains.length > 0
          ) {
            data.exclude_domains = excludeDomains;
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
        const errorData = error.response.data as TavilyErrorResponse;
        adv.onError(
          `Tavily API Error ${error.response.status}: ${errorData.error?.message || error.response.statusText
          }`
        );
        return;
      }
      adv.onError(`Error: ${(error as Error).message}`);
    }
  }
};
