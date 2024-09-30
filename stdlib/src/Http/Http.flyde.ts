import axios, { AxiosRequestConfig } from "axios";
import {
  extractInputsFromValue,
  macro2toMacro,
  MacroNodeV2,
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

const http: MacroNodeV2<HttpConfig> = {
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
    data: {
      description: "Emits the response data",
    },
  },
  run: (inputs, outputs, adv) => {
    const { method, url, headers, params, data } = adv.context.config;

    const urlValue = replaceInputsInValue(inputs, url);
    const headersValue = replaceInputsInValue(inputs, headers);
    const paramsValue = replaceInputsInValue(inputs, params);
    const dataValue = replaceInputsInValue(inputs, data);

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
