import { type Tracer, type TracerOptions, type TracerProvider } from "@opentelemetry/api";
import type { SDKOptions } from "../../lib/config.js";
import type { SecurityState } from "../../lib/security.js";
import { type RedactionSetting } from "./redaction.js";
export declare const MISTRAL_SDK_TELEMETRY_ENV = "MISTRAL_SDK_TELEMETRY";
export declare const MISTRAL_TELEMETRY_BASE_URL = "https://api.mistral.ai";
export declare const MISTRAL_TELEMETRY_TRACES_PATH = "/telemetry/v1/traces";
export declare const MISTRAL_TELEMETRY_ENDPOINT: string;
export declare const MISTRAL_OTLP_TRACES_ENDPOINT_ENV = "MISTRAL_OTLP_TRACES_ENDPOINT";
export declare const TELEMETRY_PROVIDER_DEDICATED = "dedicated";
export declare const TELEMETRY_PROVIDER_GLOBAL = "global";
declare const PROVIDER_VALUES: readonly ["dedicated", "global"];
export type TelemetryProviderMode = typeof PROVIDER_VALUES[number];
export type TelemetrySetting = boolean | string | null | undefined;
export type TelemetryProvider = TelemetryProviderMode | TracerProvider;
export type ManagedTelemetryTracerProvider = TracerProvider & {
    shutdown?: () => void | Promise<void>;
    forceFlush?: () => void | Promise<void>;
};
export type TelemetryCapableTracingHook = {
    readonly _mistralTracingHook: true;
    tracerProvider: TracerProvider | undefined;
    _autoTelemetryProvider: ManagedTelemetryTracerProvider | undefined;
    _telemetryInitialization: Promise<boolean> | undefined;
    _telemetryConfigurationVersion: number;
    _telemetryAutoDisabled: boolean;
    _telemetryUseGlobalProvider: boolean;
};
type TelemetryContext = {
    baseURL?: string | URL | null | undefined;
    options?: SDKOptions | undefined;
    resolvedSecurity?: SecurityState | null | undefined;
};
type ClientWithHooks = {
    _baseURL?: string | URL | null | undefined;
    _options?: (SDKOptions & {
        hooks?: {
            beforeRequestHooks?: unknown[];
        };
    }) | undefined;
};
export type ModuleLoader = (specifier: string) => Promise<Record<string, unknown>>;
export type CreateTelemetryTracerProviderOptions = {
    apiKey: string | null | undefined;
    baseURL?: string | URL | null | undefined;
    moduleLoader?: ModuleLoader | undefined;
    redaction?: RedactionSetting | undefined;
};
type CreateTelemetryTracerProvider = (options: CreateTelemetryTracerProviderOptions) => Promise<ManagedTelemetryTracerProvider>;
type ConfigureTelemetryForHookOptions = {
    telemetry?: TelemetrySetting;
    replaceExisting?: boolean | undefined;
    createTelemetryTracerProvider?: CreateTelemetryTracerProvider;
    redaction?: RedactionSetting | undefined;
};
export type ConfigureTelemetryOptions = {
    redaction?: RedactionSetting | undefined;
};
export declare class TelemetryConfigurationError extends Error {
    constructor(message: string);
}
export declare function configureTelemetry(client: ClientWithHooks, provider?: TelemetryProvider, options?: ConfigureTelemetryOptions): Promise<boolean>;
export declare function setTracerProvider(client: ClientWithHooks, provider: TracerProvider): Promise<boolean>;
/**
 * Flush the SDK-owned telemetry provider attached to `client` without shutting
 * it down or detaching it.
 *
 * This is a no-op when dedicated telemetry is not configured. In global/custom
 * provider modes the application owns the provider lifecycle. Rejections from
 * the SDK-owned provider's `forceFlush()` are propagated to the caller.
 */
export declare function flushTelemetry(client: ClientWithHooks): Promise<void>;
/**
 * Flush and shut down the SDK-owned telemetry provider attached to `client`.
 *
 * In dedicated mode the SDK owns a BatchSpanProcessor that buffers spans and
 * only exports them on a timer or on shutdown. Node has no reliable async exit
 * hook to flush automatically (unlike Python's finalizer), so short-lived
 * programs must call this before exiting or their buffered spans are dropped.
 * In global/custom provider modes the application owns the export pipeline, so
 * this is a no-op.
 */
export declare function shutdownTelemetry(client: ClientWithHooks): Promise<void>;
export declare function getTelemetryTracer(client: ClientWithHooks, name: string, version?: string, options?: TracerOptions): Tracer;
export declare function configureTelemetryForHook(hook: TelemetryCapableTracingHook, context: TelemetryContext, options?: ConfigureTelemetryForHookOptions): Promise<boolean>;
export declare function _createTelemetryTracerProvider(options: CreateTelemetryTracerProviderOptions): Promise<ManagedTelemetryTracerProvider>;
export {};
//# sourceMappingURL=telemetry.d.ts.map