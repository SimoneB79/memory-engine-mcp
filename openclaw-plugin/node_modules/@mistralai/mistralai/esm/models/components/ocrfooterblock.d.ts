import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { OCRBlockConfidenceScores } from "./ocrblockconfidencescores.js";
export type OCRFooterBlock = {
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
    type: "footer";
};
/** @internal */
export declare const OCRFooterBlock$inboundSchema: z.ZodType<OCRFooterBlock, unknown>;
export declare function ocrFooterBlockFromJSON(jsonString: string): SafeParseResult<OCRFooterBlock, SDKValidationError>;
//# sourceMappingURL=ocrfooterblock.d.ts.map