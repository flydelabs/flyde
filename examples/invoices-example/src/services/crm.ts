export const crmService = {
  getUser: async (email: string) => {

    if (!email) {
      return null;
    }

    if (email === "gabi.grinberg@gmail.com") {
      return {
        name: "Gabriel Grinberg",
        email,
        id: "123",
      };
    } else {
      return {
        name: "Shimi Liderman",
        email: "shimilid@gmail.com",
        id: "456",
      };
    }
  },
};
