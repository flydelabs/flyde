export const PIECE_HORIZONTAL_PADDING = 15;
export const PIECE_CHAR_WIDTH = 9;
export const MIN_WIDTH_PER_PIN = 40;

export const calcNodeIoWidth = (name: string) => {
  return Math.max(
    MIN_WIDTH_PER_PIN,
    name.length * PIECE_CHAR_WIDTH + PIECE_HORIZONTAL_PADDING * 2
  );
};
