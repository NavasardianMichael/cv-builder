import { FC } from 'react'
import { SectionComponentProps } from "shared/types/sections"
import { SECTION_TYPES } from "../constants/sections"

type SectionWithEntitiesStyles = {
    titleWidth: string
    titleContentGap: string
    contentWidth: string
    contentItemGap: string
    contentItemWidth: string
}

type HeadlinesStyles = {
    titleWidth: string
    contactsWidth: string
    bioWidth: string
}

export type SECTION = {
    id: typeof SECTION_TYPES[keyof typeof SECTION_TYPES]
    styles: {
        [SECTION_TYPES.headlines]: HeadlinesStyles
        [SECTION_TYPES.experience]: SectionWithEntitiesStyles
        [SECTION_TYPES.education]: SectionWithEntitiesStyles
        [SECTION_TYPES.skills]: SectionWithEntitiesStyles
    }
}

export type SECTION_TEMPLATE = {
    id: typeof SECTION_TYPES[keyof typeof SECTION_TYPES]
    component: FC<SectionComponentProps<typeof SECTION_TYPES[keyof typeof SECTION_TYPES]>>
}

export type SECTIONS_TEMPLATE = {
    byId: Record<SECTION_TEMPLATE['id'], SECTION_TEMPLATE>,
    allIds: SECTION_TEMPLATE['id'][]
}

export type SECTION_TEMPLATES_TYPE = Record<SECTION['id'], SECTION>