import { useCallback, useMemo } from "react";
import { ImportableEditorNode, NodeLibraryGroup } from "@flyde/core";
import { useLocalStorage } from "../../lib/user-preferences";

const RECENTLY_USED_KEY = "flyde-recently-used-nodes";
const MAX_RECENT_NODES = 8;

interface UseCommandMenuDataProps {
    groups: NodeLibraryGroup[];
    query: string;
}

interface UseCommandMenuDataResult {
    nodeMap: Record<string, ImportableEditorNode>;
    filteredGroups: NodeLibraryGroup[];
    updateRecentlyUsed: (nodeId: string) => void;
}

export const useCommandMenuData = ({
    groups,
    query
}: UseCommandMenuDataProps): UseCommandMenuDataResult => {
    const [recentlyUsedIds, setRecentlyUsedIds] = useLocalStorage<string[]>(
        RECENTLY_USED_KEY,
        []
    );

    // Create a map of all nodes by ID for efficient lookup
    const nodeMap = useMemo(() => {
        const map: Record<string, ImportableEditorNode> = {};

        // Add all library nodes to the map
        for (const group of groups) {
            for (const node of group.nodes) {
                map[node.id] = node;
            }
        }

        return map;
    }, [groups]);

    // Build the recently used nodes group
    const recentlyUsedNodes = useMemo(() => {
        return recentlyUsedIds
            .map(id => nodeMap[id])
            .filter(Boolean) as ImportableEditorNode[];
    }, [recentlyUsedIds, nodeMap]);

    // Combine recently used nodes with other groups
    const allGroups = useMemo(() => {
        const result = [...groups];

        if (recentlyUsedNodes.length > 0) {
            result.unshift({
                title: "Recently Used",
                nodes: recentlyUsedNodes
            });
        }

        return result;
    }, [groups, recentlyUsedNodes]);

    const filteredGroups = useMemo(() => {
        if (!query) {
            const essentialsNodes = new Set(
                allGroups.find((g) => g.title === "Essentials")?.nodes.map((n) => n.id) || []
            );

            return allGroups.map((group) => {
                if (group.title === "Essentials" || group.title === "Recently Used") return group;
                return {
                    ...group,
                    nodes: group.nodes.filter((node) => !essentialsNodes.has(node.id)),
                };
            });
        }

        const customNodeMatches = "Custom Node"
            .toLowerCase()
            .includes(query.toLowerCase());

        // When searching, ensure nodes don't appear in multiple categories
        const seenNodeIds = new Set<string>();
        const filteredGroups = allGroups.map((group) => {
            // For each group, filter nodes by query and exclude already seen nodes
            const filteredNodes = group.nodes.filter((node) => {
                // Skip if we've already included this node in another category
                if (seenNodeIds.has(node.id)) return false;

                const searchContent = [
                    node.id,
                    node.editorNode?.menuDisplayName,
                    node.editorNode?.description,
                    node.displayName,
                    node.description,
                    node.aliases?.join(" ")
                ].filter(Boolean).join(" ");

                const matches = searchContent.toLowerCase().includes(query.toLowerCase());

                // If it matches, mark it as seen
                if (matches) {
                    seenNodeIds.add(node.id);
                }

                return matches;
            });

            return {
                ...group,
                nodes: filteredNodes
            };
        });

        // Then filter out empty groups, but keep Essentials if customNodeMatches
        return filteredGroups.filter(
            (group) =>
                group.nodes.length > 0 ||
                (group.title === "Essentials" && customNodeMatches)
        );
    }, [allGroups, query]);

    // Update recently used nodes
    const updateRecentlyUsed = useCallback((nodeId: string) => {
        setRecentlyUsedIds(
            [nodeId, ...recentlyUsedIds.filter(id => id !== nodeId)].slice(
                0,
                MAX_RECENT_NODES
            )
        );
    }, [recentlyUsedIds, setRecentlyUsedIds]);

    return {
        nodeMap,
        filteredGroups,
        updateRecentlyUsed
    };
}; 