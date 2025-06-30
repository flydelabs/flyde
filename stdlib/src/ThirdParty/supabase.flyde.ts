import {
  createInputGroup,
  CodeNode,
} from "@flyde/core";

import axios from "axios";

export interface SupabaseErrorResponse {
  error: {
    message: string;
    code?: string;
    status?: string;
  };
}

export const Supabase: CodeNode = {
  id: "Supabase",
  menuDisplayName: "Supabase",
  namespace: "database",
  icon: `<svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_13300_170)">
<path d="M14.0274 24.399C13.3978 25.1956 12.1212 24.7591 12.106 23.7419L11.8842 8.86328H21.8408C23.6442 8.86328 24.65 10.9562 23.5286 12.3754L14.0274 24.399Z" fill="url(#paint0_linear_13300_170)"/>
<path d="M9.978 0.458346C10.6076 -0.338424 11.8842 0.0981485 11.8994 1.11542L11.9966 15.994H2.16459C0.361126 15.994 -0.644701 13.9011 0.476749 12.4819L9.978 0.458346Z" fill="currentColor"/>
</g>
<defs>
<linearGradient id="paint0_linear_13300_170" x1="11.8842" y1="12.1622" x2="20.7459" y2="15.8611" gradientUnits="userSpaceOnUse">
<stop stop-color="currentColor" stop-opacity="0.5"/>
<stop offset="1" stop-color="currentColor"/>
</linearGradient>

</defs>
</svg>
`,
  displayName: "Supabase {{action}}",
  description: "Interact with Supabase API",
  inputs: {
    authentication: {
      group: createInputGroup("Authentication", ["url", "apiKey"], {
        collapsible: true,
        defaultCollapsed: true,
      }),
    },
    url: {
      defaultValue: "$secrets.SUPABASE_URL",
      editorType: "string",
      description: "Supabase project URL",
    },
    apiKey: {
      editorType: "secret",
      editorTypeData: {
        defaultName: "SUPABASE_API_KEY",
      },
      description: "Supabase API key (service role or anon)",
    },
    action: {
      defaultValue: "select",
      label: "Action",
      typeConfigurable: true,
      description: "Action to perform on Supabase",
      editorType: "select",
      editorTypeData: {
        options: [
          { label: "Select Data", value: "select" },
          { label: "Insert Data", value: "insert" },
          { label: "Update Data", value: "update" },
          { label: "Upsert Data", value: "upsert" },
          { label: "Delete Data", value: "delete" },
          { label: "RPC Call", value: "rpc" },
        ],
      },
    },
    table: {
      defaultValue: "",
      editorType: "string",
      description: "Table name",
      condition: "action !== 'rpc'",
    },
    columns: {
      defaultValue: "*",
      editorType: "string",
      description: "Columns to select (comma-separated, or * for all)",
      condition: "action === 'select'",
    },
    filters: {
      defaultValue: {},
      editorType: "json",
      description: "Filter criteria for select/update/delete operations",
      condition:
        "action === 'select' || action === 'update' || action === 'delete'",
    },
    data: {
      defaultValue: {},
      editorType: "json",
      description: "Data to insert/update/upsert",
      condition:
        "action === 'insert' || action === 'update' || action === 'upsert'",
    },
    functionName: {
      defaultValue: "",
      editorType: "string",
      description: "RPC function name",
      condition: "action === 'rpc'",
    },
    functionArgs: {
      defaultValue: {},
      editorType: "json",
      description: "Arguments for RPC function",
      condition: "action === 'rpc'",
    },
    advancedOptions: {
      group: createInputGroup(
        "Advanced Options",
        ["limit", "offset", "order", "count", "single"],
        {
          collapsible: true,
          defaultCollapsed: true,
        }
      ),
      condition:
        "action === 'select' || action === 'insert' || action === 'update' || action === 'upsert' || action === 'delete'",
    },
    limit: {
      defaultValue: null,
      editorType: "number",
      description: "Maximum number of rows to return",
      condition: "action === 'select'",
    },
    offset: {
      defaultValue: 0,
      editorType: "number",
      description: "Number of rows to skip",
      condition: "action === 'select'",
    },
    order: {
      defaultValue: "",
      editorType: "string",
      description: "Order by column(s), e.g. 'id.asc,created_at.desc'",
      condition: "action === 'select'",
    },
    single: {
      defaultValue: false,
      editorType: "boolean",
      description: "Return a single row instead of an array",
      condition:
        "action === 'select' || action === 'insert' || action === 'update' || action === 'upsert'",
    },
    count: {
      defaultValue: null,
      editorType: "select",
      editorTypeData: {
        options: [
          { label: "None", value: "" },
          { label: "Exact", value: "exact" },
          { label: "Planned", value: "planned" },
          { label: "Estimated", value: "estimated" },
        ],
      },
      description: "Count algorithm to use",
      condition: "action === 'select'",
    },
  },
  outputs: {
    result: {
      description: "Operation result data",
    },
  },
  run: async (inputs, outputs, adv) => {
    const {
      url,
      apiKey,
      action,
      table,
      columns,
      filters,
      data,
      functionName,
      functionArgs,
      limit,
      offset,
      order,
      count,
      single,
    } = inputs;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore-error - type should be a peer-dependency
    // const { createClient } = await import("@supabase/supabase-js");

    if (!url) {
      throw new Error("Supabase URL is required");
    }

    if (!apiKey) {
      throw new Error("Supabase API key is required");
    }

    try {
      // Initialize Supabase client
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(url, apiKey);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let result: any;

      // Perform the action based on selected operation
      switch (action) {
        case "select":
          query = supabase
            .from(table)
            .select(columns, { count: count || undefined });

          // Apply filters if provided
          if (filters && Object.keys(filters).length > 0) {
            Object.entries(filters).forEach(([key, value]) => {
              if (typeof value === "object" && value !== null) {
                // Handle operators like gt, lt, etc.
                const [operator, operatorValue] = Object.entries(value)[0];
                query = query.filter(key, operator, operatorValue);
              } else {
                query = query.eq(key, value);
              }
            });
          }

          // Apply pagination and ordering
          if (limit !== null) query = query.limit(limit);
          if (offset) query = query.range(offset, offset + (limit || 10) - 1);
          if (order) {
            const orderParts = order.split(",");
            orderParts.forEach((part: string) => {
              const [column, direction] = part.split(".");
              query = query.order(column, { ascending: direction !== "desc" });
            });
          }

          // Execute query
          result = single ? await query.single() : await query;
          break;

        case "insert":
          query = supabase.from(table).insert(data);
          result = single ? await query.select().single() : await query.select();
          break;

        case "update":
          query = supabase.from(table).update(data);

          // Apply filters if provided
          if (filters && Object.keys(filters).length > 0) {
            Object.entries(filters).forEach(([key, value]) => {
              if (typeof value === "object" && value !== null) {
                const [operator, operatorValue] = Object.entries(value)[0];
                query = query.filter(key, operator, operatorValue);
              } else {
                query = query.eq(key, value);
              }
            });
          }

          result = single ? await query.select().single() : await query.select();
          break;

        case "upsert":
          query = supabase.from(table).upsert(data);
          result = single ? await query.select().single() : await query.select();
          break;

        case "delete":
          query = supabase.from(table).delete();

          // Apply filters if provided
          if (filters && Object.keys(filters).length > 0) {
            Object.entries(filters).forEach(([key, value]) => {
              if (typeof value === "object" && value !== null) {
                const [operator, operatorValue] = Object.entries(value)[0];
                query = query.filter(key, operator, operatorValue);
              } else {
                query = query.eq(key, value);
              }
            });
          }

          result = await query.select();
          break;

        case "rpc":
          result = await supabase.rpc(functionName, functionArgs);
          break;

        default:
          throw new Error(`Unsupported action: ${action}`);
      }

      if (result.error) {
        adv.onError(`Supabase Error: ${result.error.message}`);
        return;
      }

      outputs.result.next(result.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as SupabaseErrorResponse;
        adv.onError(
          `Supabase API Error ${error.response.status}: ${errorData.error?.message || error.response.statusText
          }`
        );
        return;
      }
      adv.onError(`Error: ${(error as Error).message}`);
    }
  }
};

