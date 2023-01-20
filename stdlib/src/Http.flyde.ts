import { partFromSimpleFunction } from "./utils/partFromSimpleFunction";

import axios from 'axios';

const namespace = 'HTTP';

export const Get = partFromSimpleFunction({
    id: 'GET Request',
    icon: 'fa-server', // font awesome icon
    namespace,
    description: 'Performs a HTTP GET request to a URL and emits the response data',
    inputs: [
        {name: 'url', description: 'URL to fetch data from'},
        {name: 'headers', description: 'Headers to send with the request', mode: 'required-if-connected'},
        {name: 'params', description: 'Query parameters to send with the request', mode: 'required-if-connected'}
    ],
    output: {name: 'data', description: 'The response data'},
    fn: (url) => {
        return axios.get(url).then(res => res.data);
    }
});

export const Post = partFromSimpleFunction({
    id: 'POST Request',
    icon: 'fa-server', // font awesome icon
    namespace,
    description: 'Performs a HTTP POST request to a URL and emits the response data',
    inputs: [
        {name: 'url', description: 'URL to fetch data from'},
        {name: 'headers', description: 'Headers to send with the request', mode: 'required-if-connected'},
        {name: 'params', description: 'Query parameters to send with the request', mode: 'required-if-connected'},
        {name: 'data', description: 'Data to send with the request', mode: 'required-if-connected'},
    ],
    output: {name: 'data', description: 'The response data'},
    fn: (url, headers, params, data) => {
        return axios.post(url, data, {headers, params}).then(res => res.data);
    }
});

export const Put = partFromSimpleFunction({
    id: 'PUT Request',
    icon: 'fa-server', // font awesome icon
    namespace,
    description: 'Performs a HTTP PUT request to a URL and emits the response data',
    inputs: [
        {name: 'url', description: 'URL to fetch data from'},
        {name: 'headers', description: 'Headers to send with the request', mode: 'required-if-connected'},
        {name: 'params', description: 'Query parameters to send with the request', mode: 'required-if-connected'},
        {name: 'data', description: 'Data to send with the request', mode: 'required-if-connected'},
    ],
    output: {name: 'data', description: 'The response data'},
    fn: (url, headers, params, data) => {
        return axios.put(url, data, {headers, params}).then(res => res.data);
    }
});

export const Request = partFromSimpleFunction({
    id: 'Request',
    icon: 'fa-server', // font awesome icon
    namespace,
    description: 'Performs a HTTP request to a URL and emits the response data',
    inputs: [
        {name: 'url', description: 'URL to fetch data from'},
        {name: 'method', description: 'HTTP method to use'},
        {name: 'headers', description: 'Headers to send with the request', mode: 'required-if-connected'},
        {name: 'params', description: 'Query parameters to send with the request', mode: 'required-if-connected'},
        {name: 'data', description: 'Data to send with the request', mode: 'required-if-connected'},
    ],
    output: {name: 'data', description: 'The response data'},
    fn: (url, method, headers, params, data) => {
        return axios.request({url, method, data, headers, params}).then(res => res.data);
    }
});