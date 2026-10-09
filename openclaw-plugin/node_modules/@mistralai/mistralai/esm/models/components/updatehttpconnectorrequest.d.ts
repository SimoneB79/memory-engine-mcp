import * as z from "zod/v4";
import { AuthenticationMethodCreateOrUpdateRequest, AuthenticationMethodCreateOrUpdateRequest$Outbound } from "./authenticationmethodcreateorupdaterequest.js";
import { BearerAuthMethod, BearerAuthMethod$Outbound } from "./bearerauthmethod.js";
import { NoneAuthMethod, NoneAuthMethod$Outbound } from "./noneauthmethod.js";
import { OAuth2AuthMethod, OAuth2AuthMethod$Outbound } from "./oauth2authmethod.js";
export type UpdateHTTPConnectorRequestAuthMethod1 = BearerAuthMethod | NoneAuthMethod | (OAuth2AuthMethod & {
    methodType: "oauth2";
});
export type UpdateHTTPConnectorRequestAuthMethod2 = AuthenticationMethodCreateOrUpdateRequest | BearerAuthMethod | NoneAuthMethod | (OAuth2AuthMethod & {
    methodType: "oauth2";
});
export type UpdateHTTPConnectorRequest = {
    /**
     * Optional human-readable title for the connector.
     */
    title?: string | null | undefined;
    /**
     * The name of the connector.
     */
    name?: string | null | undefined;
    /**
     * The description of the connector.
     */
    description?: string | null | undefined;
    /**
     * The optional url of the icon you want to associate to the connector.
     */
    iconUrl?: string | null | undefined;
    /**
     * New connector server URL.
     */
    server?: string | null | undefined;
    /**
     * Authentication methods supported by the connector.
     */
    authMethods?: Array<AuthenticationMethodCreateOrUpdateRequest | BearerAuthMethod | NoneAuthMethod | (OAuth2AuthMethod & {
        methodType: "oauth2";
    })> | null | undefined;
    protocol: "http";
};
/** @internal */
export type UpdateHTTPConnectorRequestAuthMethod1$Outbound = BearerAuthMethod$Outbound | NoneAuthMethod$Outbound | (OAuth2AuthMethod$Outbound & {
    method_type: "oauth2";
});
/** @internal */
export declare const UpdateHTTPConnectorRequestAuthMethod1$outboundSchema: z.ZodType<UpdateHTTPConnectorRequestAuthMethod1$Outbound, UpdateHTTPConnectorRequestAuthMethod1>;
export declare function updateHTTPConnectorRequestAuthMethod1ToJSON(updateHTTPConnectorRequestAuthMethod1: UpdateHTTPConnectorRequestAuthMethod1): string;
/** @internal */
export type UpdateHTTPConnectorRequestAuthMethod2$Outbound = AuthenticationMethodCreateOrUpdateRequest$Outbound | BearerAuthMethod$Outbound | NoneAuthMethod$Outbound | (OAuth2AuthMethod$Outbound & {
    method_type: "oauth2";
});
/** @internal */
export declare const UpdateHTTPConnectorRequestAuthMethod2$outboundSchema: z.ZodType<UpdateHTTPConnectorRequestAuthMethod2$Outbound, UpdateHTTPConnectorRequestAuthMethod2>;
export declare function updateHTTPConnectorRequestAuthMethod2ToJSON(updateHTTPConnectorRequestAuthMethod2: UpdateHTTPConnectorRequestAuthMethod2): string;
/** @internal */
export type UpdateHTTPConnectorRequest$Outbound = {
    title?: string | null | undefined;
    name?: string | null | undefined;
    description?: string | null | undefined;
    icon_url?: string | null | undefined;
    server?: string | null | undefined;
    auth_methods?: Array<AuthenticationMethodCreateOrUpdateRequest$Outbound | BearerAuthMethod$Outbound | NoneAuthMethod$Outbound | (OAuth2AuthMethod$Outbound & {
        method_type: "oauth2";
    })> | null | undefined;
    protocol: "http";
};
/** @internal */
export declare const UpdateHTTPConnectorRequest$outboundSchema: z.ZodType<UpdateHTTPConnectorRequest$Outbound, UpdateHTTPConnectorRequest>;
export declare function updateHTTPConnectorRequestToJSON(updateHTTPConnectorRequest: UpdateHTTPConnectorRequest): string;
//# sourceMappingURL=updatehttpconnectorrequest.d.ts.map