import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const ToolTypes: {
    readonly Function: "function";
};
export type ToolTypes = OpenEnum<typeof ToolTypes>;
/** @internal */
export declare const ToolTypes$inboundSchema: z.ZodType<ToolTypes, unknown>;
/** @internal */
export declare const ToolTypes$outboundSchema: z.ZodType<string, ToolTypes>;
//# sourceMappingURL=tooltypes.d.ts.map