import loki from 'lokijs';

const DB_COLLECTION_NAME = 'tasks';
const DB_AUTOSAVE_INTERVAL = 4000;

export type Task = {
    name: string,
    assigneeId?: string;
}

export const createTasksService = async () => {
    let collection: loki.Collection;

    const db = new loki('items.db', {
        autoload: true,
        autosave: true, 
        autoloadCallback: () => {
            collection = db.getCollection(DB_COLLECTION_NAME);
            if (collection === null) {
                collection = db.addCollection(DB_COLLECTION_NAME);
            }
        },
        autosaveInterval: DB_AUTOSAVE_INTERVAL
    });

    return {
        addTask: async (task: Task) => {
            return collection.insert(task);
        },
        getTasks: async () => {
            return collection.find({});
        }
    }
}
