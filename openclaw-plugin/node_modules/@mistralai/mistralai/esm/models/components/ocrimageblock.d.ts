import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { OCRBlockConfidenceScores } from "./ocrblockconfidencescores.js";
export type OCRImageBlock = {
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
    type: "image";
    /**
     * References the corresponding entry in OCRPageObject.images
     */
    imageId: string;
};
/** @internal */
export declare const OCRImageBlock$inboundSchema: z.ZodType<OCRImageBlock, unknown>;
export declare function ocrImageBlockFromJSON(jsonString: string): SafeParseResult<OCRImageBlock, SDKValidationError>;
//# sourceMappingURL=ocrimageblock.d.ts.map