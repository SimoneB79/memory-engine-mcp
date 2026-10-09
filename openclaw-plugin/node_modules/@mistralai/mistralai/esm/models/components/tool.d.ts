import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { FunctionT, FunctionT$Outbound } from "./function.js";
import { ToolTypes } from "./tooltypes.js";
export type Tool = {
    type?: ToolTypes | undefined;
    function: FunctionT;
};
/** @internal */
export declare const Tool$inboundSchema: z.ZodType<Tool, unknown>;
/** @internal */
export type Tool$Outbound = {
    type: string;
    function: FunctionT$Outbound;
};
/** @internal */
export declare const Tool$outboundSchema: z.ZodType<Tool$Outbound, Tool>;
export declare function toolToJSON(tool: Tool): string;
export declare function toolFromJSON(jsonString: string): SafeParseResult<Tool, SDKValidationError>;
//# sourceMappingURL=tool.d.ts.map