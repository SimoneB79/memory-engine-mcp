import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { OCRBlockConfidenceScores } from "./ocrblockconfidencescores.js";
export type OCRCodeBlock = {
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
    type: "code";
};
/** @internal */
export declare const OCRCodeBlock$inboundSchema: z.ZodType<OCRCodeBlock, unknown>;
export declare function ocrCodeBlockFromJSON(jsonString: string): SafeParseResult<OCRCodeBlock, SDKValidationError>;
//# sourceMappingURL=ocrcodeblock.d.ts.map