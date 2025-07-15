export const ExampleBlogpost = {
  "instances": [
    {
      "id": "OpenAI-7904gip",
      "config": {
        "apiKey": {
          "type": "string",
          "value": "OPENAI_API_KEY"
        },
        "model": {
          "type": "select",
          "value": "gpt-4.1"
        },
        "prompt": {
          "type": "string",
          "value": "You are a master blog post author, and a master on the topic of \"{{topic}}\"\nPlease generate a captivating blog post title. Return just the title, no wrappers."
        },
        "temperature": {
          "type": "number",
          "value": 0.7
        },
        "responseFormat": {
          "type": "select",
          "value": "text"
        },
        "jsonSchema": {
          "type": "json",
          "value": {
            "type": "object",
            "properties": {
              "summary": {
                "type": "string",
                "description": "A summary of the text"
              },
              "keyPoints": {
                "type": "array",
                "items": {
                  "type": "string"
                },
                "description": "Key points from the text"
              }
            },
            "required": [
              "summary",
              "keyPoints"
            ]
          }
        }
      },
      "nodeId": "OpenAI",
      "inputConfig": {},
      "pos": {
        "x": -372.3106216472647,
        "y": -237.38023521164422
      },
      "type": "code",
      "source": {
        "type": "package",
        "data": "@flyde/nodes"
      },
      "displayName": "Generate subject",
      "node": {
        "id": "OpenAI__OpenAI-7904gip",
        "inputs": {
          "topic": {
            "mode": "required"
          }
        },
        "outputs": {
          "completion": {
            "description": "Generated completion (as string)"
          }
        },
        "displayName": "Generate subject",
        "description": "Generates a chat completion using OpenAI",
        "editorConfig": {
          "type": "structured",
          "fields": [
            {
              "type": "secret",
              "configKey": "apiKey",
              "typeData": {
                "defaultName": "OPENAI_API_KEY"
              },
              "label": "OpenAI API Key"
            },
            {
              "type": "select",
              "configKey": "model",
              "typeData": {
                "options": [
                  "gpt-4.1",
                  "gpt-4.1-mini",
                  "gpt-4.1-nano",
                  "gpt-4o",
                  "chatgpt-4o-latest",
                  "gpt-4o-mini",
                  "o1",
                  "o1-mini",
                  "o3-mini",
                  "o1-preview",
                  "gpt-4o-realtime-preview",
                  "gpt-4o-mini-realtime-preview",
                  "gpt-4o-audio-preview"
                ]
              },
              "label": "The model to use"
            },
            {
              "type": "longtext",
              "configKey": "prompt",
              "label": "Prompt for chat completion"
            },
            {
              "type": "number",
              "configKey": "temperature",
              "label": "Temperature for text generation"
            },
            {
              "type": "select",
              "configKey": "responseFormat",
              "typeData": {
                "options": [
                  "text",
                  "json_object",
                  "json_schema"
                ]
              },
              "label": "Response Format",
              "description": "Format of the response (text, JSON object, or structured JSON according to schema)",
              "typeConfigurable": false
            },
            {
              "type": "json",
              "configKey": "jsonSchema",
              "label": "JSON Schema",
              "description": "JSON schema to structure the output (only used when responseFormat is 'json_schema')",
              "aiCompletion": {
                "prompt": "Generate a JSON schema matching the following requirements: {{prompt}}. Current schema: {{value}}",
                "placeholder": "Describe the structure you want for your JSON output"
              },
              "condition": "responseFormat === 'json_schema'"
            }
          ]
        },
        "icon": "<svg fill=\"currentColor\" width=\"24px\" height=\"24px\" viewBox=\"0 0 24 24\" role=\"img\" xmlns=\"http://www.w3.org/2000/svg\"><g id=\"SVGRepo_bgCarrier\" stroke-width=\"0\"></g><g id=\"SVGRepo_tracerCarrier\" stroke-linecap=\"round\" stroke-linejoin=\"round\"></g><g id=\"SVGRepo_iconCarrier\"><title>OpenAI icon</title><path d=\"M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z\"></path></g></svg>",
        "sourceCode": "// Bundled content\n{\n  \"id\": \"OpenAI\",\n  \"menuDisplayName\": \"OpenAI\",\n  \"namespace\": \"ai\",\n  \"icon\": \"<svg fill=\\\"currentColor\\\" width=\\\"24px\\\" height=\\\"24px\\\" viewBox=\\\"0 0 24 24\\\" role=\\\"img\\\" xmlns=\\\"http://www.w3.org/2000/svg\\\"><g id=\\\"SVGRepo_bgCarrier\\\" stroke-width=\\\"0\\\"></g><g id=\\\"SVGRepo_tracerCarrier\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\"></g><g id=\\\"SVGRepo_iconCarrier\\\"><title>OpenAI icon</title><path d=\\\"M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z\\\"></path></g></svg>\",\n  \"displayName\": \"OpenAI\",\n  \"description\": \"Generates a chat completion using OpenAI\",\n  \"inputs\": {\n    \"apiKey\": {\n      \"editorType\": \"secret\",\n      \"editorTypeData\": {\n        \"defaultName\": \"OPENAI_API_KEY\"\n      },\n      \"description\": \"OpenAI API Key\"\n    },\n    \"model\": {\n      \"defaultValue\": \"gpt-4.1\",\n      \"editorType\": \"select\",\n      \"editorTypeData\": {\n        \"options\": [\n          \"gpt-4.1\",\n          \"gpt-4.1-mini\",\n          \"gpt-4.1-nano\",\n          \"gpt-4o\",\n          \"chatgpt-4o-latest\",\n          \"gpt-4o-mini\",\n          \"o1\",\n          \"o1-mini\",\n          \"o3-mini\",\n          \"o1-preview\",\n          \"gpt-4o-realtime-preview\",\n          \"gpt-4o-mini-realtime-preview\",\n          \"gpt-4o-audio-preview\"\n        ]\n      },\n      \"description\": \"The model to use\"\n    },\n    \"prompt\": {\n      \"defaultValue\": \"Generate a summary of the following text: {{text}}\",\n      \"editorType\": \"longtext\",\n      \"description\": \"Prompt for chat completion\"\n    },\n    \"temperature\": {\n      \"defaultValue\": 0.7,\n      \"editorType\": \"number\",\n      \"description\": \"Temperature for text generation\"\n    },\n    \"responseFormat\": {\n      \"defaultValue\": \"text\",\n      \"editorType\": \"select\",\n      \"typeConfigurable\": false,\n      \"editorTypeData\": {\n        \"options\": [\n          \"text\",\n          \"json_object\",\n          \"json_schema\"\n        ]\n      },\n      \"label\": \"Response Format\",\n      \"description\": \"Format of the response (text, JSON object, or structured JSON according to schema)\"\n    },\n    \"jsonSchema\": {\n      \"defaultValue\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"summary\": {\n            \"type\": \"string\",\n            \"description\": \"A summary of the text\"\n          },\n          \"keyPoints\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            },\n            \"description\": \"Key points from the text\"\n          }\n        },\n        \"required\": [\n          \"summary\",\n          \"keyPoints\"\n        ]\n      },\n      \"editorType\": \"json\",\n      \"label\": \"JSON Schema\",\n      \"description\": \"JSON schema to structure the output (only used when responseFormat is 'json_schema')\",\n      \"aiCompletion\": {\n        \"prompt\": \"Generate a JSON schema matching the following requirements: {{prompt}}. Current schema: {{value}}\",\n        \"placeholder\": \"Describe the structure you want for your JSON output\"\n      },\n      \"condition\": \"responseFormat === 'json_schema'\"\n    }\n  },\n  \"outputs\": {\n    \"completion\": {\n      \"description\": \"Generated completion (as string)\"\n    }\n  }\n}"
      }
    },
    {
      "id": "Anthropic-1j14gnl",
      "config": {
        "apiKey": {
          "type": "string",
          "value": "ANTHROPIC_API_KEY"
        },
        "model": {
          "type": "select",
          "value": "claude-sonnet-4-20250514"
        },
        "prompt": {
          "type": "string",
          "value": "You are a master blog post author, expert in the topic of {{topic}}\n\nPlease generarate a short (3 paragraphs tops) blog post content, in HTML, for the following subject:\n{{subject}}\n\nReturn  just HTML for the blog's content, no metadata or title, just HTML"
        },
        "temperature": {
          "type": "number",
          "value": 0.7
        },
        "maxTokens": {
          "type": "number",
          "value": 1000
        }
      },
      "nodeId": "Anthropic",
      "inputConfig": {},
      "pos": {
        "x": -116.18342374876022,
        "y": -126.85574595958127
      },
      "type": "code",
      "source": {
        "type": "package",
        "data": "@flyde/nodes"
      },
      "node": {
        "id": "Anthropic__Anthropic-1j14gnl",
        "inputs": {
          "topic": {
            "mode": "required"
          },
          "subject": {
            "mode": "required"
          }
        },
        "outputs": {
          "response": {
            "description": "Generated text response"
          }
        },
        "displayName": "Anthropic",
        "description": "Generate text using Anthropic's Claude models",
        "editorConfig": {
          "type": "structured",
          "fields": [
            {
              "type": "secret",
              "configKey": "apiKey",
              "typeData": {
                "defaultName": "ANTHROPIC_API_KEY"
              },
              "label": "Anthropic API Key"
            },
            {
              "type": "select",
              "configKey": "model",
              "typeData": {
                "options": [
                  "claude-opus-4-20250514",
                  "claude-sonnet-4-20250514",
                  "claude-3-7-sonnet-20250219",
                  "claude-3-7-sonnet-latest",
                  "claude-3-5-sonnet-20241022",
                  "claude-3-5-sonnet-latest",
                  "claude-3-5-sonnet-20240620",
                  "claude-3-5-haiku-20241022",
                  "claude-3-5-haiku-latest",
                  "claude-3-opus-20240229",
                  "claude-3-opus-latest",
                  "claude-3-sonnet-20240229",
                  "claude-3-haiku-20240307"
                ]
              },
              "label": "Anthropic model to use"
            },
            {
              "type": "longtext",
              "configKey": "prompt",
              "label": "Prompt for text generation"
            },
            {
              "type": "number",
              "configKey": "temperature",
              "label": "Temperature for response generation (0-1)"
            },
            {
              "type": "number",
              "configKey": "maxTokens",
              "label": "Maximum number of tokens to generate"
            }
          ]
        },
        "icon": "\n<svg version=\"1.1\" id=\"Layer_1\" xmlns:x=\"ns_extend;\" xmlns:i=\"ns_ai;\" xmlns:graph=\"ns_graphs;\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" viewBox=\"0 0 92.2 65\" style=\"enable-background:new 0 0 92.2 65;\" xml:space=\"preserve\">\n <style type=\"text/css\">\n  .st0{fill: currentColor;}\n </style>\n <metadata>\n  <sfw xmlns=\"ns_sfw;\">\n   <slices>\n   </slices>\n   <sliceSourceBounds bottomLeftOrigin=\"true\" height=\"65\" width=\"92.2\" x=\"-43.7\" y=\"-98\">\n   </sliceSourceBounds>\n  </sfw>\n </metadata>\n <path class=\"st0\" d=\"M66.5,0H52.4l25.7,65h14.1L66.5,0z M25.7,0L0,65h14.4l5.3-13.6h26.9L51.8,65h14.4L40.5,0C40.5,0,25.7,0,25.7,0z\n\t M24.3,39.3l8.8-22.8l8.8,22.8H24.3z\">\n </path>\n</svg>",
        "sourceCode": "// Bundled content\n{\n  \"id\": \"Anthropic\",\n  \"displayName\": \"Anthropic\",\n  \"namespace\": \"ai\",\n  \"menuDisplayName\": \"Anthropic\",\n  \"description\": \"Generate text using Anthropic's Claude models\",\n  \"icon\": \"\\n<svg version=\\\"1.1\\\" id=\\\"Layer_1\\\" xmlns:x=\\\"ns_extend;\\\" xmlns:i=\\\"ns_ai;\\\" xmlns:graph=\\\"ns_graphs;\\\" xmlns=\\\"http://www.w3.org/2000/svg\\\" xmlns:xlink=\\\"http://www.w3.org/1999/xlink\\\" x=\\\"0px\\\" y=\\\"0px\\\" viewBox=\\\"0 0 92.2 65\\\" style=\\\"enable-background:new 0 0 92.2 65;\\\" xml:space=\\\"preserve\\\">\\n <style type=\\\"text/css\\\">\\n  .st0{fill: currentColor;}\\n </style>\\n <metadata>\\n  <sfw xmlns=\\\"ns_sfw;\\\">\\n   <slices>\\n   </slices>\\n   <sliceSourceBounds bottomLeftOrigin=\\\"true\\\" height=\\\"65\\\" width=\\\"92.2\\\" x=\\\"-43.7\\\" y=\\\"-98\\\">\\n   </sliceSourceBounds>\\n  </sfw>\\n </metadata>\\n <path class=\\\"st0\\\" d=\\\"M66.5,0H52.4l25.7,65h14.1L66.5,0z M25.7,0L0,65h14.4l5.3-13.6h26.9L51.8,65h14.4L40.5,0C40.5,0,25.7,0,25.7,0z\\n\\t M24.3,39.3l8.8-22.8l8.8,22.8H24.3z\\\">\\n </path>\\n</svg>\",\n  \"inputs\": {\n    \"apiKey\": {\n      \"editorType\": \"secret\",\n      \"editorTypeData\": {\n        \"defaultName\": \"ANTHROPIC_API_KEY\"\n      },\n      \"description\": \"Anthropic API Key\"\n    },\n    \"model\": {\n      \"defaultValue\": \"claude-3-7-sonnet-latest\",\n      \"editorType\": \"select\",\n      \"editorTypeData\": {\n        \"options\": [\n          \"claude-opus-4-20250514\",\n          \"claude-sonnet-4-20250514\",\n          \"claude-3-7-sonnet-20250219\",\n          \"claude-3-7-sonnet-latest\",\n          \"claude-3-5-sonnet-20241022\",\n          \"claude-3-5-sonnet-latest\",\n          \"claude-3-5-sonnet-20240620\",\n          \"claude-3-5-haiku-20241022\",\n          \"claude-3-5-haiku-latest\",\n          \"claude-3-opus-20240229\",\n          \"claude-3-opus-latest\",\n          \"claude-3-sonnet-20240229\",\n          \"claude-3-haiku-20240307\"\n        ]\n      },\n      \"description\": \"Anthropic model to use\"\n    },\n    \"prompt\": {\n      \"defaultValue\": \"Generate a response to the following: {{text}}\",\n      \"editorType\": \"longtext\",\n      \"description\": \"Prompt for text generation\"\n    },\n    \"temperature\": {\n      \"defaultValue\": 0.7,\n      \"editorType\": \"number\",\n      \"description\": \"Temperature for response generation (0-1)\"\n    },\n    \"maxTokens\": {\n      \"defaultValue\": 1000,\n      \"editorType\": \"number\",\n      \"description\": \"Maximum number of tokens to generate\"\n    }\n  },\n  \"outputs\": {\n    \"response\": {\n      \"description\": \"Generated text response\"\n    }\n  }\n}"
      }
    },
    {
      "id": "InlineValue-4y04ggy",
      "config": {
        "value": {
          "type": "json",
          "value": {
            "subject": "{{subject}}",
            "content": "{{content}}",
            "summary": "{{summary}}"
          }
        }
      },
      "nodeId": "InlineValue",
      "inputConfig": {},
      "pos": {
        "x": 410.1566191297444,
        "y": -201.59529702959708
      },
      "type": "code",
      "source": {
        "type": "package",
        "data": "@flyde/nodes"
      },
      "displayName": "Blog post data",
      "node": {
        "id": "InlineValue__InlineValue-4y04ggy",
        "inputs": {
          "subject": {
            "mode": "required"
          },
          "content": {
            "mode": "required"
          },
          "summary": {
            "mode": "required"
          }
        },
        "outputs": {
          "value": {
            "description": "Emits the value configured"
          }
        },
        "displayName": "Blog post data",
        "description": "Emits the value `{\"subject\":\"{{subject}}\",\"content\":\"{{content}}\",\"summary\":\"{{summary}}\"}`",
        "editorConfig": {
          "type": "structured",
          "fields": [
            {
              "type": "longtext",
              "label": "Value",
              "configKey": "value",
              "description": "The value to emit. Supports dynamic variables using {{syntax}}",
              "aiCompletion": {
                "prompt": "You are an expert at generating values with variables. The user will provide a description of the value they want to use, and you should create a valid representation with appropriate dynamic variables.\nYou can expose dynamic variables using the {{syntax}}, for example \"Hello, {{name}}\" will expose the \"name\" as a dynamic input.\nOnly expose variables if needed, otherwise avoid them.\n\n## Previous value:\n{{value}}\n\n## User request:\n{{prompt}}\n\nPrefer camelCase for variable names. Return only the generated value with no code formatting or backticks.",
                "placeholder": "Describe the value you want to generate"
              }
            }
          ]
        },
        "icon": "pencil",
        "sourceCode": "// Bundled content\n{\n  \"id\": \"InlineValue\",\n  \"mode\": \"advanced\",\n  \"defaultConfig\": {\n    \"value\": {\n      \"type\": \"string\",\n      \"value\": \"Hello, {{name}}\"\n    }\n  },\n  \"outputs\": {\n    \"value\": {\n      \"description\": \"Emits the value configured\"\n    }\n  },\n  \"menuDisplayName\": \"Inline Value\",\n  \"menuDescription\": \"Emits a value each time it's called. Supports dynamic variables\",\n  \"icon\": \"pencil\",\n  \"editorConfig\": {\n    \"type\": \"structured\",\n    \"fields\": [\n      {\n        \"type\": \"longtext\",\n        \"label\": \"Value\",\n        \"configKey\": \"value\",\n        \"description\": \"The value to emit. Supports dynamic variables using {{syntax}}\",\n        \"aiCompletion\": {\n          \"prompt\": \"You are an expert at generating values with variables. The user will provide a description of the value they want to use, and you should create a valid representation with appropriate dynamic variables.\\nYou can expose dynamic variables using the {{syntax}}, for example \\\"Hello, {{name}}\\\" will expose the \\\"name\\\" as a dynamic input.\\nOnly expose variables if needed, otherwise avoid them.\\n\\n## Previous value:\\n{{value}}\\n\\n## User request:\\n{{prompt}}\\n\\nPrefer camelCase for variable names. Return only the generated value with no code formatting or backticks.\",\n          \"placeholder\": \"Describe the value you want to generate\"\n        }\n      }\n    ]\n  }\n}"
      }
    },
    {
      "id": "OpenAI-bt14gqc",
      "config": {
        "apiKey": {
          "type": "string",
          "value": "OPENAI_API_KEY"
        },
        "model": {
          "type": "select",
          "value": "gpt-4.1-mini"
        },
        "prompt": {
          "type": "string",
          "value": "Generate a summary of the following blog post content: {{content}}"
        },
        "temperature": {
          "type": "number",
          "value": 0.7
        },
        "responseFormat": {
          "type": "select",
          "value": "text"
        },
        "jsonSchema": {
          "type": "json",
          "value": {
            "type": "object",
            "properties": {
              "summary": {
                "type": "string",
                "description": "A summary of the text"
              },
              "keyPoints": {
                "type": "array",
                "items": {
                  "type": "string"
                },
                "description": "Key points from the text"
              }
            },
            "required": [
              "summary",
              "keyPoints"
            ]
          }
        }
      },
      "nodeId": "OpenAI",
      "inputConfig": {},
      "pos": {
        "x": 153.96672291132245,
        "y": -57.827328586553676
      },
      "type": "code",
      "source": {
        "type": "package",
        "data": "@flyde/nodes"
      },
      "node": {
        "id": "OpenAI__OpenAI-bt14gqc",
        "inputs": {
          "content": {
            "mode": "required"
          }
        },
        "outputs": {
          "completion": {
            "description": "Generated completion (as string)"
          }
        },
        "displayName": "OpenAI",
        "description": "Generates a chat completion using OpenAI",
        "editorConfig": {
          "type": "structured",
          "fields": [
            {
              "type": "secret",
              "configKey": "apiKey",
              "typeData": {
                "defaultName": "OPENAI_API_KEY"
              },
              "label": "OpenAI API Key"
            },
            {
              "type": "select",
              "configKey": "model",
              "typeData": {
                "options": [
                  "gpt-4.1",
                  "gpt-4.1-mini",
                  "gpt-4.1-nano",
                  "gpt-4o",
                  "chatgpt-4o-latest",
                  "gpt-4o-mini",
                  "o1",
                  "o1-mini",
                  "o3-mini",
                  "o1-preview",
                  "gpt-4o-realtime-preview",
                  "gpt-4o-mini-realtime-preview",
                  "gpt-4o-audio-preview"
                ]
              },
              "label": "The model to use"
            },
            {
              "type": "longtext",
              "configKey": "prompt",
              "label": "Prompt for chat completion"
            },
            {
              "type": "number",
              "configKey": "temperature",
              "label": "Temperature for text generation"
            },
            {
              "type": "select",
              "configKey": "responseFormat",
              "typeData": {
                "options": [
                  "text",
                  "json_object",
                  "json_schema"
                ]
              },
              "label": "Response Format",
              "description": "Format of the response (text, JSON object, or structured JSON according to schema)",
              "typeConfigurable": false
            },
            {
              "type": "json",
              "configKey": "jsonSchema",
              "label": "JSON Schema",
              "description": "JSON schema to structure the output (only used when responseFormat is 'json_schema')",
              "aiCompletion": {
                "prompt": "Generate a JSON schema matching the following requirements: {{prompt}}. Current schema: {{value}}",
                "placeholder": "Describe the structure you want for your JSON output"
              },
              "condition": "responseFormat === 'json_schema'"
            }
          ]
        },
        "icon": "<svg fill=\"currentColor\" width=\"24px\" height=\"24px\" viewBox=\"0 0 24 24\" role=\"img\" xmlns=\"http://www.w3.org/2000/svg\"><g id=\"SVGRepo_bgCarrier\" stroke-width=\"0\"></g><g id=\"SVGRepo_tracerCarrier\" stroke-linecap=\"round\" stroke-linejoin=\"round\"></g><g id=\"SVGRepo_iconCarrier\"><title>OpenAI icon</title><path d=\"M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z\"></path></g></svg>",
        "sourceCode": "// Bundled content\n{\n  \"id\": \"OpenAI\",\n  \"menuDisplayName\": \"OpenAI\",\n  \"namespace\": \"ai\",\n  \"icon\": \"<svg fill=\\\"currentColor\\\" width=\\\"24px\\\" height=\\\"24px\\\" viewBox=\\\"0 0 24 24\\\" role=\\\"img\\\" xmlns=\\\"http://www.w3.org/2000/svg\\\"><g id=\\\"SVGRepo_bgCarrier\\\" stroke-width=\\\"0\\\"></g><g id=\\\"SVGRepo_tracerCarrier\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\"></g><g id=\\\"SVGRepo_iconCarrier\\\"><title>OpenAI icon</title><path d=\\\"M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z\\\"></path></g></svg>\",\n  \"displayName\": \"OpenAI\",\n  \"description\": \"Generates a chat completion using OpenAI\",\n  \"inputs\": {\n    \"apiKey\": {\n      \"editorType\": \"secret\",\n      \"editorTypeData\": {\n        \"defaultName\": \"OPENAI_API_KEY\"\n      },\n      \"description\": \"OpenAI API Key\"\n    },\n    \"model\": {\n      \"defaultValue\": \"gpt-4.1\",\n      \"editorType\": \"select\",\n      \"editorTypeData\": {\n        \"options\": [\n          \"gpt-4.1\",\n          \"gpt-4.1-mini\",\n          \"gpt-4.1-nano\",\n          \"gpt-4o\",\n          \"chatgpt-4o-latest\",\n          \"gpt-4o-mini\",\n          \"o1\",\n          \"o1-mini\",\n          \"o3-mini\",\n          \"o1-preview\",\n          \"gpt-4o-realtime-preview\",\n          \"gpt-4o-mini-realtime-preview\",\n          \"gpt-4o-audio-preview\"\n        ]\n      },\n      \"description\": \"The model to use\"\n    },\n    \"prompt\": {\n      \"defaultValue\": \"Generate a summary of the following text: {{text}}\",\n      \"editorType\": \"longtext\",\n      \"description\": \"Prompt for chat completion\"\n    },\n    \"temperature\": {\n      \"defaultValue\": 0.7,\n      \"editorType\": \"number\",\n      \"description\": \"Temperature for text generation\"\n    },\n    \"responseFormat\": {\n      \"defaultValue\": \"text\",\n      \"editorType\": \"select\",\n      \"typeConfigurable\": false,\n      \"editorTypeData\": {\n        \"options\": [\n          \"text\",\n          \"json_object\",\n          \"json_schema\"\n        ]\n      },\n      \"label\": \"Response Format\",\n      \"description\": \"Format of the response (text, JSON object, or structured JSON according to schema)\"\n    },\n    \"jsonSchema\": {\n      \"defaultValue\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"summary\": {\n            \"type\": \"string\",\n            \"description\": \"A summary of the text\"\n          },\n          \"keyPoints\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            },\n            \"description\": \"Key points from the text\"\n          }\n        },\n        \"required\": [\n          \"summary\",\n          \"keyPoints\"\n        ]\n      },\n      \"editorType\": \"json\",\n      \"label\": \"JSON Schema\",\n      \"description\": \"JSON schema to structure the output (only used when responseFormat is 'json_schema')\",\n      \"aiCompletion\": {\n        \"prompt\": \"Generate a JSON schema matching the following requirements: {{prompt}}. Current schema: {{value}}\",\n        \"placeholder\": \"Describe the structure you want for your JSON output\"\n      },\n      \"condition\": \"responseFormat === 'json_schema'\"\n    }\n  },\n  \"outputs\": {\n    \"completion\": {\n      \"description\": \"Generated completion (as string)\"\n    }\n  }\n}"
      }
    }
  ],
  "connections": [
    {
      "from": {
        "insId": "__this",
        "pinId": "topic"
      },
      "to": {
        "insId": "OpenAI-7904gip",
        "pinId": "topic"
      }
    },
    {
      "from": {
        "insId": "OpenAI-7904gip",
        "pinId": "completion"
      },
      "to": {
        "insId": "Anthropic-1j14gnl",
        "pinId": "subject"
      }
    },
    {
      "from": {
        "insId": "__this",
        "pinId": "topic"
      },
      "to": {
        "insId": "Anthropic-1j14gnl",
        "pinId": "topic"
      }
    },
    {
      "from": {
        "insId": "OpenAI-7904gip",
        "pinId": "completion"
      },
      "to": {
        "insId": "InlineValue-4y04ggy",
        "pinId": "subject"
      }
    },
    {
      "from": {
        "insId": "Anthropic-1j14gnl",
        "pinId": "response"
      },
      "to": {
        "insId": "OpenAI-bt14gqc",
        "pinId": "content"
      }
    },
    {
      "from": {
        "insId": "OpenAI-bt14gqc",
        "pinId": "completion"
      },
      "to": {
        "insId": "InlineValue-4y04ggy",
        "pinId": "summary"
      }
    },
    {
      "from": {
        "insId": "Anthropic-1j14gnl",
        "pinId": "response"
      },
      "to": {
        "insId": "InlineValue-4y04ggy",
        "pinId": "content"
      }
    },
    {
      "from": {
        "insId": "InlineValue-4y04ggy",
        "pinId": "value"
      },
      "to": {
        "insId": "__this",
        "pinId": "blogPost"
      }
    }
  ],
  "id": "Example",
  "inputs": {
    "topic": {
      "mode": "required"
    }
  },
  "outputs": {
    "blogPost": {
      "delayed": false
    }
  },
  "inputsPosition": {
    "question": {
      "x": -510.8552075195313,
      "y": -106.74767211914062
    },
    "userId": {
      "x": -521.2010229492188,
      "y": -5.160607910156251
    },
    "topic": {
      "x": -560.4830456542969,
      "y": -109.08241943359374
    }
  },
  "outputsPosition": {
    "result": {
      "x": -23.264428942324532,
      "y": 237.25953921502617
    },
    "blogPost": {
      "x": 633.4904876708985,
      "y": -180.87246459960937
    }
  }
};