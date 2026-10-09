import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { OCRConfidenceScore } from "./ocrconfidencescore.js";
/**
 * Confidence scores for an OCR page at various granularities.
 *
 * @remarks
 *
 * Note on page-level stats:
 * - For 'page' and 'block' granularity: average/minimum are computed from per-token
 *   exp(logprob). Neither ``word_confidence_scores`` nor ``token_scores`` is populated.
 *   Per-block scores are attached to response blocks separately for 'block' granularity.
 * - For 'word' granularity: average/minimum are computed from per-word confidence, where
 *   each word's confidence is exp(mean(token_logprobs)) — a geometric mean over the
 *   word's subword tokens. ``word_confidence_scores`` is populated.
 * - For 'token' granularity (internal): average/minimum are computed from
 *   ``token_scores``; ``token_scores`` is populated.
 */
export type OCRPageConfidenceScores = {
    /**
     * Word-level confidence scores (populated only for 'word' granularity)
     */
    wordConfidenceScores?: Array<OCRConfidenceScore> | undefined;
    /**
     * Average confidence score for the page
     */
    averagePageConfidenceScore: number;
    /**
     * Minimum confidence score for the page
     */
    minimumPageConfidenceScore: number;
};
/** @internal */
export declare const OCRPageConfidenceScores$inboundSchema: z.ZodType<OCRPageConfidenceScores, unknown>;
export declare function ocrPageConfidenceScoresFromJSON(jsonString: string): SafeParseResult<OCRPageConfidenceScores, SDKValidationError>;
//# sourceMappingURL=ocrpageconfidencescores.d.ts.map