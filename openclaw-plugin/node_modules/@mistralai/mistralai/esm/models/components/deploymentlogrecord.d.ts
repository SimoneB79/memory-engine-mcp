import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type DeploymentLogRecord = {
    timestamp: Date;
    traceId: string;
    spanId: string;
    severityText: string;
    body: string;
    logAttributes: {
        [k: string]: string;
    };
};
/** @internal */
export declare const DeploymentLogRecord$inboundSchema: z.ZodType<DeploymentLogRecord, unknown>;
export declare function deploymentLogRecordFromJSON(jsonString: string): SafeParseResult<DeploymentLogRecord, SDKValidationError>;
//# sourceMappingURL=deploymentlogrecord.d.ts.map