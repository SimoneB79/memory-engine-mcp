import { trace, } from "@opentelemetry/api";
import { OTEL_SERVICE_NAME } from "./otel.js";
import { getRegisteredTracerProvider } from "./provider.js";
import { RedactingSpanExporter, resolveRedaction, } from "./redaction.js";
export const MISTRAL_SDK_TELEMETRY_ENV = "MISTRAL_SDK_TELEMETRY";
export const MISTRAL_TELEMETRY_BASE_URL = "https://api.mistral.ai";
export const MISTRAL_TELEMETRY_TRACES_PATH = "/telemetry/v1/traces";
export const MISTRAL_TELEMETRY_ENDPOINT = createTelemetryEndpoint(MISTRAL_TELEMETRY_BASE_URL);
export const MISTRAL_OTLP_TRACES_ENDPOINT_ENV = "MISTRAL_OTLP_TRACES_ENDPOINT";
export const TELEMETRY_PROVIDER_DEDICATED = "dedicated";
export const TELEMETRY_PROVIDER_GLOBAL = "global";
const DISABLED_VALUE = "false";
const PROVIDER_VALUES = [
    TELEMETRY_PROVIDER_DEDICATED,
    TELEMETRY_PROVIDER_GLOBAL,
];
export class TelemetryConfigurationError extends Error {
    constructor(message) {
        super(message);
        this.name = "TelemetryConfigurationError";
    }
}
export async function configureTelemetry(client, provider = TELEMETRY_PROVIDER_DEDICATED, options = {}) {
    const hook = getTracingHook(client);
    const redaction = options.redaction;
    if (typeof provider === "string") {
        const providerMode = resolveProviderMode(provider);
        if (providerMode === TELEMETRY_PROVIDER_GLOBAL) {
            warnRedactionIgnored(redaction, TELEMETRY_PROVIDER_GLOBAL);
            return useGlobalTracerProvider(hook, { replaceExisting: true });
        }
        return configureTelemetryForHook(hook, { baseURL: client._baseURL, options: client._options }, { telemetry: providerMode, replaceExisting: true, redaction });
    }
    warnRedactionIgnored(redaction, "custom");
    markTelemetryConfigurationChanged(hook);
    await attachCustomTracerProvider(hook, provider);
    return true;
}
/**
 * Redaction is applied only in dedicated provider mode, where the SDK owns the
 * exporter. In global/custom modes the application owns the export pipeline, so
 * the argument is ignored. Because redaction is on by default, warn (unless it
 * was explicitly disabled) so callers know their spans are not redacted here and
 * that they must wrap their own exporter with `RedactingSpanExporter`.
 */
function warnRedactionIgnored(redaction, mode) {
    if (redaction === false) {
        return;
    }
    warnLog("Telemetry redaction is only applied in 'dedicated' provider mode, where " +
        `the Mistral SDK owns the exporter. In '${mode}' mode the application ` +
        "owns the export pipeline; wrap your exporter with RedactingSpanExporter " +
        "to redact spans. Ignoring the redaction argument.");
}
export async function setTracerProvider(client, provider) {
    return configureTelemetry(client, provider);
}
/**
 * Flush the SDK-owned telemetry provider attached to `client` without shutting
 * it down or detaching it.
 *
 * This is a no-op when dedicated telemetry is not configured. In global/custom
 * provider modes the application owns the provider lifecycle. Rejections from
 * the SDK-owned provider's `forceFlush()` are propagated to the caller.
 */
export async function flushTelemetry(client) {
    const hook = getTracingHook(client);
    await hook._autoTelemetryProvider?.forceFlush?.();
}
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
export async function shutdownTelemetry(client) {
    const hook = getTracingHook(client);
    await shutdownTelemetryProvider(hook);
}
export function getTelemetryTracer(client, name, version, options) {
    const hook = getTracingHook(client);
    const providerMode = resolveMistralTelemetryEnv();
    return getClientTracerProvider(hook, providerMode === TELEMETRY_PROVIDER_GLOBAL).getTracer(name, version, options);
}
export async function configureTelemetryForHook(hook, context, options = {}) {
    const telemetryOverride = options.telemetry;
    const hasTelemetryOverride = telemetryOverride != null;
    const replaceExisting = options.replaceExisting === true;
    if (!hasTelemetryOverride && hasConfiguredAutoTelemetry(hook)) {
        return true;
    }
    if (!hasTelemetryOverride && hook._telemetryAutoDisabled) {
        return false;
    }
    const providerMode = hasTelemetryOverride
        ? resolveTelemetryMode(telemetryOverride)
        : resolveMistralTelemetryEnv();
    if (hook._telemetryInitialization !== undefined) {
        if (!replaceExisting && providerMode === TELEMETRY_PROVIDER_DEDICATED) {
            return hook._telemetryInitialization;
        }
        try {
            await hook._telemetryInitialization;
        }
        catch {
            // Allow explicit disable/global/replacement calls to proceed after a
            // failed in-flight auto-initialization.
        }
    }
    if (providerMode == null) {
        markTelemetryConfigurationChanged(hook);
        await shutdownTelemetryProvider(hook);
        markAutoTelemetryDisabled(hook);
        return false;
    }
    if (providerMode === TELEMETRY_PROVIDER_GLOBAL) {
        return useGlobalTracerProvider(hook, {
            replaceExisting: replaceExisting || hasTelemetryOverride,
        });
    }
    if (hook._autoTelemetryProvider !== undefined) {
        return true;
    }
    if (hook.tracerProvider !== undefined) {
        if (!replaceExisting) {
            return false;
        }
        hook.tracerProvider = undefined;
    }
    if (getRegisteredTracerProvider() !== undefined && !replaceExisting) {
        return false;
    }
    const configurationVersion = markTelemetryConfigurationChanged(hook);
    const initialization = initializeTelemetryProvider(hook, context, options, configurationVersion);
    hook._telemetryInitialization = initialization;
    try {
        return await initialization;
    }
    finally {
        if (hook._telemetryInitialization === initialization) {
            hook._telemetryInitialization = undefined;
        }
    }
}
async function initializeTelemetryProvider(hook, context, options, configurationVersion) {
    const createProvider = options.createTelemetryTracerProvider ?? _createTelemetryTracerProvider;
    const provider = await createProvider({
        apiKey: await resolveApiKey(context),
        baseURL: context.baseURL ?? context.options?.serverURL,
        redaction: options.redaction,
    });
    if (hook._telemetryConfigurationVersion !== configurationVersion) {
        await provider.shutdown?.();
        return false;
    }
    await attachTelemetryProvider(hook, provider);
    return true;
}
export async function _createTelemetryTracerProvider(options) {
    if (options.apiKey == null || options.apiKey === "") {
        throw new TelemetryConfigurationError("Mistral telemetry requires an API key. Pass apiKey to the client or set MISTRAL_API_KEY.");
    }
    const moduleLoader = options.moduleLoader ?? loadModule;
    let sdkTraceBase;
    let otlpExporterModule;
    let resourcesModule;
    try {
        [sdkTraceBase, otlpExporterModule, resourcesModule] = await Promise.all([
            moduleLoader("@opentelemetry/sdk-trace-base"),
            moduleLoader("@opentelemetry/exporter-trace-otlp-http"),
            moduleLoader("@opentelemetry/resources"),
        ]);
    }
    catch {
        throw new TelemetryConfigurationError("Mistral telemetry requires optional OpenTelemetry SDK/exporter dependencies. " +
            "Install @opentelemetry/sdk-trace-base, @opentelemetry/exporter-trace-otlp-http, " +
            "and @opentelemetry/resources with your package manager.");
    }
    const BasicTracerProvider = requireExportConstructor(sdkTraceBase, "BasicTracerProvider", "@opentelemetry/sdk-trace-base");
    const BatchSpanProcessor = requireExportConstructor(sdkTraceBase, "BatchSpanProcessor", "@opentelemetry/sdk-trace-base");
    const OTLPTraceExporter = requireExportConstructor(otlpExporterModule, "OTLPTraceExporter", "@opentelemetry/exporter-trace-otlp-http");
    const exporter = new OTLPTraceExporter({
        url: resolveMistralTelemetryEndpoint(options.baseURL),
        headers: { Authorization: asBearerToken(options.apiKey) },
    });
    const policy = resolveRedaction(options.redaction ?? true);
    const spanExporter = policy
        ? new RedactingSpanExporter(exporter, policy)
        : exporter;
    const spanProcessor = new BatchSpanProcessor(spanExporter);
    const resource = createResource(resourcesModule, {
        "service.name": OTEL_SERVICE_NAME,
    });
    const provider = new BasicTracerProvider({ resource });
    if (typeof provider.addSpanProcessor === "function") {
        provider.addSpanProcessor(spanProcessor);
        return provider;
    }
    return new BasicTracerProvider({
        resource,
        spanProcessors: [spanProcessor],
    });
}
function getTracingHook(client) {
    const hooks = client._options?.hooks;
    const beforeRequestHooks = hooks?.beforeRequestHooks;
    if (!Array.isArray(beforeRequestHooks)) {
        throw new Error("Cannot configure telemetry: SDK hooks not initialised.");
    }
    const hook = beforeRequestHooks.find(isTelemetryCapableTracingHook);
    if (hook === undefined) {
        throw new Error("Cannot configure telemetry: TracingHook not found in the client's hooks.");
    }
    return hook;
}
function isTelemetryCapableTracingHook(hook) {
    return Boolean(hook &&
        typeof hook === "object" &&
        hook._mistralTracingHook === true);
}
function getClientTracerProvider(hook, usesGlobalProvider) {
    if (hook.tracerProvider !== undefined) {
        return hook.tracerProvider;
    }
    if (!usesGlobalProvider && !hook._telemetryUseGlobalProvider) {
        const registeredProvider = getRegisteredTracerProvider();
        if (registeredProvider !== undefined) {
            return registeredProvider;
        }
    }
    return trace.getTracerProvider();
}
function resolveTelemetryMode(value) {
    if (typeof value === "boolean") {
        return value ? TELEMETRY_PROVIDER_DEDICATED : null;
    }
    const normalized = value.trim().toLowerCase();
    switch (normalized) {
        case TELEMETRY_PROVIDER_DEDICATED:
            return TELEMETRY_PROVIDER_DEDICATED;
        case TELEMETRY_PROVIDER_GLOBAL:
            return TELEMETRY_PROVIDER_GLOBAL;
        case DISABLED_VALUE:
            return null;
    }
    throw new TelemetryConfigurationError(`Invalid telemetry setting ${JSON.stringify(value)}. Expected one of: dedicated, false, global.`);
}
function resolveProviderMode(value) {
    const normalized = value.trim().toLowerCase();
    switch (normalized) {
        case TELEMETRY_PROVIDER_DEDICATED:
            return TELEMETRY_PROVIDER_DEDICATED;
        case TELEMETRY_PROVIDER_GLOBAL:
            return TELEMETRY_PROVIDER_GLOBAL;
    }
    throw new TelemetryConfigurationError(`Invalid telemetry provider ${JSON.stringify(value)}. Expected one of: dedicated, global.`);
}
function resolveMistralTelemetryEnv() {
    const envValue = readEnv(MISTRAL_SDK_TELEMETRY_ENV);
    if (envValue == null || envValue === "") {
        return null;
    }
    try {
        return resolveTelemetryMode(envValue);
    }
    catch {
        throw new TelemetryConfigurationError(`Invalid ${MISTRAL_SDK_TELEMETRY_ENV}=${JSON.stringify(envValue)}. ` +
            "Expected one of: dedicated, false, global.");
    }
}
async function resolveApiKey(context) {
    const authHeader = context.resolvedSecurity?.headers?.["Authorization"];
    if (authHeader) {
        return authHeader;
    }
    const apiKey = await resolveApiKeySource(context.options?.apiKey);
    if (apiKey) {
        return apiKey;
    }
    const envApiKey = readEnv("MISTRAL_API_KEY");
    if (envApiKey) {
        return envApiKey;
    }
    throw new TelemetryConfigurationError("Mistral telemetry requires an API key. Pass apiKey to the client or set MISTRAL_API_KEY.");
}
async function resolveApiKeySource(source) {
    if (source == null) {
        return undefined;
    }
    return typeof source === "function" ? source() : source;
}
function resolveMistralTelemetryEndpoint(baseURL) {
    const endpoint = readEnv(MISTRAL_OTLP_TRACES_ENDPOINT_ENV)?.trim();
    if (endpoint) {
        return endpoint;
    }
    if (baseURL != null && `${baseURL}`.trim() !== "") {
        return createTelemetryEndpoint(baseURL);
    }
    return MISTRAL_TELEMETRY_ENDPOINT;
}
function createTelemetryEndpoint(baseURL) {
    return new URL(MISTRAL_TELEMETRY_TRACES_PATH, baseURL).toString();
}
async function attachTelemetryProvider(hook, provider) {
    await shutdownTelemetryProvider(hook);
    hook.tracerProvider = provider;
    hook._autoTelemetryProvider = provider;
    hook._telemetryUseGlobalProvider = false;
    hook._telemetryAutoDisabled = false;
}
function hasConfiguredAutoTelemetry(hook) {
    return hook._autoTelemetryProvider !== undefined || hook._telemetryUseGlobalProvider;
}
function markAutoTelemetryDisabled(hook) {
    hook._telemetryUseGlobalProvider = false;
    hook._telemetryAutoDisabled = true;
}
function markTelemetryConfigurationChanged(hook) {
    hook._telemetryConfigurationVersion += 1;
    return hook._telemetryConfigurationVersion;
}
async function attachCustomTracerProvider(hook, provider) {
    await shutdownTelemetryProvider(hook);
    hook.tracerProvider = provider;
    hook._telemetryUseGlobalProvider = false;
    hook._telemetryAutoDisabled = false;
}
async function useGlobalTracerProvider(hook, options) {
    if (hook.tracerProvider !== undefined &&
        hook._autoTelemetryProvider === undefined &&
        !options.replaceExisting) {
        return false;
    }
    markTelemetryConfigurationChanged(hook);
    await shutdownTelemetryProvider(hook);
    hook.tracerProvider = undefined;
    hook._telemetryUseGlobalProvider = true;
    hook._telemetryAutoDisabled = true;
    return true;
}
async function shutdownTelemetryProvider(hook) {
    const provider = hook._autoTelemetryProvider;
    if (provider === undefined) {
        return;
    }
    hook._autoTelemetryProvider = undefined;
    if (hook.tracerProvider === provider) {
        hook.tracerProvider = undefined;
    }
    await provider.shutdown?.();
}
function asBearerToken(apiKey) {
    return apiKey.toLowerCase().startsWith("bearer ") ? apiKey : `Bearer ${apiKey}`;
}
function readEnv(name) {
    try {
        const denoEnv = globalThis
            .Deno?.env;
        const denoValue = denoEnv?.get?.(name);
        if (denoValue !== undefined) {
            return denoValue;
        }
    }
    catch {
        // Ignore unavailable Deno permissions.
    }
    try {
        return globalThis
            .process?.env?.[name];
    }
    catch {
        return undefined;
    }
}
function warnLog(message) {
    try {
        globalThis
            .console?.warn?.(message);
    }
    catch {
        // Ignore logging failures.
    }
}
async function loadModule(specifier) {
    // Optional OpenTelemetry peer dependencies are loaded lazily at runtime. The
    // specifier is dynamic, so bundlers cannot (and must not) statically resolve
    // it — the magic comments keep it as a runtime import for webpack, Turbopack
    // and Vite instead of failing the build with "Can't resolve <dynamic>".
    return await import(
    /* webpackIgnore: true */ /* turbopackIgnore: true */ /* @vite-ignore */ specifier);
}
function requireExportConstructor(moduleExports, exportName, moduleName) {
    const value = moduleExports[exportName];
    if (typeof value !== "function") {
        throw new TelemetryConfigurationError(`Mistral telemetry expected ${moduleName} to export ${exportName}.`);
    }
    return value;
}
function createResource(moduleExports, attributes) {
    const resourceFromAttributes = moduleExports["resourceFromAttributes"];
    if (typeof resourceFromAttributes === "function") {
        return resourceFromAttributes(attributes);
    }
    const Resource = moduleExports["Resource"];
    if (typeof Resource !== "function") {
        return { attributes };
    }
    const resource = new Resource(attributes);
    const defaultResource = Resource.default?.();
    return defaultResource?.merge?.(resource) ?? resource;
}
//# sourceMappingURL=telemetry.js.map