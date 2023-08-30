import { EducationListSlice } from "./types";

export const mock: EducationListSlice = {
    byId: {
        'education 1': {
            id: 'education 1',
            degree: 'bachelor',
            institution: {
                name: 'ASUE',
                link: 'https://somewhere.com'
            },
            dates: {
                start: 'June 2022',
                end: 'November 2023'
            },
            description: 'Some description about the job',
        },
        'education 2': {
            id: 'education 2',
            degree: 'master',
            institution: {
                name: 'ASUE',
                link: 'https://somewhere.com'
            },
            dates: {
                start: 'June 2022',
                end: 'November 2023'
            },
            description: 'Some description about the job',
        },
        'education 3': {
            id: 'education 3',
            degree: 'PhD',
            institution: {
                name: 'ASUE',
                link: 'https://somewhere.com'
            },
            dates: {
                start: 'June 2022',
                end: 'November 2023'
            },
            description: 'Some description about the job',
        },
    },
    allIds: [
        'education 1',
        'education 2',
        'education 3',
    ]
} 