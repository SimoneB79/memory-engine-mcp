import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type GetDeploymentSummariesResponseVespaIndex = {
    id: string;
    name: string;
    documentCount: number | null;
};
/** @internal */
export declare const GetDeploymentSummariesResponseVespaIndex$inboundSchema: z.ZodType<GetDeploymentSummariesResponseVespaIndex, unknown>;
export declare function getDeploymentSummariesResponseVespaIndexFromJSON(jsonString: string): SafeParseResult<GetDeploymentSummariesResponseVespaIndex, SDKValidationError>;
//# sourceMappingURL=getdeploymentsummariesresponsevespaindex.d.ts.map