import { ConfigurableInput, MacroNode } from "@flyde/core";
import axios, { AxiosRequestConfig } from "axios";

const namespace = "HTTP";

export interface HttpConfig {
  method: ConfigurableInput<"GET" | "POST" | "PUT" | "DELETE" | "PATCH">;
  url: ConfigurableInput<string>;
  headers: ConfigurableInput<Record<string, string>> | undefined;
  params: ConfigurableInput<Record<string, string>> | undefined;
  data: ConfigurableInput<Record<string, any>> | undefined;
}

export const Http: MacroNode<HttpConfig> = {
  id: "Http",
  namespace,
  displayName: "HTTP Request",
  description: "Performs a HTTP request to a URL and emits the response data",
  defaultStyle: {
    icon: "globe",
  },
  runFnBuilder: (config) => {
    return (inputs, outputs, adv) => {
      const { method, url, headers, params, data } = config;
      const methodValue =
        method.mode === "dynamic" ? inputs.method : method.value;
      const urlValue = url.mode === "dynamic" ? inputs.url : url.value;
      const headersValue =
        headers?.mode === "dynamic" ? inputs.headers : headers?.value;
      const paramsValue =
        params?.mode === "dynamic" ? inputs.params : params?.value;
      const dataValue = data?.mode === "dynamic" ? inputs.data : data?.value;
      const requestConfig: AxiosRequestConfig = {
        method: methodValue,
        headers: headersValue,
        params: paramsValue,
      };
      return axios
        .request({ url: urlValue, data: dataValue, ...requestConfig })
        .then((res) => outputs.data!.next(res.data))
        .catch((e) => adv.onError(e));
    };
  },
  definitionBuilder: (config) => {
    const inputs = Object.entries(config)
      .filter(([_, v]) => v.mode === "dynamic")
      .map(([k]) => k);

    const method =
      config.method.mode === "static" ? config.method.value : undefined;
    const methodStr = method ? ` ${method}` : "";

    const urlStr =
      config.url.mode === "static"
        ? ` ${config.url.value.replace(/https?\:\/\//, "")}`
        : "";
    return {
      displayName: `HTTP${methodStr}${urlStr}`,
      description: `Performs a ${methodStr} HTTP request to ${
        config.url.mode === "static" ? config.url.value : "the received URL"
      } and emits the response data`,
      inputs: Object.fromEntries(inputs.map((input) => [input, {}])),
      outputs: {
        data: {
          displayName: "Data",
          description: "Emits the response data",
        },
      },
    };
  },
  defaultData: {
    method: { mode: "static", value: "GET" },
    url: { mode: "static", value: "https://www.example.com" },
    headers: { mode: "static", value: {} },
    params: { mode: "static", value: {} },
    data: { mode: "static", value: {} },
  },
  editorConfig: {
    type: "structured",
    fields: [
      {
        type: { value: "string" },
        configKey: "url",
        label: "URL",
        defaultValue: "https://www.example.com",
        allowDynamic: true,
      },
      {
        type: {
          value: "select",
          items: ["GET", "POST", "PUT", "DELETE", "PATCH"].map((i) => ({
            label: i,
            value: i,
          })),
        },
        configKey: "method",
        label: "Method",
        defaultValue: "GET",
        allowDynamic: true,
      },
      {
        type: { value: "json", label: "" },
        configKey: "headers",
        label: "Headers",
        defaultValue: {},
        allowDynamic: true,
      },
      {
        type: { value: "json" },
        configKey: "params",
        label: "Query Parameters",
        defaultValue: {},
        allowDynamic: true,
      },
      {
        type: { value: "json" },
        configKey: "data",
        label: "Request Body",
        defaultValue: {},
        allowDynamic: true,
      },
    ],
  },
};
