import { SkillsListSlice } from "./types";

export const mock: SkillsListSlice = {
    byId: {
        'skill 1': {
            id: 'skill 1',
            name: 'HTML'
        },
        'skill 2': {
            id: 'skill 2',
            name: 'CSS'
        },
        'skill 3': {
            id: 'skill 3',
            name: 'JavaScript'
        },
        'skill 4': {
            id: 'skill 4',
            name: 'React'
        },
    },
    allIds: [
        'skill 1',
        'skill 2',
        'skill 3',
        'skill 4',
    ]
} 