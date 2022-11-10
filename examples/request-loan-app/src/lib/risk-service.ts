import { randomInt } from "@flyde/core";

export const riskService = {
  calculateRisk: async (userId: string, amount: number) => {
    if (userId === "wealthy-gal" ) {
      return (await Promise.resolve(Math.max(amount, 100)/ 100)).toFixed(2);
    } else {
      return (randomInt(0, 20) / 100).toFixed(2);
    }
    
  },
};
