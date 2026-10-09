import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { SkillVersion } from "./skillversion.js";
export type ListSkillVersionsResponse = {
    data?: Array<SkillVersion> | undefined;
};
/** @internal */
export declare const ListSkillVersionsResponse$inboundSchema: z.ZodType<ListSkillVersionsResponse, unknown>;
export declare function listSkillVersionsResponseFromJSON(jsonString: string): SafeParseResult<ListSkillVersionsResponse, SDKValidationError>;
//# sourceMappingURL=listskillversionsresponse.d.ts.map