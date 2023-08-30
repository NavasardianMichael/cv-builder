import { Experience } from "entities/experience/model/types"
import { NormalizedShape } from "shared/types/commons"

export type ExperienceListSlice = NormalizedShape<Experience>

export type Actions = {
    setExperienceList: ExperienceListSlice
    setExperience: Pick<Experience, 'id'> & Partial<Experience>
}