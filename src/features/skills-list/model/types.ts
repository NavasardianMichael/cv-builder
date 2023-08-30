import { Skill } from "entities/skill/model/types"
import { NormalizedShape } from "shared/types/commons"

export type SkillsListSlice = NormalizedShape<Skill>

export type Actions = {
    setSkillsList: SkillsListSlice
    setSkill: Pick<Skill, 'id'> & Partial<Skill>
}