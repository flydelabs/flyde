import * as React from "react";
import { ChevronDown, ChevronRight } from "../../icons";
import { cn } from "../../lib/utils";

export interface TreeNodeInfo<T = {}> {
  id: string | number;
  label: React.ReactNode;
  childNodes?: Array<TreeNodeInfo<T>>;
  isExpanded?: boolean;
  isSelected?: boolean;
  hasCaret?: boolean;
  nodeData?: T;
}

export interface TreeProps<T> {
  contents: Array<TreeNodeInfo<T>>;
  onNodeClick?: (node: TreeNodeInfo<T>) => void;
  onNodeCollapse?: (node: TreeNodeInfo<T>) => void;
  onNodeExpand?: (node: TreeNodeInfo<T>) => void;
  className?: string;
}

export function Tree<T>({
  contents,
  onNodeClick,
  onNodeCollapse,
  onNodeExpand,
  className,
}: TreeProps<T>) {
  const renderNode = (node: TreeNodeInfo<T>) => {
    const hasChildren = node.childNodes && node.childNodes.length > 0;
    const isExpanded = node.isExpanded && hasChildren;

    const handleClick = () => {
      if (onNodeClick) {
        onNodeClick(node);
      }
    };

    const handleExpandToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (hasChildren) {
        if (isExpanded) {
          onNodeCollapse?.(node);
        } else {
          onNodeExpand?.(node);
        }
      }
    };

    return (
      <div key={node.id} className="select-none">
        <div
          className={cn(
            "flex items-center py-1 px-2 rounded-md cursor-pointer hover:bg-accent/50",
            node.isSelected && "bg-accent"
          )}
          onClick={handleClick}
        >
          {node.hasCaret && (
            <div
              className="w-4 h-4 mr-1 flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground"
              onClick={handleExpandToggle}
            >
              {hasChildren &&
                (isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                ))}
            </div>
          )}
          <div className="flex-1">{node.label}</div>
        </div>
        {isExpanded && node.childNodes && (
          <div className="ml-4">
            {node.childNodes.map((childNode) => renderNode(childNode))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("text-sm", className)}>
      {contents.map((node) => renderNode(node))}
    </div>
  );
}

export const ofType = <T extends {}>() => Tree<T>;
