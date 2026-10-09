import { ClientSDK, RequestOptions } from "../lib/sdks.js";
import * as components from "../models/components/index.js";
import * as operations from "../models/operations/index.js";
import { PageIterator } from "../types/operations.js";
export declare class Prompts extends ClientSDK {
    /**
     * ListPrompts
     */
    list(request?: operations.PromptsListRequest | undefined, options?: RequestOptions): Promise<PageIterator<operations.PromptsListResponse, {
        cursor: string;
    }>>;
    /**
     * CreatePrompt
     */
    create(request: components.CreatePromptRequest, options?: RequestOptions): Promise<components.Prompt>;
    /**
     * GetPrompt
     */
    get(request: operations.PromptsGetRequest, options?: RequestOptions): Promise<components.Prompt>;
    /**
     * DeletePrompt
     */
    delete(request: operations.PromptsDeleteRequest, options?: RequestOptions): Promise<components.DeletePromptResponse>;
    /**
     * UpdatePrompt
     */
    updateMetadata(promptId: string, requestBody: operations.UpdatePromptRequest, options?: RequestOptions): Promise<components.Prompt>;
    /**
     * ListPromptVersions
     */
    listVersions(request: operations.PromptsListVersionsRequest, options?: RequestOptions): Promise<components.ListPromptVersionsResponse>;
    /**
     * CreatePromptVersion
     */
    createVersion(promptId: string, requestBody: operations.CreatePromptVersionRequest, options?: RequestOptions): Promise<components.CreatePromptVersionResponse>;
    /**
     * GetPromptVersion
     */
    getVersion(request: operations.PromptsGetVersionRequest, options?: RequestOptions): Promise<components.Prompt>;
    /**
     * UpdatePromptVersionMetadata
     */
    updateVersionMetadata(promptId: string, version: number, requestBody: operations.UpdatePromptVersionRequest, options?: RequestOptions): Promise<components.Prompt>;
}
//# sourceMappingURL=prompts.d.ts.map