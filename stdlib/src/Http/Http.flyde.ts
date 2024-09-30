import axios, { AxiosRequestConfig } from "axios";
import {
  extractInputsFromValue,
  macro2toMacro,
  ImprovedMacroNode,
  replaceInputsInValue,
} from "../ImprovedMacros/improvedMacros";
import { macroConfigurableValue, MacroConfigurableValue } from "@flyde/core";

const namespace = "HTTP";

export interface HttpConfig {
  method: MacroConfigurableValue;
  url: MacroConfigurableValue;
  headers?: MacroConfigurableValue;
  params?: MacroConfigurableValue;
  data?: MacroConfigurableValue;
}

const http: ImprovedMacroNode<HttpConfig> = {
  id: "Http",
  menuDisplayName: "HTTP Request",
  defaultConfig: {
    method: macroConfigurableValue("select", "GET"),
    url: macroConfigurableValue("string", "https://www.example.com"),
    headers: macroConfigurableValue("json", {}),
    params: macroConfigurableValue("json", {}),
    data: macroConfigurableValue("json", {}),
  },
  namespace,
  displayName: (config) => `HTTP ${config.method.value} to ${config.url.value}`,
  menuDescription:
    "Performs a HTTP request to a URL and emits the response data",
  description: (config) => {
    let desc = `Performs a HTTP ${config.method.value} request to ${config.url.value}`;
    if (Object.keys(config.headers.value || {}).length > 0) {
      desc += ` with custom headers`;
    }
    if (Object.keys(config.params.value || {}).length > 0) {
      desc += `, including query parameters`;
    }
    if (Object.keys(config.data.value || {}).length > 0) {
      desc += `, and request body data`;
    }
    return desc;
  },
  defaultStyle: {
    icon: "globe",
  },
  inputs: (config) => {
    return Object.keys(config).reduce((acc, key) => {
      return {
        ...acc,
        ...extractInputsFromValue(config[key], key),
      };
    }, {});
  },
  outputs: {
    response: {
      description: "Emits the response data",
    },
  },
  run: (inputs, outputs, adv) => {
    const { method, url, headers, params, data } = adv.context.config;

    const urlValue = replaceInputsInValue(inputs, url);
    const headersValue = replaceInputsInValue(inputs, headers);
    const paramsValue = replaceInputsInValue(inputs, params);
    const dataValue = replaceInputsInValue(inputs, data);
    const methodValue = replaceInputsInValue(inputs, method);

    const requestConfig: AxiosRequestConfig = {
      url: urlValue,
      method: methodValue,
      headers: headersValue,
      params: paramsValue,
    };

    if (methodValue !== "GET") {
      requestConfig.data = dataValue;
    }
    return axios
      .request(requestConfig)
      .then((res) => outputs.response.next(res.data))
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
  configEditor: {
    type: "structured",
    fields: [
      {
        type: "string",
        configKey: "url",
        label: "URL",
      },
      {
        type: "select",
        typeData: {
          items: ["GET", "POST", "PUT", "DELETE", "PATCH"].map((i) => ({
            label: i,
            value: i,
          })),
        },
        configKey: "method",
        label: "Method",
      },
      {
        type: "json",
        configKey: "data",
        label: "Request Body",
      },
      {
        type: "json",
        configKey: "headers",
        label: "Headers",
      },
      {
        type: "json",
        configKey: "params",
        label: "Query Parameters",
      },
    ],
  },
};

export const Http = macro2toMacro(http);
