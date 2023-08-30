import { SECTION_TYPES } from "widgets/CV/constants/sections";
import { SECTION } from "widgets/CV/types/sections";

export type SectionComponentProps<S extends typeof SECTION_TYPES[keyof typeof SECTION_TYPES]> = {
    templateStyles: SECTION['styles'][S]
}