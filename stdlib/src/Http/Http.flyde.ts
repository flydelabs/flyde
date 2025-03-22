import axios, { AxiosRequestConfig } from "axios";
import { CodeNode, createInputGroup } from "@flyde/core";

const namespace = "HTTP";

export const Http: CodeNode = {
  id: "Http",
  menuDisplayName: "HTTP Request",
  namespace,
  icon: "globe",
  displayName: "HTTP {{method}} to {{url}}",
  description: "Sends an HTTP request",
  inputs: {
    method: {
      defaultValue: "GET",
      label: "Method",
      typeConfigurable: false,
      description: "The HTTP method to use",
      editorType: "select",
      editorTypeData: {
        options: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      },
    },
    url: {
      defaultValue: "https://www.example.com",
      label: "URL",
      description: "The URL to send the request to",
      editorType: "string",
    },
    data: {
      defaultValue: {},
      label: "Request Body",
      description: "The request body data",
      editorType: "json",
      condition: "method !== 'GET'",
    },

    // Advanced settings (collapsible)
    params: {
      defaultValue: {},
      label: "Query Parameters",
      description: "The query parameters to send with the request",
      editorType: "json",
    },
    headers: {
      defaultValue: {},
      label: "Headers",
      description: "The headers to send with the request",
      editorType: "json",
    },
    advancedSettings: {
      group: createInputGroup("Advanced Settings", ["params", "headers"], {
        collapsible: true,
        defaultCollapsed: true,
      }),
    },
  },
  outputs: {
    data: {
      description: "Emits the response data",
    },
  },
  run: (inputs, outputs, adv) => {
    const { method, url, headers, params, data } = inputs;

    const requestConfig: AxiosRequestConfig = {
      url,
      method,
      headers,
      params,
    };

    if (method !== "GET") {
      requestConfig.data = data;
    }
    return axios
      .request(requestConfig)
      .then((res) => outputs.data.next(res.data))
      .catch((e) => {
        if (e.response) {
          adv.onError(
            `HTTP Error ${e.response.status}: ${e.response.statusText}`
          );
        } else if (e.request) {
          adv.onError("No response received from the server");
        } else {
          adv.onError(`Error: ${e.message}`);
        }
      });
  },
};
