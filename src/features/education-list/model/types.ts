import { Education } from "entities/education/model/types"
import { NormalizedShape } from "shared/types/commons"

export type EducationListSlice = NormalizedShape<Education>

export type Actions = {
    setEducationList: EducationListSlice
    setEducation: Pick<Education, 'id'> & Partial<Education>
}