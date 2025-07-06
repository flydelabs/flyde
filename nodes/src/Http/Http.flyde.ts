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
  aliases: ["Http", "get", "post", "put", "delete", "patch"],
  inputs: {
    method: {
      defaultValue: "GET",
      label: "Method",
      typeConfigurable: false,
      description: "The HTTP method to use",
      editorType: "select",
      editorTypeData: {
        options: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      }
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
      aiCompletion: {
        prompt: `You are an expert HTTP request body generator. The user will provide a description of the request body they want to send and you should create a valid JSON object that matches the description.
        You can expose dynamic variables using the {{syntax}}, for example {"name": {{name}}} will expose the "name" as a dynamic input.
        User's prompt:
        {{prompt}}

        Existing value:
        {{value}}
      
        `,
        jsonMode: true
      }
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
      aiCompletion: {
        prompt: `You are an expert HTTP request headers generator. The user will provide a description of the request headers they want to send and you should create a valid JSON object that matches the description.
        You can expose dynamic variables using the {{syntax}}, for example {"X-Token": {{token}}} will expose the "token" as a dynamic input.
        User's prompt:
        {{prompt}}

        Existing value:
        {{value}}

        prefer lowerPascalCase for input names
      
        `,
        jsonMode: true
      }
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
