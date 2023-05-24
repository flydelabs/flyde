const namespace = "Postgres";

import { CodePart } from "@flyde/core";

export const Connect: CodePart = {
  id: "Connect",
  defaultStyle: {
    icon: "fa-database",
  },
  namespace,
  description:
    'Connects to a Postgres database and returns a client. Uses the "pg" package.',
  inputs: {
    host: { description: "Host" },
    port: { description: "Port" },
    database: { description: "Database" },
    user: { description: "User" },
    password: { description: "Password" },
  },
  outputs: { connection: { description: "Postgres connected client" } },
  run: async ({ host, port, database, user, password }, { connection }) => {
    const { Client } = await import("pg");
    const client = new Client({
      host,
      port,
      database,
      user,
      password,
    });
    await client.connect();
    connection.next(client);
  },
};

export const Disconnect: CodePart = {
  id: "Disconnect",
  defaultStyle: {
    icon: "fa-database",
  },
  namespace,
  description: "Disconnects from a Postgres database",
  inputs: { connection: { description: "Postgres connection" } },
  outputs: {},
  run: async ({ connection }) => {
    await connection.value?.end();
  },
};

export const Query: CodePart = {
  id: "Query",
  defaultStyle: {
    icon: "fa-database",
  },
  namespace,
  description:
    'Queries a Postgres database. Query receives a valid "pg" QueryConfig object.',
  inputs: {
    connection: { description: "Postgres connection" },
    query: { description: "Query" },
  },
  outputs: {
    result: {
      description:
        'valid "pg" <a href="https://node-postgres.com/apis/client#queryconfig">QueryConfig object</a>',
    },
  },
  run: async ({ connection, query }, { result }) => {
    const queryResult = await connection.value?.query(query);
    result.next(queryResult?.rows);
  },
};
