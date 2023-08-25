import {
  Dialog,
  Classes,
  Callout,
  Code,
  Card,
  Menu,
  MenuItem,
} from "@blueprintjs/core";
import { DebuggerEvent, PinDebuggerEvent, PinType } from "@flyde/core";
import { HistoryPayload } from "@flyde/remote-debugger";
import classNames from "classnames";
import React, { useEffect } from "react";
import { timeAgo, useDebounce } from "../..";
import { BrowserOnlyReactJson } from "../../lib/analytics-value-renderer/BrowserJsonView";
import { Loader } from "../../lib/loader";
import { useDebuggerContext } from "../DebuggerContext";

export interface DataInspectionModalProps {
  onClose: () => void;
  item: { insId: string; pin?: { id: string; type: PinType } };
}

export const DataInspectionModal: React.FC<DataInspectionModalProps> = (
  props
) => {
  const { onRequestHistory } = useDebuggerContext();
  const { item } = props;

  const [data, setData] = React.useState<HistoryPayload>();

  const [currIdx, setCurrIdx] = React.useState(0);

  const [search, setSearch] = React.useState("");

  const [filteredValue, setFilteredValue] =
    React.useState<HistoryPayload["lastSamples"]>();

  const [debouncedSearch] = useDebounce(search, 300);

  useEffect(() => {
    setFilteredValue(
      data?.lastSamples.filter((sample) => {
        if (typeof sample.val === "object") {
          return JSON.stringify(sample.val).includes(debouncedSearch);
        }

        return sample.val.toString().includes(debouncedSearch);
      })
    );
    setCurrIdx(0);
  }, [data?.lastSamples, debouncedSearch]);

  React.useEffect(() => {
    async function fetchData() {
      const data = await onRequestHistory(
        item.insId,
        item.pin?.id,
        item.pin?.type
      );
      setData(data);
    }
    fetchData();
  }, [item, onRequestHistory]);

  const renderValue = (event: DebuggerEvent) => {
    const val = event.val;

    if (typeof val === "object") {
      return <BrowserOnlyReactJson src={val} />;
    }

    return <Code>{val.toString()}</Code>;
  };

  const renderEmptyState = () => {
    if (data.lastSamples.length > 0 && search.length > 0) {
      return (
        <Callout intent="warning">
          No data found for search query "{search}"
        </Callout>
      );
    }
    return (
      <Callout intent="warning">
        No events captured for instance {item.insId}{" "}
        {item.pin ? `and ${item.pin.id}` : ""}. Make sure a debugger is
        connected and your program was triggered.
      </Callout>
    );
  };

  const itemName = `"${item.insId}" ${item.pin?.id ? `(${item.pin.id})` : ""}`;

  const renderInner = () => {
    if (!data) {
      return <Loader />;
    }

    if (data.total === 0) {
      return (
        <Callout intent="warning">
          No events captured for instance <em>{item.insId}</em>{" "}
          {item.pin ? (
            <React.Fragment>
              and pin <em>{item.pin.id}</em>
            </React.Fragment>
          ) : null}
          . Make sure debugger is running and your program was triggered.
        </Callout>
      );
    }

    const currEvent = filteredValue?.[currIdx] as PinDebuggerEvent<any>;

    if (!currEvent) {
      return renderEmptyState();
    }

    return (
      <>
        <Card className="content-wrapper">
          {currEvent ? (
            <div className="info">
              <div>
                Showing sample {currIdx} of event from{" "}
                <strong>{timeAgo(currEvent.time)}</strong> (
                {new Date(currEvent.time).toLocaleString()})
              </div>
              <div>
                Instance: <strong>{currEvent.insId}</strong>, Pin id:{" "}
                <strong>{currEvent.pinId}</strong>{" "}
              </div>
              <div>Value:</div>
            </div>
          ) : null}
          {renderValue(currEvent)}
        </Card>
        <Menu className="samples-menu">
          {filteredValue.map((sample, i) => {
            const pinId = (sample as PinDebuggerEvent<any>).pinId;
            const label = `${data.total - i}. from pin "${pinId}"`;
            return (
              <MenuItem key={i} text={label} onClick={() => setCurrIdx(i)} />
            );
          })}
        </Menu>
      </>
    );
  };

  return (
    <Dialog
      isOpen={true}
      title={`Inspecting data for instance ${itemName}`}
      onClose={props.onClose}
      canEscapeKeyClose={false}
      className="data-inspection-modal"
    >
      <main className={classNames(Classes.DIALOG_BODY)} tabIndex={0}>
        <div>
          <header>
            {data ? (
              <>
                <em>
                  {itemName} called {data.total} time(s)
                </em>
                {data.total > 10 && <span>Showing last 10 samples</span>}
              </>
            ) : null}
            <input
              className="bp5-input bp5-small bp5-fill"
              type="search"
              placeholder="Search for values"
              dir="auto"
              onChange={(e) => setSearch(e.target.value)}
              value={search}
            />
            {debouncedSearch.length > 0 && (
              <span>
                Showing {filteredValue?.length} of {data.lastSamples.length}{" "}
                samples matching query "{debouncedSearch}"
              </span>
            )}
          </header>
          <main className="main-wrapper">{renderInner()}</main>
        </div>
      </main>

      {/* <div className={Classes.DIALOG_FOOTER}>
	  <div className={Classes.DIALOG_FOOTER_ACTIONS}>
		
	  </div>
	</div> */}
    </Dialog>
  );
};
