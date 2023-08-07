import { CodeNode } from "@flyde/core";
import axios, { AxiosRequestConfig } from "axios";

const namespace = "HTTP";

export const Get: CodeNode = {
  id: "GET Request",
  defaultStyle: {
    icon: "fa-server",
  },
  namespace,
  description:
    "Performs a HTTP GET request to a URL and emits the response data",
  inputs: {
    url: { description: "URL to fetch data from" },
    headers: {
      description: "Headers to send with the request",
      mode: "required-if-connected",
    },
    params: {
      description: "Query parameters to send with the request",
      mode: "required-if-connected",
    },
  },
  outputs: { data: { description: "The response data" } },
  run: ({ url, headers, params }, { data }) => {
    return axios
      .get(url, { headers, params })
      .then((res) => data.next(res.data));
  },
};

export const Post: CodeNode = {
  id: "POST Request",
  defaultStyle: {
    icon: "fa-server",
  },
  namespace,
  description:
    "Performs a HTTP POST request to a URL and emits the response data",
  inputs: {
    url: { description: "URL to fetch data from" },
    headers: {
      description: "Headers to send with the request",
      mode: "required-if-connected",
    },
    params: {
      description: "Query parameters to send with the request",
      mode: "required-if-connected",
    },
    data: {
      description: "Data to send with the request",
      mode: "required-if-connected",
    },
  },
  outputs: { data: { description: "The response data" } },
  run: ({ url, headers, params, data: body }, { data }) => {
    const config: AxiosRequestConfig = { headers, params };
    return axios.post(url, body, config).then((res) => data.next(res.data));
  },
};

export const Put: CodeNode = {
  id: "PUT Request",
  defaultStyle: {
    icon: "fa-server",
  },
  namespace,
  description:
    "Performs a HTTP PUT request to a URL and emits the response data",
  inputs: {
    url: { description: "URL to fetch data from" },
    headers: {
      description: "Headers to send with the request",
      mode: "required-if-connected",
    },
    params: {
      description: "Query parameters to send with the request",
      mode: "required-if-connected",
    },
    data: {
      description: "Data to send with the request",
      mode: "required-if-connected",
    },
  },
  outputs: { data: { description: "The response data" } },
  run: ({ url, headers, params, data: body }, { data }) => {
    const config: AxiosRequestConfig = { headers, params };
    return axios.put(url, body, config).then((res) => data.next(res.data));
  },
};

export const Request: CodeNode = {
  id: "Request",
  defaultStyle: {
    icon: "fa-server",
  },
  namespace,
  description: "Performs a HTTP request to a URL and emits the response data",
  inputs: {
    url: { description: "URL to fetch data from" },
    method: { description: "HTTP method to use" },
    headers: {
      description: "Headers to send with the request",
      mode: "required-if-connected",
    },
    params: {
      description: "Query parameters to send with the request",
      mode: "required-if-connected",
    },
    data: {
      description: "Data to send with the request",
      mode: "required-if-connected",
    },
  },
  outputs: { data: { description: "The response data" } },
  run: ({ url, method, headers, params, data: body }, { data }) => {
    const config: AxiosRequestConfig = { method, headers, params };
    return axios
      .request({ url, data: body, ...config })
      .then((res) => data.next(res.data));
  },
};
