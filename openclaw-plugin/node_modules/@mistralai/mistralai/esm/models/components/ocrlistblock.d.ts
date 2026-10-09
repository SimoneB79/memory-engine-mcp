import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { OCRBlockConfidenceScores } from "./ocrblockconfidencescores.js";
export type OCRListBlock = {
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
    type: "list";
};
/** @internal */
export declare const OCRListBlock$inboundSchema: z.ZodType<OCRListBlock, unknown>;
export declare function ocrListBlockFromJSON(jsonString: string): SafeParseResult<OCRListBlock, SDKValidationError>;
//# sourceMappingURL=ocrlistblock.d.ts.map