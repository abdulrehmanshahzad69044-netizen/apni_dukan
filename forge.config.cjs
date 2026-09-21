const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");
const path = require("node:path");
const fs = require("node:fs");

/**
 * Copy a package folder from the project's node_modules into the packaged app's
 * node_modules. Used for native modules that Vite marks as external and
 * therefore doesn't bundle.
 */
function copyPackageToBuild(buildPath, packageName) {
  const srcDir = path.join(__dirname, "node_modules", packageName);
  const destDir = path.join(buildPath, "node_modules", packageName);

  if (!fs.existsSync(srcDir)) {
    console.warn(`[packageAfterCopy] Source not found: ${srcDir}`);
    return;
  }

  fs.mkdirSync(path.dirname(destDir), { recursive: true });
  fs.cpSync(srcDir, destDir, { recursive: true });
  console.log(`[packageAfterCopy] Copied ${packageName}`);
}

module.exports = {
  packagerConfig: {
    asar: true,
    extraResource: ["./drizzle"],
    asarUnpack: [
      "**/better-sqlite3/**",
      "**/*.node",
    ],
  },

  rebuildConfig: {},

  hooks: {
    packageAfterCopy: async (_config, buildPath) => {
      // better-sqlite3 v11+ ships prebuilt binaries under prebuilds/.
      // No external bindings package needed.
      copyPackageToBuild(buildPath, "better-sqlite3");
    },
  },

  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "apni_dukan",
        setupExe: "Apni Dukan Setup.exe",
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["win32"],
    },
  ],

  plugins: [
    {
      name: "@electron-forge/plugin-vite",
      config: {
        build: [
          {
            entry: "electron/main/main.ts",
            config: "vite.main.config.ts",
          },
          {
            entry: "electron/preload/preload.ts",
            config: "vite.preload.config.ts",
          },
        ],
        renderer: [
          {
            name: "main_window",
            config: "vite.renderer.config.ts",
          },
        ],
      },
    },

    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },

    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};