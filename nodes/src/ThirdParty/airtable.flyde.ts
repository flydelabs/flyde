import { CodeNode, createInputGroup } from "@flyde/core";
import axios from "axios";

export interface AirtableErrorResponse {
  error: {
    message: string;
    type?: string;
    statusCode?: number;
  };
}

export const Airtable: CodeNode = {
  id: "Airtable",
  menuDisplayName: "Airtable",
  namespace: "databases",
  icon: `
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M11.992 1.966c-0.434 0 -0.87 0.086 -1.28 0.257L1.779 5.917c-0.503 0.208 -0.49 0.908 0.012 1.116l8.982 3.558a3.266 3.266 0 0 0 2.454 0l8.982 -3.558c0.503 -0.196 0.503 -0.908 0.012 -1.116l-8.957 -3.694a3.255 3.255 0 0 0 -1.272 -0.257zM23.4 8.056a0.589 0.589 0 0 0 -0.222 0.045l-10.012 3.877a0.612 0.612 0 0 0 -0.38 0.564v8.896a0.6 0.6 0 0 0 0.821 0.552L23.62 18.1a0.583 0.583 0 0 0 0.38 -0.551V8.653a0.6 0.6 0 0 0 -0.6 -0.596zM0.676 8.095a0.644 0.644 0 0 0 -0.48 0.19C0.086 8.396 0 8.53 0 8.69v8.355c0 0.442 0.515 0.737 0.908 0.54l6.27 -3.006 0.307 -0.147 2.969 -1.436c0.466 -0.22 0.43 -0.908 -0.061 -1.092L0.883 8.138a0.57 0.57 0 0 0 -0.207 -0.044z" fill="currentColor"></path></svg>
`,
  displayName: "Airtable {{action}}",
  description: "Interact with Airtable API",
  inputs: {
    authentication: {
      group: createInputGroup("Authentication", ["apiKey", "baseId"], {
        collapsible: true,
        defaultCollapsed: true,
      }),
    },
    apiKey: {
      editorType: "secret",
      editorTypeData: {
        defaultName: "AIRTABLE_API_KEY",
      },
      description: "Airtable API Key",
    },
    baseId: {
      defaultValue: "",
      editorType: "string",
      description: "Airtable Base ID",
    },
    action: {
      defaultValue: "listRecords",
      label: "Action",
      description: "Action to perform on Airtable",
      editorType: "select",
      typeConfigurable: true,
      editorTypeData: {
        options: [
          { label: "List Records", value: "listRecords" },
          { label: "Get Record", value: "getRecord" },
          { label: "Create Record", value: "createRecord" },
          { label: "Update Record", value: "updateRecord" },
        ],
      },
    },
    tableName: {
      defaultValue: "",
      editorType: "string",
      description: "Name of the table",
    },
    recordId: {
      defaultValue: "",
      editorType: "string",
      description: "ID of the record",
      condition: "action === 'getRecord' || action === 'updateRecord'",
    },
    fields: {
      defaultValue: {},
      editorType: "json",
      description: "Fields data as JSON object",
      condition: "action === 'createRecord' || action === 'updateRecord'",
    },
    maxRecords: {
      defaultValue: 100,
      editorType: "number",
      description: "Maximum number of records to retrieve",
      condition: "action === 'listRecords'",
    },
    filterFormula: {
      defaultValue: "",
      editorType: "string",
      description: "Filter formula in Airtable formula language",
      condition: "action === 'listRecords'",
    },
    additionalOptions: {
      group: createInputGroup(
        "Additional Options",
        ["maxRecords", "filterFormula"],
        {
          collapsible: true,
          defaultCollapsed: true,
        }
      ),
      condition: "action === 'listRecords'",
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
      baseId,
      action,
      tableName,
      recordId,
      fields,
      maxRecords,
      filterFormula,
    } = inputs;

    if (!apiKey) {
      throw new Error("Airtable API key is required");
    }

    if (!baseId) {
      throw new Error("Airtable base ID is required");
    }

    if (!tableName) {
      throw new Error("Table name is required");
    }

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    const baseUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(
      tableName
    )}`;

    let url = baseUrl;
    let method = "GET";
    let data = undefined;

    try {
      switch (action) {
        case "listRecords": {
          const params = new URLSearchParams();
          if (maxRecords) {
            params.append("maxRecords", maxRecords.toString());
          }
          if (filterFormula) {
            params.append("filterByFormula", filterFormula);
          }

          const paramString = params.toString();
          url = paramString ? `${baseUrl}?${paramString}` : baseUrl;
          break;
        }
        case "getRecord":
          if (!recordId) {
            throw new Error("Record ID is required for getting a record");
          }
          url = `${baseUrl}/${recordId}`;
          break;

        case "createRecord":
          if (!fields || Object.keys(fields).length === 0) {
            throw new Error("Fields are required for creating a record");
          }
          method = "POST";
          data = { fields };
          break;

        case "updateRecord":
          if (!recordId) {
            throw new Error("Record ID is required for updating a record");
          }
          if (!fields || Object.keys(fields).length === 0) {
            throw new Error("Fields are required for updating a record");
          }
          method = "PATCH";
          url = `${baseUrl}/${recordId}`;
          data = { fields };
          break;

        default:
          throw new Error(`Unsupported action: ${action}`);
      }

      const res = await axios({
        method,
        url,
        headers,
        data,
      });

      outputs.result.next(res.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as AirtableErrorResponse;
        adv.onError(
          `Airtable API Error ${error.response.status}: ${errorData.error?.message || error.response.statusText
          }`
        );
        return;
      }
      adv.onError(`Error: ${(error as Error).message}`);
    }
  },
};
