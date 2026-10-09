import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { LogicalExpression } from "./logicalexpression.js";
import { ToolProperties } from "./toolproperties.js";
export type RequiresConfirmation = LogicalExpression | ToolProperties | Array<string>;
export type SkipConfirmation = LogicalExpression | ToolProperties | Array<string>;
export type ToolExecutionConfiguration = {
    requiresConfirmation?: LogicalExpression | ToolProperties | Array<string> | null | undefined;
    skipConfirmation?: LogicalExpression | ToolProperties | Array<string> | null | undefined;
    include?: Array<string> | null | undefined;
    exclude?: Array<string> | null | undefined;
};
/** @internal */
export declare const RequiresConfirmation$inboundSchema: z.ZodType<RequiresConfirmation, unknown>;
export declare function requiresConfirmationFromJSON(jsonString: string): SafeParseResult<RequiresConfirmation, SDKValidationError>;
/** @internal */
export declare const SkipConfirmation$inboundSchema: z.ZodType<SkipConfirmation, unknown>;
export declare function skipConfirmationFromJSON(jsonString: string): SafeParseResult<SkipConfirmation, SDKValidationError>;
/** @internal */
export declare const ToolExecutionConfiguration$inboundSchema: z.ZodType<ToolExecutionConfiguration, unknown>;
export declare function toolExecutionConfigurationFromJSON(jsonString: string): SafeParseResult<ToolExecutionConfiguration, SDKValidationError>;
//# sourceMappingURL=toolexecutionconfiguration.d.ts.map