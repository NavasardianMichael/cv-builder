import { createSelector } from "@reduxjs/toolkit";
import { selectEducationList } from "features/education-list/model/selectors";
import { selectExperienceList } from "features/experience-list/model/selectors";
import { selectHeadlines } from "features/headlines/model/selectors";
import { selectSkillsList } from "features/skills-list/model/selectors";

export const selectCVData = createSelector(
    selectHeadlines,
    selectExperienceList,
    selectEducationList,
    selectSkillsList,
    (headlines, experienceList, educationList, skillsList) => ({
        headlines, 
        experienceList, 
        educationList,
        skillsList
    })
)