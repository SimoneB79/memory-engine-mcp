import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { OTLPDestination, OTLPDestination$Outbound } from "./otlpdestination.js";
export type ExportDefinition = {
    destination: OTLPDestination;
};
/** @internal */
export declare const ExportDefinition$inboundSchema: z.ZodType<ExportDefinition, unknown>;
/** @internal */
export type ExportDefinition$Outbound = {
    destination: OTLPDestination$Outbound;
};
/** @internal */
export declare const ExportDefinition$outboundSchema: z.ZodType<ExportDefinition$Outbound, ExportDefinition>;
export declare function exportDefinitionToJSON(exportDefinition: ExportDefinition): string;
export declare function exportDefinitionFromJSON(jsonString: string): SafeParseResult<ExportDefinition, SDKValidationError>;
//# sourceMappingURL=exportdefinition.d.ts.map