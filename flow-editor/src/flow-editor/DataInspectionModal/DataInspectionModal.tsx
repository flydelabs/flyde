import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui";
import { Card } from "../../ui";
import { Input } from "../../ui";
import { ScrollArea } from "../../ui";
import { Alert, AlertDescription } from "../../ui";
import { Button } from "../../ui";
import { DebuggerEvent, PinDebuggerEvent, PinType, HistoryPayload } from "@flyde/core";
import React, { useEffect } from "react";
import { timeAgo, useDebounce } from "../..";
import { BrowserOnlyReactJson } from "../../lib/analytics-value-renderer/BrowserJsonView";
import { Loader } from "../../lib/loader";
import { useDebuggerContext } from "../DebuggerContext";

export interface DataInspectionModalProps {
  onClose: () => void;
  item: { insId: string; pin?: { id: string; type: PinType } };
  isOpen: boolean;
}

export const DataInspectionModal: React.FC<DataInspectionModalProps> = (
  props
) => {
  const { onRequestHistory } = useDebuggerContext();
  const { item, isOpen } = props;

  const [data, setData] = React.useState<HistoryPayload>();
  const [currIdx, setCurrIdx] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [filteredValue, setFilteredValue] =
    React.useState<HistoryPayload["lastSamples"]>([]);
  const [debouncedSearch] = useDebounce(search, 300);

  useEffect(() => {
    setFilteredValue(
      data?.lastSamples.filter((sample) => {
        if (typeof sample.val === "object") {
          return JSON.stringify(sample.val).includes(debouncedSearch);
        }
        return sample.val.toString().includes(debouncedSearch);
      }) ?? []
    );
    setCurrIdx(0);
  }, [data?.lastSamples, debouncedSearch]);

  React.useEffect(() => {
    async function fetchData() {
      const data = await onRequestHistory(
        item.insId,
        item.pin?.id ?? "",
        item.pin?.type ?? "input"
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
    return <code className="rounded bg-muted px-2 py-1">{val.toString()}</code>;
  };

  const renderEmptyState = () => {
    if (!data ||data.lastSamples.length > 0 && search.length > 0) {
      return (
        <Alert>
          <AlertDescription>
            No data found for search query "{search}"
          </AlertDescription>
        </Alert>
      );
    }
    return (
      <Alert>
        <AlertDescription>
          No events captured for instance {item.insId}{" "}
          {item.pin ? `and ${item.pin.id}` : ""}. Make sure a debugger is
          connected and your program was triggered.
        </AlertDescription>
      </Alert>
    );
  };

  const itemName = `"${item.insId}" ${item.pin?.id ? `(${item.pin.id})` : ""}`;

  const renderInner = () => {
    if (!data) {
      return <Loader />;
    }

    if (data.total === 0) {
      return (
        <Alert>
          <AlertDescription>
            No events captured for instance <em>{item.insId}</em>{" "}
            {item.pin ? (
              <React.Fragment>
                and pin <em>{item.pin.id}</em>
              </React.Fragment>
            ) : null}
            . Make sure debugger is running and your program was triggered.
          </AlertDescription>
        </Alert>
      );
    }

    const currEvent = filteredValue?.[currIdx] as PinDebuggerEvent<any>;

    if (!currEvent) {
      return renderEmptyState();
    }

    return (
      <div className="space-y-4">
        <Card className="p-4">
          {currEvent && (
            <div className="space-y-2 text-sm">
              <div>
                Showing sample {currIdx} of event from{" "}
                <strong>{timeAgo(currEvent.time)}</strong> (
                {new Date(currEvent.time).toLocaleString()})
              </div>
              <div>
                Instance: <strong>{currEvent.insId}</strong>, Pin id:{" "}
                <strong>{currEvent.pinId}</strong>
              </div>
              <div>Value:</div>
            </div>
          )}
          {renderValue(currEvent)}
        </Card>
        <ScrollArea className="h-[200px]">
          <div className="space-y-1">
            {filteredValue.map((sample, i) => {
              const pinId = (sample as PinDebuggerEvent<any>).pinId;
              const label = `${data.total - i}. from pin "${pinId}"`;
              return (
                <Button
                  key={i}
                  variant={i === currIdx ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setCurrIdx(i)}
                >
                  {label}
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && props.onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Inspecting data for instance {itemName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <header className="space-y-2">
            {data && (
              <div className="space-y-1">
                <em>
                  {itemName} called {data.total} time(s)
                </em>
                {data.total > 10 && (
                  <div className="text-sm text-muted-foreground">
                    Showing last 10 samples
                  </div>
                )}
              </div>
            )}
            <Input
              type="search"
              placeholder="Search for values"
              onChange={(e) => setSearch(e.target.value)}
              value={search}
            />
            {debouncedSearch.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Showing {filteredValue?.length} of {data?.lastSamples.length}{" "}
                samples matching query "{debouncedSearch}"
              </div>
            )}
          </header>
          <main>{renderInner()}</main>
        </div>
      </DialogContent>
    </Dialog>
  );
};
