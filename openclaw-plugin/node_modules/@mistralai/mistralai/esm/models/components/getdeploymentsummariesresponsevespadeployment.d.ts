import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { GetDeploymentSummariesResponseVespaIndex } from "./getdeploymentsummariesresponsevespaindex.js";
export type GetDeploymentSummariesResponseVespaDeployment = {
    type: "vespa";
    indexes: Array<GetDeploymentSummariesResponseVespaIndex>;
};
/** @internal */
export declare const GetDeploymentSummariesResponseVespaDeployment$inboundSchema: z.ZodType<GetDeploymentSummariesResponseVespaDeployment, unknown>;
export declare function getDeploymentSummariesResponseVespaDeploymentFromJSON(jsonString: string): SafeParseResult<GetDeploymentSummariesResponseVespaDeployment, SDKValidationError>;
//# sourceMappingURL=getdeploymentsummariesresponsevespadeployment.d.ts.map