/**
 * Binding rules injection — v4.7.0
 * Injects active binding rules as high-priority context before every prompt build.
 * Hook: before_prompt_build -> { prependContext } (doc: /plugins/hooks/prompt-and-session).
 */
export declare function registerRulesHook(api: any, me: any, logger?: any): void;
