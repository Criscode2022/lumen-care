import { bootstrapApplication } from "@angular/platform-browser";
import { App } from "./app/app";
import { appConfig } from "./app/app.config";
import { installPreviewBridge } from "./app/preview-bridge";

installPreviewBridge();
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
