import axios from "axios";
import { CodeNode } from "@flyde/core";

interface ResendErrorResponse {
  error: {
    message: string;
    code: string;
  };
}

export const Resend: CodeNode = {
  id: "Resend",
  menuDisplayName: "Resend",
  namespace: "email",
  icon: `
<svg width="24" height="24" viewBox="0 0 600 600" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
<path d="M186 447.471V154H318.062C336.788 154 353.697 158.053 368.79 166.158C384.163 174.263 396.181 185.443 404.845 199.698C413.51 213.672 417.842 229.604 417.842 247.491C417.842 265.938 413.51 282.568 404.845 297.381C396.181 311.915 384.302 323.375 369.209 331.759C354.117 340.144 337.067 344.337 318.062 344.337H253.917V447.471H186ZM348.667 447.471L274.041 314.99L346.99 304.509L430 447.471H348.667ZM253.917 289.835H311.773C319.04 289.835 325.329 288.298 330.639 285.223C336.229 281.869 340.421 277.258 343.216 271.388C346.291 265.519 347.828 258.811 347.828 251.265C347.828 243.718 346.151 237.15 342.797 231.56C339.443 225.691 334.552 221.219 328.124 218.144C321.975 215.07 314.428 213.533 305.484 213.533H253.917V289.835Z"/>
</svg>
`,
  displayName: "Resend",
  description: "Send emails using Resend",
  inputs: {
    apiKey: {
      editorType: "secret",
      editorTypeData: {
        defaultName: "RESEND_API_KEY",
      },
      description: "Resend API Key",
    },
    from: {
      defaultValue: "",
      editorType: "string",
      description: "Sender email address",
    },
    to: {
      defaultValue: "",
      editorType: "string",
      description: "Recipient email address",
    },
    subject: {
      defaultValue: "",
      editorType: "string",
      description: "Email subject",
    },
    html: {
      defaultValue: "",
      editorType: "longtext",
      description: "HTML content of the email",
    },
    text: {
      defaultValue: "",
      editorType: "longtext",
      description: "Plain text content of the email",
    },
    cc: {
      defaultValue: "",
      editorType: "string",
      description: "CC recipients (comma-separated)",
    },
    bcc: {
      defaultValue: "",
      editorType: "string",
      description: "BCC recipients (comma-separated)",
    },
    replyTo: {
      defaultValue: "",
      editorType: "string",
      description: "Reply-to email address",
    },
  },
  outputs: {
    success: {
      description: "Email sent successfully",
    },
  },
  run: async (inputs, outputs) => {
    const { apiKey, from, to, subject, html, text, cc, bcc, replyTo } = inputs;

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {
      from,
      to,
      subject,
    };

    if (html) {
      data.html = html;
    }
    if (text) {
      data.text = text;
    }
    if (cc) {
      data.cc = cc.split(",").map((email: string) => email.trim());
    }
    if (bcc) {
      data.bcc = bcc.split(",").map((email: string) => email.trim());
    }
    if (replyTo) {
      data.reply_to = replyTo;
    }

    try {
      const res = await axios.post("https://api.resend.com/emails", data, {
        headers,
      });
      outputs.success.next(res.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as ResendErrorResponse;
        console.error(errorData);
        throw new Error(
          `Resend API Error ${error.response.status}: ${errorData.error?.message || error.response.statusText
          }`
        );
      }
      throw error;
    }
  },
};
