import { partFromSimpleFunction } from "@flyde/core";
import { MongoClient } from "mongodb";

const namespace = "MongoDB";

export const MongoConnect = partFromSimpleFunction({
  id: "Connect",
  icon: "fa-database",
  namespace,
  description:
    'Connects to a Mongo database and returns a client. Uses the "mongodb" package.',
  inputs: [
    { name: "url", description: "URL" },
    { name: "options", description: "A Valid MongoClientOptions object" },
  ],
  output: { name: "connection", description: "Mongo connected client" },
  run: async (url, options) => {
    const client = new MongoClient(url, options);
    await client.connect();
    return client;
  },
});

export const Find = partFromSimpleFunction({
  id: "Find",
  icon: "fa-database",
  namespace,
  description:
    'Queries a Mongo database. Find receives a valid "mongodb" FindOptions object.',
  inputs: [
    { name: "connection", description: "Mongo connection" },
    { name: "collection", description: "Collection" },
    { name: "query", description: "Query" },
    { name: "options", description: "Options" },
  ],
  output: { name: "result", description: "" },
  run: async (connection: MongoClient, collection, query, options) => {
    const result = await connection
      .db()
      .collection(collection)
      .find(query, options)
      .toArray();
    return result;
  },
});

export const FindOne = partFromSimpleFunction({
  id: "FindOne",
  icon: "fa-database",
  namespace,
  description:
    'Queries a Mongo database. FindOne receives a valid "mongodb" FindOneOptions object.',
  inputs: [
    { name: "connection", description: "Mongo connection" },
    { name: "collection", description: "Collection" },
    { name: "query", description: "Query" },
    { name: "options", description: "Options" },
  ],
  output: { name: "result", description: "" },
  run: async (connection: MongoClient, collection, query, options) => {
    const result = await connection
      .db()
      .collection(collection)
      .findOne(query, options);
    return result;
  },
});

export const MongoDisconnect = partFromSimpleFunction({
  id: "Disconnect",
  icon: "fa-database",
  namespace,
  description: "Disconnects from a Mongo database",
  inputs: [{ name: "connection", description: "Mongo connection" }],
  run: async (connection) => {
    await connection.close();
  },
});

export const InsertOne = partFromSimpleFunction({
  id: "InsertOne",
  icon: "fa-database",
  namespace,
  description:
    'Inserts one document into a Mongo database. InsertOne receives a valid "mongodb" InsertOneOptions object.',
  inputs: [
    { name: "connection", description: "Mongo connection" },
    { name: "collection", description: "Collection" },
    { name: "document", description: "Document" },
    { name: "options", description: "Options" },
  ],
  output: { name: "result", description: "" },
  run: async (connection: MongoClient, collection, document, options) => {
    const result = await connection
      .db()
      .collection(collection)
      .insertOne(document, options);
    return result;
  },
});

export const InsertMany = partFromSimpleFunction({
  id: "InsertMany",
  icon: "fa-database",
  namespace,
  description:
    'Inserts many documents into a Mongo database. InsertMany receives a valid "mongodb" InsertManyOptions object.',
  inputs: [
    { name: "connection", description: "Mongo connection" },
    { name: "collection", description: "Collection" },
    { name: "documents", description: "Documents" },
    { name: "options", description: "Options" },
  ],
  output: { name: "result", description: "" },
  run: async (connection: MongoClient, collection, documents, options) => {
    const result = await connection
      .db()
      .collection(collection)
      .insertMany(documents, options);
    return result;
  },
});

export const UpdateOne = partFromSimpleFunction({
  id: "UpdateOne",
  icon: "fa-database",
  namespace,
  description:
    'Updates one document in a Mongo database. UpdateOne receives a valid "mongodb" UpdateOneOptions object.',
  inputs: [
    { name: "connection", description: "Mongo connection" },
    { name: "collection", description: "Collection" },
    { name: "filter", description: "Filter" },
    { name: "update", description: "Update" },
    { name: "options", description: "Options" },
  ],
  output: { name: "result", description: "" },
  run: async (connection: MongoClient, collection, filter, update, options) => {
    const result = await connection
      .db()
      .collection(collection)
      .updateOne(filter, update, options);
    return result;
  },
});

export const UpdateMany = partFromSimpleFunction({
  id: "UpdateMany",
  icon: "fa-database",
  namespace,
  description:
    'Updates many documents in a Mongo database. UpdateMany receives a valid "mongodb" UpdateManyOptions object.',
  inputs: [
    { name: "connection", description: "Mongo connection" },
    { name: "collection", description: "Collection" },
    { name: "filter", description: "Filter" },
    { name: "update", description: "Update" },
    { name: "options", description: "Options" },
  ],
  output: { name: "result", description: "" },
  run: async (connection: MongoClient, collection, filter, update, options) => {
    const result = await connection
      .db()
      .collection(collection)
      .updateMany(filter, update, options);
    return result;
  },
});

export const DeleteOne = partFromSimpleFunction({
  id: "DeleteOne",
  icon: "fa-database",
  namespace,
  description:
    'Deletes one document in a Mongo database. DeleteOne receives a valid "mongodb" DeleteOneOptions object.',
  inputs: [
    { name: "connection", description: "Mongo connection" },
    { name: "collection", description: "Collection" },
    { name: "filter", description: "Filter" },
    { name: "options", description: "Options" },
  ],
  output: { name: "result", description: "" },
  run: async (connection: MongoClient, collection, filter, options) => {
    const result = await connection
      .db()
      .collection(collection)
      .deleteOne(filter, options);
    return result;
  },
});

export const DeleteMany = partFromSimpleFunction({
  id: "DeleteMany",
  icon: "fa-database",
  namespace,
  description:
    'Deletes many documents in a Mongo database. DeleteMany receives a valid "mongodb" DeleteManyOptions object.',
  inputs: [
    { name: "connection", description: "Mongo connection" },
    { name: "collection", description: "Collection name" },
    { name: "filter", description: "Filter query" },
    { name: "options", description: "Query options" },
  ],
  output: { name: "result", description: "" },
  run: async (connection: MongoClient, collection, filter, options) => {
    const result = await connection
      .db()
      .collection(collection)
      .deleteMany(filter, options);
    return result;
  },
});

export const CountDocuments = partFromSimpleFunction({
  id: "CountDocuments",
  icon: "fa-database",
  namespace,
  description:
    'Counts documents in a Mongo database. CountDocuments receives a valid "mongodb" CountDocumentsOptions object.',
  inputs: [
    { name: "connection", description: "Mongo connection" },
    { name: "collection", description: "Collection" },
    { name: "query", description: "Query" },
    { name: "options", description: "Options" },
  ],
  output: { name: "result", description: "" },
  run: async (connection: MongoClient, collection, query, options) => {
    const result = await connection
      .db()
      .collection(collection)
      .countDocuments(query, options);
    return result;
  },
});

export const CreateIndex = partFromSimpleFunction({
  id: "CreateIndex",
  icon: "fa-database",
  namespace,
  description:
    'Creates an index in a Mongo database. CreateIndex receives a valid "mongodb" CreateIndexesOptions object.',
  inputs: [
    { name: "connection", description: "Mongo connection" },
    { name: "collection", description: "Collection" },
    { name: "fieldOrSpec", description: "Field or spec" },
    { name: "options", description: "Options" },
  ],
  output: { name: "result", description: "" },
  run: async (connection: MongoClient, collection, fieldOrSpec, options) => {
    const result = await connection
      .db()
      .collection(collection)
      .createIndex(fieldOrSpec, options);
    return result;
  },
});

export const CreateIndexes = partFromSimpleFunction({
  id: "CreateIndexes",
  icon: "fa-database",
  namespace,
  description:
    'Creates indexes in a Mongo database. CreateIndexes receives a valid "mongodb" CreateIndexesOptions object.',
  inputs: [
    { name: "connection", description: "Mongo connection" },
    { name: "collection", description: "Collection" },
    { name: "indexes", description: "Indexes" },
    { name: "options", description: "Options" },
  ],
  output: { name: "result", description: "" },
  run: async (connection: MongoClient, collection, indexes, options) => {
    const result = await connection
      .db()
      .collection(collection)
      .createIndexes(indexes, options);
    return result;
  },
});
