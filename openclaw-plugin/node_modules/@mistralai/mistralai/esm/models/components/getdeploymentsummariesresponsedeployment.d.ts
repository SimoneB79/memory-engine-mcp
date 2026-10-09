import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { GetDeploymentSummariesResponseVespaDeployment } from "./getdeploymentsummariesresponsevespadeployment.js";
export declare const GetDeploymentSummariesResponseDeploymentStatus: {
    readonly Online: "online";
    readonly Offline: "offline";
};
export type GetDeploymentSummariesResponseDeploymentStatus = OpenEnum<typeof GetDeploymentSummariesResponseDeploymentStatus>;
export type GetDeploymentSummariesResponseDeploymentDeployment = GetDeploymentSummariesResponseVespaDeployment;
export type GetDeploymentSummariesResponseDeployment = {
    id: string;
    name: string;
    creatorId: string;
    documentCount: number;
    status: GetDeploymentSummariesResponseDeploymentStatus;
    createdAt: Date;
    modifiedAt: Date;
    deployment: GetDeploymentSummariesResponseVespaDeployment;
};
/** @internal */
export declare const GetDeploymentSummariesResponseDeploymentStatus$inboundSchema: z.ZodType<GetDeploymentSummariesResponseDeploymentStatus, unknown>;
/** @internal */
export declare const GetDeploymentSummariesResponseDeploymentDeployment$inboundSchema: z.ZodType<GetDeploymentSummariesResponseDeploymentDeployment, unknown>;
export declare function getDeploymentSummariesResponseDeploymentDeploymentFromJSON(jsonString: string): SafeParseResult<GetDeploymentSummariesResponseDeploymentDeployment, SDKValidationError>;
/** @internal */
export declare const GetDeploymentSummariesResponseDeployment$inboundSchema: z.ZodType<GetDeploymentSummariesResponseDeployment, unknown>;
export declare function getDeploymentSummariesResponseDeploymentFromJSON(jsonString: string): SafeParseResult<GetDeploymentSummariesResponseDeployment, SDKValidationError>;
//# sourceMappingURL=getdeploymentsummariesresponsedeployment.d.ts.map