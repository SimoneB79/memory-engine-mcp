import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const CredentialsStatusErrorReason: {
    readonly OauthExpired: "oauth expired";
    readonly OauthNearExpiry: "oauth near expiry";
    readonly EmptyCredentials: "empty credentials";
    readonly BlankBearerToken: "blank bearer token";
    readonly UnparsableCredentials: "unparsable credentials";
    readonly YouNeedToReconnect: "you need to reconnect";
    readonly OauthRefreshError: "oauth refresh error";
    readonly MCPServerUnreachable: "MCP server unreachable";
    readonly MCPServerTimedOut: "MCP server timed out";
    readonly MCPServerError: "MCP server error";
    readonly UnknownError: "unknown error";
};
export type CredentialsStatusErrorReason = OpenEnum<typeof CredentialsStatusErrorReason>;
/** @internal */
export declare const CredentialsStatusErrorReason$inboundSchema: z.ZodType<CredentialsStatusErrorReason, unknown>;
//# sourceMappingURL=credentialsstatuserrorreason.d.ts.map