import { entries, NodeDefinition } from "@flyde/core";
import React, { useCallback, useState } from "react";
import { useDebounce } from "usehooks-ts";
import { NodePreview, useDependenciesContext } from "@flyde/flow-editor"; // ../../../../common/NodePreview/NodePreview

export interface MenuAddSectionProps {
  onAdd: (node: NodeDefinition) => void;
}

const SEARCH_DEBOUNCE = 400;

export const MenuAddSection: React.FC<MenuAddSectionProps> = (props) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { resolvedDependencies } = useDependenciesContext();
  const allNodes = entries(resolvedDependencies);
  const debouncedSearch = useDebounce(searchTerm, SEARCH_DEBOUNCE);

  const visibleNodes = allNodes.filter(([k]) => {
    return k.toLowerCase().includes(debouncedSearch.toLowerCase());
  });

  const onSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const renderedInstances = visibleNodes.map(([k, node]) => {
    return (
      <div
        className="ins-wrapper"
        onDoubleClick={() => props.onAdd(node)}
        key={node.id}
      >
        <NodePreview node={node} />
      </div>
    );
  });

  return (
    <div className="add-section">
      <input
        className="bp3-input"
        type="search"
        placeholder="Search for nodes"
        dir="auto"
        autoFocus={true}
        value={searchTerm}
        onChange={onSearchChange}
      />
      <div style={{ marginTop: 10 }}>
        {renderedInstances.length === 0
          ? "No results"
          : "Double click on nodes to add them"}
      </div>
      {renderedInstances}
      {/* <div className='ins-wrapper' onDoubleClick={() => props.onAdd(part1)}>
			{fakeIns(part1, props.resolvedNodes)}
		</div> */}
      {/* <div className='ins-wrapper' onDoubleClick={() => props.onAdd(part2)}>
			{fakeIns(part2, props.resolvedNodes)}
		</div> */}
    </div>
  );
};
