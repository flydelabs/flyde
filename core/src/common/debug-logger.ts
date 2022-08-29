import debug from 'debug';

const BASE_NS = `flyde`;

const base = debug(BASE_NS);

export const debugLogger = (subNs: string) => {
    return base.extend(subNs);
} 