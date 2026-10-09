import * as z from "zod/v4";
import { FunctionName, FunctionName$Outbound } from "./functionname.js";
import { ToolTypes } from "./tooltypes.js";
/**
 * ToolChoice is either a ToolChoiceEnum or a ToolChoice
 */
export type ToolChoice = {
    type?: ToolTypes | undefined;
    /**
     * this restriction of `Function` is used to select a specific function to call
     */
    function: FunctionName;
};
/** @internal */
export type ToolChoice$Outbound = {
    type: string;
    function: FunctionName$Outbound;
};
/** @internal */
export declare const ToolChoice$outboundSchema: z.ZodType<ToolChoice$Outbound, ToolChoice>;
export declare function toolChoiceToJSON(toolChoice: ToolChoice): string;
//# sourceMappingURL=toolchoice.d.ts.map