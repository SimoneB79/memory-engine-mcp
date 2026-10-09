import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { OCRBlockConfidenceScores } from "./ocrblockconfidencescores.js";
export type OCRReferencesBlock = {
    topLeftX: number;
    topLeftY: number;
    bottomRightX: number;
    bottomRightY: number;
    /**
     * Text/markdown/html content of this block
     */
    content: string;
    /**
     * Confidence scores for this block. Populated when confidence_scores_granularity is set to 'block'.
     */
    confidenceScores?: OCRBlockConfidenceScores | null | undefined;
    type: "references";
};
/** @internal */
export declare const OCRReferencesBlock$inboundSchema: z.ZodType<OCRReferencesBlock, unknown>;
export declare function ocrReferencesBlockFromJSON(jsonString: string): SafeParseResult<OCRReferencesBlock, SDKValidationError>;
//# sourceMappingURL=ocrreferencesblock.d.ts.map