import { Education } from "features/education"
import { Experience } from "features/experience"
import { Headlines } from "features/headlines"
import { Skills } from "features/skills"
import { SECTIONS_TEMPLATE } from "../types/sections"

export const SECTION_TYPES = {
    headlines: 'headlines',
    experience: 'experience',
    education: 'education',
    skills: 'skills'
} as const

export const SECTIONS: SECTIONS_TEMPLATE = {
    byId: {
        headlines: {
            id: SECTION_TYPES.headlines,
            component: Headlines
        },
        experience: {
            id: SECTION_TYPES.experience,
            component: Experience
        },
        education: {
            id: SECTION_TYPES.education,
            component: Education
        },
        skills: {
            id: SECTION_TYPES.skills,
            component: Skills
        },
    },
    allIds: [
        SECTION_TYPES.headlines,
        SECTION_TYPES.experience,
        SECTION_TYPES.education,
        SECTION_TYPES.skills,
    ]
}