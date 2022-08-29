import { ITreeNode, Intent, Classes, Icon, Label } from "@blueprintjs/core";
import { Tooltip2 } from "@blueprintjs/popover2";
import { NavigatorItem, NavigatorVisualPartItem } from ".";

export const navigatorItemtoBpNode = (item: NavigatorItem, expanded: Set<any>, selected: Set<any>): ITreeNode<NavigatorItem> => {
    const usages = (item as NavigatorVisualPartItem).usages || [];
    switch (item.type) {
      case "external-instance": {
        return {
          id: item.id,
          secondaryLabel: (
            <Tooltip2 placement="top" content="External part instance">
              <Icon icon="duplicate" intent={Intent.WARNING} className={Classes.TREE_NODE_ICON} />
            </Tooltip2>
          ),
          label: <em>{item.label}</em>,
          nodeData: item,
          isExpanded: expanded.has(item.id),
          isSelected: selected.has(item.id),
        };
      }
      case "internal-instance": {
        return {
          id: item.id,
          secondaryLabel: (
            <Tooltip2 placement="top" content="External part instance">
              <Icon icon="duplicate" intent={Intent.WARNING} className={Classes.TREE_NODE_ICON} />
            </Tooltip2>
          ),
          label: <em>{item.label}</em>,
          nodeData: item,
          isExpanded: expanded.has(item.id),
          isSelected: selected.has(item.id),
        };
      }
      case "code-part": {
        return {
          id: item.id,
          secondaryLabel: (
            <Tooltip2 placement="top" content="Code part">
              <Icon icon="code" intent={Intent.NONE} className={Classes.TREE_NODE_ICON} />
              {item.exported ? <Label>Exported</Label> : null}
              {item.isMain ? <Label>Main</Label> : null}
            </Tooltip2>
          ),
          label: <span>
            <em>{item.label} ({usages.length})</em>
            {item.exported ? <em>Exported</em> : null}
            {item.isMain ? <em>Main</em> : null}
          </span>,
          nodeData: item,
          isExpanded: expanded.has(item.id),
          isSelected: selected.has(item.id),
        };
      }
      case "visual-part": {
        return {
          id: item.id,
          secondaryLabel: (
            <Tooltip2 placement="top" content="Visual part">
              <Icon icon="layout" intent={Intent.SUCCESS} className={Classes.TREE_NODE_ICON} />
            </Tooltip2>
          ),
          label: (
            <strong>
              {item.label} <em>({usages.length})</em>
              {item.exported ? <em>Exported</em> : null}
              {item.isMain ? <em>Main</em> : null}
            </strong>
          ),
          // secondaryLabel: <Tag minimal>V</Tag>,,
          childNodes: item.children.map(item => navigatorItemtoBpNode(item, expanded, selected)),
          nodeData: item,
          isExpanded: expanded.has(item.id),
          isSelected: selected.has(item.id),
        };
      }
      case "instance-group": {
        return {
          id: item.id,
          label: (
            <em>
              {" "}
              {item.label} <small>({item.count})</small>
            </em>
          ),
          childNodes: item.children.map(item => navigatorItemtoBpNode(item, expanded, selected)),
          nodeData: item,
          isExpanded: expanded.has(item.id),
          isSelected: selected.has(item.id),
        };
      }
    }
  };
