// Next aliases react-dom to its bundled canary, which has useFormStatus.
// Standalone renders use the stable package, so the hook is stubbed here.
import * as ReactDOM from "react-dom";

const target = ReactDOM as unknown as Record<string, unknown>;
if (typeof target.useFormStatus !== "function") {
  target.useFormStatus = () => ({ pending: false, data: null, method: null, action: null });
}
