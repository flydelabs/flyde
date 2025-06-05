import axios from "axios";
import { CodeNode } from "@flyde/core";

interface WebflowErrorResponse {
  msg: string;
  code: number;
}

export const WebflowAddItem: CodeNode = {
  id: "WebflowAddItem",
  menuDisplayName: "Webflow Add Item",
  namespace: "integrations",
  icon: "fa-solid fa-file-circle-plus",
  displayName: "Webflow Add Item",
  description: "Adds an item to a Webflow collection",
  inputs: {
    apiToken: {
      defaultValue: "$secrets.WEBFLOW_API_TOKEN",
      editorType: "string",
      description: "Webflow API Token",
    },
    collectionId: {
      defaultValue: "",
      editorType: "string",
      description: "Webflow Collection ID",
    },
    fields: {
      defaultValue: {},
      editorType: "json",
      description: "Field data for the new item",
    },
  },
  outputs: {
    result: {
      description: "Result of the operation",
    },
  },
  run: async (inputs, outputs, adv) => {
    const { apiToken, collectionId, fields } = inputs;

    const headers = {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    };

    const data = {
      fieldData: fields,
    };

    try {
      const res = await axios.post(
        `https://api.webflow.com/v2/collections/${collectionId}/items`,
        data,
        { headers }
      );
      outputs.result.next(res.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as WebflowErrorResponse;
        throw new Error(
          `Webflow API Error ${error.response.status}: ${
            errorData.msg || error.response.statusText
          }`
        );
      }
      throw error;
    }
  },
};
