import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { OCRBlockConfidenceScores } from "./ocrblockconfidencescores.js";
export type OCREquationBlock = {
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
    type: "equation";
};
/** @internal */
export declare const OCREquationBlock$inboundSchema: z.ZodType<OCREquationBlock, unknown>;
export declare function ocrEquationBlockFromJSON(jsonString: string): SafeParseResult<OCREquationBlock, SDKValidationError>;
//# sourceMappingURL=ocrequationblock.d.ts.map