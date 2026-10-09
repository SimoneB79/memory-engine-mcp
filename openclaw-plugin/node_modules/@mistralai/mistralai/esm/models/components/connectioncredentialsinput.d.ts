import * as z from "zod/v4";
import { OAuth2ClientCredentialsInput, OAuth2ClientCredentialsInput$Outbound } from "./oauth2clientcredentialsinput.js";
export type ConnectionCredentialsInput = {
    oauth?: OAuth2ClientCredentialsInput | null | undefined;
    headers?: {
        [k: string]: string;
    } | null | undefined;
    bearerToken?: string | null | undefined;
};
/** @internal */
export type ConnectionCredentialsInput$Outbound = {
    oauth?: OAuth2ClientCredentialsInput$Outbound | null | undefined;
    headers?: {
        [k: string]: string;
    } | null | undefined;
    bearer_token?: string | null | undefined;
};
/** @internal */
export declare const ConnectionCredentialsInput$outboundSchema: z.ZodType<ConnectionCredentialsInput$Outbound, ConnectionCredentialsInput>;
export declare function connectionCredentialsInputToJSON(connectionCredentialsInput: ConnectionCredentialsInput): string;
//# sourceMappingURL=connectioncredentialsinput.d.ts.map