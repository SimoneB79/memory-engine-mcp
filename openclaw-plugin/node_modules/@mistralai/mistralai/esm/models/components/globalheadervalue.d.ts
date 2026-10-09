import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
/**
 * Value of a connector-wide header. ``value`` is plaintext in memory so create
 *
 * @remarks
 * round-trips and encryption-at-rest keep the real value; secrets are redacted only
 * on JSON serialization (API responses).
 */
export type GlobalHeaderValue = {
    isSecret?: boolean | undefined;
    value: string;
};
/** @internal */
export declare const GlobalHeaderValue$inboundSchema: z.ZodType<GlobalHeaderValue, unknown>;
/** @internal */
export type GlobalHeaderValue$Outbound = {
    is_secret: boolean;
    value: string;
};
/** @internal */
export declare const GlobalHeaderValue$outboundSchema: z.ZodType<GlobalHeaderValue$Outbound, GlobalHeaderValue>;
export declare function globalHeaderValueToJSON(globalHeaderValue: GlobalHeaderValue): string;
export declare function globalHeaderValueFromJSON(jsonString: string): SafeParseResult<GlobalHeaderValue, SDKValidationError>;
//# sourceMappingURL=globalheadervalue.d.ts.map