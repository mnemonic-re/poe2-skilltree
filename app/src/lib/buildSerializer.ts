import type { Tag } from "./buildState";

export interface SerializedBuild {
  v: "0.4" | "0.5";
  c: number | null; // selectedClass
  a: string | null; // selectedAsc
  m: number;        // mode
  b: number;        // baseBudget
  al: string;       // "key:tag,key:tag,..." or empty
  as: string;       // "key,key,..." or empty
}

export interface BuildStateInfo {
  version: "0.4" | "0.5";
  selectedClass: number | null;
  selectedAsc: string | null;
  mode: Tag;
  alloc: Map<string, Tag>;
  ascAlloc: Set<string>;
  baseBudget: number;
}

// Convert build state to URL-safe Base64 string
export function serializeBuild(
  version: "0.4" | "0.5",
  state: {
    selectedClass: number | null;
    selectedAsc: string | null;
    mode: Tag;
    alloc: Map<string, Tag>;
    ascAlloc: Set<string>;
    baseBudget: number;
  }
): string {
  const allocParts: string[] = [];
  state.alloc.forEach((tag, key) => {
    allocParts.push(`${key}:${tag}`);
  });

  const ascParts = Array.from(state.ascAlloc);

  const obj: SerializedBuild = {
    v: version,
    c: state.selectedClass,
    a: state.selectedAsc,
    m: state.mode,
    b: state.baseBudget,
    al: allocParts.join(","),
    as: ascParts.join(","),
  };

  const json = JSON.stringify(obj);
  // URL-safe base64 encoding
  try {
    const base64 = btoa(unescape(encodeURIComponent(json)));
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch (e) {
    console.error("Failed to serialize build", e);
    return "";
  }
}

// Parse build state from URL-safe Base64 string
export function deserializeBuild(str: string): { version: "0.4" | "0.5"; build: BuildStateInfo } | null {
  try {
    // Restore base64 padding and standard chars
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const json = decodeURIComponent(escape(atob(base64)));
    const obj = JSON.parse(json) as SerializedBuild;

    if (!obj || (obj.v !== "0.4" && obj.v !== "0.5")) {
      return null;
    }

    const alloc = new Map<string, Tag>();
    if (obj.al) {
      obj.al.split(",").forEach((part) => {
        const [key, tagStr] = part.split(":");
        if (key) {
          const tag = parseInt(tagStr || "0", 10) as Tag;
          alloc.set(key, tag);
        }
      });
    }

    const ascAlloc = new Set<string>();
    if (obj.as) {
      obj.as.split(",").forEach((key) => {
        if (key) ascAlloc.add(key);
      });
    }

    return {
      version: obj.v,
      build: {
        version: obj.v,
        selectedClass: obj.c,
        selectedAsc: obj.a,
        mode: (obj.m ?? 0) as Tag,
        alloc,
        ascAlloc,
        baseBudget: obj.b ?? 123,
      },
    };
  } catch (e) {
    console.error("Failed to deserialize build", e);
    return null;
  }
}
