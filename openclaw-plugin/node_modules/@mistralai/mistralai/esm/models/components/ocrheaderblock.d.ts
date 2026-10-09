import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { OCRBlockConfidenceScores } from "./ocrblockconfidencescores.js";
export type OCRHeaderBlock = {
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
    type: "header";
};
/** @internal */
export declare const OCRHeaderBlock$inboundSchema: z.ZodType<OCRHeaderBlock, unknown>;
export declare function ocrHeaderBlockFromJSON(jsonString: string): SafeParseResult<OCRHeaderBlock, SDKValidationError>;
//# sourceMappingURL=ocrheaderblock.d.ts.map