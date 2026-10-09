import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type GitCommitAuthor = {
    name?: string | null | undefined;
    username?: string | null | undefined;
    htmlUrl?: string | null | undefined;
};
/** @internal */
export declare const GitCommitAuthor$inboundSchema: z.ZodType<GitCommitAuthor, unknown>;
export declare function gitCommitAuthorFromJSON(jsonString: string): SafeParseResult<GitCommitAuthor, SDKValidationError>;
//# sourceMappingURL=gitcommitauthor.d.ts.map