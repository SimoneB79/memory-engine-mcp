import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { PublicConnectorExecutionData } from "./publicconnectorexecutiondata.js";
import { Tool } from "./tool.js";
/**
 * Credentials-free projection of ExecutionEnv for the public /connectors/mistral response.
 */
export type PublicExecutionEnv = {
    tools: Array<Tool>;
    toolExecutionData: PublicConnectorExecutionData;
    errors: Array<string>;
};
/** @internal */
export declare const PublicExecutionEnv$inboundSchema: z.ZodType<PublicExecutionEnv, unknown>;
export declare function publicExecutionEnvFromJSON(jsonString: string): SafeParseResult<PublicExecutionEnv, SDKValidationError>;
//# sourceMappingURL=publicexecutionenv.d.ts.map