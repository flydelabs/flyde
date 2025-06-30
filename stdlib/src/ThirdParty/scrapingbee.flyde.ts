import {
  CodeNode,
  createInputGroup,
} from "@flyde/core";
import axios from "axios";

export interface ScrapingBeeErrorResponse {
  error: string;
  message?: string;
  status_code?: number;
}

export const ScrapingBee: CodeNode = {
  id: "ScrapingBee",
  menuDisplayName: "ScrapingBee",
  namespace: "webscraping",
  icon: `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path opacity="0.5" d="M0.851074 7.56462V16.3306C0.851074 14.6284 1.53193 13.0114 2.80852 11.8199C4.08512 10.6284 5.78724 9.9476 7.48937 9.9476H14.1277V7.56462C14.1277 5.86249 13.4468 4.24547 12.1702 3.05398C10.8936 1.86249 9.1915 1.18164 7.48937 1.18164C5.70214 1.18164 4.00001 1.86249 2.80852 3.05398C1.53193 4.24547 0.851074 5.86249 0.851074 7.56462Z" fill="currentColor"/>
<path opacity="0.5" d="M7.48938 22.7132H16.6809C18.4681 22.7132 20.1702 22.0324 21.3617 20.8409C22.6383 19.6494 23.3192 18.0324 23.3192 16.3302C23.3192 14.6281 22.6383 13.0111 21.3617 11.8196C20.0851 10.6281 18.383 9.94727 16.6809 9.94727H14.2128V16.3302C14.2128 18.0324 13.5319 19.6494 12.2553 20.8409C10.9787 22.0324 9.27661 22.7132 7.48938 22.7132Z" fill="currentColor"/>
<path d="M0.851074 16.3302C0.851074 18.0324 1.53193 19.6494 2.80852 20.8409C4.08512 22.0324 5.78724 22.7132 7.48937 22.7132C9.27661 22.7132 10.9787 22.0324 12.1702 20.8409C13.3617 19.6494 14.1277 18.0324 14.1277 16.3302V9.94727H7.48937C5.70214 9.94727 4.00001 10.6281 2.80852 11.8196C1.53193 13.0111 0.851074 14.6281 0.851074 16.3302Z" fill="currentColor"/>
<path d="M16.6809 9.18085H14.9787V7.56383C14.9787 5.69149 14.1277 3.90426 12.766 2.54255C11.3191 1.26596 9.44681 0.5 7.48936 0.5C5.53191 0.5 3.65957 1.26596 2.21277 2.54255C0.851064 3.90426 0 5.69149 0 7.56383V16.3298C0 18.2021 0.765957 20.0745 2.21277 21.3511C3.57447 22.7128 5.53191 23.4787 7.48936 23.4787H16.6809C18.6383 23.4787 20.5106 22.7128 21.8723 21.3511C23.234 19.9894 24 18.2021 24 16.3298C24 14.4574 23.234 12.6702 21.8723 11.3085C20.5106 9.94681 18.6383 9.18085 16.6809 9.18085ZM1.70213 11.8191V7.56383C1.70213 6.11702 2.38298 4.67021 3.40426 3.64894C4.42553 2.62766 5.95745 2.03191 7.48936 2.03191C9.02128 2.03191 10.4681 2.62766 11.5745 3.64894C12.6809 4.67021 13.2766 6.03192 13.2766 7.56383V9.18085H7.48936C7.31915 9.18085 7.23404 9.18085 7.06383 9.18085H6.89362C6.80851 9.18085 6.7234 9.18085 6.6383 9.18085H6.46808C6.38298 9.18085 6.29787 9.18085 6.21277 9.18085H6.04255L5.78723 9.26596H5.61702C5.53191 9.26596 5.44681 9.26596 5.3617 9.35106H5.19149L5.10638 9.52128H4.93617C4.85106 9.52128 4.76596 9.60638 4.59574 9.60638H4.51064C4.51064 9.7766 4.34043 9.7766 4.25532 9.8617L4.17021 9.94681C4.08511 9.94681 4 10.0319 3.91489 10.0319L3.74468 10.117C3.65957 10.117 3.57447 10.2021 3.57447 10.2021C3.48936 10.2021 3.48936 10.2872 3.40426 10.2872L3.23404 10.3723L3.06383 10.4574C2.97872 10.5426 2.97872 10.5426 2.89362 10.6277L2.80851 10.7128C2.7234 10.7979 2.7234 10.7979 2.6383 10.883L2.55319 10.9681C2.46808 11.0532 2.38298 11.0532 2.38298 11.1383L2.29787 11.2234C2.21277 11.3085 2.12766 11.3936 2.04255 11.4787L1.95745 11.5638C1.78723 11.6489 1.78723 11.734 1.70213 11.8191ZM1.70213 16.3298C1.70213 14.883 2.29787 13.4362 3.40426 12.4149C4.42553 11.3085 5.95745 10.7128 7.48936 10.7128H13.2766V16.2447C13.2766 17.0106 13.1064 17.6915 12.8511 18.3723C12.5957 19.0532 12.1702 19.6489 11.5745 20.2447C11.0638 20.7553 10.383 21.1809 9.70213 21.4362C9.02128 21.6915 8.25532 21.8617 7.48936 21.8617C6.7234 21.8617 5.95745 21.8617 5.2766 21.5213C4.59574 21.266 3.91489 20.8404 3.40426 20.3298C2.89362 19.8191 2.46808 19.1383 2.12766 18.4574C1.78723 17.7766 1.61702 17.0106 1.70213 16.3298ZM16.6809 21.8617H12.2553C12.3404 21.7766 12.4255 21.7766 12.4255 21.6915L12.5106 21.6064C12.5957 21.5213 12.6809 21.4362 12.766 21.3511L12.8511 21.266C12.9362 21.1809 12.9362 21.1809 13.0213 21.0957L13.1064 21.0106C13.1915 20.9255 13.1915 20.9255 13.2766 20.8404C13.3617 20.7553 13.3617 20.7553 13.3617 20.7553C13.3617 20.7553 13.4468 20.6702 13.5319 20.5851C13.617 20.5 13.617 20.5 13.617 20.5C13.617 20.4149 13.7021 20.4149 13.7872 20.3298L13.8723 20.1596C13.8723 20.0745 13.9574 19.9894 13.9574 19.9894L14.0426 19.9043C14.1277 19.8191 14.1277 19.734 14.1277 19.6489C14.1277 19.6489 14.1277 19.5638 14.2128 19.5638C14.2979 19.4787 14.2979 19.3085 14.383 19.2234C14.383 19.2234 14.383 19.2234 14.383 19.1383C14.383 19.0532 14.4681 18.9681 14.4681 18.883C14.4681 18.883 14.4681 18.7979 14.5532 18.7979C14.5532 18.7128 14.6383 18.6277 14.6383 18.5426C14.6383 18.4574 14.6383 18.4574 14.6383 18.3723C14.6383 18.2872 14.7234 18.2021 14.7234 18.117C14.7234 18.0319 14.7234 18.0319 14.7234 17.9468C14.7234 17.8617 14.7234 17.7766 14.8085 17.6915C14.8085 17.6064 14.8085 17.6064 14.8085 17.5213C14.8085 17.4362 14.8085 17.3511 14.8085 17.266C14.8085 17.1809 14.8085 17.1809 14.8085 17.0957C14.8085 17.0106 14.8085 16.9255 14.8085 16.8404C14.8085 16.7553 14.8085 16.7553 14.8085 16.6702C14.8085 16.5 14.8085 16.4149 14.8085 16.2447V10.7128H16.5106C18.0426 10.7128 19.5745 11.3085 20.5957 12.3298C21.7021 13.3511 22.2979 14.7979 22.2979 16.2447C22.2979 17.6915 21.7021 19.1383 20.5957 20.1596C19.6596 21.266 18.2128 21.8617 16.6809 21.8617Z" fill="currentColor" opacity="0.5"/>
</svg>

`,
  displayName: "ScrapingBee {{action}}",
  description: "Web scraping API made simple",
  inputs: {
    authentication: {
      group: createInputGroup("Authentication", ["apiKey"], {
        collapsible: true,
        defaultCollapsed: true,
      }),
    },
    apiKey: {
      editorType: "secret",
      editorTypeData: {
        defaultName: "SCRAPINGBEE_API_KEY",
      },
      description: "ScrapingBee API Key",
    },
    action: {
      defaultValue: "scrape",
      label: "Action",
      typeConfigurable: true,
      description: "Action to perform with ScrapingBee",
      editorType: "select",
      editorTypeData: {
        options: [
          { label: "Scrape Page", value: "scrape" },
          { label: "Extract Data", value: "extract" },
          { label: "Take Screenshot", value: "screenshot" },
        ],
      },
    },
    url: {
      defaultValue: "{{url}}",
      editorType: "string",
      description: "URL to scrape",
    },
    waitForSelector: {
      defaultValue: "",
      editorType: "string",
      description: "CSS selector to wait for before scraping",
    },
    extractRules: {
      defaultValue: {},
      editorType: "json",
      description: "JSON extraction rules",
      condition: "action === 'extract'",
    },
    premium: {
      defaultValue: true,
      editorType: "boolean",
      description: "Use premium proxies",
    },
    renderJs: {
      defaultValue: true,
      editorType: "boolean",
      description: "Render JavaScript",
    },
    returnType: {
      defaultValue: "html",
      editorType: "select",
      editorTypeData: {
        options: ["html", "text", "json"],
      },
      description: "Response return type",
      condition: "action === 'scrape'",
    },
    advancedOptions: {
      group: createInputGroup(
        "Advanced Options",
        ["waitForSelector", "premium", "renderJs", "returnType"],
        {
          collapsible: true,
          defaultCollapsed: true,
        }
      ),
    },
  },
  outputs: {
    result: {
      description: "Operation result data",
    },
  },
  run: async (inputs, outputs, adv) => {
    const {
      apiKey,
      action,
      url,
      waitForSelector,
      extractRules,
      premium,
      renderJs,
      returnType,
    } = inputs;
  
    if (!apiKey) {
      throw new Error("ScrapingBee API key is required");
    }
  
    if (!url) {
      throw new Error("URL is required");
    }
  
    const baseUrl = "https://app.scrapingbee.com/api/v1";
  
    try {
      // Build the parameters for the API call
      const params = new URLSearchParams();
      params.append("api_key", apiKey);
      params.append("url", url);
  
      if (premium !== undefined) {
        params.append("premium_proxy", premium ? "true" : "false");
      }
  
      if (renderJs !== undefined) {
        params.append("render_js", renderJs ? "true" : "false");
      }
  
      if (waitForSelector) {
        params.append("wait_for", waitForSelector);
      }
  
      switch (action) {
        case "scrape":
          if (returnType) {
            params.append("return_type", returnType);
          }
          break;
  
        case "extract":
          if (!extractRules || Object.keys(extractRules).length === 0) {
            throw new Error("Extract rules are required for extraction");
          }
          params.append("extract_rules", JSON.stringify(extractRules));
          break;
  
        case "screenshot":
          params.append("screenshot", "true");
          params.append("output", "json");
          break;
  
        default:
          throw new Error(`Unsupported action: ${action}`);
      }
  
      const apiUrl = `${baseUrl}?${params.toString()}`;
  
      const response = await axios({
        method: "GET",
        url: apiUrl,
        responseType: action === "screenshot" ? "arraybuffer" : "json",
      });
  
      // Handle the response based on the action
      if (action === "screenshot") {
        // Convert the binary data to base64
        const base64Image = Buffer.from(response.data).toString("base64");
        outputs.result.next({
          image: `data:image/png;base64,${base64Image}`,
          contentType: response.headers["content-type"],
        });
      } else {
        outputs.result.next(response.data);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.data && typeof error.response.data === "object") {
          const errorData = error.response.data as ScrapingBeeErrorResponse;
          adv.onError(
            `ScrapingBee API Error ${error.response.status}: ${
              errorData.error || errorData.message || error.response.statusText
            }`
          );
        } else {
          adv.onError(
            `ScrapingBee API Error ${error.response.status}: ${error.response.statusText}`
          );
        }
        return;
      }
      adv.onError(`Error: ${(error as Error).message}`);
    }
  }
};

