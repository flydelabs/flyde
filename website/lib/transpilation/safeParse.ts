export type Ok<T> = { type: "ok"; data: T };
export type Error = { type: "error"; error: Error };

export type Maybe<T> = Ok<T> | Error;

export function safeParse<T>(content: string): Maybe<T> {
  try {
    return { type: "ok", data: JSON.parse(content) };
  } catch (e) {
    return {
      type: "error",
      error: e as Error,
    };
  }
}
