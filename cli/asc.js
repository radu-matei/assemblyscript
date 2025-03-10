/**
 * @license
 * Copyright 2020 Daniel Wirtz / The AssemblyScript Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Compiler frontend for node.js
 *
 * Uses the low-level API exported from src/index.ts so it works with the compiler compiled to
 * JavaScript as well as the compiler compiled to WebAssembly (eventually). Runs the sources
 * directly through ts-node if distribution files are not present (indicated by a `-dev` version).
 *
 * Can also be packaged as a bundle suitable for in-browser use with the standard library injected
 * in the build step. See dist/asc.js for the bundle and webpack.config.js for building details.
 */

/* global BUNDLE_VERSION, BUNDLE_LIBRARY, BUNDLE_DEFINITIONS */

const fs = require("fs");
const path = require("path");
const process = require("process"); // ensure shim

const utf8 = require("./util/utf8");
const colorsUtil = require("./util/colors");
const optionsUtil = require("./util/options");
const mkdirp = require("./util/mkdirp");
const find = require("./util/find");
const binaryen = global.binaryen || (global.binaryen = require("binaryen"));

const dynrequire = typeof __webpack_require__ === "function"
  ? __non_webpack_require__
  : require;

const WIN = process.platform === "win32";
const EOL = WIN ? "\r\n" : "\n";
const SEP = WIN ? "\\" : "/";

// Sets up an extension with its definition counterpart and relevant regexes.
function setupExtension(ext) {
  if (!ext.startsWith(".")) ext = "." + ext;
  return {
    ext,
    ext_d: ".d" + ext,
    re: new RegExp("\\" + ext + "$"),
    re_d: new RegExp("\\.d\\" + ext + "$"),
    re_except_d: new RegExp("^(?!.*\\.d\\" + ext + "$).*\\" + ext + "$"),
    re_index: new RegExp("(?:^|[\\\\\\/])index\\" + ext + "$")
  };
}

const defaultExtension = setupExtension(".ts");

// Proxy Binaryen's ready event
Object.defineProperty(exports, "ready", {
  get() { return binaryen.ready; }
});

// Emscripten adds an `uncaughtException` listener to Binaryen that results in an additional
// useless code fragment on top of an actual error. suppress this:
if (process.removeAllListeners) process.removeAllListeners("uncaughtException");

// Use distribution files if present, otherwise run the sources directly.
var assemblyscript;
var isDev = false;
(function loadAssemblyScript() {
  try {
    assemblyscript = require("assemblyscript");
  } catch (e) {
    try { // `asc` on the command line
      assemblyscript = dynrequire("../dist/assemblyscript.js");
    } catch (e) {
      try { // `asc` on the command line without dist files
        dynrequire("ts-node").register({
          project: path.join(__dirname, "..", "src", "tsconfig.json"),
          skipIgnore: true,
          compilerOptions: { target: "ES2016" }
        });
        dynrequire("../src/glue/js");
        assemblyscript = dynrequire("../src");
        isDev = true;
      } catch (e_ts) {
        try { // `require("dist/asc.js")` in explicit browser tests
          assemblyscript = dynrequire("./assemblyscript");
        } catch (e) {
          throw Error(e_ts.stack + "\n---\n" + e.stack);
        }
      }
    }
  }
})();

/** Whether this is a webpack bundle or not. */
exports.isBundle = typeof BUNDLE_VERSION === "string";

/** Whether asc runs the sources directly or not. */
exports.isDev = isDev;

/** AssemblyScript version. */
exports.version = exports.isBundle ? BUNDLE_VERSION : dynrequire("../package.json").version;

/** Available CLI options. */
exports.options = require("./asc.json");

/** Prefix used for library files. */
exports.libraryPrefix = assemblyscript.LIBRARY_PREFIX;

/** Default Binaryen optimization level. */
exports.defaultOptimizeLevel = 3;

/** Default Binaryen shrink level. */
exports.defaultShrinkLevel = 1;

/** Bundled library files. */
exports.libraryFiles = exports.isBundle ? BUNDLE_LIBRARY : (() => { // set up if not a bundle
  const libDir = path.join(__dirname, "..", "std", "assembly");
  const bundled = {};
  find
    .files(libDir, defaultExtension.re_except_d)
    .forEach(file => {
      bundled[file.replace(defaultExtension.re, "")] = fs.readFileSync(path.join(libDir, file), "utf8");
    });
  return bundled;
})();

/** Bundled definition files. */
exports.definitionFiles = exports.isBundle ? BUNDLE_DEFINITIONS : (() => { // set up if not a bundle
  const readDefinition = name => fs.readFileSync(
    path.join(__dirname, "..", "std", name, "index" + defaultExtension.ext_d),
    "utf8"
  );
  return {
    assembly: readDefinition("assembly"),
    portable: readDefinition("portable")
  };
})();

/** Convenience function that parses and compiles source strings directly. */
exports.compileString = (sources, options) => {
  if (typeof sources === "string") sources = { ["input" + defaultExtension.ext]: sources };
  const output = Object.create({
    stdout: createMemoryStream(),
    stderr: createMemoryStream()
  });
  var argv = [
    "--binaryFile", "binary",
    "--textFile", "text",
  ];
  Object.keys(options || {}).forEach(key => {
    var val = options[key];
    var opt = exports.options[key];
    if (opt && opt.type === "b") {
      if (val) argv.push("--" + key);
    } else {
      if (Array.isArray(val)) {
        val.forEach(val => { argv.push("--" + key, String(val)); });
      }
      else argv.push("--" + key, String(val));
    }
  });
  exports.main(argv.concat(Object.keys(sources)), {
    stdout: output.stdout,
    stderr: output.stderr,
    readFile: name => Object.prototype.hasOwnProperty.call(sources, name) ? sources[name] : null,
    writeFile: (name, contents) => { output[name] = contents; },
    listFiles: () => []
  });
  return output;
};

/** Runs the command line utility using the specified arguments array. */
exports.main = function main(argv, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  } else if (!options) {
    options = {};
  }

  const stdout = options.stdout || process.stdout;
  const stderr = options.stderr || process.stderr;
  const readFile = options.readFile || readFileNode;
  const writeFile = options.writeFile || writeFileNode;
  const listFiles = options.listFiles || listFilesNode;
  const stats = options.stats || createStats();
  let extension = defaultExtension;

  // Output must be specified if not present in the environment
  if (!stdout) throw Error("'options.stdout' must be specified");
  if (!stderr) throw Error("'options.stderr' must be specified");

  // Parse command line options but do not populate option defaults yet
  const optionsResult = optionsUtil.parse(argv, exports.options, false);
  let opts = optionsResult.options;
  argv = optionsResult.arguments;

  if (opts.noColors) {
    colorsUtil.stdout.supported =
    colorsUtil.stderr.supported = false;
  } else {
    colorsUtil.stdout = colorsUtil.from(stdout);
    colorsUtil.stderr = colorsUtil.from(stderr);
  }

  // Check for unknown options
  const unknownOpts = optionsResult.unknown;
  if (unknownOpts.length) {
    unknownOpts.forEach(arg => {
      stderr.write(colorsUtil.stderr.yellow("WARNING ") + "Unknown option '" + arg + "'" + EOL);
    });
  }

  // Check for trailing arguments
  const trailingArgv = optionsResult.trailing;
  if (trailingArgv.length) {
    stderr.write(colorsUtil.stderr.yellow("WARNING ") + "Unsupported trailing arguments: " + trailingArgv.join(" ") + EOL);
  }

  // Use default callback if none is provided
  if (!callback) callback = function defaultCallback(err) {
    var code = 0;
    if (err) {
      stderr.write(colorsUtil.stderr.red("FAILURE ") + err.stack.replace(/^ERROR: /i, "") + EOL);
      code = 1;
    }
    return code;
  };

  // Just print the version if requested
  if (opts.version) {
    stdout.write("Version " + exports.version + (isDev ? "-dev" : "") + EOL);
    return callback(null);
  }

  // Use another extension if requested
  if (typeof opts.extension === "string") {
    if (/^\.?[0-9a-zA-Z]{1,14}$/.test(opts.extension)) {
      extension = setupExtension(opts.extension);
    } else {
      return callback(Error("Invalid extension: " + opts.extension));
    }
  }

  // Print the help message if requested or no source files are provided
  if (opts.help || !argv.length) {
    var out = opts.help ? stdout : stderr;
    var color = opts.help ? colorsUtil.stdout : colorsUtil.stderr;
    out.write([
      color.white("SYNTAX"),
      "  " + color.cyan("asc") + " [entryFile ...] [options]",
      "",
      color.white("EXAMPLES"),
      "  " + color.cyan("asc") + " hello" + extension.ext,
      "  " + color.cyan("asc") + " hello" + extension.ext + " -b hello.wasm -t hello.wat",
      "  " + color.cyan("asc") + " hello1" + extension.ext + " hello2" + extension.ext + " -b -O > hello.wasm",
      "",
      color.white("OPTIONS"),
    ].concat(
      optionsUtil.help(exports.options, 24, EOL)
    ).join(EOL) + EOL);
    return callback(null);
  }

  // I/O must be specified if not present in the environment
  if (!fs.readFileSync) {
    if (readFile === readFileNode) throw Error("'options.readFile' must be specified");
    if (writeFile === writeFileNode) throw Error("'options.writeFile' must be specified");
    if (listFiles === listFilesNode) throw Error("'options.listFiles' must be specified");
  }

  // Set up base directory
  const baseDir = path.normalize(opts.baseDir || ".");

  // Load additional options from asconfig.json
  let asconfigPath = optionsUtil.resolvePath(opts.config || "asconfig.json", baseDir);
  let asconfigFile = path.basename(asconfigPath);
  let asconfigDir = path.dirname(asconfigPath);
  let asconfig = getAsconfig(asconfigFile, asconfigDir, readFile);

  const seenAsconfig = new Set();
  seenAsconfig.add(asconfigPath);

  const target = opts.target || "release";
  while (asconfig) {
    // Merge target first
    if (asconfig.targets) {
      const targetOptions = asconfig.targets[target];
      if (targetOptions) {
        opts = optionsUtil.merge(exports.options, opts, targetOptions, asconfigDir);
      }
    }
    // Merge general options
    const generalOptions = asconfig.options;
    if (generalOptions) {
      opts = optionsUtil.merge(exports.options, opts, generalOptions, asconfigDir);
    }

    // Append entries
    if (asconfig.entries) {
      for (let entry of asconfig.entries) {
        argv.push(optionsUtil.resolvePath(entry, asconfigDir));
      }
    }

    // Look up extended asconfig and repeat
    if (asconfig.extends) {
      asconfigPath = optionsUtil.resolvePath(asconfig.extends, asconfigDir, true);
      asconfigFile = path.basename(asconfigPath);
      asconfigDir = path.dirname(asconfigPath);
      if (seenAsconfig.has(asconfigPath)) break;
      seenAsconfig.add(asconfigPath);
      asconfig = getAsconfig(asconfigFile, asconfigDir, readFile);
    } else {
      break;
    }
  }

  // Populate option defaults once user-defined options are set
  optionsUtil.addDefaults(exports.options, opts);

  // If showConfig print options and exit
  if (opts.showConfig) {
    stderr.write(JSON.stringify({
      options: opts,
      entries: argv
    }, null, 2));
    return callback(null);
  }

  // create a unique set of values
  function unique(values) {
    return [...new Set(values)];
  }

  // Set up options
  const compilerOptions = assemblyscript.newOptions();
  assemblyscript.setTarget(compilerOptions, 0);
  assemblyscript.setNoAssert(compilerOptions, opts.noAssert);
  assemblyscript.setExportMemory(compilerOptions, !opts.noExportMemory);
  assemblyscript.setImportMemory(compilerOptions, opts.importMemory);
  assemblyscript.setInitialMemory(compilerOptions, opts.initialMemory >>> 0);
  assemblyscript.setMaximumMemory(compilerOptions, opts.maximumMemory >>> 0);
  assemblyscript.setSharedMemory(compilerOptions, opts.sharedMemory);
  assemblyscript.setImportTable(compilerOptions, opts.importTable);
  assemblyscript.setExportTable(compilerOptions, opts.exportTable);
  assemblyscript.setExplicitStart(compilerOptions, opts.explicitStart);
  assemblyscript.setMemoryBase(compilerOptions, opts.memoryBase >>> 0);
  assemblyscript.setTableBase(compilerOptions, opts.tableBase >>> 0);
  assemblyscript.setSourceMap(compilerOptions, opts.sourceMap != null);
  assemblyscript.setNoUnsafe(compilerOptions, opts.noUnsafe);
  assemblyscript.setPedantic(compilerOptions, opts.pedantic);
  assemblyscript.setLowMemoryLimit(compilerOptions, opts.lowMemoryLimit >>> 0);

  // Add or override aliases if specified
  if (opts.use) {
    let aliases = opts.use;
    for (let i = 0, k = aliases.length; i < k; ++i) {
      let part = aliases[i];
      let p = part.indexOf("=");
      if (p < 0) return callback(Error("Global alias '" + part + "' is invalid."));
      let alias = part.substring(0, p).trim();
      let name = part.substring(p + 1).trim();
      if (!alias.length) return callback(Error("Global alias '" + part + "' is invalid."));
      assemblyscript.setGlobalAlias(compilerOptions, alias, name);
    }
  }

  // Disable default features if specified
  var features;
  if ((features = opts.disable) != null) {
    if (typeof features === "string") features = features.split(",");
    for (let i = 0, k = features.length; i < k; ++i) {
      let name = features[i].trim();
      let flag = assemblyscript["FEATURE_" + name.replace(/-/g, "_").toUpperCase()];
      if (!flag) return callback(Error("Feature '" + name + "' is unknown."));
      assemblyscript.disableFeature(compilerOptions, flag);
    }
  }

  // Enable experimental features if specified
  if ((features = opts.enable) != null) {
    if (typeof features === "string") features = features.split(",");
    for (let i = 0, k = features.length; i < k; ++i) {
      let name = features[i].trim();
      let flag = assemblyscript["FEATURE_" + name.replace(/-/g, "_").toUpperCase()];
      if (!flag) return callback(Error("Feature '" + name + "' is unknown."));
      assemblyscript.enableFeature(compilerOptions, flag);
    }
  }

  // Set up optimization levels
  var optimizeLevel = 0;
  var shrinkLevel = 0;
  if (opts.optimize) {
    optimizeLevel = exports.defaultOptimizeLevel;
    shrinkLevel = exports.defaultShrinkLevel;
  }
  if (typeof opts.optimizeLevel === "number") optimizeLevel = opts.optimizeLevel;
  if (typeof opts.shrinkLevel === "number") shrinkLevel = opts.shrinkLevel;
  optimizeLevel = Math.min(Math.max(optimizeLevel, 0), 3);
  shrinkLevel = Math.min(Math.max(shrinkLevel, 0), 2);
  assemblyscript.setOptimizeLevelHints(compilerOptions, optimizeLevel, shrinkLevel);

  // Initialize the program
  const program = assemblyscript.newProgram(compilerOptions);

  // Set up transforms
  const transforms = [];
  if (opts.transform) {
    let tsNodeRegistered = false;
    let transformArgs = unique(opts.transform);
    for (let i = 0, k = transformArgs.length; i < k; ++i) {
      let filename = transformArgs[i].trim();
      if (!tsNodeRegistered && filename.endsWith(".ts")) { // ts-node requires .ts specifically
        dynrequire("ts-node").register({ transpileOnly: true, skipProject: true, compilerOptions: { target: "ES2016" } });
        tsNodeRegistered = true;
      }
      try {
        const classOrModule = dynrequire(dynrequire.resolve(filename, { paths: [baseDir, process.cwd()] }));
        if (typeof classOrModule === "function") {
          Object.assign(classOrModule.prototype, {
            program,
            baseDir,
            stdout,
            stderr,
            log: console.error,
            readFile,
            writeFile,
            listFiles
          });
          transforms.push(new classOrModule());
        } else {
          transforms.push(classOrModule); // legacy module
        }
      } catch (e) {
        return callback(e);
      }
    }
  }

  function applyTransform(name, ...args) {
    for (let i = 0, k = transforms.length; i < k; ++i) {
      let transform = transforms[i];
      if (typeof transform[name] === "function") {
        try {
          stats.transformCount++;
          stats.transfromTime += measure(() => {
            transform[name](...args);
          });
        } catch (e) {
          return e;
        }
      }
    }
  }

  // Parse library files
  Object.keys(exports.libraryFiles).forEach(libPath => {
    if (libPath.indexOf("/") >= 0) return; // in sub-directory: imported on demand
    stats.parseCount++;
    stats.parseTime += measure(() => {
      assemblyscript.parse(program, exports.libraryFiles[libPath], exports.libraryPrefix + libPath + extension.ext, false);
    });
  });
  let customLibDirs = [];
  if (opts.lib) {
    let lib = opts.lib;
    if (typeof lib === "string") lib = lib.split(",");
    customLibDirs.push(...lib.map(p => p.trim()));
    customLibDirs = unique(customLibDirs); // `lib` and `customLibDirs` may include duplicates
    for (let i = 0, k = customLibDirs.length; i < k; ++i) { // custom
      let libDir = customLibDirs[i];
      let libFiles;
      if (libDir.endsWith(extension.ext)) {
        libFiles = [ path.basename(libDir) ];
        libDir = path.dirname(libDir);
      } else {
        libFiles = listFiles(libDir, baseDir) || [];
      }
      for (let j = 0, l = libFiles.length; j < l; ++j) {
        let libPath = libFiles[j];
        let libText = readFile(libPath, libDir);
        if (libText === null) return callback(Error("Library file '" + libPath + "' not found."));
        stats.parseCount++;
        exports.libraryFiles[libPath.replace(extension.re, "")] = libText;
        stats.parseTime += measure(() => {
          assemblyscript.parse(program, libText, exports.libraryPrefix + libPath, false);
        });
      }
    }
  }
  opts.path = opts.path || [];

  // Maps package names to parent directory
  var packageMains = new Map();
  var packageBases = new Map();

  // Gets the file matching the specified source path, imported at the given dependee path
  function getFile(internalPath, dependeePath) {
    var sourceText = null; // text reported back to the compiler
    var sourcePath = null; // path reported back to the compiler

    const libraryPrefix = exports.libraryPrefix;
    const libraryFiles = exports.libraryFiles;

    // Try file.ext, file/index.ext, file.d.ext
    if (!internalPath.startsWith(libraryPrefix)) {
      if ((sourceText = readFile(sourcePath = internalPath + extension.ext, baseDir)) == null) {
        if ((sourceText = readFile(sourcePath = internalPath + "/index" + extension.ext, baseDir)) == null) {
          // portable d.ext: uses the .js file next to it in JS or becomes an import in Wasm
          sourcePath = internalPath + extension.ext;
          sourceText = readFile(internalPath + extension.ext_d, baseDir);
        }
      }

    // Search library in this order: stdlib, custom lib dirs, paths
    } else {
      const plainName = internalPath.substring(libraryPrefix.length);
      const indexName = plainName + "/index";
      if (Object.prototype.hasOwnProperty.call(libraryFiles, plainName)) {
        sourceText = libraryFiles[plainName];
        sourcePath = libraryPrefix + plainName + extension.ext;
      } else if (Object.prototype.hasOwnProperty.call(libraryFiles, indexName)) {
        sourceText = libraryFiles[indexName];
        sourcePath = libraryPrefix + indexName + extension.ext;
      } else { // custom lib dirs
        for (const libDir of customLibDirs) {
          if ((sourceText = readFile(plainName + extension.ext, libDir)) != null) {
            sourcePath = libraryPrefix + plainName + extension.ext;
            break;
          } else {
            if ((sourceText = readFile(indexName + extension.ext, libDir)) != null) {
              sourcePath = libraryPrefix + indexName + extension.ext;
              break;
            }
          }
        }
        if (sourceText == null) { // paths
          const match = internalPath.match(/^~lib\/((?:@[^/]+\/)?[^/]+)(?:\/(.+))?/); // ~lib/(pkg)/(path), ~lib/(@org/pkg)/(path)
          if (match) {
            const packageName = match[1];
            const isPackageRoot = match[2] === undefined;
            const filePath = isPackageRoot ? "index" : match[2];
            const basePath = packageBases.has(dependeePath) ? packageBases.get(dependeePath) : ".";
            if (opts.traceResolution) stderr.write("Looking for package '" + packageName + "' file '" + filePath + "' relative to '" + basePath + "'" + EOL);
            const paths = [];
            const parts = path.resolve(baseDir, basePath).split(SEP);
            for (let i = parts.length, k = WIN ? 1 : 0; i >= k; --i) {
              if (parts[i - 1] !== "node_modules") paths.push(parts.slice(0, i).join(SEP) + SEP + "node_modules");
            }
            for (const currentPath of paths.concat(...opts.path).map(p => path.relative(baseDir, p))) {
              if (opts.traceResolution) stderr.write("  in " + path.join(currentPath, packageName) + EOL);
              let mainPath = "assembly";
              if (packageMains.has(packageName)) { // use cached
                mainPath = packageMains.get(packageName);
              } else { // evaluate package.json
                let jsonPath = path.join(currentPath, packageName, "package.json");
                let jsonText = readFile(jsonPath, baseDir);
                if (jsonText != null) {
                  try {
                    let json = JSON.parse(jsonText);
                    if (typeof json.ascMain === "string") {
                      mainPath = json.ascMain.replace(extension.re_index, "");
                      packageMains.set(packageName, mainPath);
                    }
                  } catch (e) { /* nop */ }
                }
              }
              const mainDir = path.join(currentPath, packageName, mainPath);
              const plainName = filePath;
              if ((sourceText = readFile(path.join(mainDir, plainName + extension.ext), baseDir)) != null) {
                sourcePath = libraryPrefix + packageName + "/" + plainName + extension.ext;
                packageBases.set(sourcePath.replace(extension.re, ""), path.join(currentPath, packageName));
                if (opts.traceResolution) stderr.write("  -> " + path.join(mainDir, plainName + extension.ext) + EOL);
                break;
              } else if (!isPackageRoot) {
                const indexName = filePath + "/index";
                if ((sourceText = readFile(path.join(mainDir, indexName + extension.ext), baseDir)) !== null) {
                  sourcePath = libraryPrefix + packageName + "/" + indexName + extension.ext;
                  packageBases.set(sourcePath.replace(extension.re, ""), path.join(currentPath, packageName));
                  if (opts.traceResolution) stderr.write("  -> " + path.join(mainDir, indexName + extension.ext) + EOL);
                  break;
                }
              }
            }
          }
        }
      }
    }
    // No such file
    if (sourceText == null) return null;
    return { sourceText, sourcePath };
  }

  // Parses the backlog of imported files after including entry files
  function parseBacklog() {
    var internalPath;
    while ((internalPath = assemblyscript.nextFile(program)) != null) {
      let file = getFile(internalPath, assemblyscript.getDependee(program, internalPath));
      if (file) {
        stats.parseCount++;
        stats.parseTime += measure(() => {
          assemblyscript.parse(program, file.sourceText, file.sourcePath, false);
        });
      } else {
        assemblyscript.parse(program, null, internalPath + extension.ext, false);
      }
    }
    var numErrors = checkDiagnostics(program, stderr);
    if (numErrors) {
      const err = Error(numErrors + " parse error(s)");
      err.stack = err.message; // omit stack
      return callback(err);
    }
  }

  // Include runtime template before entry files so its setup runs first
  {
    let runtimeName = String(opts.runtime);
    let runtimePath = "rt/index-" + runtimeName;
    let runtimeText = exports.libraryFiles[runtimePath];
    if (runtimeText == null) {
      runtimePath = runtimeName;
      runtimeText = readFile(runtimePath + extension.ext, baseDir);
      if (runtimeText == null) return callback(Error("Runtime '" + runtimeName + "' not found."));
    } else {
      runtimePath = "~lib/" + runtimePath;
    }
    stats.parseCount++;
    stats.parseTime += measure(() => {
      assemblyscript.parse(program, runtimeText, runtimePath + extension.ext, true);
    });
  }

  // Include entry files
  for (let i = 0, k = argv.length; i < k; ++i) {
    const filename = argv[i];

    let sourcePath = String(filename).replace(/\\/g, "/").replace(extension.re, "").replace(/[\\/]$/, "");

    // Setting the path to relative path
    sourcePath = path.isAbsolute(sourcePath) ? path.relative(baseDir, sourcePath).replace(/\\/g, "/") : sourcePath;

    // Try entryPath.ext, then entryPath/index.ext
    let sourceText = readFile(sourcePath + extension.ext, baseDir);
    if (sourceText == null) {
      sourceText = readFile(sourcePath + "/index" + extension.ext, baseDir);
      if (sourceText != null) sourcePath += "/index" + extension.ext;
      else sourcePath += extension.ext;
    } else {
      sourcePath += extension.ext;
    }

    stats.parseCount++;
    stats.parseTime += measure(() => {
      assemblyscript.parse(program, sourceText, sourcePath, true);
    });
  }

  // Parse entry files
  {
    let code = parseBacklog();
    if (code) return code;
  }

  // Call afterParse transform hook
  {
    let error = applyTransform("afterParse", program.parser);
    if (error) return callback(error);
  }

  // Parse additional files, if any
  {
    let code = parseBacklog();
    if (code) return code;
  }

  // Print files and exit if listFiles
  if (opts.listFiles) {
    // FIXME: not a proper C-like API
    stderr.write(program.sources.map(s => s.normalizedPath).sort().join(EOL) + EOL);
    return callback(null);
  }

  // Pre-emptively initialize the program
  stats.initializeCount++;
  stats.initializeTime += measure(() => {
    assemblyscript.initializeProgram(program);
  });

  // Call afterInitialize transform hook
  {
    let error = applyTransform("afterInitialize", program);
    if (error) return callback(error);
  }

  var module;
  stats.compileCount++;
  stats.compileTime += measure(() => {
    module = assemblyscript.compile(program);
  });
  var numErrors = checkDiagnostics(program, stderr);
  if (numErrors) {
    if (module) module.dispose();
    const err = Error(numErrors + " compile error(s)");
    err.stack = err.message; // omit stack
    return callback(err);
  }

  // Call afterCompile transform hook
  {
    let error = applyTransform("afterCompile", module);
    if (error) return callback(error);
  }

  // Validate the module if requested
  if (!opts.noValidate) {
    stats.validateCount++;
    let isValid;
    stats.validateTime += measure(() => {
      isValid = module.validate();
    });
    if (!isValid) {
      module.dispose();
      return callback(Error("validate error"));
    }
  }

  // Set Binaryen-specific options
  if (opts.trapMode === "clamp") {
    stats.optimizeCount++;
    stats.optimizeTime += measure(() => {
      module.runPass("trap-mode-clamp");
    });
  } else if (opts.trapMode === "js") {
    stats.optimizeCount++;
    stats.optimizeTime += measure(() => {
      module.runPass("trap-mode-js");
    });
  } else if (opts.trapMode !== "allow") {
    module.dispose();
    return callback(Error("Unsupported trap mode"));
  }

  // Optimize the module
  const debugInfo = opts.debug;
  const usesARC = opts.runtime == "half" || opts.runtime == "full";
  const converge = opts.converge;
  const runPasses = [];
  if (opts.runPasses) {
    if (typeof opts.runPasses === "string") {
      opts.runPasses = opts.runPasses.split(",");
    }
    if (opts.runPasses.length) {
      opts.runPasses.forEach(pass => {
        if (runPasses.indexOf(pass = pass.trim()) < 0)
          runPasses.push(pass);
      });
    }
  }

  stats.optimizeTime += measure(() => {
    stats.optimizeCount++;
    module.optimize(optimizeLevel, shrinkLevel, debugInfo, usesARC);
    module.runPasses(runPasses);
    if (converge) {
      let last = module.toBinary();
      do {
        stats.optimizeCount++;
        module.optimize(optimizeLevel, shrinkLevel, debugInfo, usesARC);
        module.runPasses(runPasses);
        let next = module.toBinary();
        if (next.output.length >= last.output.length) {
          if (next.output.length > last.output.length) {
            stderr.write("Last converge was suboptimial." + EOL);
          }
          break;
        }
        last = next;
      } while (true);
    }
  });

  // Prepare output
  if (!opts.noEmit) {
    if (opts.outFile != null) {
      if (/\.was?t$/.test(opts.outFile) && opts.textFile == null) {
        opts.textFile = opts.outFile;
      } else if (/\.js$/.test(opts.outFile) && opts.jsFile == null) {
        opts.jsFile = opts.outFile;
      } else if (opts.binaryFile == null) {
        opts.binaryFile = opts.outFile;
      }
    }

    let hasStdout = false;
    let hasOutput = opts.textFile != null
                 || opts.binaryFile != null
                 || opts.jsFile != null
                 || opts.tsdFile != null
                 || opts.idlFile != null;

    // Write binary
    if (opts.binaryFile != null) {
      let basename = path.basename(opts.binaryFile);
      let sourceMapURL = opts.sourceMap != null
        ? opts.sourceMap.length
          ? opts.sourceMap
          : "./" + basename + ".map"
        : null;

      let wasm;
      stats.emitCount++;
      stats.emitTime += measure(() => {
        wasm = module.toBinary(sourceMapURL);
      });

      if (opts.binaryFile.length) {
        writeFile(opts.binaryFile, wasm.output, baseDir);
      } else {
        writeStdout(wasm.output);
        hasStdout = true;
      }

      // Post-process source map
      if (wasm.sourceMap != null) {
        if (opts.binaryFile.length) {
          let map = JSON.parse(wasm.sourceMap);
          map.sourceRoot = "./" + basename;
          let contents = [];
          map.sources.forEach((name, index) => {
            let text = assemblyscript.getSource(program, name.replace(extension.re, ""));
            if (text == null) return callback(Error("Source of file '" + name + "' not found."));
            contents[index] = text;
          });
          map.sourcesContent = contents;
          writeFile(path.join(
            path.dirname(opts.binaryFile),
            path.basename(sourceMapURL)
          ).replace(/^\.\//, ""), JSON.stringify(map), baseDir);
        } else {
          stderr.write("Skipped source map (stdout already occupied)" + EOL);
        }
      }
    }

    // Write text (also fallback)
    if (opts.textFile != null || !hasOutput) {
      let wat;
      if (opts.textFile != null && opts.textFile.length) {
        stats.emitCount++;
        stats.emitTime += measure(() => {
          wat = module.toText();
        });
        writeFile(opts.textFile, wat, baseDir);
      } else if (!hasStdout) {
        stats.emitCount++;
        stats.emitTime += measure(() => {
          wat = module.toText();
        });
        writeStdout(wat);
      }
    }

    // Write WebIDL
    if (opts.idlFile != null) {
      let idl;
      if (opts.idlFile.length) {
        stats.emitCount++;
        stats.emitTime += measure(() => {
          idl = assemblyscript.buildIDL(program);
        });
        writeFile(opts.idlFile, idl, baseDir);
      } else if (!hasStdout) {
        stats.emitCount++;
        stats.emitTime += measure(() => {
          idl = assemblyscript.buildIDL(program);
        });
        writeStdout(idl);
        hasStdout = true;
      }
    }

    // Write TypeScript definition
    if (opts.tsdFile != null) {
      let tsd;
      if (opts.tsdFile.length) {
        stats.emitCount++;
        stats.emitTime += measure(() => {
          tsd = assemblyscript.buildTSD(program);
        });
        writeFile(opts.tsdFile, tsd, baseDir);
      } else if (!hasStdout) {
        stats.emitCount++;
        stats.emitTime += measure(() => {
          tsd = assemblyscript.buildTSD(program);
        });
        writeStdout(tsd);
        hasStdout = true;
      }
    }

    // Write JS (modifies the binary, so must be last)
    if (opts.jsFile != null) {
      let js;
      if (opts.jsFile.length) {
        stats.emitCount++;
        stats.emitTime += measure(() => {
          js = module.toAsmjs();
        });
        writeFile(opts.jsFile, js, baseDir);
      } else if (!hasStdout) {
        stats.emitCount++;
        stats.emitTime += measure(() => {
          js = module.toAsmjs();
        });
        writeStdout(js);
      }
    }
  }

  module.dispose();
  if (opts.measure) {
    printStats(stats, stderr);
  }

  return callback(null);

  function readFileNode(filename, baseDir) {
    let name = path.resolve(baseDir, filename);
    try {
      let text;
      stats.readCount++;
      stats.readTime += measure(() => {
        text = fs.readFileSync(name, { encoding: "utf8" });
      });
      return text;
    } catch (e) {
      return null;
    }
  }

  function writeFileNode(filename, contents, baseDir) {
    try {
      stats.writeCount++;
      stats.writeTime += measure(() => {
        const dirPath = path.resolve(baseDir, path.dirname(filename));
        filename = path.basename(filename);
        const outputFilePath = path.join(dirPath, filename);
        if (!fs.existsSync(dirPath)) mkdirp(dirPath);
        fs.writeFileSync(
          outputFilePath, contents,
          typeof contents === "string" ? { encoding: "utf8" } : void 0
        );
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  function listFilesNode(dirname, baseDir) {
    var files;
    try {
      stats.readCount++;
      stats.readTime += measure(() => {
        files = fs.readdirSync(path.join(baseDir, dirname))
          .filter(file => extension.re_except_d.test(file));
      });
      return files;
    } catch (e) {
      return null;
    }
  }

  function writeStdout(contents) {
    if (!writeStdout.used) {
      stats.writeCount++;
      writeStdout.used = true;
    }
    stats.writeTime += measure(() => {
      if (typeof contents === "string") {
        stdout.write(contents, { encoding: "utf8" });
      } else {
        stdout.write(contents);
      }
    });
  }
};

const toString = Object.prototype.toString;

function isObject(arg) {
  return toString.call(arg) === "[object Object]";
}

function getAsconfig(file, baseDir, readFile) {
  const contents = readFile(file, baseDir);
  const location = path.join(baseDir, file);
  if (!contents) return null;

  // obtain the configuration
  let config;
  try {
    config = JSON.parse(contents);
  } catch(ex) {
    throw new Error("Asconfig is not valid json: " + location);
  }

  // validate asconfig shape
  if (config.options && !isObject(config.options)) {
    throw new Error("Asconfig.options is not an object: " + location);
  }

  if (config.include && !Array.isArray(config.include)) {
    throw new Error("Asconfig.include is not an array: " + location);
  }

  if (config.targets) {
    if (!isObject(config.targets)) {
      throw new Error("Asconfig.targets is not an object: " + location);
    }
    const targets = Object.keys(config.targets);
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      if (!isObject(config.targets[target])) {
        throw new Error("Asconfig.targets." + target + " is not an object: " + location);
      }
    }
  }

  if (config.extends && typeof config.extends !== "string") {
    throw new Error("Asconfig.extends is not a string: " + location);
  }

  return config;
}

exports.getAsconfig = getAsconfig;

/** Checks diagnostics emitted so far for errors. */
function checkDiagnostics(program, stderr) {
  var diagnostic;
  var numErrors = 0;
  while ((diagnostic = assemblyscript.nextDiagnostic(program)) != null) {
    if (stderr) {
      stderr.write(
        assemblyscript.formatDiagnostic(diagnostic, stderr.isTTY, true) +
        EOL + EOL
      );
    }
    if (assemblyscript.isError(diagnostic)) ++numErrors;
  }
  return numErrors;
}

exports.checkDiagnostics = checkDiagnostics;

/** Creates an empty set of stats. */
function createStats() {
  return {
    readTime: 0,
    readCount: 0,
    writeTime: 0,
    writeCount: 0,
    parseTime: 0,
    parseCount: 0,
    initializeTime: 0,
    initializeCount: 0,
    compileTime: 0,
    compileCount: 0,
    emitTime: 0,
    emitCount: 0,
    validateTime: 0,
    validateCount: 0,
    optimizeTime: 0,
    optimizeCount: 0,
    transformTime: 0,
    transformCount: 0
  };
}

exports.createStats = createStats;

/** Measures the execution time of the specified function.  */
function measure(fn) {
  const start = process.hrtime();
  fn();
  const times = process.hrtime(start);
  return times[0] * 1e9 + times[1];
}

exports.measure = measure;

function pad(str, len) {
  while (str.length < len) str = " " + str;
  return str;
}

/** Formats a high resolution time to a human readable string. */
function formatTime(time) {
  return time ? (time / 1e6).toFixed(3) + " ms" : "n/a";
}

exports.formatTime = formatTime;

/** Formats and prints out the contents of a set of stats. */
function printStats(stats, output) {
  const format = (time, count) => pad(formatTime(time), 12) + "  n=" + count;
  (output || process.stdout).write([
    "I/O Read   : " + format(stats.readTime, stats.readCount),
    "I/O Write  : " + format(stats.writeTime, stats.writeCount),
    "Parse      : " + format(stats.parseTime, stats.parseCount),
    "Initialize : " + format(stats.initializeTime, stats.initializeCount),
    "Compile    : " + format(stats.compileTime, stats.compileCount),
    "Emit       : " + format(stats.emitTime, stats.emitCount),
    "Validate   : " + format(stats.validateTime, stats.validateCount),
    "Optimize   : " + format(stats.optimizeTime, stats.optimizeCount),
    "Transform  : " + format(stats.transformTime, stats.transformCount)
  ].join(EOL) + EOL);
}

exports.printStats = printStats;

var allocBuffer = typeof global !== "undefined" && global.Buffer
  ? global.Buffer.allocUnsafe || (len => new global.Buffer(len))
  : len => new Uint8Array(len);

/** Creates a memory stream that can be used in place of stdout/stderr. */
function createMemoryStream(fn) {
  var stream = [];
  stream.write = function(chunk) {
    if (fn) fn(chunk);
    if (typeof chunk === "string") {
      let buffer = allocBuffer(utf8.length(chunk));
      utf8.write(chunk, buffer, 0);
      chunk = buffer;
    }
    this.push(chunk);
  };
  stream.reset = function() {
    stream.length = 0;
  };
  stream.toBuffer = function() {
    var offset = 0, i = 0, k = this.length;
    while (i < k) offset += this[i++].length;
    var buffer = allocBuffer(offset);
    offset = i = 0;
    while (i < k) {
      buffer.set(this[i], offset);
      offset += this[i].length;
      ++i;
    }
    return buffer;
  };
  stream.toString = function() {
    var buffer = this.toBuffer();
    return utf8.read(buffer, 0, buffer.length);
  };
  return stream;
}

exports.createMemoryStream = createMemoryStream;

/** Compatible TypeScript compiler options for syntax highlighting etc. */
exports.tscOptions = {
  alwaysStrict: true,
  noImplicitAny: true,
  noImplicitReturns: true,
  noImplicitThis: true,
  noEmitOnError: true,
  strictNullChecks: true,
  experimentalDecorators: true,
  target: "esnext",
  module: "commonjs",
  noLib: true,
  types: [],
  allowJs: false
};
