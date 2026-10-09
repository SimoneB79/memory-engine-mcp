import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { PromptDefinition } from "./promptdefinition.js";
import { RegistrySharingScope } from "./registrysharingscope.js";
export type Prompt = {
    id?: string | undefined;
    /**
     * Stable object name.
     */
    name?: string | undefined;
    /**
     * Versioned prompt content.
     */
    definition?: PromptDefinition | undefined;
    version?: number | undefined;
    /**
     * Notes for this version.
     */
    notes?: string | undefined;
    /**
     * Aliases pointing to this version.
     */
    aliases?: Array<string> | undefined;
    sharingScope?: RegistrySharingScope | undefined;
    /**
     * RFC 3339 timestamp.
     */
    createdAt?: Date | undefined;
    /**
     * RFC 3339 timestamp.
     */
    updatedAt?: Date | undefined;
    /**
     * Latest version number.
     */
    latestVersion?: number | undefined;
    /**
     * Display title.
     */
    title?: string | undefined;
    /**
     * Display description.
     */
    description?: string | undefined;
    createdBy?: string | undefined;
    /**
     * RFC 3339 timestamp.
     */
    versionCreatedAt?: Date | undefined;
};
/** @internal */
export declare const Prompt$inboundSchema: z.ZodType<Prompt, unknown>;
export declare function promptFromJSON(jsonString: string): SafeParseResult<Prompt, SDKValidationError>;
//# sourceMappingURL=prompt.d.ts.map