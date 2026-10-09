import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { OCRBlockConfidenceScores } from "./ocrblockconfidencescores.js";
export type OCRAsideTextBlock = {
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
    type: "aside_text";
};
/** @internal */
export declare const OCRAsideTextBlock$inboundSchema: z.ZodType<OCRAsideTextBlock, unknown>;
export declare function ocrAsideTextBlockFromJSON(jsonString: string): SafeParseResult<OCRAsideTextBlock, SDKValidationError>;
//# sourceMappingURL=ocrasidetextblock.d.ts.map