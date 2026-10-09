import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type ClientSecret = {
    value: string;
    expiresAt: Date;
};
/** @internal */
export declare const ClientSecret$inboundSchema: z.ZodType<ClientSecret, unknown>;
export declare function clientSecretFromJSON(jsonString: string): SafeParseResult<ClientSecret, SDKValidationError>;
//# sourceMappingURL=clientsecret.d.ts.map