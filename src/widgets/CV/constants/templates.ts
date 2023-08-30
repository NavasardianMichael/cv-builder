import { CV_TEMPLATES_TYPE } from "../types/templates"
import { SECTION_TYPES } from "./sections"

export const CV_TEMPLATE_TYPES = {
    variant1: 'variant1',
    variant2: 'variant2',
    variant3: 'variant3',
} as const

export const CV_TEMPLATES: CV_TEMPLATES_TYPE = {
    byId: {
        [CV_TYPES.v1]: {
            id: CV_TYPES.v1,
            name: 'CV template 1',
            sections: {
                [SECTION_TYPES.headlines]: {
                    id: SECTION_TYPES.headlines,
                    styles: {
                        
                    },
                },
                [SECTION_TYPES.experience]: {
                    id: SECTION_TYPES.experience,
                    styles: {
                        titleWidth: '30%',
                        titleContentGap: '.25rem',
                        contentWidth: '100%',
                        contentItemGap: '.25rem',
                        contentItemWidth: '100%'
                    },
                },
                [SECTION_TYPES.education]: {
                    id: SECTION_TYPES.education,
                    styles: {
                        titleWidth: '30%',
                        titleContentGap: '.25rem',
                        contentWidth: '100%',
                        contentItemGap: '.25rem',
                        contentItemWidth: '100%'
                    },
                },
                [SECTION_TYPES.skills]: {
                    id: SECTION_TYPES.skills,
                    styles: {
                        titleWidth: '30%',
                        titleContentGap: '.25rem',
                        contentWidth: '100%',
                        contentItemGap: '.25rem',
                        contentItemWidth: '100%'
                    },
                },
            }
        },
        [CV_TYPES.v2]: {
            id: CV_TYPES.v2,
            name: 'CV template 2',
            sections: {
                [SECTION_TYPES.headlines]: {
                    id: SECTION_TYPES.headlines,
                    styles: {
                        titleWidth: '30%',
                        titleContentGap: '.25rem',
                        contentWidth: '100%',
                        contentItemGap: '.25rem',
                        contentItemWidth: '100%'
                    },
                },
                [SECTION_TYPES.experience]: {
                    id: SECTION_TYPES.experience,
                    styles: {
                        titleWidth: '30%',
                        titleContentGap: '.25rem',
                        contentWidth: '100%',
                        contentItemGap: '.25rem',
                        contentItemWidth: '100%'
                    },
                },
                [SECTION_TYPES.education]: {
                    id: SECTION_TYPES.education,
                    styles: {
                        titleWidth: '30%',
                        titleContentGap: '.25rem',
                        contentWidth: '100%',
                        contentItemGap: '.25rem',
                        contentItemWidth: '100%'
                    },
                },
                [SECTION_TYPES.skills]: {
                    id: SECTION_TYPES.skills,
                    styles: {
                        titleWidth: '30%',
                        titleContentGap: '.25rem',
                        contentWidth: '100%',
                        contentItemGap: '.25rem',
                        contentItemWidth: '100%'
                    },
                },
            }
        },
        [CV_TYPES.v3]: {
            id: CV_TYPES.v3,
            name: 'CV template 3',
            sections: {
                [SECTION_TYPES.headlines]: {
                    id: SECTION_TYPES.headlines,
                    styles: {
                        titleWidth: '30%',
                        titleContentGap: '.25rem',
                        contentWidth: '100%',
                        contentItemGap: '.25rem',
                        contentItemWidth: '100%'
                    },
                },
                [SECTION_TYPES.experience]: {
                    id: SECTION_TYPES.experience,
                    styles: {
                        titleWidth: '30%',
                        titleContentGap: '.25rem',
                        contentWidth: '100%',
                        contentItemGap: '.25rem',
                        contentItemWidth: '100%'
                    },
                },
                [SECTION_TYPES.education]: {
                    id: SECTION_TYPES.education,
                    styles: {
                        titleWidth: '30%',
                        titleContentGap: '.25rem',
                        contentWidth: '100%',
                        contentItemGap: '.25rem',
                        contentItemWidth: '100%'
                    },
                },
                [SECTION_TYPES.skills]: {
                    id: SECTION_TYPES.skills,
                    styles: {
                        titleWidth: '30%',
                        titleContentGap: '.25rem',
                        contentWidth: '100%',
                        contentItemGap: '.25rem',
                        contentItemWidth: '100%'
                    },
                },
            }        
        },
    },
    allIds: [
        CV_TYPES.v1,
        CV_TYPES.v2,
        CV_TYPES.v3,
    ]
}