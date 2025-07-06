import {
  createInputGroup,
  CodeNode,
} from "@flyde/core";
import axios from "axios";

export interface NotionErrorResponse {
  error: {
    message: string;
    code?: string;
    status?: number;
  };
}

export const Notion: CodeNode = {
  id: "Notion",
  menuDisplayName: "Notion",
  namespace: "integrations",
  icon: `
<svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M15.3833 0.0570475L1.50874 1.07879C0.38941 1.17528 0 1.90453 0 2.77851V17.9433C0 18.6241 0.242472 19.2066 0.827465 19.9851L4.08893 24.2133C4.62478 24.894 5.11198 25.04 6.13503 24.9915L22.2473 24.019C23.6096 23.9223 24 23.2898 24 22.2208V5.16024C24 4.60774 23.7811 4.44849 23.1367 3.977L18.5972 0.786039C17.5257 0.00929803 17.0877 -0.0889508 15.3833 0.0567975V0.0570475ZM6.49936 4.88099C5.18369 4.96924 4.8853 4.98924 4.13808 4.3835L2.23842 2.87701C2.04534 2.68202 2.14238 2.43877 2.62883 2.39027L15.9668 1.41853C17.0869 1.32103 17.6701 1.71028 18.1082 2.05027L20.3958 3.70275C20.4936 3.752 20.7368 4.04275 20.4442 4.04275L6.66987 4.86949L6.49936 4.88099ZM4.96554 22.075V7.59196C4.96554 6.95946 5.16037 6.66772 5.74361 6.61872L21.5642 5.69523C22.1008 5.64698 22.3433 5.98698 22.3433 6.61847V21.005C22.3433 21.6375 22.2455 22.1725 21.3697 22.2208L6.23031 23.0958C5.35445 23.144 4.96579 22.8533 4.96579 22.075H4.96554ZM19.9101 8.36845C20.0071 8.80594 19.9101 9.24344 19.4713 9.29344L18.7416 9.43769V20.1308C18.1079 20.4708 17.5247 20.6651 17.0373 20.6651C16.2582 20.6651 16.0636 20.4218 15.4801 19.6933L10.7084 12.2084V19.4501L12.2179 19.7908C12.2179 19.7908 12.2179 20.6658 11 20.6658L7.64252 20.86C7.54473 20.6651 7.64252 20.1793 7.98278 20.0826L8.85964 19.8401V10.2652L7.64277 10.1669C7.54498 9.72943 7.7882 9.09769 8.47023 9.04869L12.0727 8.80694L17.0375 16.3886V9.68118L15.772 9.53618C15.6742 9.00044 16.0636 8.6112 16.5501 8.5637L19.9101 8.36845Z" fill="currentColor"/>
</svg>

`,
  displayName: "Notion {{action}}",
  description: "Interact with Notion API",
  inputs: {
    apiKey: {
      editorType: "secret",
      editorTypeData: {
        defaultName: "NOTION_API_KEY",
      },
      description: "Notion API Key",
    },
    action: {
      defaultValue: "queryDatabase",
      label: "Action",
      typeConfigurable: true,
      description: "Action to perform with Notion",
      editorType: "select",
      editorTypeData: {
        options: [
          { label: "Query Database", value: "queryDatabase" },
          { label: "Create Page", value: "createPage" },
          { label: "Update Page", value: "updatePage" },
          { label: "Retrieve Page", value: "retrievePage" },
          { label: "Search", value: "search" },
        ],
      },
    },
    databaseId: {
      defaultValue: "",
      editorType: "string",
      description: "Notion Database ID",
      condition: "action === 'queryDatabase' || action === 'createPage'",
    },
    pageId: {
      defaultValue: "",
      editorType: "string",
      description: "Notion Page ID",
      condition: "action === 'updatePage' || action === 'retrievePage'",
    },
    filter: {
      defaultValue: {},
      editorType: "json",
      description: "Filter for database query",
      condition: "action === 'queryDatabase'",
    },
    sorts: {
      defaultValue: [],
      editorType: "json",
      description: "Sort options for database query",
      condition: "action === 'queryDatabase'",
    },
    properties: {
      defaultValue: {},
      editorType: "json",
      description: "Page properties",
      condition: "action === 'createPage' || action === 'updatePage'",
    },
    content: {
      defaultValue: [],
      editorType: "json",
      description: "Page content blocks",
      condition: "action === 'createPage' || action === 'updatePage'",
    },
    query: {
      defaultValue: "",
      editorType: "string",
      description: "Search query",
      condition: "action === 'search'",
    },
    searchOptions: {
      group: createInputGroup("Search Options", ["query"], {
        collapsible: true,
        defaultCollapsed: true,
      }),
      condition: "action === 'search'",
    },
    pageOptions: {
      group: createInputGroup("Page Options", ["properties", "content"], {
        collapsible: true,
        defaultCollapsed: true,
      }),
      condition: "action === 'createPage' || action === 'updatePage'",
    },
  },
  outputs: {
    result: {
      description: "Operation result",
    },
  },
  run: async (inputs, outputs, adv) => {
    const {
      apiKey,
      action,
      databaseId,
      pageId,
      filter,
      sorts,
      properties,
      content,
      query,
    } = inputs;

    if (!apiKey) {
      throw new Error("Notion API key is required");
    }

    try {
      let url = "";
      let method = "GET";
      let data: Record<string, unknown> = {};

      switch (action) {
        case "queryDatabase":
          if (!databaseId) {
            throw new Error("Database ID is required for querying a database");
          }
          url = `https://api.notion.com/v1/databases/${databaseId}/query`;
          method = "POST";

          if (filter && Object.keys(filter).length > 0) {
            data.filter = filter;
          }

          if (sorts && Array.isArray(sorts) && sorts.length > 0) {
            data.sorts = sorts;
          }
          break;

        case "createPage":
          if (!databaseId) {
            throw new Error("Database ID is required for creating a page");
          }
          url = "https://api.notion.com/v1/pages";
          method = "POST";
          data = {
            parent: { database_id: databaseId },
            properties: properties || {},
          };

          if (content && Array.isArray(content) && content.length > 0) {
            data.children = content;
          }
          break;

        case "updatePage":
          if (!pageId) {
            throw new Error("Page ID is required for updating a page");
          }
          url = `https://api.notion.com/v1/pages/${pageId}`;
          method = "PATCH";
          data = {
            properties: properties || {},
          };

          if (content && Array.isArray(content) && content.length > 0) {
            data.children = content;
          }
          break;

        case "retrievePage":
          if (!pageId) {
            throw new Error("Page ID is required for retrieving a page");
          }
          url = `https://api.notion.com/v1/pages/${pageId}`;
          method = "GET";
          break;

        case "search":
          url = "https://api.notion.com/v1/search";
          method = "POST";

          if (query) {
            data.query = query;
          }
          break;

        default:
          throw new Error(`Unsupported action: ${action}`);
      }

      const response = await axios({
        method,
        url,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        data: method !== "GET" ? data : undefined,
      });

      outputs.result.next(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as NotionErrorResponse;
        adv.onError(
          `Notion API Error ${error.response.status}: ${errorData?.error?.message || error.response.statusText
          }`
        );
        return;
      }
      adv.onError(`Error: ${(error as Error).message}`);
    }
  }
};

