import * as z from "zod/v4";
import * as discriminatedUnionTypes from "../../types/discriminatedUnion.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { OCRAsideTextBlock } from "./ocrasidetextblock.js";
import { OCRCaptionBlock } from "./ocrcaptionblock.js";
import { OCRCodeBlock } from "./ocrcodeblock.js";
import { OCREquationBlock } from "./ocrequationblock.js";
import { OCRFooterBlock } from "./ocrfooterblock.js";
import { OCRHeaderBlock } from "./ocrheaderblock.js";
import { OCRImageBlock } from "./ocrimageblock.js";
import { OCRImageObject } from "./ocrimageobject.js";
import { OCRListBlock } from "./ocrlistblock.js";
import { OCRPageConfidenceScores } from "./ocrpageconfidencescores.js";
import { OCRPageDimensions } from "./ocrpagedimensions.js";
import { OCRReferencesBlock } from "./ocrreferencesblock.js";
import { OCRSignatureBlock } from "./ocrsignatureblock.js";
import { OCRTableBlock } from "./ocrtableblock.js";
import { OCRTableObject } from "./ocrtableobject.js";
import { OCRTextBlock } from "./ocrtextblock.js";
import { OCRTitleBlock } from "./ocrtitleblock.js";
export type Block = OCRAsideTextBlock | OCRCaptionBlock | OCRCodeBlock | OCREquationBlock | OCRFooterBlock | OCRHeaderBlock | OCRImageBlock | OCRListBlock | OCRReferencesBlock | OCRSignatureBlock | OCRTableBlock | OCRTextBlock | OCRTitleBlock | discriminatedUnionTypes.Unknown<"type">;
export type OCRPageObject = {
    /**
     * The page index in a pdf document starting from 0
     */
    index: number;
    /**
     * The markdown string response of the page
     */
    markdown: string;
    /**
     * List of all extracted images in the page
     */
    images: Array<OCRImageObject>;
    /**
     * List of all extracted tables in the page
     */
    tables?: Array<OCRTableObject> | undefined;
    /**
     * List of all hyperlinks in the page
     */
    hyperlinks?: Array<string> | undefined;
    /**
     * Header of the page
     */
    header?: string | null | undefined;
    /**
     * Footer of the page
     */
    footer?: string | null | undefined;
    /**
     * The dimensions of the PDF Page's screenshot image
     */
    dimensions: OCRPageDimensions | null;
    /**
     * Confidence scores for the OCR page (populated when confidence_scores_granularity is set)
     */
    confidenceScores?: OCRPageConfidenceScores | null | undefined;
    /**
     * Paragraph-level bounding boxes for all content blocks in reading order (populated when include_blocks is True)
     */
    blocks?: Array<OCRAsideTextBlock | OCRCaptionBlock | OCRCodeBlock | OCREquationBlock | OCRFooterBlock | OCRHeaderBlock | OCRImageBlock | OCRListBlock | OCRReferencesBlock | OCRSignatureBlock | OCRTableBlock | OCRTextBlock | OCRTitleBlock | discriminatedUnionTypes.Unknown<"type">> | null | undefined;
};
/** @internal */
export declare const Block$inboundSchema: z.ZodType<Block, unknown>;
export declare function blockFromJSON(jsonString: string): SafeParseResult<Block, SDKValidationError>;
/** @internal */
export declare const OCRPageObject$inboundSchema: z.ZodType<OCRPageObject, unknown>;
export declare function ocrPageObjectFromJSON(jsonString: string): SafeParseResult<OCRPageObject, SDKValidationError>;
//# sourceMappingURL=ocrpageobject.d.ts.map