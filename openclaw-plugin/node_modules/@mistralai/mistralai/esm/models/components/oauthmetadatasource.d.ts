import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
/**
 * How a connector's OAuth server metadata was obtained.
 */
export declare const OAuthMetadataSource: {
    readonly Autodiscovery: "autodiscovery";
    readonly Provided: "provided";
};
/**
 * How a connector's OAuth server metadata was obtained.
 */
export type OAuthMetadataSource = OpenEnum<typeof OAuthMetadataSource>;
/** @internal */
export declare const OAuthMetadataSource$inboundSchema: z.ZodType<OAuthMetadataSource, unknown>;
/** @internal */
export declare const OAuthMetadataSource$outboundSchema: z.ZodType<string, OAuthMetadataSource>;
//# sourceMappingURL=oauthmetadatasource.d.ts.map