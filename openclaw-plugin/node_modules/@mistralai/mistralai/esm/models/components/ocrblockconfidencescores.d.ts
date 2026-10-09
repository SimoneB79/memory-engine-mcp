import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
/**
 * Per-block confidence scores, computed per-word from model logprobs.
 *
 * @remarks
 *
 * All fields ``None`` when the block couldn't be scored.
 * Individual fields ``None`` when that signal is absent — e.g. an image-only block has
 * no caption, so content scores are ``None``.
 */
export type OCRBlockConfidenceScores = {
    /**
     * Average confidence over the block's content (caption) tokens. None when the block has no textual content (e.g. image-only entry).
     */
    averageContentConfidenceScore?: number | null | undefined;
    /**
     * Minimum per-word content confidence in the block. None when the block has no textual content.
     */
    minimumContentConfidenceScore?: number | null | undefined;
    /**
     * Confidence in the block type (e.g. 'text', 'title', 'table'). None when the entry had no block type or the block type span could not be located.
     */
    blockTypeConfidenceScore?: number | null | undefined;
};
/** @internal */
export declare const OCRBlockConfidenceScores$inboundSchema: z.ZodType<OCRBlockConfidenceScores, unknown>;
export declare function ocrBlockConfidenceScoresFromJSON(jsonString: string): SafeParseResult<OCRBlockConfidenceScores, SDKValidationError>;
//# sourceMappingURL=ocrblockconfidencescores.d.ts.map