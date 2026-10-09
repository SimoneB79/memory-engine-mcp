import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { Skill } from "./skill.js";
export type ListSkillsResponse = {
    data?: Array<Skill> | undefined;
    nextPageToken?: string | undefined;
};
/** @internal */
export declare const ListSkillsResponse$inboundSchema: z.ZodType<ListSkillsResponse, unknown>;
export declare function listSkillsResponseFromJSON(jsonString: string): SafeParseResult<ListSkillsResponse, SDKValidationError>;
//# sourceMappingURL=listskillsresponse.d.ts.map