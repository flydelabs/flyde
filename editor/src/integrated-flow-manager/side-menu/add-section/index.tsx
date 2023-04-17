import { entries, PartDefinition } from "@flyde/core";
import React, { useCallback, useState } from "react";
import { useDebounce } from "usehooks-ts";
import { PartPreview, useDependenciesContext } from "@flyde/flow-editor"; // ../../../../common/PartPreview/PartPreview

export interface MenuAddSectionProps {
  onAdd: (part: PartDefinition) => void;
}

const SEARCH_DEBOUNCE = 400;

export const MenuAddSection: React.FC<MenuAddSectionProps> = (props) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { resolvedDependencies } = useDependenciesContext();
  const allParts = entries(resolvedDependencies);
  const debouncedSearch = useDebounce(searchTerm, SEARCH_DEBOUNCE);

  const visibleParts = allParts.filter(([k]) => {
    return k.toLowerCase().includes(debouncedSearch.toLowerCase());
  });

  const onSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const renderedInstances = visibleParts.map(([k, part]) => {
    return (
      <div
        className="ins-wrapper"
        onDoubleClick={() => props.onAdd(part)}
        key={part.id}
      >
        <PartPreview part={part} />
      </div>
    );
  });

  return (
    <div className="add-section">
      <input
        className="bp3-input"
        type="search"
        placeholder="Search for parts"
        dir="auto"
        autoFocus={true}
        value={searchTerm}
        onChange={onSearchChange}
      />
      <div style={{ marginTop: 10 }}>
        {renderedInstances.length === 0
          ? "No results"
          : "Double click on parts to add them"}
      </div>
      {renderedInstances}
      {/* <div className='ins-wrapper' onDoubleClick={() => props.onAdd(part1)}>
			{fakeIns(part1, props.resolvedParts)}
		</div> */}
      {/* <div className='ins-wrapper' onDoubleClick={() => props.onAdd(part2)}>
			{fakeIns(part2, props.resolvedParts)}
		</div> */}
    </div>
  );
};
