const map = {
  'wealthy-gal@flmail.com': {
    name: 'Kim K.',
    id: 'weathy-dudette'
  },
  'bob42@flahoo.com': {
    name: 'Bob J.',
    id: 'poor-dude'
  }
}

export const crmService = {
  getUser: async (email: string) => {
    return map[email] || {
      name: 'John Doe',
      id: '123123'
    }
  },
};
