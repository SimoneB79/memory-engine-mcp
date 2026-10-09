import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { OCRBlockConfidenceScores } from "./ocrblockconfidencescores.js";
export type OCRTableBlock = {
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
    type: "table";
    /**
     * References the corresponding entry in OCRPageObject.tables, when tables are extracted
     */
    tableId?: string | null | undefined;
};
/** @internal */
export declare const OCRTableBlock$inboundSchema: z.ZodType<OCRTableBlock, unknown>;
export declare function ocrTableBlockFromJSON(jsonString: string): SafeParseResult<OCRTableBlock, SDKValidationError>;
//# sourceMappingURL=ocrtableblock.d.ts.map