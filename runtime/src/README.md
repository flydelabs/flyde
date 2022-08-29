# Flyde Runtime

Is responsible of running .flyde flows.
It first resolves a .flyde flow and all it's dependencies into one repository of parts, consisting of a `Main` part, and other parts as declared in "parts".
Then it wraps `@flyde/core` with a simpler, Promise-based API.
