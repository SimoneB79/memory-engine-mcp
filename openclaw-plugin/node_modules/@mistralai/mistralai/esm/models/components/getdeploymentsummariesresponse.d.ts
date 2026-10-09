import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { GetDeploymentSummariesResponseDeployment } from "./getdeploymentsummariesresponsedeployment.js";
export type GetDeploymentSummariesResponse = {
    deployments: Array<GetDeploymentSummariesResponseDeployment>;
};
/** @internal */
export declare const GetDeploymentSummariesResponse$inboundSchema: z.ZodType<GetDeploymentSummariesResponse, unknown>;
export declare function getDeploymentSummariesResponseFromJSON(jsonString: string): SafeParseResult<GetDeploymentSummariesResponse, SDKValidationError>;
//# sourceMappingURL=getdeploymentsummariesresponse.d.ts.map