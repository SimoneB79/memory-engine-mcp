import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { GitCommitAuthor } from "./gitcommitauthor.js";
export type GitCommitMetadata = {
    sha: string;
    message?: string | null | undefined;
    author?: GitCommitAuthor | null | undefined;
    htmlUrl?: string | null | undefined;
};
/** @internal */
export declare const GitCommitMetadata$inboundSchema: z.ZodType<GitCommitMetadata, unknown>;
export declare function gitCommitMetadataFromJSON(jsonString: string): SafeParseResult<GitCommitMetadata, SDKValidationError>;
//# sourceMappingURL=gitcommitmetadata.d.ts.map