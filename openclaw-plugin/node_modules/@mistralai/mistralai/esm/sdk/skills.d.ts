import { ClientSDK, RequestOptions } from "../lib/sdks.js";
import * as components from "../models/components/index.js";
import * as operations from "../models/operations/index.js";
import { PageIterator } from "../types/operations.js";
export declare class Skills extends ClientSDK {
    /**
     * ListSkills
     */
    list(request?: operations.SkillsListRequest | undefined, options?: RequestOptions): Promise<PageIterator<operations.SkillsListResponse, {
        cursor: string;
    }>>;
    /**
     * CreateSkill
     */
    create(request: components.CreateSkillRequest, options?: RequestOptions): Promise<components.Skill>;
    /**
     * GetSkill
     */
    get(request: operations.SkillsGetRequest, options?: RequestOptions): Promise<components.Skill>;
    /**
     * DeleteSkill
     */
    delete(request: operations.SkillsDeleteRequest, options?: RequestOptions): Promise<components.DeleteSkillResponse>;
    /**
     * UpdateSkill
     */
    updateMetadata(skillId: string, requestBody: operations.UpdateSkillRequest, options?: RequestOptions): Promise<components.Skill>;
    /**
     * ListSkillVersions
     */
    listVersions(request: operations.SkillsListVersionsRequest, options?: RequestOptions): Promise<components.ListSkillVersionsResponse>;
    /**
     * CreateSkillVersion
     */
    createVersion(skillId: string, requestBody: operations.CreateSkillVersionRequest, options?: RequestOptions): Promise<components.CreateSkillVersionResponse>;
    /**
     * GetSkillVersion
     */
    getVersion(request: operations.SkillsGetVersionRequest, options?: RequestOptions): Promise<components.Skill>;
    /**
     * UpdateSkillVersionMetadata
     */
    updateVersionMetadata(skillId: string, version: number, requestBody: operations.UpdateSkillVersionRequest, options?: RequestOptions): Promise<components.Skill>;
}
//# sourceMappingURL=skills.d.ts.map