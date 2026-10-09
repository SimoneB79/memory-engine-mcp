import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type ToolProperties = {
    readOnly: boolean | null;
};
/** @internal */
export declare const ToolProperties$inboundSchema: z.ZodType<ToolProperties, unknown>;
export declare function toolPropertiesFromJSON(jsonString: string): SafeParseResult<ToolProperties, SDKValidationError>;
//# sourceMappingURL=toolproperties.d.ts.map