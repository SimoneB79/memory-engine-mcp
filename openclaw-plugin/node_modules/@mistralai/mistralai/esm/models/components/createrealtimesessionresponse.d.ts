import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ClientSecret } from "./clientsecret.js";
import { ClientSessionPurpose } from "./clientsessionpurpose.js";
export type CreateRealtimeSessionResponse = {
    object: "client.session";
    /**
     * Supported purposes for client sessions.
     */
    purpose: ClientSessionPurpose;
    expiresAt: Date;
    clientSecret: ClientSecret;
};
/** @internal */
export declare const CreateRealtimeSessionResponse$inboundSchema: z.ZodType<CreateRealtimeSessionResponse, unknown>;
export declare function createRealtimeSessionResponseFromJSON(jsonString: string): SafeParseResult<CreateRealtimeSessionResponse, SDKValidationError>;
//# sourceMappingURL=createrealtimesessionresponse.d.ts.map