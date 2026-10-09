import * as z from "zod/v4";
export type OAuth2ClientCredentialsInput = {
    grantType: "client_credentials";
    clientId: string;
    clientSecret: string;
};
/** @internal */
export type OAuth2ClientCredentialsInput$Outbound = {
    grant_type: "client_credentials";
    client_id: string;
    client_secret: string;
};
/** @internal */
export declare const OAuth2ClientCredentialsInput$outboundSchema: z.ZodType<OAuth2ClientCredentialsInput$Outbound, OAuth2ClientCredentialsInput>;
export declare function oAuth2ClientCredentialsInputToJSON(oAuth2ClientCredentialsInput: OAuth2ClientCredentialsInput): string;
//# sourceMappingURL=oauth2clientcredentialsinput.d.ts.map