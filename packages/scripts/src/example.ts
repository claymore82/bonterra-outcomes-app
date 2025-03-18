import { Resource } from "sst";
import { Example } from "@bonstart/core/example";

// Access the bucket using the export name defined in sst.config.ts
console.log(`${Example.hello()} Linked to ${Resource.Uploads.name}.`);
