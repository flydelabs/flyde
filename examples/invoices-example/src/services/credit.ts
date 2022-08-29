import { randomInt } from "@flyde/core";

export const creditService = {
  getCredit: (userId: string) => {
    if (userId === "123") {
      return 250;
    }
    const score = randomInt(650, 800);
    return Promise.resolve(score);
  },
};
