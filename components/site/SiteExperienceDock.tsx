"use client";

import { useEffect, useState } from "react";

type Density = "comfortable" | "compact";
type PreviewMode = "rich" | "compact";

type ExperienceState = {
  density: Density;
  motionEnabled: boolean;
  previewMode: PreviewMode;
};

const STORAGE_KEY = "site-experience-v2";

function applyExperience(state: ExperienceState) {
  const root = document.documentElement;
  root.dataset.density = state.density;
  root.dataset.motion = state.motionEnabled ? "on" : "off";
  root.dataset.preview = state.previewMode;
}

function readStoredState(): ExperienceState {
  if (typeof window === "undefined") {
    return {
      density: "comfortable",
      motionEnabled: true,
      previewMode: "rich",
    };
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    return {
      density: parsed.density === "compact" ? "compact" : "comfortable",
      motionEnabled: parsed.motionEnabled !== false,
      previewMode: parsed.previewMode === "compact" ? "compact" : "rich",
    };
  } catch {
    return {
      density: "comfortable",
      motionEnabled: true,
      previewMode: "rich",
    };
  }
}

export default function SiteExperienceDock() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ExperienceState>(() => readStoredState());

  useEffect(() => {
    const nextState = readStoredState();
    setState(nextState);
    applyExperience(nextState);
  }, []);

  useEffect(() => {
    applyExperience(state);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("site-experience-updated", { detail: state }));
  }, [state]);

  return (
    <div className="experience-dock">
      <button
        type="button"
        className="experience-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        display
      </button>

      {open ? (
        <div className="experience-panel">
          <label className="experience-row">
            <span>density</span>
            <select
              value={state.density}
              onChange={(event) =>
                setState((prev) => ({
                  ...prev,
                  density: event.target.value === "compact" ? "compact" : "comfortable",
                }))
              }
            >
              <option value="comfortable">comfortable</option>
              <option value="compact">compact</option>
            </select>
          </label>

          <label className="experience-row">
            <span>motion</span>
            <select
              value={state.motionEnabled ? "on" : "off"}
              onChange={(event) =>
                setState((prev) => ({
                  ...prev,
                  motionEnabled: event.target.value === "on",
                }))
              }
            >
              <option value="on">on</option>
              <option value="off">off</option>
            </select>
          </label>

          <label className="experience-row">
            <span>preview</span>
            <select
              value={state.previewMode}
              onChange={(event) =>
                setState((prev) => ({
                  ...prev,
                  previewMode: event.target.value === "compact" ? "compact" : "rich",
                }))
              }
            >
              <option value="rich">rich</option>
              <option value="compact">compact</option>
            </select>
          </label>
        </div>
      ) : null}
    </div>
  );
}
