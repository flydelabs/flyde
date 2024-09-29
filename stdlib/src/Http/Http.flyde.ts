import axios, { AxiosRequestConfig } from "axios";
import { replaceTemplateVars } from "../macroHelpers";
import {
  extractInputsFromValue,
  macro2toMacro,
  MacroNodeV2,
} from "../ImprovedMacros/improvedMacros";

const namespace = "HTTP";

export interface HttpConfig {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  data?: Record<string, any>;
}

const http: MacroNodeV2<HttpConfig> = {
  id: "Http",
  menuDisplayName: "HTTP Request",
  defaultConfig: {
    method: "GET",
    url: "https://www.example.com",
    headers: {},
    params: {},
    data: {},
  },
  namespace,
  displayName: (config) => `HTTP ${config.method} to ${config.url}`,
  menuDescription:
    "Performs a HTTP request to a URL and emits the response data",
  description: (config) => {
    let desc = `Performs a HTTP ${config.method} request to ${config.url}`;
    if (Object.keys(config.headers || {}).length > 0) {
      desc += ` with custom headers`;
    }
    if (Object.keys(config.params || {}).length > 0) {
      desc += `, including query parameters`;
    }
    if (Object.keys(config.data || {}).length > 0) {
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
        ...extractInputsFromValue(config[key]),
      };
    }, {});
  },
  outputs: {
    data: {
      description: "Emits the response data",
    },
  },
  run: (inputs, outputs, adv) => {
    const { method, url, headers, params, data } = adv.context.config;

    const urlValue = replaceTemplateVars(url, inputs);
    const headersValue = replaceTemplateVars(headers, inputs);
    const paramsValue = replaceTemplateVars(params, inputs);
    const dataValue = replaceTemplateVars(data, inputs);

    const requestConfig: AxiosRequestConfig = {
      method,
      headers: headersValue,
      params: paramsValue,
    };

    return axios
      .request({ url: urlValue, data: dataValue, ...requestConfig })
      .then((res) => outputs.data!.next(res.data))
      .catch((e) => adv.onError(e));
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
        configKey: "headers",
        label: "Headers",
      },
      {
        type: "json",
        configKey: "params",
        label: "Query Parameters",
      },
      {
        type: "json",
        configKey: "data",
        label: "Request Body",
      },
    ],
  },
};

export const Http = macro2toMacro(http);
