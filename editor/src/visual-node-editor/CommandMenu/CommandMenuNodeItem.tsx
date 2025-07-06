import React from "react";
import {
    CommandItem,
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../../ui";
import { ImportableEditorNode } from "@flyde/core";
import { InstanceIcon } from "../instance-view";

export interface NodeItemProps {
    node: ImportableEditorNode;
    groupTitle: string;
    onSelect: (value: string) => void;
}

export const NodeItem: React.FC<NodeItemProps> = ({ node, groupTitle, onSelect }) => (
    <CommandItem
        key={`${groupTitle}-${node.id}`}
        value={`${groupTitle}:${node.id}`}
        onSelect={onSelect}
        className="text-xs cursor-pointer"
    >
        <InstanceIcon icon={node.icon} className="mr-0.5" />
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger className="truncate">
                    {node.displayName ?? node.id}
                </TooltipTrigger>
                {node.description && (
                    <TooltipContent
                        side="right"
                        className="max-w-[300px]"
                    >
                        {node.description}
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
    </CommandItem>
);

export const CustomNodeButton: React.FC<{ onSelect: (value: string) => void }> = ({ onSelect }) => (
    <CommandItem
        value="custom"
        onSelect={onSelect}
        className="text-xs py-1 px-1 cursor-pointer add-menu-item"
    >
        <InstanceIcon icon="cow" className="mr-0.5" />
        Custom Node
    </CommandItem>
); 