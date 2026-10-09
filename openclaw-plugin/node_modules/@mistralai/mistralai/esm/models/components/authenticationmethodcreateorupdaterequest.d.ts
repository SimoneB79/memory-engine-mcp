import * as z from "zod/v4";
import { AuthDirection } from "./authdirection.js";
import { ConnectorAuthenticationHeader, ConnectorAuthenticationHeader$Outbound } from "./connectorauthenticationheader.js";
import { ExtendedOAuthServerMetadata, ExtendedOAuthServerMetadata$Outbound } from "./extendedoauthservermetadata.js";
import { GlobalHeaderValue, GlobalHeaderValue$Outbound } from "./globalheadervalue.js";
import { InboundAuthenticationType } from "./inboundauthenticationtype.js";
import { Oauth2MetadataSecrets, Oauth2MetadataSecrets$Outbound } from "./oauth2metadatasecrets.js";
import { OutboundAuthenticationType } from "./outboundauthenticationtype.js";
/**
 * The type of authentication method (e.g. oauth2, bearer, none).
 */
export type MethodType = OutboundAuthenticationType | InboundAuthenticationType;
export type AuthenticationMethodCreateOrUpdateRequest = {
    /**
     * The type of authentication method (e.g. oauth2, bearer, none).
     */
    methodType: OutboundAuthenticationType | InboundAuthenticationType;
    authDirection?: AuthDirection | undefined;
    /**
     * Set of headers to connect to the connector
     */
    headers?: Array<ConnectorAuthenticationHeader> | null | undefined;
    /**
     * Connector-wide headers keyed by header name, applied to every credential. Secret values are encrypted at rest and never returned in clear.
     */
    globalHeaders?: {
        [k: string]: GlobalHeaderValue;
    } | undefined;
    /**
     * New OAuth2 client credentials (client_id and client_secret).
     */
    oauth2MetadataSecrets?: Oauth2MetadataSecrets | null | undefined;
    /**
     * New OAuth2 authorization server metadata.
     */
    oauth2ServerMetadata?: ExtendedOAuthServerMetadata | null | undefined;
};
/** @internal */
export type MethodType$Outbound = string | string;
/** @internal */
export declare const MethodType$outboundSchema: z.ZodType<MethodType$Outbound, MethodType>;
export declare function methodTypeToJSON(methodType: MethodType): string;
/** @internal */
export type AuthenticationMethodCreateOrUpdateRequest$Outbound = {
    method_type: string | string;
    auth_direction?: string | undefined;
    headers?: Array<ConnectorAuthenticationHeader$Outbound> | null | undefined;
    global_headers?: {
        [k: string]: GlobalHeaderValue$Outbound;
    } | undefined;
    oauth2_metadata_secrets?: Oauth2MetadataSecrets$Outbound | null | undefined;
    oauth2_server_metadata?: ExtendedOAuthServerMetadata$Outbound | null | undefined;
};
/** @internal */
export declare const AuthenticationMethodCreateOrUpdateRequest$outboundSchema: z.ZodType<AuthenticationMethodCreateOrUpdateRequest$Outbound, AuthenticationMethodCreateOrUpdateRequest>;
export declare function authenticationMethodCreateOrUpdateRequestToJSON(authenticationMethodCreateOrUpdateRequest: AuthenticationMethodCreateOrUpdateRequest): string;
//# sourceMappingURL=authenticationmethodcreateorupdaterequest.d.ts.map