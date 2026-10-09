import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { Agent } from "./agent.js";
export type AgentListPage = {
    object: "list";
    data: Array<Agent>;
    nextPageToken?: string | null | undefined;
};
/** @internal */
export declare const AgentListPage$inboundSchema: z.ZodType<AgentListPage, unknown>;
export declare function agentListPageFromJSON(jsonString: string): SafeParseResult<AgentListPage, SDKValidationError>;
//# sourceMappingURL=agentlistpage.d.ts.map