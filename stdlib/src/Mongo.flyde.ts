import { CodeNode } from "@flyde/core";
import { MongoClient } from "mongodb";

const namespace = "MongoDB";

export const MongoConnect: CodeNode = {
  id: "Connect",
  defaultStyle: {
    icon: "fa-database",
  },
  namespace,
  description:
    'Connects to a Mongo database and returns a client. Uses the "mongodb" package.',
  inputs: {
    url: { description: "URL" },
    options: { description: "A Valid MongoClientOptions object" },
  },
  outputs: { connection: { description: "Mongo connected client" } },
  run: async ({ url, options }, { connection }) => {
    const client = new MongoClient(url, options);
    await client.connect();
    connection.next(client);
  },
};

export const Find: CodeNode = {
  id: "Find",
  defaultStyle: {
    icon: "fa-database",
  },
  namespace,
  description:
    'Queries a Mongo database. Find receives a valid "mongodb" FindOptions object.',
  inputs: {
    connection: { description: "Mongo connection" },
    collection: { description: "Collection" },
    query: { description: "Query" },
    options: { description: "Options" },
  },
  outputs: { result: { description: "" } },
  run: async ({ connection, collection, query, options }, { result }) => {
    const res = await connection
      .db()
      .collection(collection)
      .find(query, options)
      .toArray();
    result.next(res);
  },
};

export const FindOne: CodeNode = {
  id: "FindOne",
  defaultStyle: {
    icon: "fa-database",
  },
  namespace,
  description:
    'Queries a Mongo database. FindOne receives a valid "mongodb" FindOneOptions object.',
  inputs: {
    connection: { description: "Mongo connection" },
    collection: { description: "Collection" },
    query: { description: "Query" },
    options: { description: "Options" },
  },
  outputs: { result: { description: "" } },
  run: async ({ connection, collection, query, options }, { result }) => {
    const res = await connection
      .db()
      .collection(collection)
      .findOne(query, options);
    result.next(res);
  },
};

export const MongoDisconnect: CodeNode = {
  id: "Disconnect",
  defaultStyle: {
    icon: "fa-database",
  },
  namespace,
  description: "Disconnects from a Mongo database",
  inputs: { connection: { description: "Mongo connection" } },
  outputs: {},
  run: async ({ connection }) => {
    await connection.close();
  },
};

export const InsertOne: CodeNode = {
  id: "InsertOne",
  defaultStyle: {
    icon: "fa-database",
  },
  namespace,
  description:
    'Inserts one document into a Mongo database. InsertOne receives a valid "mongodb" InsertOneOptions object.',
  inputs: {
    connection: { description: "Mongo connection" },
    collection: { description: "Collection" },
    document: { description: "Document" },
    options: { description: "Options" },
  },
  outputs: { result: { description: "" } },
  run: async ({ connection, collection, document, options }, { result }) => {
    const res = await connection
      .db()
      .collection(collection)
      .insertOne(document, options);
    result.next(res);
  },
};

export const InsertMany: CodeNode = {
  id: "InsertMany",
  defaultStyle: {
    icon: "fa-database",
  },
  namespace,
  description:
    'Inserts many documents into a Mongo database. InsertMany receives a valid "mongodb" InsertManyOptions object.',
  inputs: {
    connection: { description: "Mongo connection" },
    collection: { description: "Collection" },
    documents: { description: "Documents" },
    options: { description: "Options" },
  },
  outputs: { result: { description: "" } },
  run: async ({ connection, collection, documents, options }, { result }) => {
    const res = await connection
      .db()
      .collection(collection)
      .insertMany(documents, options);
    result.next(res);
  },
};

export const UpdateOne: CodeNode = {
  id: "UpdateOne",
  defaultStyle: {
    icon: "fa-database",
  },
  namespace,
  description:
    'Updates one document in a Mongo database. UpdateOne receives a valid "mongodb" UpdateOneOptions object.',
  inputs: {
    connection: { description: "Mongo connection" },
    collection: { description: "Collection" },
    filter: { description: "Filter" },
    update: { description: "Update" },
    options: { description: "Options" },
  },
  outputs: { result: { description: "" } },
  run: async (
    { connection, collection, filter, update, options },
    { result }
  ) => {
    const res = await connection
      .db()
      .collection(collection)
      .updateOne(filter, update, options);
    result.next(res);
  },
};
export const UpdateMany: CodeNode = {
  id: "UpdateMany",
  defaultStyle: {
    icon: "fa-database",
  },
  namespace,
  description:
    'Updates many documents in a Mongo database. UpdateMany receives a valid "mongodb" UpdateManyOptions object.',
  inputs: {
    connection: { description: "Mongo connection" },
    collection: { description: "Collection" },
    filter: { description: "Filter" },
    update: { description: "Update" },
    options: { description: "Options" },
  },
  outputs: { result: { description: "" } },
  run: async (
    { connection, collection, filter, update, options },
    { result }
  ) => {
    const res = await connection
      .db()
      .collection(collection)
      .updateMany(filter, update, options);
    result.next(res);
  },
};

export const DeleteOne: CodeNode = {
  id: "DeleteOne",
  defaultStyle: {
    icon: "fa-database",
  },
  namespace,
  description:
    'Deletes one document in a Mongo database. DeleteOne receives a valid "mongodb" DeleteOneOptions object.',
  inputs: {
    connection: { description: "Mongo connection" },
    collection: { description: "Collection" },
    filter: { description: "Filter" },
    options: { description: "Options" },
  },
  outputs: { result: { description: "" } },
  run: async ({ connection, collection, filter, options }, { result }) => {
    const res = await connection
      .db()
      .collection(collection)
      .deleteOne(filter, options);
    result.next(res);
  },
};

export const DeleteMany: CodeNode = {
  id: "DeleteMany",
  defaultStyle: {
    icon: "fa-database",
  },
  namespace,
  description:
    'Deletes many documents in a Mongo database. DeleteMany receives a valid "mongodb" DeleteManyOptions object.',
  inputs: {
    connection: { description: "Mongo connection" },
    collection: { description: "Collection name" },
    filter: { description: "Filter query" },
    options: { description: "Query options" },
  },
  outputs: { result: { description: "" } },
  run: async ({ connection, collection, filter, options }, { result }) => {
    const res = await connection
      .db()
      .collection(collection)
      .deleteMany(filter, options);
    result.next(res);
  },
};

export const CountDocuments: CodeNode = {
  id: "CountDocuments",
  defaultStyle: {
    icon: "fa-database",
  },
  namespace,
  description:
    'Counts documents in a Mongo database. CountDocuments receives a valid "mongodb" CountDocumentsOptions object.',
  inputs: {
    connection: { description: "Mongo connection" },
    collection: { description: "Collection" },
    query: { description: "Query" },
    options: { description: "Options" },
  },
  outputs: { result: { description: "" } },
  run: async ({ connection, collection, query, options }, { result }) => {
    const res = await connection
      .db()
      .collection(collection)
      .countDocuments(query, options);
    result.next(res);
  },
};

export const CreateIndex: CodeNode = {
  id: "CreateIndex",
  defaultStyle: {
    icon: "fa-database",
  },
  namespace,
  description:
    'Creates an index in a Mongo database. CreateIndex receives a valid "mongodb" CreateIndexesOptions object.',
  inputs: {
    connection: { description: "Mongo connection" },
    collection: { description: "Collection" },
    fieldOrSpec: { description: "Field or spec" },
    options: { description: "Options" },
  },
  outputs: { result: { description: "" } },
  run: async ({ connection, collection, fieldOrSpec, options }, { result }) => {
    const res = await connection
      .db()
      .collection(collection)
      .createIndex(fieldOrSpec, options);
    result.next(res);
  },
};

export const CreateIndexes: CodeNode = {
  id: "CreateIndexes",
  defaultStyle: {
    icon: "fa-database",
  },
  namespace,
  description:
    'Creates indexes in a Mongo database. CreateIndexes receives a valid "mongodb" CreateIndexesOptions object.',
  inputs: {
    connection: { description: "Mongo connection" },
    collection: { description: "Collection" },
    indexes: { description: "Indexes" },
    options: { description: "Options" },
  },
  outputs: { result: { description: "" } },
  run: async ({ connection, collection, indexes, options }, { result }) => {
    const res = await connection
      .db()
      .collection(collection)
      .createIndexes(indexes, options);
    result.next(res);
  },
};
