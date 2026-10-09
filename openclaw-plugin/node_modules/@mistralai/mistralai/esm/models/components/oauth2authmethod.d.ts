import * as z from "zod/v4";
import { OAuth2AuthorizationCodeAuthMethod, OAuth2AuthorizationCodeAuthMethod$Outbound } from "./oauth2authorizationcodeauthmethod.js";
import { OAuth2ClientCredentialsAuthMethod, OAuth2ClientCredentialsAuthMethod$Outbound } from "./oauth2clientcredentialsauthmethod.js";
export type OAuth2AuthMethod = OAuth2AuthorizationCodeAuthMethod | OAuth2ClientCredentialsAuthMethod;
/** @internal */
export type OAuth2AuthMethod$Outbound = OAuth2AuthorizationCodeAuthMethod$Outbound | OAuth2ClientCredentialsAuthMethod$Outbound;
/** @internal */
export declare const OAuth2AuthMethod$outboundSchema: z.ZodType<OAuth2AuthMethod$Outbound, OAuth2AuthMethod>;
export declare function oAuth2AuthMethodToJSON(oAuth2AuthMethod: OAuth2AuthMethod): string;
//# sourceMappingURL=oauth2authmethod.d.ts.map