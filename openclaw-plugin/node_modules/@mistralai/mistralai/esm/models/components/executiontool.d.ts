import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ExecutionConfig } from "./executionconfig.js";
export type ExecutionTool = {
    name: string;
    integrationId: string;
    executionConfig: ExecutionConfig | null;
};
/** @internal */
export declare const ExecutionTool$inboundSchema: z.ZodType<ExecutionTool, unknown>;
export declare function executionToolFromJSON(jsonString: string): SafeParseResult<ExecutionTool, SDKValidationError>;
//# sourceMappingURL=executiontool.d.ts.map