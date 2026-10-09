import * as z from "zod/v4";
import { AuthData, AuthData$Outbound } from "./authdata.js";
import { ConnectorAuthenticationHeader, ConnectorAuthenticationHeader$Outbound } from "./connectorauthenticationheader.js";
import { ExtendedOAuthServerMetadata, ExtendedOAuthServerMetadata$Outbound } from "./extendedoauthservermetadata.js";
export type OAuth2AuthorizationCodeAuthMethod = {
    methodType?: "oauth2" | undefined;
    /**
     * Custom superset of RFC 8414 OAuth 2.0 Authorization Server Metadata.
     *
     * @remarks
     *
     * Stored at connector creation time (provided for HTTP connectors, discovered via .well-known for MCP).
     * Mirrors the shape of .well-known/oauth-authorization-server responses.
     */
    oauth2ServerMetadata: ExtendedOAuthServerMetadata;
    /**
     * Optional headers sent with requests for this auth method.
     */
    headers?: Array<ConnectorAuthenticationHeader> | null | undefined;
    grantType: "authorization_code";
    authData: AuthData;
};
/** @internal */
export type OAuth2AuthorizationCodeAuthMethod$Outbound = {
    method_type: "oauth2";
    oauth2_server_metadata: ExtendedOAuthServerMetadata$Outbound;
    headers?: Array<ConnectorAuthenticationHeader$Outbound> | null | undefined;
    grant_type: "authorization_code";
    auth_data: AuthData$Outbound;
};
/** @internal */
export declare const OAuth2AuthorizationCodeAuthMethod$outboundSchema: z.ZodType<OAuth2AuthorizationCodeAuthMethod$Outbound, OAuth2AuthorizationCodeAuthMethod>;
export declare function oAuth2AuthorizationCodeAuthMethodToJSON(oAuth2AuthorizationCodeAuthMethod: OAuth2AuthorizationCodeAuthMethod): string;
//# sourceMappingURL=oauth2authorizationcodeauthmethod.d.ts.map