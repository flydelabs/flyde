import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { VisualNode } from "@flyde/core";
import { useVisualNodeEditorContext } from "./VisualNodeEditorContext";
import { GroupEditorBoardData } from "./VisualNodeEditor";
import { usePorts } from "../flow-editor/ports";
import { useLocalStorage } from "../lib/user-preferences";
import { useDarkMode } from "../flow-editor/DarkModeContext";
import { Alert, AlertDescription, Lightbulb, Check } from "../ui";
import { cn } from "../lib/utils";

interface TipData {
  tip: string;
  predicate: (
    lastAndCurrNode: [VisualNode, VisualNode],
    lastAndCurrBoardData: [GroupEditorBoardData, GroupEditorBoardData]
  ) => boolean;
}

const tips: Record<string, TipData> = {
  pan: {
    tip: "Try panning the canvas by clicking and dragging the background",
    predicate: (_, [lastBoardData, currBoardData]) => {
      const dx = lastBoardData.viewPort.pos.x - currBoardData.viewPort.pos.x;
      const dy = lastBoardData.viewPort.pos.y - currBoardData.viewPort.pos.y;

      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance > 75;
    },
  },
  zoom: {
    tip: "Zoom in and out using the mouse wheel or trackpad scroll",
    predicate: (_, [lastBoardData, currBoardData]) => {
      const dz = lastBoardData.viewPort.zoom - currBoardData.viewPort.zoom;
      return Math.abs(dz) > 0.25;
    },
  },
  addNode: {
    tip: "Add a new node from the Cmd/Ctrl+K menu",
    predicate: ([lastNode, currNode]) => {
      return currNode.instances.length > lastNode.instances.length;
    },
  },
  connect: {
    tip: "Connect two nodes by dragging from an output pin to an input pin",
    predicate: ([lastNode, currNode]) => {
      return currNode.connections.length > lastNode.connections.length;
    },
  },
};

export type TipAction = keyof typeof tips;

const tipsOrder: TipAction[] = ["pan", "zoom", "addNode", "connect"];

interface OnboardingTipsProps { }

const TIPS_ADVANCE_TIMEOUT = 1000;
const TIP_COMPLETED_FEEDBACK_TIMEOUT = 3000;
const ALL_TIPS_COMPLETED_FEEDBACK_TIMEOUT = 10000;

const useIsMounted = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
};

export const OnboardingTips: React.FC<OnboardingTipsProps> = () => {
  const { node, boardData } = useVisualNodeEditorContext();

  const { reportEvent } = usePorts();
  const isMounted = useIsMounted();

  const [currentTip, setCurrentTip] = useLocalStorage(
    "onboarding-tip",
    tipsOrder[0]!
  );
  const [showFeedback, setShowFeedback] = useState(false);

  const [isCompleted, setIsCompleted] = useLocalStorage(
    "onboarding-tip-completed",
    false
  );

  const lastBoardData = useRef<GroupEditorBoardData>();
  const lastNode = useRef<VisualNode>();

  const [showTips, setShowTips] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowTips(true), 1000);
  }, []);

  useEffect(() => {
    if (!showTips || lastBoardData.current) {
      return;
    }
    lastBoardData.current = boardData;
    lastNode.current = node;
  }, [showTips, boardData, node]);

  const currIndex = useMemo(() => {
    return currentTip ? tipsOrder.indexOf(currentTip) : -1;
  }, [currentTip]);

  const advanceTip = useCallback(() => {
    setShowFeedback(true);
    const nextTip = tipsOrder[currIndex + 1];
    const isLast = currIndex === tipsOrder.length - 1;

    reportEvent("onBoardingTipCompleted", {
      tip: currentTip ?? "n/a",
    });

    setTimeout(
      () => {
        setShowFeedback(false);
        setIsAdvancing(false);
        if (isLast) {
          setIsCompleted(true);
        } else {
          setCurrentTip(nextTip!);
        }
      },
      isLast
        ? ALL_TIPS_COMPLETED_FEEDBACK_TIMEOUT
        : TIP_COMPLETED_FEEDBACK_TIMEOUT
    );
  }, [currIndex, reportEvent, currentTip, setIsCompleted, setCurrentTip]);

  useEffect(() => {
    if (isCompleted) {
      return;
    }

    if (!lastBoardData.current || !lastNode.current) {
      return;
    }

    if (isAdvancing) {
      return;
    }

    if (!tips[currentTip]) {
      return;
    }

    if (
      tips[currentTip].predicate(
        [lastNode.current, node],
        [lastBoardData.current, boardData]
      )
    ) {
      lastNode.current = node;
      lastBoardData.current = boardData;
      setIsAdvancing(true);
      setTimeout(() => {
        advanceTip();
      }, TIPS_ADVANCE_TIMEOUT);
    }
  }, [currentTip, advanceTip, isCompleted, node, boardData, isAdvancing]);

  return !isMounted || isCompleted ? null : (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md transition-all duration-200 ease-in-out",
        !showTips && "opacity-0 -translate-y-2",
        showTips && "opacity-100 translate-y-0",
        "onboarding-tips"
      )}
    >
      <Alert
        variant="default"
        className={cn(
          "flex items-start gap-2 shadow-lg p-3",
          !showFeedback && "bg-secondary"
        )}
      >
        <div className="mt-0.5 shrink-0">
          {showFeedback ? (
            <Check className="h-4 w-4" />
          ) : (
            <Lightbulb className="h-4 w-4" />
          )}
        </div>
        <AlertDescription>
          {showFeedback
            ? currIndex === tipsOrder.length - 1
              ? "Great job! For more tips, check out the help menu."
              : "Great job! Moving to the next tip..."
            : tips[currentTip]?.tip ?? "n/a"}
        </AlertDescription>
      </Alert>
    </div>
  );
};
