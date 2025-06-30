import {
  createInputGroup,
  CodeNode,
} from "@flyde/core";
import axios from "axios";

export interface SlackErrorResponse {
  error: string;
  warning?: string;
  response_metadata?: {
    messages?: string[];
  };
}

export const Slack: CodeNode = {
  id: "Slack",
  menuDisplayName: "Slack",
  namespace: "integrations",
  icon: `
<svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5.75957 15.7586C5.75957 17.1524 4.63308 18.2789 3.23928 18.2789C1.84549 18.2789 0.718994 17.1524 0.718994 15.7586C0.718994 14.3648 1.84549 13.2383 3.23928 13.2383H5.75957V15.7586ZM7.01971 15.7586C7.01971 14.3648 8.1462 13.2383 9.54 13.2383C10.9338 13.2383 12.0603 14.3648 12.0603 15.7586V22.0593C12.0603 23.4531 10.9338 24.5796 9.54 24.5796C8.1462 24.5796 7.01971 23.4531 7.01971 22.0593V15.7586Z" fill="currentColor"/>
<path d="M9.54005 5.64021C8.14625 5.64021 7.01976 4.51371 7.01976 3.11991C7.01976 1.72611 8.14625 0.599609 9.54005 0.599609C10.9338 0.599609 12.0603 1.72611 12.0603 3.11991V5.64021H9.54005ZM9.54005 6.91946C10.9338 6.91946 12.0603 8.04596 12.0603 9.43976C12.0603 10.8336 10.9338 11.9601 9.54005 11.9601H3.22024C1.82644 11.9601 0.699951 10.8336 0.699951 9.43976C0.699951 8.04596 1.82644 6.91946 3.22024 6.91946H9.54005Z" fill="currentColor"/>
<path d="M19.6403 9.43976C19.6403 8.04596 20.7668 6.91946 22.1606 6.91946C23.5544 6.91946 24.6809 8.04596 24.6809 9.43976C24.6809 10.8336 23.5544 11.9601 22.1606 11.9601H19.6403V9.43976ZM18.3802 9.43976C18.3802 10.8336 17.2537 11.9601 15.8599 11.9601C14.4661 11.9601 13.3396 10.8336 13.3396 9.43976V3.11991C13.3396 1.72611 14.4661 0.599609 15.8599 0.599609C17.2537 0.599609 18.3802 1.72611 18.3802 3.11991V9.43976Z" fill="currentColor"/>
<path d="M15.8599 19.539C17.2537 19.539 18.3802 20.6655 18.3802 22.0593C18.3802 23.4531 17.2537 24.5796 15.8599 24.5796C14.4661 24.5796 13.3396 23.4531 13.3396 22.0593V19.539H15.8599ZM15.8599 18.2789C14.4661 18.2789 13.3396 17.1524 13.3396 15.7586C13.3396 14.3648 14.4661 13.2383 15.8599 13.2383H22.1797C23.5735 13.2383 24.7 14.3648 24.7 15.7586C24.7 17.1524 23.5735 18.2789 22.1797 18.2789H15.8599Z" fill="currentColor"/>
</svg>
`,
  displayName: "Slack {{action}}",
  description: "Interact with Slack API",
  inputs: {
    action: {
      defaultValue: "postMessage",
      label: "Action",
      typeConfigurable: true,
      description: "Action to perform with Slack",
      editorType: "select",
      editorTypeData: {
        options: [
          { label: "Post Message", value: "postMessage" },
          { label: "Post Message (Webhook)", value: "postMessageWebhook" },
          { label: "Upload File", value: "uploadFile" },
          { label: "Get Channel List", value: "getChannelList" },
          { label: "Get User List", value: "getUserList" },
          { label: "Get Channel History", value: "getChannelHistory" },
        ],
      },
    },
    webhookUrl: {
      defaultValue: "",
      editorType: "string",
      description: "Slack Webhook URL",
      condition: "action === 'postMessageWebhook'",
    },
    authentication: {
      group: createInputGroup("Authentication", ["token"], {
        collapsible: true,
        defaultCollapsed: true,
      }),
      condition: "action !== 'postMessageWebhook'",
    },
    token: {
      defaultValue: "$secrets.SLACK_TOKEN",
      editorType: "string",
      description: "Slack Bot Token",
      condition: "action !== 'postMessageWebhook'",
    },
    channel: {
      defaultValue: "",
      editorType: "string",
      description: "Channel ID or name",
      condition:
        "action === 'postMessage' || action === 'uploadFile' || action === 'getChannelHistory'",
    },
    text: {
      defaultValue: "",
      editorType: "string",
      description: "Message text",
      condition: "action === 'postMessage' || action === 'postMessageWebhook'",
    },
    blocks: {
      defaultValue: [],
      editorType: "json",
      description: "Message blocks (rich formatting)",
      condition: "action === 'postMessage' || action === 'postMessageWebhook'",
    },
    fileOptions: {
      group: createInputGroup(
        "File Options",
        ["fileContent", "fileName", "fileType"],
        {
          collapsible: true,
          defaultCollapsed: true,
        }
      ),
      condition: "action === 'uploadFile'",
    },
    fileContent: {
      defaultValue: "",
      editorType: "string",
      description: "File content to upload",
      condition: "action === 'uploadFile'",
    },
    fileName: {
      defaultValue: "",
      editorType: "string",
      description: "File name",
      condition: "action === 'uploadFile'",
    },
    fileType: {
      defaultValue: "",
      editorType: "string",
      description: "File MIME type",
      condition: "action === 'uploadFile'",
    },
    historyOptions: {
      group: createInputGroup(
        "History Options",
        ["limit", "oldest", "latest"],
        {
          collapsible: true,
          defaultCollapsed: true,
        }
      ),
      condition: "action === 'getChannelHistory'",
    },
    limit: {
      defaultValue: 100,
      editorType: "number",
      description: "Number of items to return",
      condition:
        "action === 'getChannelHistory' || action === 'getChannelList' || action === 'getUserList'",
    },
    oldest: {
      defaultValue: "",
      editorType: "string",
      description: "Start of time range (timestamp)",
      condition: "action === 'getChannelHistory'",
    },
    latest: {
      defaultValue: "",
      editorType: "string",
      description: "End of time range (timestamp)",
      condition: "action === 'getChannelHistory'",
    },
  },
  outputs: {
    result: {
      description: "Operation result",
    },
  },
  run: async (inputs, outputs, adv) => {
    const {
      token,
      action,
      channel,
      text,
      blocks,
      fileContent,
      fileName,
      fileType,
      limit,
      oldest,
      latest,
      webhookUrl,
    } = inputs;

    // Only validate token for non-webhook actions
    if (action !== 'postMessageWebhook' && !token) {
      throw new Error("Slack token is required");
    }

    // Validate webhook URL for webhook action
    if (action === 'postMessageWebhook' && !webhookUrl) {
      throw new Error("Webhook URL is required");
    }

    try {
      let url = "";
      let method = "POST";
      let data: Record<string, unknown> = {};
      let headers: Record<string, string> = {};

      // Set headers based on action type
      if (action !== 'postMessageWebhook') {
        headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };
      } else {
        headers = {
          "Content-Type": "application/json",
        };
      }

      switch (action) {
        case "postMessage":
          if (!channel) {
            throw new Error("Channel is required for posting a message");
          }
          url = "https://slack.com/api/chat.postMessage";
          data = { channel };

          if (text) {
            data.text = text;
          }

          if (blocks && Array.isArray(blocks) && blocks.length > 0) {
            data.blocks = blocks;
          }

          if (!text && (!blocks || blocks.length === 0)) {
            throw new Error(
              "Either text or blocks must be provided for posting a message"
            );
          }
          break;

        case "postMessageWebhook":
          url = webhookUrl;

          if (text) {
            data.text = text;
          }

          if (blocks && Array.isArray(blocks) && blocks.length > 0) {
            data.blocks = blocks;
          }

          if (!text && (!blocks || blocks.length === 0)) {
            throw new Error(
              "Either text or blocks must be provided for posting a message"
            );
          }
          break;

        case "uploadFile":
          if (!channel) {
            throw new Error("Channel is required for uploading a file");
          }

          if (!fileContent) {
            throw new Error("File content is required for uploading a file");
          }

          if (!fileName) {
            throw new Error("File name is required for uploading a file");
          }

          url = "https://slack.com/api/files.upload";
          data = {
            channels: channel,
            content: fileContent,
            filename: fileName,
          };

          if (fileType) {
            data.filetype = fileType;
          }
          break;

        case "getChannelList":
          url = "https://slack.com/api/conversations.list";
          method = "GET";
          data = {};

          if (limit) {
            data.limit = limit;
          }
          break;

        case "getUserList":
          url = "https://slack.com/api/users.list";
          method = "GET";
          data = {};

          if (limit) {
            data.limit = limit;
          }
          break;

        case "getChannelHistory":
          if (!channel) {
            throw new Error("Channel is required for getting channel history");
          }

          url = "https://slack.com/api/conversations.history";
          method = "GET";
          data = { channel };

          if (limit) {
            data.limit = limit;
          }

          if (oldest) {
            data.oldest = oldest;
          }

          if (latest) {
            data.latest = latest;
          }
          break;

        default:
          throw new Error(`Unsupported action: ${action}`);
      }

      const response = await axios({
        method,
        url,
        headers,
        data: method === "POST" ? data : undefined,
        params: method === "GET" ? data : undefined,
      });

      // For webhook calls, success is indicated by a 200 status rather than a data.ok field
      if (action === 'postMessageWebhook') {
        outputs.result.next({ ok: true, ...response.data });
      } else if (!response.data.ok) {
        throw new Error(
          `Slack API Error: ${response.data.error || "Unknown error"}`
        );
      } else {
        outputs.result.next(response.data);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as SlackErrorResponse;
        adv.onError(
          `Slack API Error ${error.response.status}: ${errorData?.error || error.response.statusText
          }`
        );
        return;
      }
      adv.onError(`Error: ${(error as Error).message}`);
    }
  },
};
