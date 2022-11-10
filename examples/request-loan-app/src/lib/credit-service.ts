import { randomInt } from "@flyde/core";

export const creditService = {
  getCredit: (userId: string) => {
    switch (userId) {
      case 'wealthy-dudette':{
        return 777;
      }
      case 'poor-dude': {
        return 250;
      }
      default: {
        return randomInt(650, 800);
      }
    }
  },
};
