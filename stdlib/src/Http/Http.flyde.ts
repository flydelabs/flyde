import { MacroNode } from "@flyde/core";
import axios, { AxiosRequestConfig } from "axios";

const namespace = "HTTP";

export interface HttpConfig {
  method:
    | {
        mode: "static";
        value: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
      }
    | { mode: "dynamic" };
  url: { mode: "static"; value: string } | { mode: "dynamic" };
  headers?:
    | { mode: "static"; value: Record<string, string> }
    | { mode: "dynamic" };
  params?:
    | { mode: "static"; value: Record<string, string> }
    | { mode: "dynamic" };
  data?:
    | { mode: "static"; value: Record<string, string> }
    | { mode: "dynamic" };
}

export const Http: MacroNode<HttpConfig> = {
  id: "Http",
  namespace,
  displayName: "HTTP Request",
  description: "Performs a HTTP request to a URL and emits the response data",
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
        .then((res) => outputs.data.next(res.data))
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
    return {
      displayName: `HTTP${methodStr} Request`,
      description: `Performs a ${methodStr} HTTP request to a URL and emits the response data`,
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
  editorComponentBundlePath: "../../../dist/ui/Http.js",
};
