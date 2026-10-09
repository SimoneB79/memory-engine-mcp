import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type SkillAssetContentTextContent = {
    textContent: string;
    isExecutable?: boolean | undefined;
};
export type RawContent = {
    rawContent: string;
    isExecutable?: boolean | undefined;
};
export type SkillAssetContent = RawContent | SkillAssetContentTextContent;
/** @internal */
export declare const SkillAssetContentTextContent$inboundSchema: z.ZodType<SkillAssetContentTextContent, unknown>;
/** @internal */
export type SkillAssetContentTextContent$Outbound = {
    textContent: string;
    isExecutable?: boolean | undefined;
};
/** @internal */
export declare const SkillAssetContentTextContent$outboundSchema: z.ZodType<SkillAssetContentTextContent$Outbound, SkillAssetContentTextContent>;
export declare function skillAssetContentTextContentToJSON(skillAssetContentTextContent: SkillAssetContentTextContent): string;
export declare function skillAssetContentTextContentFromJSON(jsonString: string): SafeParseResult<SkillAssetContentTextContent, SDKValidationError>;
/** @internal */
export declare const RawContent$inboundSchema: z.ZodType<RawContent, unknown>;
/** @internal */
export type RawContent$Outbound = {
    rawContent: string;
    isExecutable?: boolean | undefined;
};
/** @internal */
export declare const RawContent$outboundSchema: z.ZodType<RawContent$Outbound, RawContent>;
export declare function rawContentToJSON(rawContent: RawContent): string;
export declare function rawContentFromJSON(jsonString: string): SafeParseResult<RawContent, SDKValidationError>;
/** @internal */
export declare const SkillAssetContent$inboundSchema: z.ZodType<SkillAssetContent, unknown>;
/** @internal */
export type SkillAssetContent$Outbound = RawContent$Outbound | SkillAssetContentTextContent$Outbound;
/** @internal */
export declare const SkillAssetContent$outboundSchema: z.ZodType<SkillAssetContent$Outbound, SkillAssetContent>;
export declare function skillAssetContentToJSON(skillAssetContent: SkillAssetContent): string;
export declare function skillAssetContentFromJSON(jsonString: string): SafeParseResult<SkillAssetContent, SDKValidationError>;
//# sourceMappingURL=skillassetcontent.d.ts.map