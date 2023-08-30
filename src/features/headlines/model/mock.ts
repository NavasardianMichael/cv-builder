import { HeadlinesSlice } from "./types";

export const mock: HeadlinesSlice = {
  fullName: 'Your Name Here',
  bio: 'I am a Project Manager, currently working at Geeglo. I help companies build products from zero to one. This is a brief description about you. Write some details about yourself, and make it meaningful.',
  contacts: {
    byId: {
        contact1: {
            id: 'contact1',
            link: 'your-portfolio.com',
            name: 'your-portfolio.com',
        },
        contact2: {
            id: 'contact2',
            link: 'your@email.com',
            name: 'your@email.com',
        },
        contact3: {
            id: 'contact3',
            link: '080989999',
            name: '080989999',
        },
    },
    allIds: [
        'contact1',
        'contact2',
        'contact3',
    ]
  }
}