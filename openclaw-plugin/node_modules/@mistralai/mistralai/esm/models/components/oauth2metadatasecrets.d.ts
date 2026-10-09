import * as z from "zod/v4";
/**
 * OAuth2 client credentials stored alongside a connector's authentication method.
 *
 * @remarks
 *
 * Used by OAuth2 and Slack App auth types for token exchange and refresh flows.
 * Contains the client credentials obtained during OAuth2 Dynamic Client Registration
 * or provided at connector creation time.
 */
export type Oauth2MetadataSecrets = {
    clientId?: string | null | undefined;
    clientSecret?: string | null | undefined;
    clientIdIssuedAt?: number | null | undefined;
    clientSecretExpiresAt?: number | null | undefined;
};
/** @internal */
export type Oauth2MetadataSecrets$Outbound = {
    client_id?: string | null | undefined;
    client_secret?: string | null | undefined;
    client_id_issued_at?: number | null | undefined;
    client_secret_expires_at?: number | null | undefined;
};
/** @internal */
export declare const Oauth2MetadataSecrets$outboundSchema: z.ZodType<Oauth2MetadataSecrets$Outbound, Oauth2MetadataSecrets>;
export declare function oauth2MetadataSecretsToJSON(oauth2MetadataSecrets: Oauth2MetadataSecrets): string;
//# sourceMappingURL=oauth2metadatasecrets.d.ts.map