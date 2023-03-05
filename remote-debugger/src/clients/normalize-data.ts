export const normalizeData = (data: any) => {
    // if it's an object, mark any circular references as "<<circular>>" (using a WeakRef)
    if (typeof data === "object" && data !== null) {

        // hack to avoid toJSON overrides (i.e. in discord bot)
        data = {...data};

        const seen = new WeakSet();
        const normalize = (data: any) => {

            if (typeof data  !== 'object' || Array.isArray(data)) {
                return data;
            }

            if (seen.has(data)) {
                return "[Circular]";
            }
            try {
                seen.add(data);
            } catch (e) {
                console.error(typeof data, data);
            }
            if (Array.isArray(data)) {
                return data.map(normalize);
            }
            if (typeof data === "object") {
                const normalized: any = {};
                for (const key in data) {
                    normalized[key] = normalize(data[key]);
                }
                return normalized;
            }
            return data;
        };
        return normalize(data);
    }
    return data;
};