// Shared engine + engine-version definitions for marketplace assets.
// The DB column is still named `godot_version` for historical reasons but
// now stores any engine's version string (e.g. "MZ", "5.x", "Godot 4.3+").

export const ENGINES = ['Godot', 'RPG Maker', 'Unity', 'Unreal', 'Other'] as const;
export type Engine = (typeof ENGINES)[number];

export const ENGINE_VERSIONS: Record<Engine, string[]> = {
  Godot: ['Godot 4.3+', 'Godot 4.2', 'Godot 4.1', 'Godot 4.0', 'Godot 3.x'],
  'RPG Maker': ['MZ', 'MV', 'VX Ace', 'XP', '2003'],
  Unity: ['6 LTS', '2022 LTS', '2021 LTS'],
  Unreal: ['5.x', '4.x'],
  Other: [],
};

export function isEngine(value: string | null | undefined): value is Engine {
  return !!value && (ENGINES as readonly string[]).includes(value);
}
