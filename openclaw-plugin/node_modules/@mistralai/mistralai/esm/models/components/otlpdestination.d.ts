import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { PipelineConfigHeader, PipelineConfigHeader$Outbound } from "./pipelineconfigheader.js";
export type OTLPDestination = {
    protocol: string;
    endpoint: string;
    insecure?: boolean | undefined;
    headers?: {
        [k: string]: PipelineConfigHeader;
    } | undefined;
};
/** @internal */
export declare const OTLPDestination$inboundSchema: z.ZodType<OTLPDestination, unknown>;
/** @internal */
export type OTLPDestination$Outbound = {
    protocol: string;
    endpoint: string;
    insecure: boolean;
    headers?: {
        [k: string]: PipelineConfigHeader$Outbound;
    } | undefined;
};
/** @internal */
export declare const OTLPDestination$outboundSchema: z.ZodType<OTLPDestination$Outbound, OTLPDestination>;
export declare function otlpDestinationToJSON(otlpDestination: OTLPDestination): string;
export declare function otlpDestinationFromJSON(jsonString: string): SafeParseResult<OTLPDestination, SDKValidationError>;
//# sourceMappingURL=otlpdestination.d.ts.map