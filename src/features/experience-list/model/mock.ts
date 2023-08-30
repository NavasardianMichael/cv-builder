import { Experience } from "./types";

export const experienceMock: Experience = {
    byId: {
        'workspace 1': {
            id: 'workspace 1',
            company: {
            name: 'company name 1',
                link: 'https://company.com'
            },
            dates: {
                start: 'June 2022',
                end: 'November 2023'
            },
            position: 'React.js Developer',
            description: 'Some description about the job',
        },
        'workspace 2': {
            id: 'workspace 2',
            company: {
                name: 'company name 2',
                link: 'https://company.com'
            },
            dates: {
                start: 'June 2022',
                end: 'November 2023'
            },
            position: 'React.js Developer',
            description: 'Some description about the job',
        },
        'workspace 3': {
            id: 'workspace 3',
            company: {
                name: 'company name 3',
                link: 'https://company.com'
            },
            dates: {
                start: 'June 2022',
                end: 'November 2023'
            },
            position: 'React.js Developer',
            description: 'Some description about the job',
        },
    },
    allIds: [
        'workspace 1',
        'workspace 2',
        'workspace 3',
    ]
} 