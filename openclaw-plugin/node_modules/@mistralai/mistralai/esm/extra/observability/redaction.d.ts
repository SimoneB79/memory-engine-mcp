/**
 * Client-side redaction of telemetry spans before they are exported.
 *
 * This module provides a configurable, export-time masking layer for
 * OpenTelemetry spans so PII/secrets never leave the client. It is the primary,
 * reusable primitive: any OTEL application can wrap the exporter it owns with
 * `RedactingSpanExporter`, and the Mistral SDK installs it automatically in
 * dedicated telemetry mode (see `configureTelemetry`). Several redaction
 * policies are implemented in `redaction-policies.ts`.
 *
 * The module stays importable without the optional OpenTelemetry SDK: it only
 * manipulates plain objects and delegates the actual export to the wrapped
 * exporter. Structural types are used instead of importing
 * `@opentelemetry/sdk-trace-base` so no extra dependency is required to import.
 */
import type { Attributes } from "@opentelemetry/api";
import { RedactionPolicy, type AttributeMaskCallback } from "./redaction-policies.js";
/**
 * Redaction setting accepted by `configureTelemetry` and the exporter:
 * - `true`: the default (regex) policy
 * - `false`: redaction disabled
 * - a `RedactionPolicy` instance
 * - a `(key, value) => value | undefined` callback
 */
export type RedactionSetting = boolean | RedactionPolicy | AttributeMaskCallback;
type SpanStatusLike = {
    code: number;
    message?: string;
};
type TimedEventLike = {
    name: string;
    attributes?: Attributes;
};
type LinkLike = {
    attributes?: Attributes;
};
type ResourceLike = {
    attributes: Attributes;
};
/**
 * Minimal structural view of an OpenTelemetry `ReadableSpan`. Only the redacted
 * surface is described; every other field is preserved via the prototype chain.
 */
export interface ReadableSpanLike {
    name: string;
    attributes: Attributes;
    events: TimedEventLike[];
    links: LinkLike[];
    resource: ResourceLike;
    status: SpanStatusLike;
    spanContext(): unknown;
}
export type ExportResultLike = {
    code: number;
    error?: Error;
};
/** Minimal structural view of an OpenTelemetry `SpanExporter`. */
export interface SpanExporterLike {
    export(spans: ReadableSpanLike[], resultCallback: (result: ExportResultLike) => void): void;
    shutdown(): Promise<void>;
    forceFlush?(): Promise<void>;
}
/**
 * Resolve a redaction setting into a policy, or `undefined` to disable
 * redaction. `true` yields the default policy, `false` disables redaction
 * entirely, and a policy or `(key, value) => value | undefined` callback is used
 * as-is.
 */
export declare function resolveRedaction(redaction: RedactionSetting): RedactionPolicy | undefined;
/**
 * Wrap any `SpanExporter` to redact spans before delegating export.
 *
 * @example
 * ```ts
 * const exporter = new RedactingSpanExporter(new OTLPTraceExporter());
 * provider.addSpanProcessor(new BatchSpanProcessor(exporter));
 * ```
 */
export declare class RedactingSpanExporter implements SpanExporterLike {
    private readonly exporter;
    private readonly policy;
    constructor(exporter: SpanExporterLike, policy?: RedactionPolicy | AttributeMaskCallback);
    export(spans: ReadableSpanLike[], resultCallback: (result: ExportResultLike) => void): void;
    shutdown(): Promise<void>;
    forceFlush(): Promise<void>;
}
/**
 * Return a redacted clone of a span: same prototype, every own field copied, so
 * untouched fields survive exporters that spread or enumerate it ({...span},
 * Object.keys). Only the sensitive surface is overridden.
 */
export declare function redactSpan(span: ReadableSpanLike, policy: RedactionPolicy): ReadableSpanLike;
export {};
//# sourceMappingURL=redaction.d.ts.map