import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { OCRBlockConfidenceScores } from "./ocrblockconfidencescores.js";
export type OCRTextBlock = {
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
    type: "text";
};
/** @internal */
export declare const OCRTextBlock$inboundSchema: z.ZodType<OCRTextBlock, unknown>;
export declare function ocrTextBlockFromJSON(jsonString: string): SafeParseResult<OCRTextBlock, SDKValidationError>;
//# sourceMappingURL=ocrtextblock.d.ts.map