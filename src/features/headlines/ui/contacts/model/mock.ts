import { Contacts } from "./types";

export const contactsMock: Contacts = {
    byId: {
        email: {
            id: 'email',
            name: 'smth@gmail.com',
            link: 'smth@gmail.com',
        },
        linkedin: {
            id: 'linkedin',
            name: 'linkedin',
            link: 'linkedin',
        },
        phone: {
            id: 'email',
            name: '+37498751615',
            link: '+37498751615',
        },
        website: {
            id: 'website',
            name: 'https://p.com',
            link: 'https://p.com'
        }
    },
    allIds: [
        'email',
        'linkedin',
        'phone',
        'website',
    ]
} 