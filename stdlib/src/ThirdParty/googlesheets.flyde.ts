import {
  createInputGroup,
  CodeNode,
} from "@flyde/core";
import axios from "axios";

export interface GoogleSheetsErrorResponse {
  error: {
    message: string;
    code: string;
    status?: string;
  };
}

export const GoogleSheets: CodeNode = {
  id: "GoogleSheets",
  menuDisplayName: "Google Sheets",
  namespace: "spreadsheets",
  icon: `table-cells`,
  displayName: "Google Sheets {{action}}",
  description: "Interact with Google Sheets API",
  inputs: {
    authentication: {
      group: createInputGroup(
        "Authentication",
        ["authMethod", "accessToken", "serviceAccountKey"],
        {
          collapsible: true,
          defaultCollapsed: true,
        }
      ),
    },
    authMethod: {
      defaultValue: "oauth",
      label: "Authentication Method",
      description: "Method to authenticate with Google Sheets API",
      editorType: "select",
      editorTypeData: {
        options: ["oauth", "serviceAccount"],
      },
    },
    accessToken: {
      editorType: "secret",
      editorTypeData: {
        defaultName: "GOOGLE_ACCESS_TOKEN",
      },
      description: "OAuth Access Token for Google API",
      condition: "authMethod === 'oauth'",
    },
    serviceAccountKey: {
      editorType: "secret",
      editorTypeData: {
        defaultName: "GOOGLE_SERVICE_ACCOUNT_KEY",
      },
      description: "Service Account JSON key file contents",
      condition: "authMethod === 'serviceAccount'",
    },
    action: {
      defaultValue: "getValues",
      label: "Action",
      typeConfigurable: true,
      description: "Action to perform on the spreadsheet",
      editorType: "select",
      editorTypeData: {
        options: [
          { label: "Get Values", value: "getValues" },
          { label: "Update Values", value: "updateValues" },
          { label: "Append Values", value: "appendValues" },
          { label: "Clear Values", value: "clearValues" },
          { label: "Create Sheet", value: "createSheet" },
        ],
      },
    },
    spreadsheetId: {
      defaultValue: "",
      editorType: "string",
      description: "ID of the Google Sheet document (found in the URL)",
    },
    range: {
      defaultValue: "Sheet1!A1:D5",
      editorType: "string",
      description: "Cell range (e.g., Sheet1!A1:D5)",
      condition: "action !== 'createSheet'",
    },
    values: {
      defaultValue: [["Data", "In", "A", "Table"]],
      editorType: "json",
      description: "Data to write as a 2D array",
      condition: "action === 'updateValues' || action === 'appendValues'",
    },
    valueInputOption: {
      defaultValue: "RAW",
      editorType: "select",
      editorTypeData: {
        options: ["RAW", "USER_ENTERED"],
      },
      description: "How input data should be interpreted",
      condition: "action === 'updateValues' || action === 'appendValues'",
    },
    title: {
      defaultValue: "New Spreadsheet",
      editorType: "string",
      description: "Title for the new spreadsheet",
      condition: "action === 'createSheet'",
    },
    sheetProperties: {
      defaultValue: {
        title: "Sheet1",
        gridProperties: { rowCount: 100, columnCount: 20 },
      },
      editorType: "json",
      description: "Properties for the new sheet",
      condition: "action === 'createSheet'",
    },
    additionalOptions: {
      group: createInputGroup("Additional Options", ["valueInputOption"], {
        collapsible: true,
        defaultCollapsed: true,
      }),
      condition: "action === 'updateValues' || action === 'appendValues'",
    },
  },
  outputs: {
    result: {
      description: "Operation result data",
    },
  },
  run: async (inputs, outputs, adv) => {
    const {
      authMethod,
      accessToken,
      serviceAccountKey,
      action,
      spreadsheetId,
      range,
      values,
      valueInputOption,
      title,
      sheetProperties,
    } = inputs;

    if (authMethod === "oauth" && !accessToken) {
      throw new Error(
        "OAuth access token is required when using OAuth authentication"
      );
    }

    if (authMethod === "serviceAccount" && !serviceAccountKey) {
      throw new Error(
        "Service account key is required when using service account authentication"
      );
    }

    if (!spreadsheetId && action !== "createSheet") {
      throw new Error("spreadsheetId is required");
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Set auth headers based on selected method
    if (authMethod === "oauth") {
      headers.Authorization = `Bearer ${accessToken}`;
    } else if (authMethod === "serviceAccount") {
      try {
        // Parse the service account key
        const serviceAccount = JSON.parse(serviceAccountKey);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore-error - type should be a peer-dependency
        const { JWT } = await import("google-auth-library");

        // Create a JWT client using the service account credentials
        const jwtClient = new JWT({
          email: serviceAccount.client_email,
          key: serviceAccount.private_key,
          scopes: [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive",
          ],
        });

        // Authorize the client and get an access token
        const token = await jwtClient.getAccessToken();
        if (!token.token) {
          throw new Error("Failed to obtain access token from service account");
        }

        // Set the authorization header with the token
        headers.Authorization = `Bearer ${token.token}`;
      } catch (error) {
        if (error instanceof SyntaxError) {
          throw new Error("Invalid service account key JSON format");
        }
        adv.onError(
          `Service account authentication error: ${(error as Error).message}`
        );
        return;
      }
    }

    let url = "";
    let method = "GET";
    let data = undefined;

    // Build request based on action
    switch (action) {
      case "getValues":
        url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
        break;

      case "updateValues":
        url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
        url += `?valueInputOption=${valueInputOption}`;
        method = "PUT";
        data = { values };
        break;

      case "appendValues":
        url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append`;
        url += `?valueInputOption=${valueInputOption}`;
        method = "POST";
        data = { values };
        break;

      case "clearValues":
        url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:clear`;
        method = "POST";
        break;

      case "createSheet":
        url = `https://sheets.googleapis.com/v4/spreadsheets`;
        method = "POST";
        data = {
          properties: { title },
          sheets: [{ properties: sheetProperties }],
        };
        break;

      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    try {
      const res = await axios({
        method,
        url,
        headers,
        data,
      });
      outputs.result.next(res.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as GoogleSheetsErrorResponse;
        adv.onError(
          `Google Sheets API Error ${error.response.status}: ${errorData.error?.message || error.response.statusText
          }`
        );
        return;
      }
      adv.onError(`Error: ${(error as Error).message}`);
    }
  },
};
