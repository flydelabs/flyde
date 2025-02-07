import axios, { AxiosRequestConfig } from "axios";
import { processImprovedMacro, ImprovedMacroNode } from "@flyde/core";

const namespace = "HTTP";

const http: ImprovedMacroNode = {
  id: "Http",
  menuDisplayName: "HTTP Request",
  namespace,
  icon: "globe",
  displayName: "HTTP {{method}} to {{url}}",
  description: "Sends an HTTP request",
  inputs: {
    method: {
      defaultValue: "GET",
      description: "The HTTP method to use",
      editorType: "select",
      editorTypeData: {
        options: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      },
    },
    url: {
      defaultValue: "https://www.example.com",
      description: "The URL to send the request to",
      editorType: "string",
    },
    data: {
      defaultValue: {},
      description: "The request body data",
      editorType: "json",
    },
    params: {
      defaultValue: {},
      description: "The query parameters to send with the request",
      editorType: "json",
    },
    headers: {
      defaultValue: {},
      description: "The headers to send with the request",
      editorType: "json",
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

export const Http = processImprovedMacro(http);
