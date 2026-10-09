import * as z from "zod/v4";
import { AuthenticationMethodCreateOrUpdateRequest, AuthenticationMethodCreateOrUpdateRequest$Outbound } from "./authenticationmethodcreateorupdaterequest.js";
import { BearerAuthMethod, BearerAuthMethod$Outbound } from "./bearerauthmethod.js";
import { NoneAuthMethod, NoneAuthMethod$Outbound } from "./noneauthmethod.js";
import { OAuth2AuthMethod, OAuth2AuthMethod$Outbound } from "./oauth2authmethod.js";
export type ConnectorMCPPublicUpdateAuthMethod1 = BearerAuthMethod | NoneAuthMethod | (OAuth2AuthMethod & {
    methodType: "oauth2";
});
export type ConnectorMCPPublicUpdateAuthMethod2 = AuthenticationMethodCreateOrUpdateRequest | BearerAuthMethod | NoneAuthMethod | (OAuth2AuthMethod & {
    methodType: "oauth2";
});
export type ConnectorMCPPublicUpdate = {
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
    protocol: "mcp";
    /**
     * Optional system prompt for the connector.
     */
    systemPrompt?: string | null | undefined;
};
/** @internal */
export type ConnectorMCPPublicUpdateAuthMethod1$Outbound = BearerAuthMethod$Outbound | NoneAuthMethod$Outbound | (OAuth2AuthMethod$Outbound & {
    method_type: "oauth2";
});
/** @internal */
export declare const ConnectorMCPPublicUpdateAuthMethod1$outboundSchema: z.ZodType<ConnectorMCPPublicUpdateAuthMethod1$Outbound, ConnectorMCPPublicUpdateAuthMethod1>;
export declare function connectorMCPPublicUpdateAuthMethod1ToJSON(connectorMCPPublicUpdateAuthMethod1: ConnectorMCPPublicUpdateAuthMethod1): string;
/** @internal */
export type ConnectorMCPPublicUpdateAuthMethod2$Outbound = AuthenticationMethodCreateOrUpdateRequest$Outbound | BearerAuthMethod$Outbound | NoneAuthMethod$Outbound | (OAuth2AuthMethod$Outbound & {
    method_type: "oauth2";
});
/** @internal */
export declare const ConnectorMCPPublicUpdateAuthMethod2$outboundSchema: z.ZodType<ConnectorMCPPublicUpdateAuthMethod2$Outbound, ConnectorMCPPublicUpdateAuthMethod2>;
export declare function connectorMCPPublicUpdateAuthMethod2ToJSON(connectorMCPPublicUpdateAuthMethod2: ConnectorMCPPublicUpdateAuthMethod2): string;
/** @internal */
export type ConnectorMCPPublicUpdate$Outbound = {
    title?: string | null | undefined;
    name?: string | null | undefined;
    description?: string | null | undefined;
    icon_url?: string | null | undefined;
    server?: string | null | undefined;
    auth_methods?: Array<AuthenticationMethodCreateOrUpdateRequest$Outbound | BearerAuthMethod$Outbound | NoneAuthMethod$Outbound | (OAuth2AuthMethod$Outbound & {
        method_type: "oauth2";
    })> | null | undefined;
    protocol: "mcp";
    system_prompt?: string | null | undefined;
};
/** @internal */
export declare const ConnectorMCPPublicUpdate$outboundSchema: z.ZodType<ConnectorMCPPublicUpdate$Outbound, ConnectorMCPPublicUpdate>;
export declare function connectorMCPPublicUpdateToJSON(connectorMCPPublicUpdate: ConnectorMCPPublicUpdate): string;
//# sourceMappingURL=connectormcppublicupdate.d.ts.map