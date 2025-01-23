import { Badge } from "@flyde/ui";
import { X } from "lucide-react";
import React from "react";
import { AddNodeMenuFilter } from "../AddNodeMenu";

export interface AddNodeMenuResultsSummaryProps {
  filter: AddNodeMenuFilter;
  onChangeFilter: (filters: AddNodeMenuFilter) => void;
  query: string;
  onChangeQuery: (query: string) => void;
  resultsCount: number;
}

export const AddNodeMenuResultsSummary: React.FC<
  AddNodeMenuResultsSummaryProps
> = (props) => {
  const { resultsCount, query, filter, onChangeFilter, onChangeQuery } = props;

  function filterTag() {
    if (filter.type === "all") return null;
    if (filter.type === "external") {
      return (
        <>
          from &nbsp;
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-accent gap-1"
            onClick={() => onChangeFilter({ type: "all" })}
          >
            package {filter.module}
            {filter.namespace ? ` / ${filter.namespace}` : null}
            <X className="h-3 w-3" />
          </Badge>
        </>
      );
    }
    return (
      <>
        from &nbsp;
        <Badge
          variant="outline"
          className="cursor-pointer hover:bg-accent gap-1"
          onClick={() => onChangeFilter({ type: "all" })}
        >
          this project {filter.file ? ` / ${filter.file}` : null}
          <X className="h-3 w-3" />
        </Badge>
      </>
    );
  }

  return (
    <div className="text-sm text-muted-foreground flex items-center gap-2 p-2">
      {resultsCount
        ? `Showing ${resultsCount} result${resultsCount > 1 ? "s" : ""}`
        : "No results found"}
      {query ? (
        <>
          matching query&nbsp;
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-accent gap-1"
            onClick={() => onChangeQuery("")}
          >
            "{query}"
            <X className="h-3 w-3" />
          </Badge>
        </>
      ) : null}
      {filterTag()}
    </div>
  );
};
