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
import { CallbackRedactionPolicy, defaultRedactionPolicy, RedactionPolicy, } from "./redaction-policies.js";
/**
 * Resolve a redaction setting into a policy, or `undefined` to disable
 * redaction. `true` yields the default policy, `false` disables redaction
 * entirely, and a policy or `(key, value) => value | undefined` callback is used
 * as-is.
 */
export function resolveRedaction(redaction) {
    if (redaction === false) {
        return undefined;
    }
    if (redaction === true) {
        return defaultRedactionPolicy();
    }
    return resolvePolicy(redaction);
}
function resolvePolicy(policy) {
    if (policy == null) {
        return defaultRedactionPolicy();
    }
    if (policy instanceof RedactionPolicy) {
        return policy;
    }
    if (typeof policy === "function") {
        return new CallbackRedactionPolicy(policy);
    }
    throw new TypeError("redaction policy must be a RedactionPolicy, a callable, or undefined; " +
        `got ${typeof policy}.`);
}
/**
 * Wrap any `SpanExporter` to redact spans before delegating export.
 *
 * @example
 * ```ts
 * const exporter = new RedactingSpanExporter(new OTLPTraceExporter());
 * provider.addSpanProcessor(new BatchSpanProcessor(exporter));
 * ```
 */
export class RedactingSpanExporter {
    exporter;
    policy;
    constructor(exporter, policy) {
        this.exporter = exporter;
        this.policy = resolvePolicy(policy);
    }
    export(spans, resultCallback) {
        const redacted = spans.map((span) => redactSpan(span, this.policy));
        this.exporter.export(redacted, resultCallback);
    }
    shutdown() {
        return this.exporter.shutdown();
    }
    forceFlush() {
        return this.exporter.forceFlush?.() ?? Promise.resolve();
    }
}
/**
 * Define an own data property on `target`, shadowing the prototype. Plain
 * assignment (`target.key = value`) fails when the prototype exposes `key` as a
 * getter-only accessor (e.g. OpenTelemetry's `Resource.attributes`), so we
 * always define the override explicitly.
 */
function overrideProperty(target, key, value) {
    Object.defineProperty(target, key, {
        value,
        enumerable: true,
        configurable: true,
        writable: true,
    });
}
/**
 * Shallow-clone an object, keeping its prototype and copying every own field as
 * an own property.
 */
function shallowClone(source) {
    return Object.create(Object.getPrototypeOf(source), Object.getOwnPropertyDescriptors(source));
}
/**
 * Return a redacted clone of a span: same prototype, every own field copied, so
 * untouched fields survive exporters that spread or enumerate it ({...span},
 * Object.keys). Only the sensitive surface is overridden.
 */
export function redactSpan(span, policy) {
    const redacted = shallowClone(span);
    overrideProperty(redacted, "name", policy.redactSpanName(span.name));
    overrideProperty(redacted, "attributes", policy.redactAttributes(span.attributes));
    overrideProperty(redacted, "events", redactEvents(span.events, policy));
    overrideProperty(redacted, "links", redactLinks(span.links, policy));
    overrideProperty(redacted, "resource", redactResource(span.resource, policy));
    overrideProperty(redacted, "status", redactStatus(span.status, policy));
    return redacted;
}
function redactEvents(events, policy) {
    if (events == null) {
        return [];
    }
    return events.map((event) => {
        const redacted = shallowClone(event);
        overrideProperty(redacted, "attributes", policy.redactAttributes(event.attributes));
        return redacted;
    });
}
function redactLinks(links, policy) {
    if (links == null) {
        return [];
    }
    return links.map((link) => {
        const redacted = shallowClone(link);
        overrideProperty(redacted, "attributes", policy.redactAttributes(link.attributes));
        return redacted;
    });
}
function redactResource(resource, policy) {
    if (resource == null) {
        return resource;
    }
    const redacted = shallowClone(resource);
    overrideProperty(redacted, "attributes", policy.redactAttributes(resource.attributes));
    return redacted;
}
function redactStatus(status, policy) {
    if (status == null) {
        return status;
    }
    const message = policy.redactStatusDescription(status.message);
    const redacted = { code: status.code };
    if (message !== undefined) {
        redacted.message = message;
    }
    return redacted;
}
//# sourceMappingURL=redaction.js.map