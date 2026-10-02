import { defineFeaturePlugin } from "openclaw/plugin-sdk/feature-plugin";
import { contract } from "./ui-contract.js";
import { createFeatureHandlers } from "./ui-feature.js";
import pluginEntry from "./entry.js";

export default defineFeaturePlugin({
  contract,
  name: "Memory Engine",
  description: "Native Memory Engine: 45 memory tools, session ingest/digest, curator and Control UI.",
  setup(api, events) {
    (pluginEntry as any).register(api);
    return createFeatureHandlers() as any;
  },
});
