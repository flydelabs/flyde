# Flyde Resolver

Resolves .flyde files and their imports into a resolved flow that contains all information required for it to be executed.

It resolves all imports, recursively, until reaching leaf flows (either code flows or visual flows with no imports).

The resolved flow will include all imported nodes, namespaced by the node required them.
