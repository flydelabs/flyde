import { partFromSimpleFunction } from "./utils/partFromSimpleFunction";

import type * as pg from 'pg';

const namespace = 'Postgres';

export const Connect = partFromSimpleFunction({
    id: 'Connect',
    icon: 'fa-database',
    namespace,
    description: 'Connects to a Postgres database and returns a client. Uses the "pg" package.',
    inputs: [
        {name: 'host', description: 'Host'},
        {name: 'port', description: 'Port'},
        {name: 'database', description: 'Database'},
        {name: 'user', description: 'User'},
        {name: 'password', description: 'Password'}
    ],
    output: {name: 'connection', description: 'Postgres connected client'},
    fn: async (host, port, database, user, password) => {
        const { Client } = await import('pg');
        const client = new Client({
            host,
            port,
            database,
            user,
            password
        });
        await client.connect();
        return client;
    }
});

export const Disconnect = partFromSimpleFunction({
    id: 'Disconnect',
    icon: 'fa-database',
    namespace,
    description: 'Disconnects from a Postgres database',
    inputs: [
        {name: 'connection', description: 'Postgres connection'}
    ],
    fn: async (connection) => {
        await connection.end();
    }
});

export const Query = partFromSimpleFunction({
    id: 'Query',
    icon: 'fa-database',
    namespace,
    description: 'Queries a Postgres database. Query receives a valid "pg" QueryConfig object.',
    inputs: [
        {name: 'connection', description: 'Postgres connection'},
        {name: 'query', description: 'Query'}
    ],
    output: {name: 'result', description: 'valid "pg" <a href="https://node-postgres.com/apis/client#queryconfig">QueryConfig object</a>'},
    fn: async (connection: pg.Client, query) => {
        const result = await connection.query(query);
        return result.rows;
    }
});
