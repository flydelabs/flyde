import { CustomPart, FlydeFlow } from "@flyde/core";
import { Breadcrumbs as BPBreadcrumbs, IBreadcrumbProps, Menu, MenuItem } from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";

import React from "react";
import { PartsRelationshipData, PartsRelationshipNode } from "@flyde/flow-editor"; // ../../../common/lib/part-relationship-data
// import { buildPartsRelationshipData } from '../../side-menu/build-navigator-data';

import "./styles.scss";
import { noop } from "lodash";

export interface BreadcrumbsProps {
  flow: FlydeFlow;
  relationshipData: PartsRelationshipData;
  onEditPart: (partId: string) => void;
  editedPart: CustomPart;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = (props) => {
  const { editedPart, relationshipData } = props;

  const node = relationshipData.nodeMap[editedPart.id];

  if (!node) {
    return <span>Error</span>;
    // throw new Error(`cannot find node in map for ${editedPart.id}`);
  }

  let n: PartsRelationshipNode | undefined = node;

  const bcs: IBreadcrumbProps[] = [];

  while (n) {
    const currNode = n;
    bcs.unshift({
      text: n.part.id,
      onClick: () => props.onEditPart(currNode.part.id),
    });

    if (!n.parent && n.usedByPartIds.length > 1) {
      const menu = (
        <Menu>
          {n.usedByPartIds.map((partId) => (
            <MenuItem text={partId} key={partId} onClick={() => props.onEditPart(partId)} />
          ))}
        </Menu>
      );
      const element = (
        <Popover2 placement={"bottom"} content={menu}>
          <span>{n.usedByPartIds.length} usages</span>
        </Popover2>
      );

      bcs.unshift({
        text: element,
        onClick: noop,
      });
    }
    n = n.parent;
  }

  return (
    <div className="breadcrumbs">
      {/* <Card elevation={0} style={{ width: `100%` }}> */}
      <BPBreadcrumbs
        // breadcrumbRenderer={renderCurrentBreadcrumb}
        items={bcs}
        collapseFrom="start"
      />
      {/* </Card> */}
    </div>
  );
};
