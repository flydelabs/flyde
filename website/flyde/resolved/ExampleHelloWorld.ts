export const ExampleHelloWorld = {
  "instances": [
    {
      "id": "InlineValue-lt28i55w",
      "config": {
        "value": {
          "type": "string",
          "value": "Hello, {{name}}"
        }
      },
      "nodeId": "InlineValue",
      "inputConfig": {},
      "pos": {
        "x": 89.57865951397048,
        "y": -168.91223409434372
      },
      "type": "code",
      "source": {
        "type": "package",
        "data": "@flyde/nodes"
      },
      "node": {
        "id": "InlineValue__InlineValue-lt28i55w",
        "inputs": {
          "name": {
            "mode": "required"
          }
        },
        "outputs": {
          "value": {
            "description": "Emits the value configured"
          }
        },
        "displayName": "\"Hello, {{name}}\"",
        "description": "Emits the value `\"Hello, {{name}}\"`",
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
    }
  ],
  "connections": [
    {
      "from": {
        "insId": "__this",
        "pinId": "name"
      },
      "to": {
        "insId": "InlineValue-lt28i55w",
        "pinId": "name"
      }
    },
    {
      "from": {
        "insId": "InlineValue-lt28i55w",
        "pinId": "value"
      },
      "to": {
        "insId": "__this",
        "pinId": "response"
      }
    }
  ],
  "id": "Example",
  "inputs": {
    "name": {
      "mode": "required"
    }
  },
  "outputs": {
    "response": {
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
      "x": -523.7615185546875,
      "y": -160.86858276367187
    },
    "name": {
      "x": -217.2192211914063,
      "y": -169.20122436523437
    }
  },
  "outputsPosition": {
    "result": {
      "x": -23.264428942324532,
      "y": 237.25953921502617
    },
    "blogPost": {
      "x": 663.252458190918,
      "y": -186.23055786132812
    },
    "response": {
      "x": 363.25312957763674,
      "y": -169.17501586914062
    }
  },
  "completionOutputs": []
};