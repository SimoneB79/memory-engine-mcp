import * as z from "zod/v4";
import { ConnectorAuthenticationHeader, ConnectorAuthenticationHeader$Outbound } from "./connectorauthenticationheader.js";
import { ExtendedOAuthServerMetadata, ExtendedOAuthServerMetadata$Outbound } from "./extendedoauthservermetadata.js";
import { OAuth2TokenEndpointAuthMethod } from "./oauth2tokenendpointauthmethod.js";
export type OAuth2ClientCredentialsAuthMethod = {
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
    grantType: "client_credentials";
    tokenEndpointAuthMethod: OAuth2TokenEndpointAuthMethod;
};
/** @internal */
export type OAuth2ClientCredentialsAuthMethod$Outbound = {
    method_type: "oauth2";
    oauth2_server_metadata: ExtendedOAuthServerMetadata$Outbound;
    headers?: Array<ConnectorAuthenticationHeader$Outbound> | null | undefined;
    grant_type: "client_credentials";
    token_endpoint_auth_method: string;
};
/** @internal */
export declare const OAuth2ClientCredentialsAuthMethod$outboundSchema: z.ZodType<OAuth2ClientCredentialsAuthMethod$Outbound, OAuth2ClientCredentialsAuthMethod>;
export declare function oAuth2ClientCredentialsAuthMethodToJSON(oAuth2ClientCredentialsAuthMethod: OAuth2ClientCredentialsAuthMethod): string;
//# sourceMappingURL=oauth2clientcredentialsauthmethod.d.ts.map