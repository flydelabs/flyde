import { MongoClient } from "mongodb";

let existingClient: MongoClient | undefined;

const getConnectionUri = () => {
  return 'mongodb://localhost:27017';
};

export const createDbClient = async () => {
  if (existingClient) {
    return existingClient;
  }

  const uri = getConnectionUri();
  const client = new MongoClient(uri);
  existingClient = client;
  return client.connect();
};
