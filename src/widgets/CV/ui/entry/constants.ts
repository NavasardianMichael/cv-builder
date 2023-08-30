import { CV_TEMPLATE_TYPES } from "widgets/CV/constants/templates";
import { Template1 } from "../template1/main";
import { Template2 } from "../template2/main";
import { Template3 } from "../template3/main";

export const TEMPLATE_COMPONENTS = {
    [CV_TEMPLATE_TYPES.variant1]: Template1,
    [CV_TEMPLATE_TYPES.variant2]: Template2,
    [CV_TEMPLATE_TYPES.variant3]: Template3,
}