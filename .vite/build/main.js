"use strict";
const require$$3$1 = require("electron");
const path = require("node:path");
const require$$0$1 = require("path");
const require$$1$1 = require("child_process");
const require$$0 = require("tty");
const require$$1 = require("util");
const require$$3 = require("fs");
const require$$4 = require("net");
const crypto$1 = require("node:crypto");
const fs = require("node:fs");
const Client = require("better-sqlite3");
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var src = { exports: {} };
var browser = { exports: {} };
var debug = { exports: {} };
var ms;
var hasRequiredMs;
function requireMs() {
  if (hasRequiredMs) return ms;
  hasRequiredMs = 1;
  var s = 1e3;
  var m = s * 60;
  var h = m * 60;
  var d = h * 24;
  var y = d * 365.25;
  ms = function(val, options) {
    options = options || {};
    var type = typeof val;
    if (type === "string" && val.length > 0) {
      return parse2(val);
    } else if (type === "number" && isNaN(val) === false) {
      return options.long ? fmtLong(val) : fmtShort(val);
    }
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
    );
  };
  function parse2(str) {
    str = String(str);
    if (str.length > 100) {
      return;
    }
    var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(
      str
    );
    if (!match) {
      return;
    }
    var n = parseFloat(match[1]);
    var type = (match[2] || "ms").toLowerCase();
    switch (type) {
      case "years":
      case "year":
      case "yrs":
      case "yr":
      case "y":
        return n * y;
      case "days":
      case "day":
      case "d":
        return n * d;
      case "hours":
      case "hour":
      case "hrs":
      case "hr":
      case "h":
        return n * h;
      case "minutes":
      case "minute":
      case "mins":
      case "min":
      case "m":
        return n * m;
      case "seconds":
      case "second":
      case "secs":
      case "sec":
      case "s":
        return n * s;
      case "milliseconds":
      case "millisecond":
      case "msecs":
      case "msec":
      case "ms":
        return n;
      default:
        return void 0;
    }
  }
  function fmtShort(ms2) {
    if (ms2 >= d) {
      return Math.round(ms2 / d) + "d";
    }
    if (ms2 >= h) {
      return Math.round(ms2 / h) + "h";
    }
    if (ms2 >= m) {
      return Math.round(ms2 / m) + "m";
    }
    if (ms2 >= s) {
      return Math.round(ms2 / s) + "s";
    }
    return ms2 + "ms";
  }
  function fmtLong(ms2) {
    return plural(ms2, d, "day") || plural(ms2, h, "hour") || plural(ms2, m, "minute") || plural(ms2, s, "second") || ms2 + " ms";
  }
  function plural(ms2, n, name) {
    if (ms2 < n) {
      return;
    }
    if (ms2 < n * 1.5) {
      return Math.floor(ms2 / n) + " " + name;
    }
    return Math.ceil(ms2 / n) + " " + name + "s";
  }
  return ms;
}
var hasRequiredDebug;
function requireDebug() {
  if (hasRequiredDebug) return debug.exports;
  hasRequiredDebug = 1;
  (function(module, exports) {
    exports = module.exports = createDebug.debug = createDebug["default"] = createDebug;
    exports.coerce = coerce;
    exports.disable = disable;
    exports.enable = enable;
    exports.enabled = enabled;
    exports.humanize = requireMs();
    exports.names = [];
    exports.skips = [];
    exports.formatters = {};
    var prevTime;
    function selectColor(namespace) {
      var hash = 0, i;
      for (i in namespace) {
        hash = (hash << 5) - hash + namespace.charCodeAt(i);
        hash |= 0;
      }
      return exports.colors[Math.abs(hash) % exports.colors.length];
    }
    function createDebug(namespace) {
      function debug2() {
        if (!debug2.enabled) return;
        var self = debug2;
        var curr = +/* @__PURE__ */ new Date();
        var ms2 = curr - (prevTime || curr);
        self.diff = ms2;
        self.prev = prevTime;
        self.curr = curr;
        prevTime = curr;
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }
        args[0] = exports.coerce(args[0]);
        if ("string" !== typeof args[0]) {
          args.unshift("%O");
        }
        var index2 = 0;
        args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
          if (match === "%%") return match;
          index2++;
          var formatter = exports.formatters[format];
          if ("function" === typeof formatter) {
            var val = args[index2];
            match = formatter.call(self, val);
            args.splice(index2, 1);
            index2--;
          }
          return match;
        });
        exports.formatArgs.call(self, args);
        var logFn = debug2.log || exports.log || console.log.bind(console);
        logFn.apply(self, args);
      }
      debug2.namespace = namespace;
      debug2.enabled = exports.enabled(namespace);
      debug2.useColors = exports.useColors();
      debug2.color = selectColor(namespace);
      if ("function" === typeof exports.init) {
        exports.init(debug2);
      }
      return debug2;
    }
    function enable(namespaces) {
      exports.save(namespaces);
      exports.names = [];
      exports.skips = [];
      var split = (typeof namespaces === "string" ? namespaces : "").split(/[\s,]+/);
      var len = split.length;
      for (var i = 0; i < len; i++) {
        if (!split[i]) continue;
        namespaces = split[i].replace(/\*/g, ".*?");
        if (namespaces[0] === "-") {
          exports.skips.push(new RegExp("^" + namespaces.substr(1) + "$"));
        } else {
          exports.names.push(new RegExp("^" + namespaces + "$"));
        }
      }
    }
    function disable() {
      exports.enable("");
    }
    function enabled(name) {
      var i, len;
      for (i = 0, len = exports.skips.length; i < len; i++) {
        if (exports.skips[i].test(name)) {
          return false;
        }
      }
      for (i = 0, len = exports.names.length; i < len; i++) {
        if (exports.names[i].test(name)) {
          return true;
        }
      }
      return false;
    }
    function coerce(val) {
      if (val instanceof Error) return val.stack || val.message;
      return val;
    }
  })(debug, debug.exports);
  return debug.exports;
}
var hasRequiredBrowser;
function requireBrowser() {
  if (hasRequiredBrowser) return browser.exports;
  hasRequiredBrowser = 1;
  (function(module, exports) {
    exports = module.exports = requireDebug();
    exports.log = log;
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.storage = "undefined" != typeof chrome && "undefined" != typeof chrome.storage ? chrome.storage.local : localstorage();
    exports.colors = [
      "lightseagreen",
      "forestgreen",
      "goldenrod",
      "dodgerblue",
      "darkorchid",
      "crimson"
    ];
    function useColors() {
      if (typeof window !== "undefined" && window.process && window.process.type === "renderer") {
        return true;
      }
      return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // is firebug? http://stackoverflow.com/a/398120/376773
      typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || // double check webkit in userAgent just in case we are in a worker
      typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    exports.formatters.j = function(v) {
      try {
        return JSON.stringify(v);
      } catch (err) {
        return "[UnexpectedJSONParseError]: " + err.message;
      }
    };
    function formatArgs(args) {
      var useColors2 = this.useColors;
      args[0] = (useColors2 ? "%c" : "") + this.namespace + (useColors2 ? " %c" : " ") + args[0] + (useColors2 ? "%c " : " ") + "+" + exports.humanize(this.diff);
      if (!useColors2) return;
      var c = "color: " + this.color;
      args.splice(1, 0, c, "color: inherit");
      var index2 = 0;
      var lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, function(match) {
        if ("%%" === match) return;
        index2++;
        if ("%c" === match) {
          lastC = index2;
        }
      });
      args.splice(lastC, 0, c);
    }
    function log() {
      return "object" === typeof console && console.log && Function.prototype.apply.call(console.log, console, arguments);
    }
    function save(namespaces) {
      try {
        if (null == namespaces) {
          exports.storage.removeItem("debug");
        } else {
          exports.storage.debug = namespaces;
        }
      } catch (e) {
      }
    }
    function load() {
      var r;
      try {
        r = exports.storage.debug;
      } catch (e) {
      }
      if (!r && typeof process !== "undefined" && "env" in process) {
        r = process.env.DEBUG;
      }
      return r;
    }
    exports.enable(load());
    function localstorage() {
      try {
        return window.localStorage;
      } catch (e) {
      }
    }
  })(browser, browser.exports);
  return browser.exports;
}
var node = { exports: {} };
var hasRequiredNode;
function requireNode() {
  if (hasRequiredNode) return node.exports;
  hasRequiredNode = 1;
  (function(module, exports) {
    var tty = require$$0;
    var util = require$$1;
    exports = module.exports = requireDebug();
    exports.init = init;
    exports.log = log;
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.colors = [6, 2, 3, 4, 5, 1];
    exports.inspectOpts = Object.keys(process.env).filter(function(key) {
      return /^debug_/i.test(key);
    }).reduce(function(obj, key) {
      var prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, function(_, k) {
        return k.toUpperCase();
      });
      var val = process.env[key];
      if (/^(yes|on|true|enabled)$/i.test(val)) val = true;
      else if (/^(no|off|false|disabled)$/i.test(val)) val = false;
      else if (val === "null") val = null;
      else val = Number(val);
      obj[prop] = val;
      return obj;
    }, {});
    var fd = parseInt(process.env.DEBUG_FD, 10) || 2;
    if (1 !== fd && 2 !== fd) {
      util.deprecate(function() {
      }, "except for stderr(2) and stdout(1), any other usage of DEBUG_FD is deprecated. Override debug.log if you want to use a different log function (https://git.io/debug_fd)")();
    }
    var stream = 1 === fd ? process.stdout : 2 === fd ? process.stderr : createWritableStdioStream(fd);
    function useColors() {
      return "colors" in exports.inspectOpts ? Boolean(exports.inspectOpts.colors) : tty.isatty(fd);
    }
    exports.formatters.o = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v, this.inspectOpts).split("\n").map(function(str) {
        return str.trim();
      }).join(" ");
    };
    exports.formatters.O = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v, this.inspectOpts);
    };
    function formatArgs(args) {
      var name = this.namespace;
      var useColors2 = this.useColors;
      if (useColors2) {
        var c = this.color;
        var prefix = "  \x1B[3" + c + ";1m" + name + " \x1B[0m";
        args[0] = prefix + args[0].split("\n").join("\n" + prefix);
        args.push("\x1B[3" + c + "m+" + exports.humanize(this.diff) + "\x1B[0m");
      } else {
        args[0] = (/* @__PURE__ */ new Date()).toUTCString() + " " + name + " " + args[0];
      }
    }
    function log() {
      return stream.write(util.format.apply(util, arguments) + "\n");
    }
    function save(namespaces) {
      if (null == namespaces) {
        delete process.env.DEBUG;
      } else {
        process.env.DEBUG = namespaces;
      }
    }
    function load() {
      return process.env.DEBUG;
    }
    function createWritableStdioStream(fd2) {
      var stream2;
      var tty_wrap = process.binding("tty_wrap");
      switch (tty_wrap.guessHandleType(fd2)) {
        case "TTY":
          stream2 = new tty.WriteStream(fd2);
          stream2._type = "tty";
          if (stream2._handle && stream2._handle.unref) {
            stream2._handle.unref();
          }
          break;
        case "FILE":
          var fs2 = require$$3;
          stream2 = new fs2.SyncWriteStream(fd2, { autoClose: false });
          stream2._type = "fs";
          break;
        case "PIPE":
        case "TCP":
          var net = require$$4;
          stream2 = new net.Socket({
            fd: fd2,
            readable: false,
            writable: true
          });
          stream2.readable = false;
          stream2.read = null;
          stream2._type = "pipe";
          if (stream2._handle && stream2._handle.unref) {
            stream2._handle.unref();
          }
          break;
        default:
          throw new Error("Implement me. Unknown stream file type!");
      }
      stream2.fd = fd2;
      stream2._isStdio = true;
      return stream2;
    }
    function init(debug2) {
      debug2.inspectOpts = {};
      var keys = Object.keys(exports.inspectOpts);
      for (var i = 0; i < keys.length; i++) {
        debug2.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
      }
    }
    exports.enable(load());
  })(node, node.exports);
  return node.exports;
}
var hasRequiredSrc;
function requireSrc() {
  if (hasRequiredSrc) return src.exports;
  hasRequiredSrc = 1;
  if (typeof process !== "undefined" && process.type === "renderer") {
    src.exports = requireBrowser();
  } else {
    src.exports = requireNode();
  }
  return src.exports;
}
var electronSquirrelStartup;
var hasRequiredElectronSquirrelStartup;
function requireElectronSquirrelStartup() {
  if (hasRequiredElectronSquirrelStartup) return electronSquirrelStartup;
  hasRequiredElectronSquirrelStartup = 1;
  var path2 = require$$0$1;
  var spawn = require$$1$1.spawn;
  var debug2 = requireSrc()("electron-squirrel-startup");
  var app = require$$3$1.app;
  var run = function(args, done) {
    var updateExe = path2.resolve(path2.dirname(process.execPath), "..", "Update.exe");
    debug2("Spawning `%s` with args `%s`", updateExe, args);
    spawn(updateExe, args, {
      detached: true
    }).on("close", done);
  };
  var check = function() {
    if (process.platform === "win32") {
      var cmd = process.argv[1];
      debug2("processing squirrel command `%s`", cmd);
      var target = path2.basename(process.execPath);
      if (cmd === "--squirrel-install" || cmd === "--squirrel-updated") {
        run(["--createShortcut=" + target], app.quit);
        return true;
      }
      if (cmd === "--squirrel-uninstall") {
        run(["--removeShortcut=" + target], app.quit);
        return true;
      }
      if (cmd === "--squirrel-obsolete") {
        app.quit();
        return true;
      }
    }
    return false;
  };
  electronSquirrelStartup = check();
  return electronSquirrelStartup;
}
var electronSquirrelStartupExports = requireElectronSquirrelStartup();
const started = /* @__PURE__ */ getDefaultExportFromCjs(electronSquirrelStartupExports);
function readMigrationFiles(config2) {
  const migrationFolderTo = config2.migrationsFolder;
  const migrationQueries = [];
  const journalPath = `${migrationFolderTo}/meta/_journal.json`;
  if (!fs.existsSync(journalPath)) {
    throw new Error(`Can't find meta/_journal.json file`);
  }
  const journalAsString = fs.readFileSync(`${migrationFolderTo}/meta/_journal.json`).toString();
  const journal = JSON.parse(journalAsString);
  for (const journalEntry of journal.entries) {
    const migrationPath = `${migrationFolderTo}/${journalEntry.tag}.sql`;
    try {
      const query = fs.readFileSync(`${migrationFolderTo}/${journalEntry.tag}.sql`).toString();
      const result = query.split("--> statement-breakpoint").map((it) => {
        return it;
      });
      migrationQueries.push({
        sql: result,
        bps: journalEntry.breakpoints,
        folderMillis: journalEntry.when,
        hash: crypto$1.createHash("sha256").update(query).digest("hex")
      });
    } catch {
      throw new Error(`No file ${migrationPath} found in ${migrationFolderTo} folder`);
    }
  }
  return migrationQueries;
}
function migrate(db, config2) {
  const migrations = readMigrationFiles(config2);
  db.dialect.migrate(migrations, db.session, config2);
}
const entityKind = /* @__PURE__ */ Symbol.for("drizzle:entityKind");
function is(value, type) {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (value instanceof type) {
    return true;
  }
  if (!Object.prototype.hasOwnProperty.call(type, entityKind)) {
    throw new Error(
      `Class "${type.name ?? "<unknown>"}" doesn't look like a Drizzle entity. If this is incorrect and the class is provided by Drizzle, please report this as a bug.`
    );
  }
  let cls = Object.getPrototypeOf(value).constructor;
  if (cls) {
    while (cls) {
      if (entityKind in cls && cls[entityKind] === type[entityKind]) {
        return true;
      }
      cls = Object.getPrototypeOf(cls);
    }
  }
  return false;
}
class ConsoleLogWriter {
  static [entityKind] = "ConsoleLogWriter";
  write(message) {
    console.log(message);
  }
}
class DefaultLogger {
  static [entityKind] = "DefaultLogger";
  writer;
  constructor(config2) {
    this.writer = config2?.writer ?? new ConsoleLogWriter();
  }
  logQuery(query, params) {
    const stringifiedParams = params.map((p) => {
      try {
        return JSON.stringify(p);
      } catch {
        return String(p);
      }
    });
    const paramsStr = stringifiedParams.length ? ` -- params: [${stringifiedParams.join(", ")}]` : "";
    this.writer.write(`Query: ${query}${paramsStr}`);
  }
}
class NoopLogger {
  static [entityKind] = "NoopLogger";
  logQuery() {
  }
}
const TableName = /* @__PURE__ */ Symbol.for("drizzle:Name");
const Schema = /* @__PURE__ */ Symbol.for("drizzle:Schema");
const Columns = /* @__PURE__ */ Symbol.for("drizzle:Columns");
const ExtraConfigColumns = /* @__PURE__ */ Symbol.for("drizzle:ExtraConfigColumns");
const OriginalName = /* @__PURE__ */ Symbol.for("drizzle:OriginalName");
const BaseName = /* @__PURE__ */ Symbol.for("drizzle:BaseName");
const IsAlias = /* @__PURE__ */ Symbol.for("drizzle:IsAlias");
const ExtraConfigBuilder = /* @__PURE__ */ Symbol.for("drizzle:ExtraConfigBuilder");
const IsDrizzleTable = /* @__PURE__ */ Symbol.for("drizzle:IsDrizzleTable");
class Table {
  static [entityKind] = "Table";
  /** @internal */
  static Symbol = {
    Name: TableName,
    Schema,
    OriginalName,
    Columns,
    ExtraConfigColumns,
    BaseName,
    IsAlias,
    ExtraConfigBuilder
  };
  /**
   * @internal
   * Can be changed if the table is aliased.
   */
  [TableName];
  /**
   * @internal
   * Used to store the original name of the table, before any aliasing.
   */
  [OriginalName];
  /** @internal */
  [Schema];
  /** @internal */
  [Columns];
  /** @internal */
  [ExtraConfigColumns];
  /**
   *  @internal
   * Used to store the table name before the transformation via the `tableCreator` functions.
   */
  [BaseName];
  /** @internal */
  [IsAlias] = false;
  /** @internal */
  [IsDrizzleTable] = true;
  /** @internal */
  [ExtraConfigBuilder] = void 0;
  constructor(name, schema2, baseName) {
    this[TableName] = this[OriginalName] = name;
    this[Schema] = schema2;
    this[BaseName] = baseName;
  }
}
function getTableName(table) {
  return table[TableName];
}
function getTableUniqueName(table) {
  return `${table[Schema] ?? "public"}.${table[TableName]}`;
}
class Column {
  constructor(table, config2) {
    this.table = table;
    this.config = config2;
    this.name = config2.name;
    this.keyAsName = config2.keyAsName;
    this.notNull = config2.notNull;
    this.default = config2.default;
    this.defaultFn = config2.defaultFn;
    this.onUpdateFn = config2.onUpdateFn;
    this.hasDefault = config2.hasDefault;
    this.primary = config2.primaryKey;
    this.isUnique = config2.isUnique;
    this.uniqueName = config2.uniqueName;
    this.uniqueType = config2.uniqueType;
    this.dataType = config2.dataType;
    this.columnType = config2.columnType;
    this.generated = config2.generated;
    this.generatedIdentity = config2.generatedIdentity;
  }
  static [entityKind] = "Column";
  name;
  keyAsName;
  primary;
  notNull;
  default;
  defaultFn;
  onUpdateFn;
  hasDefault;
  isUnique;
  uniqueName;
  uniqueType;
  dataType;
  columnType;
  enumValues = void 0;
  generated = void 0;
  generatedIdentity = void 0;
  config;
  mapFromDriverValue(value) {
    return value;
  }
  mapToDriverValue(value) {
    return value;
  }
  // ** @internal */
  shouldDisableInsert() {
    return this.config.generated !== void 0 && this.config.generated.type !== "byDefault";
  }
}
class ColumnBuilder {
  static [entityKind] = "ColumnBuilder";
  config;
  constructor(name, dataType, columnType) {
    this.config = {
      name,
      keyAsName: name === "",
      notNull: false,
      default: void 0,
      hasDefault: false,
      primaryKey: false,
      isUnique: false,
      uniqueName: void 0,
      uniqueType: void 0,
      dataType,
      columnType,
      generated: void 0
    };
  }
  /**
   * Changes the data type of the column. Commonly used with `json` columns. Also, useful for branded types.
   *
   * @example
   * ```ts
   * const users = pgTable('users', {
   * 	id: integer('id').$type<UserId>().primaryKey(),
   * 	details: json('details').$type<UserDetails>().notNull(),
   * });
   * ```
   */
  $type() {
    return this;
  }
  /**
   * Adds a `not null` clause to the column definition.
   *
   * Affects the `select` model of the table - columns *without* `not null` will be nullable on select.
   */
  notNull() {
    this.config.notNull = true;
    return this;
  }
  /**
   * Adds a `default <value>` clause to the column definition.
   *
   * Affects the `insert` model of the table - columns *with* `default` are optional on insert.
   *
   * If you need to set a dynamic default value, use {@link $defaultFn} instead.
   */
  default(value) {
    this.config.default = value;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Adds a dynamic default value to the column.
   * The function will be called when the row is inserted, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $defaultFn(fn) {
    this.config.defaultFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $defaultFn}.
   */
  $default = this.$defaultFn;
  /**
   * Adds a dynamic update value to the column.
   * The function will be called when the row is updated, and the returned value will be used as the column value if none is provided.
   * If no `default` (or `$defaultFn`) value is provided, the function will be called when the row is inserted as well, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $onUpdateFn(fn) {
    this.config.onUpdateFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $onUpdateFn}.
   */
  $onUpdate = this.$onUpdateFn;
  /**
   * Adds a `primary key` clause to the column definition. This implicitly makes the column `not null`.
   *
   * In SQLite, `integer primary key` implicitly makes the column auto-incrementing.
   */
  primaryKey() {
    this.config.primaryKey = true;
    this.config.notNull = true;
    return this;
  }
  /** @internal Sets the name of the column to the key within the table definition if a name was not given. */
  setName(name) {
    if (this.config.name !== "") return;
    this.config.name = name;
  }
}
const isPgEnumSym = /* @__PURE__ */ Symbol.for("drizzle:isPgEnum");
function isPgEnum(obj) {
  return !!obj && typeof obj === "function" && isPgEnumSym in obj && obj[isPgEnumSym] === true;
}
class Subquery {
  static [entityKind] = "Subquery";
  constructor(sql2, fields, alias, isWith = false, usedTables = []) {
    this._ = {
      brand: "Subquery",
      sql: sql2,
      selectedFields: fields,
      alias,
      isWith,
      usedTables
    };
  }
  // getSQL(): SQL<unknown> {
  // 	return new SQL([this]);
  // }
}
class WithSubquery extends Subquery {
  static [entityKind] = "WithSubquery";
}
const tracer = {
  startActiveSpan(name, fn) {
    {
      return fn();
    }
  }
};
const ViewBaseConfig = /* @__PURE__ */ Symbol.for("drizzle:ViewBaseConfig");
function isSQLWrapper(value) {
  return value !== null && value !== void 0 && typeof value.getSQL === "function";
}
function mergeQueries(queries) {
  const result = { sql: "", params: [] };
  for (const query of queries) {
    result.sql += query.sql;
    result.params.push(...query.params);
    if (query.typings?.length) {
      if (!result.typings) {
        result.typings = [];
      }
      result.typings.push(...query.typings);
    }
  }
  return result;
}
class StringChunk {
  static [entityKind] = "StringChunk";
  value;
  constructor(value) {
    this.value = Array.isArray(value) ? value : [value];
  }
  getSQL() {
    return new SQL([this]);
  }
}
class SQL {
  constructor(queryChunks) {
    this.queryChunks = queryChunks;
    for (const chunk of queryChunks) {
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        this.usedTables.push(
          schemaName === void 0 ? chunk[Table.Symbol.Name] : schemaName + "." + chunk[Table.Symbol.Name]
        );
      }
    }
  }
  static [entityKind] = "SQL";
  /** @internal */
  decoder = noopDecoder;
  shouldInlineParams = false;
  /** @internal */
  usedTables = [];
  append(query) {
    this.queryChunks.push(...query.queryChunks);
    return this;
  }
  toQuery(config2) {
    return tracer.startActiveSpan("drizzle.buildSQL", (span) => {
      const query = this.buildQueryFromSourceParams(this.queryChunks, config2);
      span?.setAttributes({
        "drizzle.query.text": query.sql,
        "drizzle.query.params": JSON.stringify(query.params)
      });
      return query;
    });
  }
  buildQueryFromSourceParams(chunks, _config) {
    const config2 = Object.assign({}, _config, {
      inlineParams: _config.inlineParams || this.shouldInlineParams,
      paramStartIndex: _config.paramStartIndex || { value: 0 }
    });
    const {
      casing,
      escapeName,
      escapeParam,
      prepareTyping,
      inlineParams,
      paramStartIndex
    } = config2;
    return mergeQueries(chunks.map((chunk) => {
      if (is(chunk, StringChunk)) {
        return { sql: chunk.value.join(""), params: [] };
      }
      if (is(chunk, Name)) {
        return { sql: escapeName(chunk.value), params: [] };
      }
      if (chunk === void 0) {
        return { sql: "", params: [] };
      }
      if (Array.isArray(chunk)) {
        const result = [new StringChunk("(")];
        for (const [i, p] of chunk.entries()) {
          result.push(p);
          if (i < chunk.length - 1) {
            result.push(new StringChunk(", "));
          }
        }
        result.push(new StringChunk(")"));
        return this.buildQueryFromSourceParams(result, config2);
      }
      if (is(chunk, SQL)) {
        return this.buildQueryFromSourceParams(chunk.queryChunks, {
          ...config2,
          inlineParams: inlineParams || chunk.shouldInlineParams
        });
      }
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        const tableName = chunk[Table.Symbol.Name];
        return {
          sql: schemaName === void 0 || chunk[IsAlias] ? escapeName(tableName) : escapeName(schemaName) + "." + escapeName(tableName),
          params: []
        };
      }
      if (is(chunk, Column)) {
        const columnName = casing.getColumnCasing(chunk);
        if (_config.invokeSource === "indexes") {
          return { sql: escapeName(columnName), params: [] };
        }
        const schemaName = chunk.table[Table.Symbol.Schema];
        return {
          sql: chunk.table[IsAlias] || schemaName === void 0 ? escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName) : escapeName(schemaName) + "." + escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName),
          params: []
        };
      }
      if (is(chunk, View)) {
        const schemaName = chunk[ViewBaseConfig].schema;
        const viewName = chunk[ViewBaseConfig].name;
        return {
          sql: schemaName === void 0 || chunk[ViewBaseConfig].isAlias ? escapeName(viewName) : escapeName(schemaName) + "." + escapeName(viewName),
          params: []
        };
      }
      if (is(chunk, Param)) {
        if (is(chunk.value, Placeholder)) {
          return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
        }
        const mappedValue = chunk.value === null ? null : chunk.encoder.mapToDriverValue(chunk.value);
        if (is(mappedValue, SQL)) {
          return this.buildQueryFromSourceParams([mappedValue], config2);
        }
        if (inlineParams) {
          return { sql: this.mapInlineParam(mappedValue, config2), params: [] };
        }
        let typings = ["none"];
        if (prepareTyping) {
          typings = [prepareTyping(chunk.encoder)];
        }
        return { sql: escapeParam(paramStartIndex.value++, mappedValue), params: [mappedValue], typings };
      }
      if (is(chunk, Placeholder)) {
        return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
      }
      if (is(chunk, SQL.Aliased) && chunk.fieldAlias !== void 0) {
        return { sql: escapeName(chunk.fieldAlias), params: [] };
      }
      if (is(chunk, Subquery)) {
        if (chunk._.isWith) {
          return { sql: escapeName(chunk._.alias), params: [] };
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk._.sql,
          new StringChunk(") "),
          new Name(chunk._.alias)
        ], config2);
      }
      if (isPgEnum(chunk)) {
        if (chunk.schema) {
          return { sql: escapeName(chunk.schema) + "." + escapeName(chunk.enumName), params: [] };
        }
        return { sql: escapeName(chunk.enumName), params: [] };
      }
      if (isSQLWrapper(chunk)) {
        if (chunk.shouldOmitSQLParens?.()) {
          return this.buildQueryFromSourceParams([chunk.getSQL()], config2);
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk.getSQL(),
          new StringChunk(")")
        ], config2);
      }
      if (inlineParams) {
        return { sql: this.mapInlineParam(chunk, config2), params: [] };
      }
      return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
    }));
  }
  mapInlineParam(chunk, { escapeString }) {
    if (chunk === null) {
      return "null";
    }
    if (typeof chunk === "number" || typeof chunk === "boolean") {
      return chunk.toString();
    }
    if (typeof chunk === "string") {
      return escapeString(chunk);
    }
    if (typeof chunk === "object") {
      const mappedValueAsString = chunk.toString();
      if (mappedValueAsString === "[object Object]") {
        return escapeString(JSON.stringify(chunk));
      }
      return escapeString(mappedValueAsString);
    }
    throw new Error("Unexpected param value: " + chunk);
  }
  getSQL() {
    return this;
  }
  as(alias) {
    if (alias === void 0) {
      return this;
    }
    return new SQL.Aliased(this, alias);
  }
  mapWith(decoder) {
    this.decoder = typeof decoder === "function" ? { mapFromDriverValue: decoder } : decoder;
    return this;
  }
  inlineParams() {
    this.shouldInlineParams = true;
    return this;
  }
  /**
   * This method is used to conditionally include a part of the query.
   *
   * @param condition - Condition to check
   * @returns itself if the condition is `true`, otherwise `undefined`
   */
  if(condition) {
    return condition ? this : void 0;
  }
}
class Name {
  constructor(value) {
    this.value = value;
  }
  static [entityKind] = "Name";
  brand;
  getSQL() {
    return new SQL([this]);
  }
}
function isDriverValueEncoder(value) {
  return typeof value === "object" && value !== null && "mapToDriverValue" in value && typeof value.mapToDriverValue === "function";
}
const noopDecoder = {
  mapFromDriverValue: (value) => value
};
const noopEncoder = {
  mapToDriverValue: (value) => value
};
({
  ...noopDecoder,
  ...noopEncoder
});
class Param {
  /**
   * @param value - Parameter value
   * @param encoder - Encoder to convert the value to a driver parameter
   */
  constructor(value, encoder = noopEncoder) {
    this.value = value;
    this.encoder = encoder;
  }
  static [entityKind] = "Param";
  brand;
  getSQL() {
    return new SQL([this]);
  }
}
function sql(strings, ...params) {
  const queryChunks = [];
  if (params.length > 0 || strings.length > 0 && strings[0] !== "") {
    queryChunks.push(new StringChunk(strings[0]));
  }
  for (const [paramIndex, param2] of params.entries()) {
    queryChunks.push(param2, new StringChunk(strings[paramIndex + 1]));
  }
  return new SQL(queryChunks);
}
((sql2) => {
  function empty() {
    return new SQL([]);
  }
  sql2.empty = empty;
  function fromList(list) {
    return new SQL(list);
  }
  sql2.fromList = fromList;
  function raw(str) {
    return new SQL([new StringChunk(str)]);
  }
  sql2.raw = raw;
  function join(chunks, separator) {
    const result = [];
    for (const [i, chunk] of chunks.entries()) {
      if (i > 0 && separator !== void 0) {
        result.push(separator);
      }
      result.push(chunk);
    }
    return new SQL(result);
  }
  sql2.join = join;
  function identifier(value) {
    return new Name(value);
  }
  sql2.identifier = identifier;
  function placeholder2(name2) {
    return new Placeholder(name2);
  }
  sql2.placeholder = placeholder2;
  function param2(value, encoder) {
    return new Param(value, encoder);
  }
  sql2.param = param2;
})(sql || (sql = {}));
((SQL2) => {
  class Aliased {
    constructor(sql2, fieldAlias) {
      this.sql = sql2;
      this.fieldAlias = fieldAlias;
    }
    static [entityKind] = "SQL.Aliased";
    /** @internal */
    isSelectionField = false;
    getSQL() {
      return this.sql;
    }
    /** @internal */
    clone() {
      return new Aliased(this.sql, this.fieldAlias);
    }
  }
  SQL2.Aliased = Aliased;
})(SQL || (SQL = {}));
class Placeholder {
  constructor(name2) {
    this.name = name2;
  }
  static [entityKind] = "Placeholder";
  getSQL() {
    return new SQL([this]);
  }
}
function fillPlaceholders(params, values) {
  return params.map((p) => {
    if (is(p, Placeholder)) {
      if (!(p.name in values)) {
        throw new Error(`No value for placeholder "${p.name}" was provided`);
      }
      return values[p.name];
    }
    if (is(p, Param) && is(p.value, Placeholder)) {
      if (!(p.value.name in values)) {
        throw new Error(`No value for placeholder "${p.value.name}" was provided`);
      }
      return p.encoder.mapToDriverValue(values[p.value.name]);
    }
    return p;
  });
}
const IsDrizzleView = /* @__PURE__ */ Symbol.for("drizzle:IsDrizzleView");
class View {
  static [entityKind] = "View";
  /** @internal */
  [ViewBaseConfig];
  /** @internal */
  [IsDrizzleView] = true;
  constructor({ name: name2, schema: schema2, selectedFields, query }) {
    this[ViewBaseConfig] = {
      name: name2,
      originalName: name2,
      schema: schema2,
      selectedFields,
      query,
      isExisting: !query,
      isAlias: false
    };
  }
  getSQL() {
    return new SQL([this]);
  }
}
Column.prototype.getSQL = function() {
  return new SQL([this]);
};
Table.prototype.getSQL = function() {
  return new SQL([this]);
};
Subquery.prototype.getSQL = function() {
  return new SQL([this]);
};
function mapResultRow(columns, row, joinsNotNullableMap) {
  const nullifyMap = {};
  const result = columns.reduce(
    (result2, { path: path2, field }, columnIndex) => {
      let decoder;
      if (is(field, Column)) {
        decoder = field;
      } else if (is(field, SQL)) {
        decoder = field.decoder;
      } else if (is(field, Subquery)) {
        decoder = field._.sql.decoder;
      } else {
        decoder = field.sql.decoder;
      }
      let node2 = result2;
      for (const [pathChunkIndex, pathChunk] of path2.entries()) {
        if (pathChunkIndex < path2.length - 1) {
          if (!(pathChunk in node2)) {
            node2[pathChunk] = {};
          }
          node2 = node2[pathChunk];
        } else {
          const rawValue = row[columnIndex];
          const value = node2[pathChunk] = rawValue === null ? null : decoder.mapFromDriverValue(rawValue);
          if (joinsNotNullableMap && is(field, Column) && path2.length === 2) {
            const objectName = path2[0];
            if (!(objectName in nullifyMap)) {
              nullifyMap[objectName] = value === null ? getTableName(field.table) : false;
            } else if (typeof nullifyMap[objectName] === "string" && nullifyMap[objectName] !== getTableName(field.table)) {
              nullifyMap[objectName] = false;
            }
          }
        }
      }
      return result2;
    },
    {}
  );
  if (joinsNotNullableMap && Object.keys(nullifyMap).length > 0) {
    for (const [objectName, tableName] of Object.entries(nullifyMap)) {
      if (typeof tableName === "string" && !joinsNotNullableMap[tableName]) {
        result[objectName] = null;
      }
    }
  }
  return result;
}
function orderSelectedFields(fields, pathPrefix) {
  return Object.entries(fields).reduce((result, [name, field]) => {
    if (typeof name !== "string") {
      return result;
    }
    const newPath = pathPrefix ? [...pathPrefix, name] : [name];
    if (is(field, Column) || is(field, SQL) || is(field, SQL.Aliased) || is(field, Subquery)) {
      result.push({ path: newPath, field });
    } else if (is(field, Table)) {
      result.push(...orderSelectedFields(field[Table.Symbol.Columns], newPath));
    } else {
      result.push(...orderSelectedFields(field, newPath));
    }
    return result;
  }, []);
}
function haveSameKeys(left, right) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  for (const [index2, key] of leftKeys.entries()) {
    if (key !== rightKeys[index2]) {
      return false;
    }
  }
  return true;
}
function mapUpdateSet(table, values) {
  const entries = Object.entries(values).filter(([, value]) => value !== void 0).map(([key, value]) => {
    if (is(value, SQL) || is(value, Column)) {
      return [key, value];
    } else {
      return [key, new Param(value, table[Table.Symbol.Columns][key])];
    }
  });
  if (entries.length === 0) {
    throw new Error("No values to set");
  }
  return Object.fromEntries(entries);
}
function applyMixins(baseClass, extendedClasses) {
  for (const extendedClass of extendedClasses) {
    for (const name of Object.getOwnPropertyNames(extendedClass.prototype)) {
      if (name === "constructor") continue;
      Object.defineProperty(
        baseClass.prototype,
        name,
        Object.getOwnPropertyDescriptor(extendedClass.prototype, name) || /* @__PURE__ */ Object.create(null)
      );
    }
  }
}
function getTableColumns(table) {
  return table[Table.Symbol.Columns];
}
function getTableLikeName(table) {
  return is(table, Subquery) ? table._.alias : is(table, View) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : table[Table.Symbol.IsAlias] ? table[Table.Symbol.Name] : table[Table.Symbol.BaseName];
}
function getColumnNameAndConfig(a, b) {
  return {
    name: typeof a === "string" && a.length > 0 ? a : "",
    config: typeof a === "object" ? a : b
  };
}
function isConfig(data) {
  if (typeof data !== "object" || data === null) return false;
  if (data.constructor.name !== "Object") return false;
  if ("logger" in data) {
    const type = typeof data["logger"];
    if (type !== "boolean" && (type !== "object" || typeof data["logger"]["logQuery"] !== "function") && type !== "undefined") return false;
    return true;
  }
  if ("schema" in data) {
    const type = typeof data["schema"];
    if (type !== "object" && type !== "undefined") return false;
    return true;
  }
  if ("casing" in data) {
    const type = typeof data["casing"];
    if (type !== "string" && type !== "undefined") return false;
    return true;
  }
  if ("mode" in data) {
    if (data["mode"] !== "default" || data["mode"] !== "planetscale" || data["mode"] !== void 0) return false;
    return true;
  }
  if ("connection" in data) {
    const type = typeof data["connection"];
    if (type !== "string" && type !== "object" && type !== "undefined") return false;
    return true;
  }
  if ("client" in data) {
    const type = typeof data["client"];
    if (type !== "object" && type !== "function" && type !== "undefined") return false;
    return true;
  }
  if (Object.keys(data).length === 0) return true;
  return false;
}
const textDecoder = typeof TextDecoder === "undefined" ? null : new TextDecoder();
const InlineForeignKeys$1 = /* @__PURE__ */ Symbol.for("drizzle:PgInlineForeignKeys");
const EnableRLS = /* @__PURE__ */ Symbol.for("drizzle:EnableRLS");
class PgTable extends Table {
  static [entityKind] = "PgTable";
  /** @internal */
  static Symbol = Object.assign({}, Table.Symbol, {
    InlineForeignKeys: InlineForeignKeys$1,
    EnableRLS
  });
  /**@internal */
  [InlineForeignKeys$1] = [];
  /** @internal */
  [EnableRLS] = false;
  /** @internal */
  [Table.Symbol.ExtraConfigBuilder] = void 0;
  /** @internal */
  [Table.Symbol.ExtraConfigColumns] = {};
}
class PrimaryKeyBuilder {
  static [entityKind] = "PgPrimaryKeyBuilder";
  /** @internal */
  columns;
  /** @internal */
  name;
  constructor(columns, name) {
    this.columns = columns;
    this.name = name;
  }
  /** @internal */
  build(table) {
    return new PrimaryKey(table, this.columns, this.name);
  }
}
class PrimaryKey {
  constructor(table, columns, name) {
    this.table = table;
    this.columns = columns;
    this.name = name;
  }
  static [entityKind] = "PgPrimaryKey";
  columns;
  name;
  getName() {
    return this.name ?? `${this.table[PgTable.Symbol.Name]}_${this.columns.map((column) => column.name).join("_")}_pk`;
  }
}
function bindIfParam(value, column) {
  if (isDriverValueEncoder(column) && !isSQLWrapper(value) && !is(value, Param) && !is(value, Placeholder) && !is(value, Column) && !is(value, Table) && !is(value, View)) {
    return new Param(value, column);
  }
  return value;
}
const eq = (left, right) => {
  return sql`${left} = ${bindIfParam(right, left)}`;
};
const ne = (left, right) => {
  return sql`${left} <> ${bindIfParam(right, left)}`;
};
function and(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" and ")),
    new StringChunk(")")
  ]);
}
function or(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" or ")),
    new StringChunk(")")
  ]);
}
function not(condition) {
  return sql`not ${condition}`;
}
const gt = (left, right) => {
  return sql`${left} > ${bindIfParam(right, left)}`;
};
const gte = (left, right) => {
  return sql`${left} >= ${bindIfParam(right, left)}`;
};
const lt = (left, right) => {
  return sql`${left} < ${bindIfParam(right, left)}`;
};
const lte = (left, right) => {
  return sql`${left} <= ${bindIfParam(right, left)}`;
};
function inArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return sql`false`;
    }
    return sql`${column} in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} in ${bindIfParam(values, column)}`;
}
function notInArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return sql`true`;
    }
    return sql`${column} not in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} not in ${bindIfParam(values, column)}`;
}
function isNull(value) {
  return sql`${value} is null`;
}
function isNotNull(value) {
  return sql`${value} is not null`;
}
function exists(subquery) {
  return sql`exists ${subquery}`;
}
function notExists(subquery) {
  return sql`not exists ${subquery}`;
}
function between(column, min, max) {
  return sql`${column} between ${bindIfParam(min, column)} and ${bindIfParam(
    max,
    column
  )}`;
}
function notBetween(column, min, max) {
  return sql`${column} not between ${bindIfParam(
    min,
    column
  )} and ${bindIfParam(max, column)}`;
}
function like(column, value) {
  return sql`${column} like ${value}`;
}
function notLike(column, value) {
  return sql`${column} not like ${value}`;
}
function ilike(column, value) {
  return sql`${column} ilike ${value}`;
}
function notIlike(column, value) {
  return sql`${column} not ilike ${value}`;
}
function asc(column) {
  return sql`${column} asc`;
}
function desc(column) {
  return sql`${column} desc`;
}
class Relation {
  constructor(sourceTable, referencedTable, relationName) {
    this.sourceTable = sourceTable;
    this.referencedTable = referencedTable;
    this.relationName = relationName;
    this.referencedTableName = referencedTable[Table.Symbol.Name];
  }
  static [entityKind] = "Relation";
  referencedTableName;
  fieldName;
}
class Relations {
  constructor(table, config2) {
    this.table = table;
    this.config = config2;
  }
  static [entityKind] = "Relations";
}
class One extends Relation {
  constructor(sourceTable, referencedTable, config2, isNullable) {
    super(sourceTable, referencedTable, config2?.relationName);
    this.config = config2;
    this.isNullable = isNullable;
  }
  static [entityKind] = "One";
  withFieldName(fieldName) {
    const relation = new One(
      this.sourceTable,
      this.referencedTable,
      this.config,
      this.isNullable
    );
    relation.fieldName = fieldName;
    return relation;
  }
}
class Many extends Relation {
  constructor(sourceTable, referencedTable, config2) {
    super(sourceTable, referencedTable, config2?.relationName);
    this.config = config2;
  }
  static [entityKind] = "Many";
  withFieldName(fieldName) {
    const relation = new Many(
      this.sourceTable,
      this.referencedTable,
      this.config
    );
    relation.fieldName = fieldName;
    return relation;
  }
}
function getOperators() {
  return {
    and,
    between,
    eq,
    exists,
    gt,
    gte,
    ilike,
    inArray,
    isNull,
    isNotNull,
    like,
    lt,
    lte,
    ne,
    not,
    notBetween,
    notExists,
    notLike,
    notIlike,
    notInArray,
    or,
    sql
  };
}
function getOrderByOperators() {
  return {
    sql,
    asc,
    desc
  };
}
function extractTablesRelationalConfig(schema2, configHelpers) {
  if (Object.keys(schema2).length === 1 && "default" in schema2 && !is(schema2["default"], Table)) {
    schema2 = schema2["default"];
  }
  const tableNamesMap = {};
  const relationsBuffer = {};
  const tablesConfig = {};
  for (const [key, value] of Object.entries(schema2)) {
    if (is(value, Table)) {
      const dbName = getTableUniqueName(value);
      const bufferedRelations = relationsBuffer[dbName];
      tableNamesMap[dbName] = key;
      tablesConfig[key] = {
        tsName: key,
        dbName: value[Table.Symbol.Name],
        schema: value[Table.Symbol.Schema],
        columns: value[Table.Symbol.Columns],
        relations: bufferedRelations?.relations ?? {},
        primaryKey: bufferedRelations?.primaryKey ?? []
      };
      for (const column of Object.values(
        value[Table.Symbol.Columns]
      )) {
        if (column.primary) {
          tablesConfig[key].primaryKey.push(column);
        }
      }
      const extraConfig = value[Table.Symbol.ExtraConfigBuilder]?.(value[Table.Symbol.ExtraConfigColumns]);
      if (extraConfig) {
        for (const configEntry of Object.values(extraConfig)) {
          if (is(configEntry, PrimaryKeyBuilder)) {
            tablesConfig[key].primaryKey.push(...configEntry.columns);
          }
        }
      }
    } else if (is(value, Relations)) {
      const dbName = getTableUniqueName(value.table);
      const tableName = tableNamesMap[dbName];
      const relations2 = value.config(
        configHelpers(value.table)
      );
      let primaryKey;
      for (const [relationName, relation] of Object.entries(relations2)) {
        if (tableName) {
          const tableConfig = tablesConfig[tableName];
          tableConfig.relations[relationName] = relation;
        } else {
          if (!(dbName in relationsBuffer)) {
            relationsBuffer[dbName] = {
              relations: {},
              primaryKey
            };
          }
          relationsBuffer[dbName].relations[relationName] = relation;
        }
      }
    }
  }
  return { tables: tablesConfig, tableNamesMap };
}
function relations(table, relations2) {
  return new Relations(
    table,
    (helpers) => Object.fromEntries(
      Object.entries(relations2(helpers)).map(([key, value]) => [
        key,
        value.withFieldName(key)
      ])
    )
  );
}
function createOne(sourceTable) {
  return function one(table, config2) {
    return new One(
      sourceTable,
      table,
      config2,
      config2?.fields.reduce((res, f) => res && f.notNull, true) ?? false
    );
  };
}
function createMany(sourceTable) {
  return function many(referencedTable, config2) {
    return new Many(sourceTable, referencedTable, config2);
  };
}
function normalizeRelation(schema2, tableNamesMap, relation) {
  if (is(relation, One) && relation.config) {
    return {
      fields: relation.config.fields,
      references: relation.config.references
    };
  }
  const referencedTableTsName = tableNamesMap[getTableUniqueName(relation.referencedTable)];
  if (!referencedTableTsName) {
    throw new Error(
      `Table "${relation.referencedTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const referencedTableConfig = schema2[referencedTableTsName];
  if (!referencedTableConfig) {
    throw new Error(`Table "${referencedTableTsName}" not found in schema`);
  }
  const sourceTable = relation.sourceTable;
  const sourceTableTsName = tableNamesMap[getTableUniqueName(sourceTable)];
  if (!sourceTableTsName) {
    throw new Error(
      `Table "${sourceTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const reverseRelations = [];
  for (const referencedTableRelation of Object.values(
    referencedTableConfig.relations
  )) {
    if (relation.relationName && relation !== referencedTableRelation && referencedTableRelation.relationName === relation.relationName || !relation.relationName && referencedTableRelation.referencedTable === relation.sourceTable) {
      reverseRelations.push(referencedTableRelation);
    }
  }
  if (reverseRelations.length > 1) {
    throw relation.relationName ? new Error(
      `There are multiple relations with name "${relation.relationName}" in table "${referencedTableTsName}"`
    ) : new Error(
      `There are multiple relations between "${referencedTableTsName}" and "${relation.sourceTable[Table.Symbol.Name]}". Please specify relation name`
    );
  }
  if (reverseRelations[0] && is(reverseRelations[0], One) && reverseRelations[0].config) {
    return {
      fields: reverseRelations[0].config.references,
      references: reverseRelations[0].config.fields
    };
  }
  throw new Error(
    `There is not enough information to infer relation "${sourceTableTsName}.${relation.fieldName}"`
  );
}
function createTableRelationsHelpers(sourceTable) {
  return {
    one: createOne(sourceTable),
    many: createMany(sourceTable)
  };
}
function mapRelationalRow(tablesConfig, tableConfig, row, buildQueryResultSelection, mapColumnValue = (value) => value) {
  const result = {};
  for (const [
    selectionItemIndex,
    selectionItem
  ] of buildQueryResultSelection.entries()) {
    if (selectionItem.isJson) {
      const relation = tableConfig.relations[selectionItem.tsKey];
      const rawSubRows = row[selectionItemIndex];
      const subRows = typeof rawSubRows === "string" ? JSON.parse(rawSubRows) : rawSubRows;
      result[selectionItem.tsKey] = is(relation, One) ? subRows && mapRelationalRow(
        tablesConfig,
        tablesConfig[selectionItem.relationTableTsKey],
        subRows,
        selectionItem.selection,
        mapColumnValue
      ) : subRows.map(
        (subRow) => mapRelationalRow(
          tablesConfig,
          tablesConfig[selectionItem.relationTableTsKey],
          subRow,
          selectionItem.selection,
          mapColumnValue
        )
      );
    } else {
      const value = mapColumnValue(row[selectionItemIndex]);
      const field = selectionItem.field;
      let decoder;
      if (is(field, Column)) {
        decoder = field;
      } else if (is(field, SQL)) {
        decoder = field.decoder;
      } else {
        decoder = field.sql.decoder;
      }
      result[selectionItem.tsKey] = value === null ? null : decoder.mapFromDriverValue(value);
    }
  }
  return result;
}
class ColumnAliasProxyHandler {
  constructor(table) {
    this.table = table;
  }
  static [entityKind] = "ColumnAliasProxyHandler";
  get(columnObj, prop) {
    if (prop === "table") {
      return this.table;
    }
    return columnObj[prop];
  }
}
class TableAliasProxyHandler {
  constructor(alias, replaceOriginalName) {
    this.alias = alias;
    this.replaceOriginalName = replaceOriginalName;
  }
  static [entityKind] = "TableAliasProxyHandler";
  get(target, prop) {
    if (prop === Table.Symbol.IsAlias) {
      return true;
    }
    if (prop === Table.Symbol.Name) {
      return this.alias;
    }
    if (this.replaceOriginalName && prop === Table.Symbol.OriginalName) {
      return this.alias;
    }
    if (prop === ViewBaseConfig) {
      return {
        ...target[ViewBaseConfig],
        name: this.alias,
        isAlias: true
      };
    }
    if (prop === Table.Symbol.Columns) {
      const columns = target[Table.Symbol.Columns];
      if (!columns) {
        return columns;
      }
      const proxiedColumns = {};
      Object.keys(columns).map((key) => {
        proxiedColumns[key] = new Proxy(
          columns[key],
          new ColumnAliasProxyHandler(new Proxy(target, this))
        );
      });
      return proxiedColumns;
    }
    const value = target[prop];
    if (is(value, Column)) {
      return new Proxy(value, new ColumnAliasProxyHandler(new Proxy(target, this)));
    }
    return value;
  }
}
function aliasedTable(table, tableAlias) {
  return new Proxy(table, new TableAliasProxyHandler(tableAlias, false));
}
function aliasedTableColumn(column, tableAlias) {
  return new Proxy(
    column,
    new ColumnAliasProxyHandler(new Proxy(column.table, new TableAliasProxyHandler(tableAlias, false)))
  );
}
function mapColumnsInAliasedSQLToAlias(query, alias) {
  return new SQL.Aliased(mapColumnsInSQLToAlias(query.sql, alias), query.fieldAlias);
}
function mapColumnsInSQLToAlias(query, alias) {
  return sql.join(query.queryChunks.map((c) => {
    if (is(c, Column)) {
      return aliasedTableColumn(c, alias);
    }
    if (is(c, SQL)) {
      return mapColumnsInSQLToAlias(c, alias);
    }
    if (is(c, SQL.Aliased)) {
      return mapColumnsInAliasedSQLToAlias(c, alias);
    }
    return c;
  }));
}
class SelectionProxyHandler {
  static [entityKind] = "SelectionProxyHandler";
  config;
  constructor(config2) {
    this.config = { ...config2 };
  }
  get(subquery, prop) {
    if (prop === "_") {
      return {
        ...subquery["_"],
        selectedFields: new Proxy(
          subquery._.selectedFields,
          this
        )
      };
    }
    if (prop === ViewBaseConfig) {
      return {
        ...subquery[ViewBaseConfig],
        selectedFields: new Proxy(
          subquery[ViewBaseConfig].selectedFields,
          this
        )
      };
    }
    if (typeof prop === "symbol") {
      return subquery[prop];
    }
    const columns = is(subquery, Subquery) ? subquery._.selectedFields : is(subquery, View) ? subquery[ViewBaseConfig].selectedFields : subquery;
    const value = columns[prop];
    if (is(value, SQL.Aliased)) {
      if (this.config.sqlAliasedBehavior === "sql" && !value.isSelectionField) {
        return value.sql;
      }
      const newValue = value.clone();
      newValue.isSelectionField = true;
      return newValue;
    }
    if (is(value, SQL)) {
      if (this.config.sqlBehavior === "sql") {
        return value;
      }
      throw new Error(
        `You tried to reference "${prop}" field from a subquery, which is a raw SQL field, but it doesn't have an alias declared. Please add an alias to the field using ".as('alias')" method.`
      );
    }
    if (is(value, Column)) {
      if (this.config.alias) {
        return new Proxy(
          value,
          new ColumnAliasProxyHandler(
            new Proxy(
              value.table,
              new TableAliasProxyHandler(this.config.alias, this.config.replaceOriginalName ?? false)
            )
          )
        );
      }
      return value;
    }
    if (typeof value !== "object" || value === null) {
      return value;
    }
    return new Proxy(value, new SelectionProxyHandler(this.config));
  }
}
class QueryPromise {
  static [entityKind] = "QueryPromise";
  [Symbol.toStringTag] = "QueryPromise";
  catch(onRejected) {
    return this.then(void 0, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (reason) => {
        onFinally?.();
        throw reason;
      }
    );
  }
  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }
}
class ForeignKeyBuilder {
  static [entityKind] = "SQLiteForeignKeyBuilder";
  /** @internal */
  reference;
  /** @internal */
  _onUpdate;
  /** @internal */
  _onDelete;
  constructor(config2, actions) {
    this.reference = () => {
      const { name, columns, foreignColumns } = config2();
      return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
    };
    if (actions) {
      this._onUpdate = actions.onUpdate;
      this._onDelete = actions.onDelete;
    }
  }
  onUpdate(action) {
    this._onUpdate = action;
    return this;
  }
  onDelete(action) {
    this._onDelete = action;
    return this;
  }
  /** @internal */
  build(table) {
    return new ForeignKey(table, this);
  }
}
class ForeignKey {
  constructor(table, builder) {
    this.table = table;
    this.reference = builder.reference;
    this.onUpdate = builder._onUpdate;
    this.onDelete = builder._onDelete;
  }
  static [entityKind] = "SQLiteForeignKey";
  reference;
  onUpdate;
  onDelete;
  getName() {
    const { name, columns, foreignColumns } = this.reference();
    const columnNames = columns.map((column) => column.name);
    const foreignColumnNames = foreignColumns.map((column) => column.name);
    const chunks = [
      this.table[TableName],
      ...columnNames,
      foreignColumns[0].table[TableName],
      ...foreignColumnNames
    ];
    return name ?? `${chunks.join("_")}_fk`;
  }
}
function uniqueKeyName(table, columns) {
  return `${table[TableName]}_${columns.join("_")}_unique`;
}
function unique(name) {
  return new UniqueOnConstraintBuilder(name);
}
class UniqueConstraintBuilder {
  constructor(columns, name) {
    this.name = name;
    this.columns = columns;
  }
  static [entityKind] = "SQLiteUniqueConstraintBuilder";
  /** @internal */
  columns;
  /** @internal */
  build(table) {
    return new UniqueConstraint(table, this.columns, this.name);
  }
}
class UniqueOnConstraintBuilder {
  static [entityKind] = "SQLiteUniqueOnConstraintBuilder";
  /** @internal */
  name;
  constructor(name) {
    this.name = name;
  }
  on(...columns) {
    return new UniqueConstraintBuilder(columns, this.name);
  }
}
class UniqueConstraint {
  constructor(table, columns, name) {
    this.table = table;
    this.columns = columns;
    this.name = name ?? uniqueKeyName(this.table, this.columns.map((column) => column.name));
  }
  static [entityKind] = "SQLiteUniqueConstraint";
  columns;
  name;
  getName() {
    return this.name;
  }
}
class SQLiteColumnBuilder extends ColumnBuilder {
  static [entityKind] = "SQLiteColumnBuilder";
  foreignKeyConfigs = [];
  references(ref, actions = {}) {
    this.foreignKeyConfigs.push({ ref, actions });
    return this;
  }
  unique(name) {
    this.config.isUnique = true;
    this.config.uniqueName = name;
    return this;
  }
  generatedAlwaysAs(as, config2) {
    this.config.generated = {
      as,
      type: "always",
      mode: config2?.mode ?? "virtual"
    };
    return this;
  }
  /** @internal */
  buildForeignKeys(column, table) {
    return this.foreignKeyConfigs.map(({ ref, actions }) => {
      return ((ref2, actions2) => {
        const builder = new ForeignKeyBuilder(() => {
          const foreignColumn = ref2();
          return { columns: [column], foreignColumns: [foreignColumn] };
        });
        if (actions2.onUpdate) {
          builder.onUpdate(actions2.onUpdate);
        }
        if (actions2.onDelete) {
          builder.onDelete(actions2.onDelete);
        }
        return builder.build(table);
      })(ref, actions);
    });
  }
}
class SQLiteColumn extends Column {
  constructor(table, config2) {
    if (!config2.uniqueName) {
      config2.uniqueName = uniqueKeyName(table, [config2.name]);
    }
    super(table, config2);
    this.table = table;
  }
  static [entityKind] = "SQLiteColumn";
}
class SQLiteBigIntBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteBigIntBuilder";
  constructor(name) {
    super(name, "bigint", "SQLiteBigInt");
  }
  /** @internal */
  build(table) {
    return new SQLiteBigInt(table, this.config);
  }
}
class SQLiteBigInt extends SQLiteColumn {
  static [entityKind] = "SQLiteBigInt";
  getSQLType() {
    return "blob";
  }
  mapFromDriverValue(value) {
    if (typeof Buffer !== "undefined" && Buffer.from) {
      const buf = Buffer.isBuffer(value) ? value : value instanceof ArrayBuffer ? Buffer.from(value) : value.buffer ? Buffer.from(value.buffer, value.byteOffset, value.byteLength) : Buffer.from(value);
      return BigInt(buf.toString("utf8"));
    }
    return BigInt(textDecoder.decode(value));
  }
  mapToDriverValue(value) {
    return Buffer.from(value.toString());
  }
}
class SQLiteBlobJsonBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteBlobJsonBuilder";
  constructor(name) {
    super(name, "json", "SQLiteBlobJson");
  }
  /** @internal */
  build(table) {
    return new SQLiteBlobJson(
      table,
      this.config
    );
  }
}
class SQLiteBlobJson extends SQLiteColumn {
  static [entityKind] = "SQLiteBlobJson";
  getSQLType() {
    return "blob";
  }
  mapFromDriverValue(value) {
    if (typeof Buffer !== "undefined" && Buffer.from) {
      const buf = Buffer.isBuffer(value) ? value : value instanceof ArrayBuffer ? Buffer.from(value) : value.buffer ? Buffer.from(value.buffer, value.byteOffset, value.byteLength) : Buffer.from(value);
      return JSON.parse(buf.toString("utf8"));
    }
    return JSON.parse(textDecoder.decode(value));
  }
  mapToDriverValue(value) {
    return Buffer.from(JSON.stringify(value));
  }
}
class SQLiteBlobBufferBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteBlobBufferBuilder";
  constructor(name) {
    super(name, "buffer", "SQLiteBlobBuffer");
  }
  /** @internal */
  build(table) {
    return new SQLiteBlobBuffer(table, this.config);
  }
}
class SQLiteBlobBuffer extends SQLiteColumn {
  static [entityKind] = "SQLiteBlobBuffer";
  mapFromDriverValue(value) {
    if (Buffer.isBuffer(value)) {
      return value;
    }
    return Buffer.from(value);
  }
  getSQLType() {
    return "blob";
  }
}
function blob(a, b) {
  const { name, config: config2 } = getColumnNameAndConfig(a, b);
  if (config2?.mode === "json") {
    return new SQLiteBlobJsonBuilder(name);
  }
  if (config2?.mode === "bigint") {
    return new SQLiteBigIntBuilder(name);
  }
  return new SQLiteBlobBufferBuilder(name);
}
class SQLiteCustomColumnBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteCustomColumnBuilder";
  constructor(name, fieldConfig, customTypeParams) {
    super(name, "custom", "SQLiteCustomColumn");
    this.config.fieldConfig = fieldConfig;
    this.config.customTypeParams = customTypeParams;
  }
  /** @internal */
  build(table) {
    return new SQLiteCustomColumn(
      table,
      this.config
    );
  }
}
class SQLiteCustomColumn extends SQLiteColumn {
  static [entityKind] = "SQLiteCustomColumn";
  sqlName;
  mapTo;
  mapFrom;
  constructor(table, config2) {
    super(table, config2);
    this.sqlName = config2.customTypeParams.dataType(config2.fieldConfig);
    this.mapTo = config2.customTypeParams.toDriver;
    this.mapFrom = config2.customTypeParams.fromDriver;
  }
  getSQLType() {
    return this.sqlName;
  }
  mapFromDriverValue(value) {
    return typeof this.mapFrom === "function" ? this.mapFrom(value) : value;
  }
  mapToDriverValue(value) {
    return typeof this.mapTo === "function" ? this.mapTo(value) : value;
  }
}
function customType(customTypeParams) {
  return (a, b) => {
    const { name, config: config2 } = getColumnNameAndConfig(a, b);
    return new SQLiteCustomColumnBuilder(
      name,
      config2,
      customTypeParams
    );
  };
}
class SQLiteBaseIntegerBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteBaseIntegerBuilder";
  constructor(name, dataType, columnType) {
    super(name, dataType, columnType);
    this.config.autoIncrement = false;
  }
  primaryKey(config2) {
    if (config2?.autoIncrement) {
      this.config.autoIncrement = true;
    }
    this.config.hasDefault = true;
    return super.primaryKey();
  }
}
class SQLiteBaseInteger extends SQLiteColumn {
  static [entityKind] = "SQLiteBaseInteger";
  autoIncrement = this.config.autoIncrement;
  getSQLType() {
    return "integer";
  }
}
class SQLiteIntegerBuilder extends SQLiteBaseIntegerBuilder {
  static [entityKind] = "SQLiteIntegerBuilder";
  constructor(name) {
    super(name, "number", "SQLiteInteger");
  }
  build(table) {
    return new SQLiteInteger(
      table,
      this.config
    );
  }
}
class SQLiteInteger extends SQLiteBaseInteger {
  static [entityKind] = "SQLiteInteger";
}
class SQLiteTimestampBuilder extends SQLiteBaseIntegerBuilder {
  static [entityKind] = "SQLiteTimestampBuilder";
  constructor(name, mode) {
    super(name, "date", "SQLiteTimestamp");
    this.config.mode = mode;
  }
  /**
   * @deprecated Use `default()` with your own expression instead.
   *
   * Adds `DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))` to the column, which is the current epoch timestamp in milliseconds.
   */
  defaultNow() {
    return this.default(sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`);
  }
  build(table) {
    return new SQLiteTimestamp(
      table,
      this.config
    );
  }
}
class SQLiteTimestamp extends SQLiteBaseInteger {
  static [entityKind] = "SQLiteTimestamp";
  mode = this.config.mode;
  mapFromDriverValue(value) {
    if (this.config.mode === "timestamp") {
      return new Date(value * 1e3);
    }
    return new Date(value);
  }
  mapToDriverValue(value) {
    const unix = value.getTime();
    if (this.config.mode === "timestamp") {
      return Math.floor(unix / 1e3);
    }
    return unix;
  }
}
class SQLiteBooleanBuilder extends SQLiteBaseIntegerBuilder {
  static [entityKind] = "SQLiteBooleanBuilder";
  constructor(name, mode) {
    super(name, "boolean", "SQLiteBoolean");
    this.config.mode = mode;
  }
  build(table) {
    return new SQLiteBoolean(
      table,
      this.config
    );
  }
}
class SQLiteBoolean extends SQLiteBaseInteger {
  static [entityKind] = "SQLiteBoolean";
  mode = this.config.mode;
  mapFromDriverValue(value) {
    return Number(value) === 1;
  }
  mapToDriverValue(value) {
    return value ? 1 : 0;
  }
}
function integer$1(a, b) {
  const { name, config: config2 } = getColumnNameAndConfig(a, b);
  if (config2?.mode === "timestamp" || config2?.mode === "timestamp_ms") {
    return new SQLiteTimestampBuilder(name, config2.mode);
  }
  if (config2?.mode === "boolean") {
    return new SQLiteBooleanBuilder(name, config2.mode);
  }
  return new SQLiteIntegerBuilder(name);
}
class SQLiteNumericBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteNumericBuilder";
  constructor(name) {
    super(name, "string", "SQLiteNumeric");
  }
  /** @internal */
  build(table) {
    return new SQLiteNumeric(
      table,
      this.config
    );
  }
}
class SQLiteNumeric extends SQLiteColumn {
  static [entityKind] = "SQLiteNumeric";
  mapFromDriverValue(value) {
    if (typeof value === "string") return value;
    return String(value);
  }
  getSQLType() {
    return "numeric";
  }
}
class SQLiteNumericNumberBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteNumericNumberBuilder";
  constructor(name) {
    super(name, "number", "SQLiteNumericNumber");
  }
  /** @internal */
  build(table) {
    return new SQLiteNumericNumber(
      table,
      this.config
    );
  }
}
class SQLiteNumericNumber extends SQLiteColumn {
  static [entityKind] = "SQLiteNumericNumber";
  mapFromDriverValue(value) {
    if (typeof value === "number") return value;
    return Number(value);
  }
  mapToDriverValue = String;
  getSQLType() {
    return "numeric";
  }
}
class SQLiteNumericBigIntBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteNumericBigIntBuilder";
  constructor(name) {
    super(name, "bigint", "SQLiteNumericBigInt");
  }
  /** @internal */
  build(table) {
    return new SQLiteNumericBigInt(
      table,
      this.config
    );
  }
}
class SQLiteNumericBigInt extends SQLiteColumn {
  static [entityKind] = "SQLiteNumericBigInt";
  mapFromDriverValue = BigInt;
  mapToDriverValue = String;
  getSQLType() {
    return "numeric";
  }
}
function numeric(a, b) {
  const { name, config: config2 } = getColumnNameAndConfig(a, b);
  const mode = config2?.mode;
  return mode === "number" ? new SQLiteNumericNumberBuilder(name) : mode === "bigint" ? new SQLiteNumericBigIntBuilder(name) : new SQLiteNumericBuilder(name);
}
class SQLiteRealBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteRealBuilder";
  constructor(name) {
    super(name, "number", "SQLiteReal");
  }
  /** @internal */
  build(table) {
    return new SQLiteReal(table, this.config);
  }
}
class SQLiteReal extends SQLiteColumn {
  static [entityKind] = "SQLiteReal";
  getSQLType() {
    return "real";
  }
}
function real(name) {
  return new SQLiteRealBuilder(name ?? "");
}
class SQLiteTextBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteTextBuilder";
  constructor(name, config2) {
    super(name, "string", "SQLiteText");
    this.config.enumValues = config2.enum;
    this.config.length = config2.length;
  }
  /** @internal */
  build(table) {
    return new SQLiteText(
      table,
      this.config
    );
  }
}
class SQLiteText extends SQLiteColumn {
  static [entityKind] = "SQLiteText";
  enumValues = this.config.enumValues;
  length = this.config.length;
  constructor(table, config2) {
    super(table, config2);
  }
  getSQLType() {
    return `text${this.config.length ? `(${this.config.length})` : ""}`;
  }
}
class SQLiteTextJsonBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteTextJsonBuilder";
  constructor(name) {
    super(name, "json", "SQLiteTextJson");
  }
  /** @internal */
  build(table) {
    return new SQLiteTextJson(
      table,
      this.config
    );
  }
}
class SQLiteTextJson extends SQLiteColumn {
  static [entityKind] = "SQLiteTextJson";
  getSQLType() {
    return "text";
  }
  mapFromDriverValue(value) {
    return JSON.parse(value);
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
}
function text(a, b = {}) {
  const { name, config: config2 } = getColumnNameAndConfig(a, b);
  if (config2.mode === "json") {
    return new SQLiteTextJsonBuilder(name);
  }
  return new SQLiteTextBuilder(name, config2);
}
function getSQLiteColumnBuilders() {
  return {
    blob,
    customType,
    integer: integer$1,
    numeric,
    real,
    text
  };
}
const InlineForeignKeys = /* @__PURE__ */ Symbol.for("drizzle:SQLiteInlineForeignKeys");
class SQLiteTable extends Table {
  static [entityKind] = "SQLiteTable";
  /** @internal */
  static Symbol = Object.assign({}, Table.Symbol, {
    InlineForeignKeys
  });
  /** @internal */
  [Table.Symbol.Columns];
  /** @internal */
  [InlineForeignKeys] = [];
  /** @internal */
  [Table.Symbol.ExtraConfigBuilder] = void 0;
}
function sqliteTableBase(name, columns, extraConfig, schema2, baseName = name) {
  const rawTable = new SQLiteTable(name, schema2, baseName);
  const parsedColumns = typeof columns === "function" ? columns(getSQLiteColumnBuilders()) : columns;
  const builtColumns = Object.fromEntries(
    Object.entries(parsedColumns).map(([name2, colBuilderBase]) => {
      const colBuilder = colBuilderBase;
      colBuilder.setName(name2);
      const column = colBuilder.build(rawTable);
      rawTable[InlineForeignKeys].push(...colBuilder.buildForeignKeys(column, rawTable));
      return [name2, column];
    })
  );
  const table = Object.assign(rawTable, builtColumns);
  table[Table.Symbol.Columns] = builtColumns;
  table[Table.Symbol.ExtraConfigColumns] = builtColumns;
  if (extraConfig) {
    table[SQLiteTable.Symbol.ExtraConfigBuilder] = extraConfig;
  }
  return table;
}
const sqliteTable = (name, columns, extraConfig) => {
  return sqliteTableBase(name, columns, extraConfig);
};
class IndexBuilderOn {
  constructor(name, unique2) {
    this.name = name;
    this.unique = unique2;
  }
  static [entityKind] = "SQLiteIndexBuilderOn";
  on(...columns) {
    return new IndexBuilder(this.name, columns, this.unique);
  }
}
class IndexBuilder {
  static [entityKind] = "SQLiteIndexBuilder";
  /** @internal */
  config;
  constructor(name, columns, unique2) {
    this.config = {
      name,
      columns,
      unique: unique2,
      where: void 0
    };
  }
  /**
   * Condition for partial index.
   */
  where(condition) {
    this.config.where = condition;
    return this;
  }
  /** @internal */
  build(table) {
    return new Index(this.config, table);
  }
}
class Index {
  static [entityKind] = "SQLiteIndex";
  config;
  constructor(config2, table) {
    this.config = { ...config2, table };
  }
}
function index(name) {
  return new IndexBuilderOn(name, false);
}
function extractUsedTable(table) {
  if (is(table, SQLiteTable)) {
    return [`${table[Table.Symbol.BaseName]}`];
  }
  if (is(table, Subquery)) {
    return table._.usedTables ?? [];
  }
  if (is(table, SQL)) {
    return table.usedTables ?? [];
  }
  return [];
}
class SQLiteDeleteBase extends QueryPromise {
  constructor(table, session, dialect, withList) {
    super();
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.config = { table, withList };
  }
  static [entityKind] = "SQLiteDelete";
  /** @internal */
  config;
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will delete only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be deleted.
   *
   * ```ts
   * // Delete all cars with green color
   * db.delete(cars).where(eq(cars.color, 'green'));
   * // or
   * db.delete(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Delete all BMW cars with a green color
   * db.delete(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Delete all cars with the green or blue color
   * db.delete(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.table[Table.Symbol.Columns],
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      this.config.orderBy = orderByArray;
    } else {
      const orderByArray = columns;
      this.config.orderBy = orderByArray;
    }
    return this;
  }
  limit(limit) {
    this.config.limit = limit;
    return this;
  }
  returning(fields = this.table[SQLiteTable.Symbol.Columns]) {
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildDeleteQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      this.config.returning,
      this.config.returning ? "all" : "run",
      true,
      void 0,
      {
        type: "delete",
        tables: extractUsedTable(this.config.table)
      }
    );
  }
  prepare() {
    return this._prepare(false);
  }
  run = (placeholderValues) => {
    return this._prepare().run(placeholderValues);
  };
  all = (placeholderValues) => {
    return this._prepare().all(placeholderValues);
  };
  get = (placeholderValues) => {
    return this._prepare().get(placeholderValues);
  };
  values = (placeholderValues) => {
    return this._prepare().values(placeholderValues);
  };
  async execute(placeholderValues) {
    return this._prepare().execute(placeholderValues);
  }
  $dynamic() {
    return this;
  }
}
function toSnakeCase(input) {
  const words = input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.map((word) => word.toLowerCase()).join("_");
}
function toCamelCase(input) {
  const words = input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.reduce((acc, word, i) => {
    const formattedWord = i === 0 ? word.toLowerCase() : `${word[0].toUpperCase()}${word.slice(1)}`;
    return acc + formattedWord;
  }, "");
}
function noopCase(input) {
  return input;
}
class CasingCache {
  static [entityKind] = "CasingCache";
  /** @internal */
  cache = {};
  cachedTables = {};
  convert;
  constructor(casing) {
    this.convert = casing === "snake_case" ? toSnakeCase : casing === "camelCase" ? toCamelCase : noopCase;
  }
  getColumnCasing(column) {
    if (!column.keyAsName) return column.name;
    const schema2 = column.table[Table.Symbol.Schema] ?? "public";
    const tableName = column.table[Table.Symbol.OriginalName];
    const key = `${schema2}.${tableName}.${column.name}`;
    if (!this.cache[key]) {
      this.cacheTable(column.table);
    }
    return this.cache[key];
  }
  cacheTable(table) {
    const schema2 = table[Table.Symbol.Schema] ?? "public";
    const tableName = table[Table.Symbol.OriginalName];
    const tableKey = `${schema2}.${tableName}`;
    if (!this.cachedTables[tableKey]) {
      for (const column of Object.values(table[Table.Symbol.Columns])) {
        const columnKey = `${tableKey}.${column.name}`;
        this.cache[columnKey] = this.convert(column.name);
      }
      this.cachedTables[tableKey] = true;
    }
  }
  clearCache() {
    this.cache = {};
    this.cachedTables = {};
  }
}
class DrizzleError extends Error {
  static [entityKind] = "DrizzleError";
  constructor({ message, cause }) {
    super(message);
    this.name = "DrizzleError";
    this.cause = cause;
  }
}
class DrizzleQueryError extends Error {
  constructor(query, params, cause) {
    super(`Failed query: ${query}
params: ${params}`);
    this.query = query;
    this.params = params;
    this.cause = cause;
    Error.captureStackTrace(this, DrizzleQueryError);
    if (cause) this.cause = cause;
  }
}
class TransactionRollbackError extends DrizzleError {
  static [entityKind] = "TransactionRollbackError";
  constructor() {
    super({ message: "Rollback" });
  }
}
class SQLiteViewBase extends View {
  static [entityKind] = "SQLiteViewBase";
}
class SQLiteDialect {
  static [entityKind] = "SQLiteDialect";
  /** @internal */
  casing;
  constructor(config2) {
    this.casing = new CasingCache(config2?.casing);
  }
  escapeName(name) {
    return `"${name.replace(/"/g, '""')}"`;
  }
  escapeParam(_num) {
    return "?";
  }
  escapeString(str) {
    return `'${str.replace(/'/g, "''")}'`;
  }
  buildWithCTE(queries) {
    if (!queries?.length) return void 0;
    const withSqlChunks = [sql`with `];
    for (const [i, w] of queries.entries()) {
      withSqlChunks.push(sql`${sql.identifier(w._.alias)} as (${w._.sql})`);
      if (i < queries.length - 1) {
        withSqlChunks.push(sql`, `);
      }
    }
    withSqlChunks.push(sql` `);
    return sql.join(withSqlChunks);
  }
  buildDeleteQuery({
    table,
    where,
    returning,
    withList,
    limit,
    orderBy
  }) {
    const withSql = this.buildWithCTE(withList);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const whereSql = where ? sql` where ${where}` : void 0;
    const orderBySql = this.buildOrderBy(orderBy);
    const limitSql = this.buildLimit(limit);
    return sql`${withSql}delete from ${table}${whereSql}${returningSql}${orderBySql}${limitSql}`;
  }
  buildUpdateSet(table, set) {
    const tableColumns = table[Table.Symbol.Columns];
    const columnNames = Object.keys(tableColumns).filter(
      (colName) => set[colName] !== void 0 || tableColumns[colName]?.onUpdateFn !== void 0
    );
    const setSize = columnNames.length;
    return sql.join(
      columnNames.flatMap((colName, i) => {
        const col = tableColumns[colName];
        const onUpdateFnResult = col.onUpdateFn?.();
        const value = set[colName] ?? (is(onUpdateFnResult, SQL) ? onUpdateFnResult : sql.param(onUpdateFnResult, col));
        const res = sql`${sql.identifier(this.casing.getColumnCasing(col))} = ${value}`;
        if (i < setSize - 1) {
          return [res, sql.raw(", ")];
        }
        return [res];
      })
    );
  }
  buildUpdateQuery({
    table,
    set,
    where,
    returning,
    withList,
    joins,
    from,
    limit,
    orderBy
  }) {
    const withSql = this.buildWithCTE(withList);
    const setSql = this.buildUpdateSet(table, set);
    const fromSql = from && sql.join([sql.raw(" from "), this.buildFromTable(from)]);
    const joinsSql = this.buildJoins(joins);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const whereSql = where ? sql` where ${where}` : void 0;
    const orderBySql = this.buildOrderBy(orderBy);
    const limitSql = this.buildLimit(limit);
    return sql`${withSql}update ${table} set ${setSql}${fromSql}${joinsSql}${whereSql}${returningSql}${orderBySql}${limitSql}`;
  }
  /**
   * Builds selection SQL with provided fields/expressions
   *
   * Examples:
   *
   * `select <selection> from`
   *
   * `insert ... returning <selection>`
   *
   * If `isSingleTable` is true, then columns won't be prefixed with table name
   */
  buildSelection(fields, { isSingleTable = false } = {}) {
    const columnsLen = fields.length;
    const chunks = fields.flatMap(({ field }, i) => {
      const chunk = [];
      if (is(field, SQL.Aliased) && field.isSelectionField) {
        chunk.push(sql.identifier(field.fieldAlias));
      } else if (is(field, SQL.Aliased) || is(field, SQL)) {
        const query = is(field, SQL.Aliased) ? field.sql : field;
        if (isSingleTable) {
          chunk.push(
            new SQL(
              query.queryChunks.map((c) => {
                if (is(c, Column)) {
                  return sql.identifier(this.casing.getColumnCasing(c));
                }
                return c;
              })
            )
          );
        } else {
          chunk.push(query);
        }
        if (is(field, SQL.Aliased)) {
          chunk.push(sql` as ${sql.identifier(field.fieldAlias)}`);
        }
      } else if (is(field, Column)) {
        const tableName = field.table[Table.Symbol.Name];
        if (field.columnType === "SQLiteNumericBigInt") {
          if (isSingleTable) {
            chunk.push(
              sql`cast(${sql.identifier(this.casing.getColumnCasing(field))} as text)`
            );
          } else {
            chunk.push(
              sql`cast(${sql.identifier(tableName)}.${sql.identifier(this.casing.getColumnCasing(field))} as text)`
            );
          }
        } else {
          if (isSingleTable) {
            chunk.push(sql.identifier(this.casing.getColumnCasing(field)));
          } else {
            chunk.push(
              sql`${sql.identifier(tableName)}.${sql.identifier(this.casing.getColumnCasing(field))}`
            );
          }
        }
      } else if (is(field, Subquery)) {
        const entries = Object.entries(field._.selectedFields);
        if (entries.length === 1) {
          const entry = entries[0][1];
          const fieldDecoder = is(entry, SQL) ? entry.decoder : is(entry, Column) ? { mapFromDriverValue: (v) => entry.mapFromDriverValue(v) } : entry.sql.decoder;
          if (fieldDecoder) field._.sql.decoder = fieldDecoder;
        }
        chunk.push(field);
      }
      if (i < columnsLen - 1) {
        chunk.push(sql`, `);
      }
      return chunk;
    });
    return sql.join(chunks);
  }
  buildJoins(joins) {
    if (!joins || joins.length === 0) {
      return void 0;
    }
    const joinsArray = [];
    if (joins) {
      for (const [index2, joinMeta] of joins.entries()) {
        if (index2 === 0) {
          joinsArray.push(sql` `);
        }
        const table = joinMeta.table;
        const onSql = joinMeta.on ? sql` on ${joinMeta.on}` : void 0;
        if (is(table, SQLiteTable)) {
          const tableName = table[SQLiteTable.Symbol.Name];
          const tableSchema = table[SQLiteTable.Symbol.Schema];
          const origTableName = table[SQLiteTable.Symbol.OriginalName];
          const alias = tableName === origTableName ? void 0 : joinMeta.alias;
          joinsArray.push(
            sql`${sql.raw(joinMeta.joinType)} join ${tableSchema ? sql`${sql.identifier(tableSchema)}.` : void 0}${sql.identifier(
              origTableName
            )}${alias && sql` ${sql.identifier(alias)}`}${onSql}`
          );
        } else {
          joinsArray.push(
            sql`${sql.raw(joinMeta.joinType)} join ${table}${onSql}`
          );
        }
        if (index2 < joins.length - 1) {
          joinsArray.push(sql` `);
        }
      }
    }
    return sql.join(joinsArray);
  }
  buildLimit(limit) {
    return typeof limit === "object" || typeof limit === "number" && limit >= 0 ? sql` limit ${limit}` : void 0;
  }
  buildOrderBy(orderBy) {
    const orderByList = [];
    if (orderBy) {
      for (const [index2, orderByValue] of orderBy.entries()) {
        orderByList.push(orderByValue);
        if (index2 < orderBy.length - 1) {
          orderByList.push(sql`, `);
        }
      }
    }
    return orderByList.length > 0 ? sql` order by ${sql.join(orderByList)}` : void 0;
  }
  buildFromTable(table) {
    if (is(table, Table) && table[Table.Symbol.IsAlias]) {
      return sql`${sql`${sql.identifier(table[Table.Symbol.Schema] ?? "")}.`.if(table[Table.Symbol.Schema])}${sql.identifier(
        table[Table.Symbol.OriginalName]
      )} ${sql.identifier(table[Table.Symbol.Name])}`;
    }
    return table;
  }
  buildSelectQuery({
    withList,
    fields,
    fieldsFlat,
    where,
    having,
    table,
    joins,
    orderBy,
    groupBy,
    limit,
    offset,
    distinct,
    setOperators
  }) {
    const fieldsList = fieldsFlat ?? orderSelectedFields(fields);
    for (const f of fieldsList) {
      if (is(f.field, Column) && getTableName(f.field.table) !== (is(table, Subquery) ? table._.alias : is(table, SQLiteViewBase) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : getTableName(table)) && !((table2) => joins?.some(
        ({ alias }) => alias === (table2[Table.Symbol.IsAlias] ? getTableName(table2) : table2[Table.Symbol.BaseName])
      ))(f.field.table)) {
        const tableName = getTableName(f.field.table);
        throw new Error(
          `Your "${f.path.join(
            "->"
          )}" field references a column "${tableName}"."${f.field.name}", but the table "${tableName}" is not part of the query! Did you forget to join it?`
        );
      }
    }
    const isSingleTable = !joins || joins.length === 0;
    const withSql = this.buildWithCTE(withList);
    const distinctSql = distinct ? sql` distinct` : void 0;
    const selection = this.buildSelection(fieldsList, { isSingleTable });
    const tableSql = this.buildFromTable(table);
    const joinsSql = this.buildJoins(joins);
    const whereSql = where ? sql` where ${where}` : void 0;
    const havingSql = having ? sql` having ${having}` : void 0;
    const groupByList = [];
    if (groupBy) {
      for (const [index2, groupByValue] of groupBy.entries()) {
        groupByList.push(groupByValue);
        if (index2 < groupBy.length - 1) {
          groupByList.push(sql`, `);
        }
      }
    }
    const groupBySql = groupByList.length > 0 ? sql` group by ${sql.join(groupByList)}` : void 0;
    const orderBySql = this.buildOrderBy(orderBy);
    const limitSql = this.buildLimit(limit);
    const offsetSql = offset ? sql` offset ${offset}` : void 0;
    const finalQuery = sql`${withSql}select${distinctSql} ${selection} from ${tableSql}${joinsSql}${whereSql}${groupBySql}${havingSql}${orderBySql}${limitSql}${offsetSql}`;
    if (setOperators.length > 0) {
      return this.buildSetOperations(finalQuery, setOperators);
    }
    return finalQuery;
  }
  buildSetOperations(leftSelect, setOperators) {
    const [setOperator, ...rest] = setOperators;
    if (!setOperator) {
      throw new Error("Cannot pass undefined values to any set operator");
    }
    if (rest.length === 0) {
      return this.buildSetOperationQuery({ leftSelect, setOperator });
    }
    return this.buildSetOperations(
      this.buildSetOperationQuery({ leftSelect, setOperator }),
      rest
    );
  }
  buildSetOperationQuery({
    leftSelect,
    setOperator: { type, isAll, rightSelect, limit, orderBy, offset }
  }) {
    const leftChunk = sql`${leftSelect.getSQL()} `;
    const rightChunk = sql`${rightSelect.getSQL()}`;
    let orderBySql;
    if (orderBy && orderBy.length > 0) {
      const orderByValues = [];
      for (const singleOrderBy of orderBy) {
        if (is(singleOrderBy, SQLiteColumn)) {
          orderByValues.push(sql.identifier(singleOrderBy.name));
        } else if (is(singleOrderBy, SQL)) {
          for (let i = 0; i < singleOrderBy.queryChunks.length; i++) {
            const chunk = singleOrderBy.queryChunks[i];
            if (is(chunk, SQLiteColumn)) {
              singleOrderBy.queryChunks[i] = sql.identifier(
                this.casing.getColumnCasing(chunk)
              );
            }
          }
          orderByValues.push(sql`${singleOrderBy}`);
        } else {
          orderByValues.push(sql`${singleOrderBy}`);
        }
      }
      orderBySql = sql` order by ${sql.join(orderByValues, sql`, `)}`;
    }
    const limitSql = typeof limit === "object" || typeof limit === "number" && limit >= 0 ? sql` limit ${limit}` : void 0;
    const operatorChunk = sql.raw(`${type} ${isAll ? "all " : ""}`);
    const offsetSql = offset ? sql` offset ${offset}` : void 0;
    return sql`${leftChunk}${operatorChunk}${rightChunk}${orderBySql}${limitSql}${offsetSql}`;
  }
  buildInsertQuery({
    table,
    values: valuesOrSelect,
    onConflict,
    returning,
    withList,
    select
  }) {
    const valuesSqlList = [];
    const columns = table[Table.Symbol.Columns];
    const colEntries = Object.entries(columns).filter(
      ([_, col]) => !col.shouldDisableInsert()
    );
    const insertOrder = colEntries.map(([, column]) => sql.identifier(this.casing.getColumnCasing(column)));
    if (select) {
      const select2 = valuesOrSelect;
      if (is(select2, SQL)) {
        valuesSqlList.push(select2);
      } else {
        valuesSqlList.push(select2.getSQL());
      }
    } else {
      const values = valuesOrSelect;
      valuesSqlList.push(sql.raw("values "));
      for (const [valueIndex, value] of values.entries()) {
        const valueList = [];
        for (const [fieldName, col] of colEntries) {
          const colValue = value[fieldName];
          if (colValue === void 0 || is(colValue, Param) && colValue.value === void 0) {
            let defaultValue;
            if (col.default !== null && col.default !== void 0) {
              defaultValue = is(col.default, SQL) ? col.default : sql.param(col.default, col);
            } else if (col.defaultFn !== void 0) {
              const defaultFnResult = col.defaultFn();
              defaultValue = is(defaultFnResult, SQL) ? defaultFnResult : sql.param(defaultFnResult, col);
            } else if (!col.default && col.onUpdateFn !== void 0) {
              const onUpdateFnResult = col.onUpdateFn();
              defaultValue = is(onUpdateFnResult, SQL) ? onUpdateFnResult : sql.param(onUpdateFnResult, col);
            } else {
              defaultValue = sql`null`;
            }
            valueList.push(defaultValue);
          } else {
            valueList.push(colValue);
          }
        }
        valuesSqlList.push(valueList);
        if (valueIndex < values.length - 1) {
          valuesSqlList.push(sql`, `);
        }
      }
    }
    const withSql = this.buildWithCTE(withList);
    const valuesSql = sql.join(valuesSqlList);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const onConflictSql = onConflict?.length ? sql.join(onConflict) : void 0;
    return sql`${withSql}insert into ${table} ${insertOrder} ${valuesSql}${onConflictSql}${returningSql}`;
  }
  sqlToQuery(sql2, invokeSource) {
    return sql2.toQuery({
      casing: this.casing,
      escapeName: this.escapeName,
      escapeParam: this.escapeParam,
      escapeString: this.escapeString,
      invokeSource
    });
  }
  buildRelationalQuery({
    fullSchema,
    schema: schema2,
    tableNamesMap,
    table,
    tableConfig,
    queryConfig: config2,
    tableAlias,
    nestedQueryRelation,
    joinOn
  }) {
    let selection = [];
    let limit, offset, orderBy = [], where;
    const joins = [];
    if (config2 === true) {
      const selectionEntries = Object.entries(tableConfig.columns);
      selection = selectionEntries.map(([key, value]) => ({
        dbKey: value.name,
        tsKey: key,
        field: aliasedTableColumn(value, tableAlias),
        relationTableTsKey: void 0,
        isJson: false,
        selection: []
      }));
    } else {
      const aliasedColumns = Object.fromEntries(
        Object.entries(tableConfig.columns).map(([key, value]) => [
          key,
          aliasedTableColumn(value, tableAlias)
        ])
      );
      if (config2.where) {
        const whereSql = typeof config2.where === "function" ? config2.where(aliasedColumns, getOperators()) : config2.where;
        where = whereSql && mapColumnsInSQLToAlias(whereSql, tableAlias);
      }
      const fieldsSelection = [];
      let selectedColumns = [];
      if (config2.columns) {
        let isIncludeMode = false;
        for (const [field, value] of Object.entries(config2.columns)) {
          if (value === void 0) {
            continue;
          }
          if (field in tableConfig.columns) {
            if (!isIncludeMode && value === true) {
              isIncludeMode = true;
            }
            selectedColumns.push(field);
          }
        }
        if (selectedColumns.length > 0) {
          selectedColumns = isIncludeMode ? selectedColumns.filter((c) => config2.columns?.[c] === true) : Object.keys(tableConfig.columns).filter(
            (key) => !selectedColumns.includes(key)
          );
        }
      } else {
        selectedColumns = Object.keys(tableConfig.columns);
      }
      for (const field of selectedColumns) {
        const column = tableConfig.columns[field];
        fieldsSelection.push({ tsKey: field, value: column });
      }
      let selectedRelations = [];
      if (config2.with) {
        selectedRelations = Object.entries(config2.with).filter(
          (entry) => !!entry[1]
        ).map(([tsKey, queryConfig]) => ({
          tsKey,
          queryConfig,
          relation: tableConfig.relations[tsKey]
        }));
      }
      let extras;
      if (config2.extras) {
        extras = typeof config2.extras === "function" ? config2.extras(aliasedColumns, { sql }) : config2.extras;
        for (const [tsKey, value] of Object.entries(extras)) {
          fieldsSelection.push({
            tsKey,
            value: mapColumnsInAliasedSQLToAlias(value, tableAlias)
          });
        }
      }
      for (const { tsKey, value } of fieldsSelection) {
        selection.push({
          dbKey: is(value, SQL.Aliased) ? value.fieldAlias : tableConfig.columns[tsKey].name,
          tsKey,
          field: is(value, Column) ? aliasedTableColumn(value, tableAlias) : value,
          relationTableTsKey: void 0,
          isJson: false,
          selection: []
        });
      }
      let orderByOrig = typeof config2.orderBy === "function" ? config2.orderBy(aliasedColumns, getOrderByOperators()) : config2.orderBy ?? [];
      if (!Array.isArray(orderByOrig)) {
        orderByOrig = [orderByOrig];
      }
      orderBy = orderByOrig.map((orderByValue) => {
        if (is(orderByValue, Column)) {
          return aliasedTableColumn(orderByValue, tableAlias);
        }
        return mapColumnsInSQLToAlias(orderByValue, tableAlias);
      });
      limit = config2.limit;
      offset = config2.offset;
      for (const {
        tsKey: selectedRelationTsKey,
        queryConfig: selectedRelationConfigValue,
        relation
      } of selectedRelations) {
        const normalizedRelation = normalizeRelation(
          schema2,
          tableNamesMap,
          relation
        );
        const relationTableName = getTableUniqueName(relation.referencedTable);
        const relationTableTsName = tableNamesMap[relationTableName];
        const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
        const joinOn2 = and(
          ...normalizedRelation.fields.map(
            (field2, i) => eq(
              aliasedTableColumn(
                normalizedRelation.references[i],
                relationTableAlias
              ),
              aliasedTableColumn(field2, tableAlias)
            )
          )
        );
        const builtRelation = this.buildRelationalQuery({
          fullSchema,
          schema: schema2,
          tableNamesMap,
          table: fullSchema[relationTableTsName],
          tableConfig: schema2[relationTableTsName],
          queryConfig: is(relation, One) ? selectedRelationConfigValue === true ? { limit: 1 } : { ...selectedRelationConfigValue, limit: 1 } : selectedRelationConfigValue,
          tableAlias: relationTableAlias,
          joinOn: joinOn2,
          nestedQueryRelation: relation
        });
        const field = sql`(${builtRelation.sql})`.as(selectedRelationTsKey);
        selection.push({
          dbKey: selectedRelationTsKey,
          tsKey: selectedRelationTsKey,
          field,
          relationTableTsKey: relationTableTsName,
          isJson: true,
          selection: builtRelation.selection
        });
      }
    }
    if (selection.length === 0) {
      throw new DrizzleError({
        message: `No fields selected for table "${tableConfig.tsName}" ("${tableAlias}"). You need to have at least one item in "columns", "with" or "extras". If you need to select all columns, omit the "columns" key or set it to undefined.`
      });
    }
    let result;
    where = and(joinOn, where);
    if (nestedQueryRelation) {
      let field = sql`json_array(${sql.join(
        selection.map(
          ({ field: field2 }) => is(field2, SQLiteColumn) ? sql.identifier(this.casing.getColumnCasing(field2)) : is(field2, SQL.Aliased) ? field2.sql : field2
        ),
        sql`, `
      )})`;
      if (is(nestedQueryRelation, Many)) {
        field = sql`coalesce(json_group_array(${field}), json_array())`;
      }
      const nestedSelection = [
        {
          dbKey: "data",
          tsKey: "data",
          field: field.as("data"),
          isJson: true,
          relationTableTsKey: tableConfig.tsName,
          selection
        }
      ];
      const needsSubquery = limit !== void 0 || offset !== void 0 || orderBy.length > 0;
      if (needsSubquery) {
        result = this.buildSelectQuery({
          table: aliasedTable(table, tableAlias),
          fields: {},
          fieldsFlat: [
            {
              path: [],
              field: sql.raw("*")
            }
          ],
          where,
          limit,
          offset,
          orderBy,
          setOperators: []
        });
        where = void 0;
        limit = void 0;
        offset = void 0;
        orderBy = void 0;
      } else {
        result = aliasedTable(table, tableAlias);
      }
      result = this.buildSelectQuery({
        table: is(result, SQLiteTable) ? result : new Subquery(result, {}, tableAlias),
        fields: {},
        fieldsFlat: nestedSelection.map(({ field: field2 }) => ({
          path: [],
          field: is(field2, Column) ? aliasedTableColumn(field2, tableAlias) : field2
        })),
        joins,
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    } else {
      result = this.buildSelectQuery({
        table: aliasedTable(table, tableAlias),
        fields: {},
        fieldsFlat: selection.map(({ field }) => ({
          path: [],
          field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field
        })),
        joins,
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    }
    return {
      tableTsKey: tableConfig.tsName,
      sql: result,
      selection
    };
  }
}
class SQLiteSyncDialect extends SQLiteDialect {
  static [entityKind] = "SQLiteSyncDialect";
  migrate(migrations, session, config2) {
    const migrationsTable = config2 === void 0 ? "__drizzle_migrations" : typeof config2 === "string" ? "__drizzle_migrations" : config2.migrationsTable ?? "__drizzle_migrations";
    const migrationTableCreate = sql`
			CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsTable)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at numeric
			)
		`;
    session.run(migrationTableCreate);
    const dbMigrations = session.values(
      sql`SELECT id, hash, created_at FROM ${sql.identifier(migrationsTable)} ORDER BY created_at DESC LIMIT 1`
    );
    const lastDbMigration = dbMigrations[0] ?? void 0;
    session.run(sql`BEGIN`);
    try {
      for (const migration of migrations) {
        if (!lastDbMigration || Number(lastDbMigration[2]) < migration.folderMillis) {
          for (const stmt of migration.sql) {
            session.run(sql.raw(stmt));
          }
          session.run(
            sql`INSERT INTO ${sql.identifier(
              migrationsTable
            )} ("hash", "created_at") VALUES(${migration.hash}, ${migration.folderMillis})`
          );
        }
      }
      session.run(sql`COMMIT`);
    } catch (e) {
      session.run(sql`ROLLBACK`);
      throw e;
    }
  }
}
class TypedQueryBuilder {
  static [entityKind] = "TypedQueryBuilder";
  /** @internal */
  getSelectedFields() {
    return this._.selectedFields;
  }
}
class SQLiteSelectBuilder {
  static [entityKind] = "SQLiteSelectBuilder";
  fields;
  session;
  dialect;
  withList;
  distinct;
  constructor(config2) {
    this.fields = config2.fields;
    this.session = config2.session;
    this.dialect = config2.dialect;
    this.withList = config2.withList;
    this.distinct = config2.distinct;
  }
  from(source) {
    const isPartialSelect = !!this.fields;
    let fields;
    if (this.fields) {
      fields = this.fields;
    } else if (is(source, Subquery)) {
      fields = Object.fromEntries(
        Object.keys(source._.selectedFields).map((key) => [key, source[key]])
      );
    } else if (is(source, SQLiteViewBase)) {
      fields = source[ViewBaseConfig].selectedFields;
    } else if (is(source, SQL)) {
      fields = {};
    } else {
      fields = getTableColumns(source);
    }
    return new SQLiteSelectBase({
      table: source,
      fields,
      isPartialSelect,
      session: this.session,
      dialect: this.dialect,
      withList: this.withList,
      distinct: this.distinct
    });
  }
}
class SQLiteSelectQueryBuilderBase extends TypedQueryBuilder {
  static [entityKind] = "SQLiteSelectQueryBuilder";
  _;
  /** @internal */
  config;
  joinsNotNullableMap;
  tableName;
  isPartialSelect;
  session;
  dialect;
  cacheConfig = void 0;
  usedTables = /* @__PURE__ */ new Set();
  constructor({ table, fields, isPartialSelect, session, dialect, withList, distinct }) {
    super();
    this.config = {
      withList,
      table,
      fields: { ...fields },
      distinct,
      setOperators: []
    };
    this.isPartialSelect = isPartialSelect;
    this.session = session;
    this.dialect = dialect;
    this._ = {
      selectedFields: fields,
      config: this.config
    };
    this.tableName = getTableLikeName(table);
    this.joinsNotNullableMap = typeof this.tableName === "string" ? { [this.tableName]: true } : {};
    for (const item of extractUsedTable(table)) this.usedTables.add(item);
  }
  /** @internal */
  getUsedTables() {
    return [...this.usedTables];
  }
  createJoin(joinType) {
    return (table, on) => {
      const baseTableName = this.tableName;
      const tableName = getTableLikeName(table);
      for (const item of extractUsedTable(table)) this.usedTables.add(item);
      if (typeof tableName === "string" && this.config.joins?.some((join) => join.alias === tableName)) {
        throw new Error(`Alias "${tableName}" is already used in this query`);
      }
      if (!this.isPartialSelect) {
        if (Object.keys(this.joinsNotNullableMap).length === 1 && typeof baseTableName === "string") {
          this.config.fields = {
            [baseTableName]: this.config.fields
          };
        }
        if (typeof tableName === "string" && !is(table, SQL)) {
          const selection = is(table, Subquery) ? table._.selectedFields : is(table, View) ? table[ViewBaseConfig].selectedFields : table[Table.Symbol.Columns];
          this.config.fields[tableName] = selection;
        }
      }
      if (typeof on === "function") {
        on = on(
          new Proxy(
            this.config.fields,
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          )
        );
      }
      if (!this.config.joins) {
        this.config.joins = [];
      }
      this.config.joins.push({ on, table, joinType, alias: tableName });
      if (typeof tableName === "string") {
        switch (joinType) {
          case "left": {
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
          case "right": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "cross":
          case "inner": {
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "full": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
        }
      }
      return this;
    };
  }
  /**
   * Executes a `left join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the table with the corresponding row from the joined table, if a match is found. If no matching row exists, it sets all columns of the joined table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#left-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet | null; }[] = await db.select()
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number | null; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  leftJoin = this.createJoin("left");
  /**
   * Executes a `right join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the joined table with the corresponding row from the main table, if a match is found. If no matching row exists, it sets all columns of the main table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#right-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User | null; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number | null; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  rightJoin = this.createJoin("right");
  /**
   * Executes an `inner join` operation, creating a new table by combining rows from two tables that have matching values.
   *
   * Calling this method retrieves rows that have corresponding entries in both joined tables. Rows without matching entries in either table are excluded, resulting in a table that includes only matching pairs.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#inner-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  innerJoin = this.createJoin("inner");
  /**
   * Executes a `full join` operation by combining rows from two tables into a new table.
   *
   * Calling this method retrieves all rows from both main and joined tables, merging rows with matching values and filling in `null` for non-matching columns.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#full-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User | null; pets: Pet | null; }[] = await db.select()
   *   .from(users)
   *   .fullJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number | null; petId: number | null; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .fullJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  fullJoin = this.createJoin("full");
  /**
   * Executes a `cross join` operation by combining rows from two tables into a new table.
   *
   * Calling this method retrieves all rows from both main and joined tables, merging all rows from each table.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#cross-join}
   *
   * @param table the table to join.
   *
   * @example
   *
   * ```ts
   * // Select all users, each user with every pet
   * const usersWithPets: { user: User; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .crossJoin(pets)
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .crossJoin(pets)
   * ```
   */
  crossJoin = this.createJoin("cross");
  createSetOperator(type, isAll) {
    return (rightSelection) => {
      const rightSelect = typeof rightSelection === "function" ? rightSelection(getSQLiteSetOperators()) : rightSelection;
      if (!haveSameKeys(this.getSelectedFields(), rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
      this.config.setOperators.push({ type, isAll, rightSelect });
      return this;
    };
  }
  /**
   * Adds `union` set operator to the query.
   *
   * Calling this method will combine the result sets of the `select` statements and remove any duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union}
   *
   * @example
   *
   * ```ts
   * // Select all unique names from customers and users tables
   * await db.select({ name: users.name })
   *   .from(users)
   *   .union(
   *     db.select({ name: customers.name }).from(customers)
   *   );
   * // or
   * import { union } from 'drizzle-orm/sqlite-core'
   *
   * await union(
   *   db.select({ name: users.name }).from(users),
   *   db.select({ name: customers.name }).from(customers)
   * );
   * ```
   */
  union = this.createSetOperator("union", false);
  /**
   * Adds `union all` set operator to the query.
   *
   * Calling this method will combine the result-set of the `select` statements and keep all duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union-all}
   *
   * @example
   *
   * ```ts
   * // Select all transaction ids from both online and in-store sales
   * await db.select({ transaction: onlineSales.transactionId })
   *   .from(onlineSales)
   *   .unionAll(
   *     db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   *   );
   * // or
   * import { unionAll } from 'drizzle-orm/sqlite-core'
   *
   * await unionAll(
   *   db.select({ transaction: onlineSales.transactionId }).from(onlineSales),
   *   db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   * );
   * ```
   */
  unionAll = this.createSetOperator("union", true);
  /**
   * Adds `intersect` set operator to the query.
   *
   * Calling this method will retain only the rows that are present in both result sets and eliminate duplicates.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#intersect}
   *
   * @example
   *
   * ```ts
   * // Select course names that are offered in both departments A and B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .intersect(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { intersect } from 'drizzle-orm/sqlite-core'
   *
   * await intersect(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  intersect = this.createSetOperator("intersect", false);
  /**
   * Adds `except` set operator to the query.
   *
   * Calling this method will retrieve all unique rows from the left query, except for the rows that are present in the result set of the right query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#except}
   *
   * @example
   *
   * ```ts
   * // Select all courses offered in department A but not in department B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .except(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { except } from 'drizzle-orm/sqlite-core'
   *
   * await except(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  except = this.createSetOperator("except", false);
  /** @internal */
  addSetOperators(setOperators) {
    this.config.setOperators.push(...setOperators);
    return this;
  }
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#filtering}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be selected.
   *
   * ```ts
   * // Select all cars with green color
   * await db.select().from(cars).where(eq(cars.color, 'green'));
   * // or
   * await db.select().from(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Select all BMW cars with a green color
   * await db.select().from(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Select all cars with the green or blue color
   * await db.select().from(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    if (typeof where === "function") {
      where = where(
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.where = where;
    return this;
  }
  /**
   * Adds a `having` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition. It is typically used with aggregate functions to filter the aggregated data based on a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#aggregations}
   *
   * @param having the `having` clause.
   *
   * @example
   *
   * ```ts
   * // Select all brands with more than one car
   * await db.select({
   * 	brand: cars.brand,
   * 	count: sql<number>`cast(count(${cars.id}) as int)`,
   * })
   *   .from(cars)
   *   .groupBy(cars.brand)
   *   .having(({ count }) => gt(count, 1));
   * ```
   */
  having(having) {
    if (typeof having === "function") {
      having = having(
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.having = having;
    return this;
  }
  groupBy(...columns) {
    if (typeof columns[0] === "function") {
      const groupBy = columns[0](
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      this.config.groupBy = Array.isArray(groupBy) ? groupBy : [groupBy];
    } else {
      this.config.groupBy = columns;
    }
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    } else {
      const orderByArray = columns;
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    }
    return this;
  }
  /**
   * Adds a `limit` clause to the query.
   *
   * Calling this method will set the maximum number of rows that will be returned by this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param limit the `limit` clause.
   *
   * @example
   *
   * ```ts
   * // Get the first 10 people from this query.
   * await db.select().from(people).limit(10);
   * ```
   */
  limit(limit) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).limit = limit;
    } else {
      this.config.limit = limit;
    }
    return this;
  }
  /**
   * Adds an `offset` clause to the query.
   *
   * Calling this method will skip a number of rows when returning results from this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param offset the `offset` clause.
   *
   * @example
   *
   * ```ts
   * // Get the 10th-20th people from this query.
   * await db.select().from(people).offset(10).limit(10);
   * ```
   */
  offset(offset) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).offset = offset;
    } else {
      this.config.offset = offset;
    }
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildSelectQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  as(alias) {
    const usedTables = [];
    usedTables.push(...extractUsedTable(this.config.table));
    if (this.config.joins) {
      for (const it of this.config.joins) usedTables.push(...extractUsedTable(it.table));
    }
    return new Proxy(
      new Subquery(this.getSQL(), this.config.fields, alias, false, [...new Set(usedTables)]),
      new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  /** @internal */
  getSelectedFields() {
    return new Proxy(
      this.config.fields,
      new SelectionProxyHandler({ alias: this.tableName, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  $dynamic() {
    return this;
  }
}
class SQLiteSelectBase extends SQLiteSelectQueryBuilderBase {
  static [entityKind] = "SQLiteSelect";
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    if (!this.session) {
      throw new Error("Cannot execute a query on a query builder. Please use a database instance instead.");
    }
    const fieldsList = orderSelectedFields(this.config.fields);
    const query = this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      fieldsList,
      "all",
      true,
      void 0,
      {
        type: "select",
        tables: [...this.usedTables]
      },
      this.cacheConfig
    );
    query.joinsNotNullableMap = this.joinsNotNullableMap;
    return query;
  }
  $withCache(config2) {
    this.cacheConfig = config2 === void 0 ? { config: {}, enable: true, autoInvalidate: true } : config2 === false ? { enable: false } : { enable: true, autoInvalidate: true, ...config2 };
    return this;
  }
  prepare() {
    return this._prepare(false);
  }
  run = (placeholderValues) => {
    return this._prepare().run(placeholderValues);
  };
  all = (placeholderValues) => {
    return this._prepare().all(placeholderValues);
  };
  get = (placeholderValues) => {
    return this._prepare().get(placeholderValues);
  };
  values = (placeholderValues) => {
    return this._prepare().values(placeholderValues);
  };
  async execute() {
    return this.all();
  }
}
applyMixins(SQLiteSelectBase, [QueryPromise]);
function createSetOperator(type, isAll) {
  return (leftSelect, rightSelect, ...restSelects) => {
    const setOperators = [rightSelect, ...restSelects].map((select) => ({
      type,
      isAll,
      rightSelect: select
    }));
    for (const setOperator of setOperators) {
      if (!haveSameKeys(leftSelect.getSelectedFields(), setOperator.rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
    }
    return leftSelect.addSetOperators(setOperators);
  };
}
const getSQLiteSetOperators = () => ({
  union: union$1,
  unionAll,
  intersect,
  except
});
const union$1 = createSetOperator("union", false);
const unionAll = createSetOperator("union", true);
const intersect = createSetOperator("intersect", false);
const except = createSetOperator("except", false);
class QueryBuilder {
  static [entityKind] = "SQLiteQueryBuilder";
  dialect;
  dialectConfig;
  constructor(dialect) {
    this.dialect = is(dialect, SQLiteDialect) ? dialect : void 0;
    this.dialectConfig = is(dialect, SQLiteDialect) ? void 0 : dialect;
  }
  $with = (alias, selection) => {
    const queryBuilder = this;
    const as = (qb) => {
      if (typeof qb === "function") {
        qb = qb(queryBuilder);
      }
      return new Proxy(
        new WithSubquery(
          qb.getSQL(),
          selection ?? ("getSelectedFields" in qb ? qb.getSelectedFields() ?? {} : {}),
          alias,
          true
        ),
        new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
      );
    };
    return { as };
  };
  with(...queries) {
    const self = this;
    function select(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        withList: queries
      });
    }
    function selectDistinct(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        withList: queries,
        distinct: true
      });
    }
    return { select, selectDistinct };
  }
  select(fields) {
    return new SQLiteSelectBuilder({ fields: fields ?? void 0, session: void 0, dialect: this.getDialect() });
  }
  selectDistinct(fields) {
    return new SQLiteSelectBuilder({
      fields: fields ?? void 0,
      session: void 0,
      dialect: this.getDialect(),
      distinct: true
    });
  }
  // Lazy load dialect to avoid circular dependency
  getDialect() {
    if (!this.dialect) {
      this.dialect = new SQLiteSyncDialect(this.dialectConfig);
    }
    return this.dialect;
  }
}
class SQLiteInsertBuilder {
  constructor(table, session, dialect, withList) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
  }
  static [entityKind] = "SQLiteInsertBuilder";
  values(values) {
    values = Array.isArray(values) ? values : [values];
    if (values.length === 0) {
      throw new Error("values() must be called with at least one value");
    }
    const mappedValues = values.map((entry) => {
      const result = {};
      const cols = this.table[Table.Symbol.Columns];
      for (const colKey of Object.keys(entry)) {
        const colValue = entry[colKey];
        result[colKey] = is(colValue, SQL) ? colValue : new Param(colValue, cols[colKey]);
      }
      return result;
    });
    return new SQLiteInsertBase(this.table, mappedValues, this.session, this.dialect, this.withList);
  }
  select(selectQuery) {
    const select = typeof selectQuery === "function" ? selectQuery(new QueryBuilder()) : selectQuery;
    if (!is(select, SQL) && !haveSameKeys(this.table[Columns], select._.selectedFields)) {
      throw new Error(
        "Insert select error: selected fields are not the same or are in a different order compared to the table definition"
      );
    }
    return new SQLiteInsertBase(this.table, select, this.session, this.dialect, this.withList, true);
  }
}
class SQLiteInsertBase extends QueryPromise {
  constructor(table, values, session, dialect, withList, select) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { table, values, withList, select };
  }
  static [entityKind] = "SQLiteInsert";
  /** @internal */
  config;
  returning(fields = this.config.table[SQLiteTable.Symbol.Columns]) {
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /**
   * Adds an `on conflict do nothing` clause to the query.
   *
   * Calling this method simply avoids inserting a row as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#on-conflict-do-nothing}
   *
   * @param config The `target` and `where` clauses.
   *
   * @example
   * ```ts
   * // Insert one row and cancel the insert if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing();
   *
   * // Explicitly specify conflict target
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing({ target: cars.id });
   * ```
   */
  onConflictDoNothing(config2 = {}) {
    if (!this.config.onConflict) this.config.onConflict = [];
    if (config2.target === void 0) {
      this.config.onConflict.push(sql` on conflict do nothing`);
    } else {
      const targetSql = Array.isArray(config2.target) ? sql`${config2.target}` : sql`${[config2.target]}`;
      const whereSql = config2.where ? sql` where ${config2.where}` : sql``;
      this.config.onConflict.push(sql` on conflict ${targetSql} do nothing${whereSql}`);
    }
    return this;
  }
  /**
   * Adds an `on conflict do update` clause to the query.
   *
   * Calling this method will update the existing row that conflicts with the row proposed for insertion as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#upserts-and-conflicts}
   *
   * @param config The `target`, `set` and `where` clauses.
   *
   * @example
   * ```ts
   * // Update the row if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'Porsche' }
   *   });
   *
   * // Upsert with 'where' clause
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'newBMW' },
   *     where: sql`${cars.createdAt} > '2023-01-01'::date`,
   *   });
   * ```
   */
  onConflictDoUpdate(config2) {
    if (config2.where && (config2.targetWhere || config2.setWhere)) {
      throw new Error(
        'You cannot use both "where" and "targetWhere"/"setWhere" at the same time - "where" is deprecated, use "targetWhere" or "setWhere" instead.'
      );
    }
    if (!this.config.onConflict) this.config.onConflict = [];
    const whereSql = config2.where ? sql` where ${config2.where}` : void 0;
    const targetWhereSql = config2.targetWhere ? sql` where ${config2.targetWhere}` : void 0;
    const setWhereSql = config2.setWhere ? sql` where ${config2.setWhere}` : void 0;
    const targetSql = Array.isArray(config2.target) ? sql`${config2.target}` : sql`${[config2.target]}`;
    const setSql = this.dialect.buildUpdateSet(this.config.table, mapUpdateSet(this.config.table, config2.set));
    this.config.onConflict.push(
      sql` on conflict ${targetSql}${targetWhereSql} do update set ${setSql}${whereSql}${setWhereSql}`
    );
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildInsertQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      this.config.returning,
      this.config.returning ? "all" : "run",
      true,
      void 0,
      {
        type: "insert",
        tables: extractUsedTable(this.config.table)
      }
    );
  }
  prepare() {
    return this._prepare(false);
  }
  run = (placeholderValues) => {
    return this._prepare().run(placeholderValues);
  };
  all = (placeholderValues) => {
    return this._prepare().all(placeholderValues);
  };
  get = (placeholderValues) => {
    return this._prepare().get(placeholderValues);
  };
  values = (placeholderValues) => {
    return this._prepare().values(placeholderValues);
  };
  async execute() {
    return this.config.returning ? this.all() : this.run();
  }
  $dynamic() {
    return this;
  }
}
class SQLiteUpdateBuilder {
  constructor(table, session, dialect, withList) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
  }
  static [entityKind] = "SQLiteUpdateBuilder";
  set(values) {
    return new SQLiteUpdateBase(
      this.table,
      mapUpdateSet(this.table, values),
      this.session,
      this.dialect,
      this.withList
    );
  }
}
class SQLiteUpdateBase extends QueryPromise {
  constructor(table, set, session, dialect, withList) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { set, table, withList, joins: [] };
  }
  static [entityKind] = "SQLiteUpdate";
  /** @internal */
  config;
  from(source) {
    this.config.from = source;
    return this;
  }
  createJoin(joinType) {
    return (table, on) => {
      const tableName = getTableLikeName(table);
      if (typeof tableName === "string" && this.config.joins.some((join) => join.alias === tableName)) {
        throw new Error(`Alias "${tableName}" is already used in this query`);
      }
      if (typeof on === "function") {
        const from = this.config.from ? is(table, SQLiteTable) ? table[Table.Symbol.Columns] : is(table, Subquery) ? table._.selectedFields : is(table, SQLiteViewBase) ? table[ViewBaseConfig].selectedFields : void 0 : void 0;
        on = on(
          new Proxy(
            this.config.table[Table.Symbol.Columns],
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          ),
          from && new Proxy(
            from,
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          )
        );
      }
      this.config.joins.push({ on, table, joinType, alias: tableName });
      return this;
    };
  }
  leftJoin = this.createJoin("left");
  rightJoin = this.createJoin("right");
  innerJoin = this.createJoin("inner");
  fullJoin = this.createJoin("full");
  /**
   * Adds a 'where' clause to the query.
   *
   * Calling this method will update only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param where the 'where' clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be updated.
   *
   * ```ts
   * // Update all cars with green color
   * db.update(cars).set({ color: 'red' })
   *   .where(eq(cars.color, 'green'));
   * // or
   * db.update(cars).set({ color: 'red' })
   *   .where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Update all BMW cars with a green color
   * db.update(cars).set({ color: 'red' })
   *   .where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Update all cars with the green or blue color
   * db.update(cars).set({ color: 'red' })
   *   .where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.table[Table.Symbol.Columns],
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      this.config.orderBy = orderByArray;
    } else {
      const orderByArray = columns;
      this.config.orderBy = orderByArray;
    }
    return this;
  }
  limit(limit) {
    this.config.limit = limit;
    return this;
  }
  returning(fields = this.config.table[SQLiteTable.Symbol.Columns]) {
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildUpdateQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      this.config.returning,
      this.config.returning ? "all" : "run",
      true,
      void 0,
      {
        type: "insert",
        tables: extractUsedTable(this.config.table)
      }
    );
  }
  prepare() {
    return this._prepare(false);
  }
  run = (placeholderValues) => {
    return this._prepare().run(placeholderValues);
  };
  all = (placeholderValues) => {
    return this._prepare().all(placeholderValues);
  };
  get = (placeholderValues) => {
    return this._prepare().get(placeholderValues);
  };
  values = (placeholderValues) => {
    return this._prepare().values(placeholderValues);
  };
  async execute() {
    return this.config.returning ? this.all() : this.run();
  }
  $dynamic() {
    return this;
  }
}
class SQLiteCountBuilder extends SQL {
  constructor(params) {
    super(SQLiteCountBuilder.buildEmbeddedCount(params.source, params.filters).queryChunks);
    this.params = params;
    this.session = params.session;
    this.sql = SQLiteCountBuilder.buildCount(
      params.source,
      params.filters
    );
  }
  sql;
  static [entityKind] = "SQLiteCountBuilderAsync";
  [Symbol.toStringTag] = "SQLiteCountBuilderAsync";
  session;
  static buildEmbeddedCount(source, filters) {
    return sql`(select count(*) from ${source}${sql.raw(" where ").if(filters)}${filters})`;
  }
  static buildCount(source, filters) {
    return sql`select count(*) from ${source}${sql.raw(" where ").if(filters)}${filters}`;
  }
  then(onfulfilled, onrejected) {
    return Promise.resolve(this.session.count(this.sql)).then(
      onfulfilled,
      onrejected
    );
  }
  catch(onRejected) {
    return this.then(void 0, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (reason) => {
        onFinally?.();
        throw reason;
      }
    );
  }
}
class RelationalQueryBuilder {
  constructor(mode, fullSchema, schema2, tableNamesMap, table, tableConfig, dialect, session) {
    this.mode = mode;
    this.fullSchema = fullSchema;
    this.schema = schema2;
    this.tableNamesMap = tableNamesMap;
    this.table = table;
    this.tableConfig = tableConfig;
    this.dialect = dialect;
    this.session = session;
  }
  static [entityKind] = "SQLiteAsyncRelationalQueryBuilder";
  findMany(config2) {
    return this.mode === "sync" ? new SQLiteSyncRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config2 ? config2 : {},
      "many"
    ) : new SQLiteRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config2 ? config2 : {},
      "many"
    );
  }
  findFirst(config2) {
    return this.mode === "sync" ? new SQLiteSyncRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config2 ? { ...config2, limit: 1 } : { limit: 1 },
      "first"
    ) : new SQLiteRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config2 ? { ...config2, limit: 1 } : { limit: 1 },
      "first"
    );
  }
}
class SQLiteRelationalQuery extends QueryPromise {
  constructor(fullSchema, schema2, tableNamesMap, table, tableConfig, dialect, session, config2, mode) {
    super();
    this.fullSchema = fullSchema;
    this.schema = schema2;
    this.tableNamesMap = tableNamesMap;
    this.table = table;
    this.tableConfig = tableConfig;
    this.dialect = dialect;
    this.session = session;
    this.config = config2;
    this.mode = mode;
  }
  static [entityKind] = "SQLiteAsyncRelationalQuery";
  /** @internal */
  mode;
  /** @internal */
  getSQL() {
    return this.dialect.buildRelationalQuery({
      fullSchema: this.fullSchema,
      schema: this.schema,
      tableNamesMap: this.tableNamesMap,
      table: this.table,
      tableConfig: this.tableConfig,
      queryConfig: this.config,
      tableAlias: this.tableConfig.tsName
    }).sql;
  }
  /** @internal */
  _prepare(isOneTimeQuery = false) {
    const { query, builtQuery } = this._toSQL();
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      builtQuery,
      void 0,
      this.mode === "first" ? "get" : "all",
      true,
      (rawRows, mapColumnValue) => {
        const rows = rawRows.map(
          (row) => mapRelationalRow(this.schema, this.tableConfig, row, query.selection, mapColumnValue)
        );
        if (this.mode === "first") {
          return rows[0];
        }
        return rows;
      }
    );
  }
  prepare() {
    return this._prepare(false);
  }
  _toSQL() {
    const query = this.dialect.buildRelationalQuery({
      fullSchema: this.fullSchema,
      schema: this.schema,
      tableNamesMap: this.tableNamesMap,
      table: this.table,
      tableConfig: this.tableConfig,
      queryConfig: this.config,
      tableAlias: this.tableConfig.tsName
    });
    const builtQuery = this.dialect.sqlToQuery(query.sql);
    return { query, builtQuery };
  }
  toSQL() {
    return this._toSQL().builtQuery;
  }
  /** @internal */
  executeRaw() {
    if (this.mode === "first") {
      return this._prepare(false).get();
    }
    return this._prepare(false).all();
  }
  async execute() {
    return this.executeRaw();
  }
}
class SQLiteSyncRelationalQuery extends SQLiteRelationalQuery {
  static [entityKind] = "SQLiteSyncRelationalQuery";
  sync() {
    return this.executeRaw();
  }
}
class SQLiteRaw extends QueryPromise {
  constructor(execute, getSQL, action, dialect, mapBatchResult) {
    super();
    this.execute = execute;
    this.getSQL = getSQL;
    this.dialect = dialect;
    this.mapBatchResult = mapBatchResult;
    this.config = { action };
  }
  static [entityKind] = "SQLiteRaw";
  /** @internal */
  config;
  getQuery() {
    return { ...this.dialect.sqlToQuery(this.getSQL()), method: this.config.action };
  }
  mapResult(result, isFromBatch) {
    return isFromBatch ? this.mapBatchResult(result) : result;
  }
  _prepare() {
    return this;
  }
  /** @internal */
  isResponseInArrayMode() {
    return false;
  }
}
class BaseSQLiteDatabase {
  constructor(resultKind, dialect, session, schema2) {
    this.resultKind = resultKind;
    this.dialect = dialect;
    this.session = session;
    this._ = schema2 ? {
      schema: schema2.schema,
      fullSchema: schema2.fullSchema,
      tableNamesMap: schema2.tableNamesMap
    } : {
      schema: void 0,
      fullSchema: {},
      tableNamesMap: {}
    };
    this.query = {};
    const query = this.query;
    if (this._.schema) {
      for (const [tableName, columns] of Object.entries(this._.schema)) {
        query[tableName] = new RelationalQueryBuilder(
          resultKind,
          schema2.fullSchema,
          this._.schema,
          this._.tableNamesMap,
          schema2.fullSchema[tableName],
          columns,
          dialect,
          session
        );
      }
    }
    this.$cache = { invalidate: async (_params) => {
    } };
  }
  static [entityKind] = "BaseSQLiteDatabase";
  query;
  /**
   * Creates a subquery that defines a temporary named result set as a CTE.
   *
   * It is useful for breaking down complex queries into simpler parts and for reusing the result set in subsequent parts of the query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
   *
   * @param alias The alias for the subquery.
   *
   * Failure to provide an alias will result in a DrizzleTypeError, preventing the subquery from being referenced in other queries.
   *
   * @example
   *
   * ```ts
   * // Create a subquery with alias 'sq' and use it in the select query
   * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
   *
   * const result = await db.with(sq).select().from(sq);
   * ```
   *
   * To select arbitrary SQL values as fields in a CTE and reference them in other CTEs or in the main query, you need to add aliases to them:
   *
   * ```ts
   * // Select an arbitrary SQL value as a field in a CTE and reference it in the main query
   * const sq = db.$with('sq').as(db.select({
   *   name: sql<string>`upper(${users.name})`.as('name'),
   * })
   * .from(users));
   *
   * const result = await db.with(sq).select({ name: sq.name }).from(sq);
   * ```
   */
  $with = (alias, selection) => {
    const self = this;
    const as = (qb) => {
      if (typeof qb === "function") {
        qb = qb(new QueryBuilder(self.dialect));
      }
      return new Proxy(
        new WithSubquery(
          qb.getSQL(),
          selection ?? ("getSelectedFields" in qb ? qb.getSelectedFields() ?? {} : {}),
          alias,
          true
        ),
        new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
      );
    };
    return { as };
  };
  $count(source, filters) {
    return new SQLiteCountBuilder({ source, filters, session: this.session });
  }
  /**
   * Incorporates a previously defined CTE (using `$with`) into the main query.
   *
   * This method allows the main query to reference a temporary named result set.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
   *
   * @param queries The CTEs to incorporate into the main query.
   *
   * @example
   *
   * ```ts
   * // Define a subquery 'sq' as a CTE using $with
   * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
   *
   * // Incorporate the CTE 'sq' into the main query and select from it
   * const result = await db.with(sq).select().from(sq);
   * ```
   */
  with(...queries) {
    const self = this;
    function select(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries
      });
    }
    function selectDistinct(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries,
        distinct: true
      });
    }
    function update(table) {
      return new SQLiteUpdateBuilder(table, self.session, self.dialect, queries);
    }
    function insert(into) {
      return new SQLiteInsertBuilder(into, self.session, self.dialect, queries);
    }
    function delete_(from) {
      return new SQLiteDeleteBase(from, self.session, self.dialect, queries);
    }
    return { select, selectDistinct, update, insert, delete: delete_ };
  }
  select(fields) {
    return new SQLiteSelectBuilder({ fields: fields ?? void 0, session: this.session, dialect: this.dialect });
  }
  selectDistinct(fields) {
    return new SQLiteSelectBuilder({
      fields: fields ?? void 0,
      session: this.session,
      dialect: this.dialect,
      distinct: true
    });
  }
  /**
   * Creates an update query.
   *
   * Calling this method without `.where()` clause will update all rows in a table. The `.where()` clause specifies which rows should be updated.
   *
   * Use `.set()` method to specify which values to update.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param table The table to update.
   *
   * @example
   *
   * ```ts
   * // Update all rows in the 'cars' table
   * await db.update(cars).set({ color: 'red' });
   *
   * // Update rows with filters and conditions
   * await db.update(cars).set({ color: 'red' }).where(eq(cars.brand, 'BMW'));
   *
   * // Update with returning clause
   * const updatedCar: Car[] = await db.update(cars)
   *   .set({ color: 'red' })
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  update(table) {
    return new SQLiteUpdateBuilder(table, this.session, this.dialect);
  }
  $cache;
  /**
   * Creates an insert query.
   *
   * Calling this method will create new rows in a table. Use `.values()` method to specify which values to insert.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert}
   *
   * @param table The table to insert into.
   *
   * @example
   *
   * ```ts
   * // Insert one row
   * await db.insert(cars).values({ brand: 'BMW' });
   *
   * // Insert multiple rows
   * await db.insert(cars).values([{ brand: 'BMW' }, { brand: 'Porsche' }]);
   *
   * // Insert with returning clause
   * const insertedCar: Car[] = await db.insert(cars)
   *   .values({ brand: 'BMW' })
   *   .returning();
   * ```
   */
  insert(into) {
    return new SQLiteInsertBuilder(into, this.session, this.dialect);
  }
  /**
   * Creates a delete query.
   *
   * Calling this method without `.where()` clause will delete all rows in a table. The `.where()` clause specifies which rows should be deleted.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param table The table to delete from.
   *
   * @example
   *
   * ```ts
   * // Delete all rows in the 'cars' table
   * await db.delete(cars);
   *
   * // Delete rows with filters and conditions
   * await db.delete(cars).where(eq(cars.color, 'green'));
   *
   * // Delete with returning clause
   * const deletedCar: Car[] = await db.delete(cars)
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  delete(from) {
    return new SQLiteDeleteBase(from, this.session, this.dialect);
  }
  run(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.run(sequel),
        () => sequel,
        "run",
        this.dialect,
        this.session.extractRawRunValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.run(sequel);
  }
  all(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.all(sequel),
        () => sequel,
        "all",
        this.dialect,
        this.session.extractRawAllValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.all(sequel);
  }
  get(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.get(sequel),
        () => sequel,
        "get",
        this.dialect,
        this.session.extractRawGetValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.get(sequel);
  }
  values(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.values(sequel),
        () => sequel,
        "values",
        this.dialect,
        this.session.extractRawValuesValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.values(sequel);
  }
  transaction(transaction, config2) {
    return this.session.transaction(transaction, config2);
  }
}
class Cache {
  static [entityKind] = "Cache";
}
class NoopCache extends Cache {
  strategy() {
    return "all";
  }
  static [entityKind] = "NoopCache";
  async get(_key) {
    return void 0;
  }
  async put(_hashedQuery, _response, _tables, _config) {
  }
  async onMutate(_params) {
  }
}
async function hashQuery(sql2, params) {
  const dataToHash = `${sql2}-${JSON.stringify(params)}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(dataToHash);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = [...new Uint8Array(hashBuffer)];
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}
class ExecuteResultSync extends QueryPromise {
  constructor(resultCb) {
    super();
    this.resultCb = resultCb;
  }
  static [entityKind] = "ExecuteResultSync";
  async execute() {
    return this.resultCb();
  }
  sync() {
    return this.resultCb();
  }
}
class SQLitePreparedQuery {
  constructor(mode, executeMethod, query, cache, queryMetadata, cacheConfig) {
    this.mode = mode;
    this.executeMethod = executeMethod;
    this.query = query;
    this.cache = cache;
    this.queryMetadata = queryMetadata;
    this.cacheConfig = cacheConfig;
    if (cache && cache.strategy() === "all" && cacheConfig === void 0) {
      this.cacheConfig = { enable: true, autoInvalidate: true };
    }
    if (!this.cacheConfig?.enable) {
      this.cacheConfig = void 0;
    }
  }
  static [entityKind] = "PreparedQuery";
  /** @internal */
  joinsNotNullableMap;
  /** @internal */
  async queryWithCache(queryString, params, query) {
    if (this.cache === void 0 || is(this.cache, NoopCache) || this.queryMetadata === void 0) {
      try {
        return await query();
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if (this.cacheConfig && !this.cacheConfig.enable) {
      try {
        return await query();
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if ((this.queryMetadata.type === "insert" || this.queryMetadata.type === "update" || this.queryMetadata.type === "delete") && this.queryMetadata.tables.length > 0) {
      try {
        const [res] = await Promise.all([
          query(),
          this.cache.onMutate({ tables: this.queryMetadata.tables })
        ]);
        return res;
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if (!this.cacheConfig) {
      try {
        return await query();
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if (this.queryMetadata.type === "select") {
      const fromCache = await this.cache.get(
        this.cacheConfig.tag ?? await hashQuery(queryString, params),
        this.queryMetadata.tables,
        this.cacheConfig.tag !== void 0,
        this.cacheConfig.autoInvalidate
      );
      if (fromCache === void 0) {
        let result;
        try {
          result = await query();
        } catch (e) {
          throw new DrizzleQueryError(queryString, params, e);
        }
        await this.cache.put(
          this.cacheConfig.tag ?? await hashQuery(queryString, params),
          result,
          // make sure we send tables that were used in a query only if user wants to invalidate it on each write
          this.cacheConfig.autoInvalidate ? this.queryMetadata.tables : [],
          this.cacheConfig.tag !== void 0,
          this.cacheConfig.config
        );
        return result;
      }
      return fromCache;
    }
    try {
      return await query();
    } catch (e) {
      throw new DrizzleQueryError(queryString, params, e);
    }
  }
  getQuery() {
    return this.query;
  }
  mapRunResult(result, _isFromBatch) {
    return result;
  }
  mapAllResult(_result, _isFromBatch) {
    throw new Error("Not implemented");
  }
  mapGetResult(_result, _isFromBatch) {
    throw new Error("Not implemented");
  }
  execute(placeholderValues) {
    if (this.mode === "async") {
      return this[this.executeMethod](placeholderValues);
    }
    return new ExecuteResultSync(() => this[this.executeMethod](placeholderValues));
  }
  mapResult(response, isFromBatch) {
    switch (this.executeMethod) {
      case "run": {
        return this.mapRunResult(response, isFromBatch);
      }
      case "all": {
        return this.mapAllResult(response, isFromBatch);
      }
      case "get": {
        return this.mapGetResult(response, isFromBatch);
      }
    }
  }
}
class SQLiteSession {
  constructor(dialect) {
    this.dialect = dialect;
  }
  static [entityKind] = "SQLiteSession";
  prepareOneTimeQuery(query, fields, executeMethod, isResponseInArrayMode, customResultMapper, queryMetadata, cacheConfig) {
    return this.prepareQuery(
      query,
      fields,
      executeMethod,
      isResponseInArrayMode,
      customResultMapper,
      queryMetadata,
      cacheConfig
    );
  }
  run(query) {
    const staticQuery = this.dialect.sqlToQuery(query);
    try {
      return this.prepareOneTimeQuery(staticQuery, void 0, "run", false).run();
    } catch (err) {
      throw new DrizzleError({ cause: err, message: `Failed to run the query '${staticQuery.sql}'` });
    }
  }
  /** @internal */
  extractRawRunValueFromBatchResult(result) {
    return result;
  }
  all(query) {
    return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).all();
  }
  /** @internal */
  extractRawAllValueFromBatchResult(_result) {
    throw new Error("Not implemented");
  }
  get(query) {
    return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).get();
  }
  /** @internal */
  extractRawGetValueFromBatchResult(_result) {
    throw new Error("Not implemented");
  }
  values(query) {
    return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).values();
  }
  async count(sql2) {
    const result = await this.values(sql2);
    return result[0][0];
  }
  /** @internal */
  extractRawValuesValueFromBatchResult(_result) {
    throw new Error("Not implemented");
  }
}
class SQLiteTransaction extends BaseSQLiteDatabase {
  constructor(resultType, dialect, session, schema2, nestedIndex = 0) {
    super(resultType, dialect, session, schema2);
    this.schema = schema2;
    this.nestedIndex = nestedIndex;
  }
  static [entityKind] = "SQLiteTransaction";
  rollback() {
    throw new TransactionRollbackError();
  }
}
class BetterSQLiteSession extends SQLiteSession {
  constructor(client, dialect, schema2, options = {}) {
    super(dialect);
    this.client = client;
    this.schema = schema2;
    this.logger = options.logger ?? new NoopLogger();
    this.cache = options.cache ?? new NoopCache();
  }
  static [entityKind] = "BetterSQLiteSession";
  logger;
  cache;
  prepareQuery(query, fields, executeMethod, isResponseInArrayMode, customResultMapper, queryMetadata, cacheConfig) {
    const stmt = this.client.prepare(query.sql);
    return new PreparedQuery(
      stmt,
      query,
      this.logger,
      this.cache,
      queryMetadata,
      cacheConfig,
      fields,
      executeMethod,
      isResponseInArrayMode,
      customResultMapper
    );
  }
  transaction(transaction, config2 = {}) {
    const tx = new BetterSQLiteTransaction("sync", this.dialect, this, this.schema);
    const nativeTx = this.client.transaction(transaction);
    return nativeTx[config2.behavior ?? "deferred"](tx);
  }
}
class BetterSQLiteTransaction extends SQLiteTransaction {
  static [entityKind] = "BetterSQLiteTransaction";
  transaction(transaction) {
    const savepointName = `sp${this.nestedIndex}`;
    const tx = new BetterSQLiteTransaction("sync", this.dialect, this.session, this.schema, this.nestedIndex + 1);
    this.session.run(sql.raw(`savepoint ${savepointName}`));
    try {
      const result = transaction(tx);
      this.session.run(sql.raw(`release savepoint ${savepointName}`));
      return result;
    } catch (err) {
      this.session.run(sql.raw(`rollback to savepoint ${savepointName}`));
      throw err;
    }
  }
}
class PreparedQuery extends SQLitePreparedQuery {
  constructor(stmt, query, logger, cache, queryMetadata, cacheConfig, fields, executeMethod, _isResponseInArrayMode, customResultMapper) {
    super("sync", executeMethod, query, cache, queryMetadata, cacheConfig);
    this.stmt = stmt;
    this.logger = logger;
    this.fields = fields;
    this._isResponseInArrayMode = _isResponseInArrayMode;
    this.customResultMapper = customResultMapper;
  }
  static [entityKind] = "BetterSQLitePreparedQuery";
  run(placeholderValues) {
    const params = fillPlaceholders(this.query.params, placeholderValues ?? {});
    this.logger.logQuery(this.query.sql, params);
    return this.stmt.run(...params);
  }
  all(placeholderValues) {
    const { fields, joinsNotNullableMap, query, logger, stmt, customResultMapper } = this;
    if (!fields && !customResultMapper) {
      const params = fillPlaceholders(query.params, placeholderValues ?? {});
      logger.logQuery(query.sql, params);
      return stmt.all(...params);
    }
    const rows = this.values(placeholderValues);
    if (customResultMapper) {
      return customResultMapper(rows);
    }
    return rows.map((row) => mapResultRow(fields, row, joinsNotNullableMap));
  }
  get(placeholderValues) {
    const params = fillPlaceholders(this.query.params, placeholderValues ?? {});
    this.logger.logQuery(this.query.sql, params);
    const { fields, stmt, joinsNotNullableMap, customResultMapper } = this;
    if (!fields && !customResultMapper) {
      return stmt.get(...params);
    }
    const row = stmt.raw().get(...params);
    if (!row) {
      return void 0;
    }
    if (customResultMapper) {
      return customResultMapper([row]);
    }
    return mapResultRow(fields, row, joinsNotNullableMap);
  }
  values(placeholderValues) {
    const params = fillPlaceholders(this.query.params, placeholderValues ?? {});
    this.logger.logQuery(this.query.sql, params);
    return this.stmt.raw().all(...params);
  }
  /** @internal */
  isResponseInArrayMode() {
    return this._isResponseInArrayMode;
  }
}
class BetterSQLite3Database extends BaseSQLiteDatabase {
  static [entityKind] = "BetterSQLite3Database";
}
function construct(client, config2 = {}) {
  const dialect = new SQLiteSyncDialect({ casing: config2.casing });
  let logger;
  if (config2.logger === true) {
    logger = new DefaultLogger();
  } else if (config2.logger !== false) {
    logger = config2.logger;
  }
  let schema2;
  if (config2.schema) {
    const tablesConfig = extractTablesRelationalConfig(
      config2.schema,
      createTableRelationsHelpers
    );
    schema2 = {
      fullSchema: config2.schema,
      schema: tablesConfig.tables,
      tableNamesMap: tablesConfig.tableNamesMap
    };
  }
  const session = new BetterSQLiteSession(client, dialect, schema2, { logger });
  const db = new BetterSQLite3Database("sync", dialect, session, schema2);
  db.$client = client;
  return db;
}
function drizzle(...params) {
  if (params[0] === void 0 || typeof params[0] === "string") {
    const instance = params[0] === void 0 ? new Client() : new Client(params[0]);
    return construct(instance, params[1]);
  }
  if (isConfig(params[0])) {
    const { connection, client, ...drizzleConfig } = params[0];
    if (client) return construct(client, drizzleConfig);
    if (typeof connection === "object") {
      const { source, ...options } = connection;
      const instance2 = new Client(source, options);
      return construct(instance2, drizzleConfig);
    }
    const instance = new Client(connection);
    return construct(instance, drizzleConfig);
  }
  return construct(params[0], params[1]);
}
((drizzle2) => {
  function mock(config2) {
    return construct({}, config2);
  }
  drizzle2.mock = mock;
})(drizzle || (drizzle = {}));
const money = (name) => integer$1(name);
const quantity = (name) => integer$1(name);
const timestamps = {
  createdAt: integer$1("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer$1("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
};
const softDelete = {
  deletedAt: integer$1("deleted_at", { mode: "timestamp" })
};
const customers = sqliteTable(
  "customers",
  {
    id: integer$1("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    contactNumber: text("contact_number"),
    address: text("address"),
    /**
     * Cached outstanding balance in paisa.
     * Recalculated by the payment service on every bill/payment write.
     * NEVER trust this for accounting math — always recompute from bills.
     */
    cachedOutstanding: money("cached_outstanding").notNull().default(0),
    ...timestamps,
    ...softDelete
  },
  (t) => ({
    nameIdx: index("customers_name_idx").on(t.name),
    contactIdx: index("customers_contact_idx").on(t.contactNumber)
  })
);
const customersRelations = relations(customers, ({ many }) => ({
  // Forward references declared in their own modules.
  // Drizzle resolves them via the barrel file.
}));
const companies = sqliteTable(
  "companies",
  {
    id: integer$1("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    contactNumber: text("contact_number"),
    ...timestamps,
    ...softDelete
  },
  (t) => ({
    nameIdx: index("companies_name_idx").on(t.name)
  })
);
const companiesRelations = relations(companies, ({ many }) => ({
  // Populated when products / purchases / company-payments exist.
}));
const categories = sqliteTable("categories", {
  id: integer$1("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  ...timestamps,
  ...softDelete
});
const categoriesRelations = relations(categories, ({ many }) => ({
  // Populated when products exist.
}));
const units = sqliteTable(
  "units",
  {
    id: integer$1("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    shortName: text("short_name").notNull(),
    ...timestamps,
    ...softDelete
  },
  (t) => ({
    nameIdx: index("units_name_idx").on(t.name)
  })
);
const unitConversions = sqliteTable(
  "unit_conversions",
  {
    id: integer$1("id").primaryKey({ autoIncrement: true }),
    fromUnitId: integer$1("from_unit_id").notNull().references(() => units.id, { onDelete: "cascade" }),
    toUnitId: integer$1("to_unit_id").notNull().references(() => units.id, { onDelete: "cascade" }),
    factor: integer$1("factor").notNull(),
    ...timestamps
  },
  (t) => ({
    pairUnique: unique("unit_conversions_pair_unique").on(
      t.fromUnitId,
      t.toUnitId
    ),
    fromIdx: index("unit_conversions_from_idx").on(t.fromUnitId),
    toIdx: index("unit_conversions_to_idx").on(t.toUnitId)
  })
);
const unitsRelations = relations(units, ({ many }) => ({
  conversionsFrom: many(unitConversions, { relationName: "fromUnit" }),
  conversionsTo: many(unitConversions, { relationName: "toUnit" })
}));
const unitConversionsRelations = relations(
  unitConversions,
  ({ one }) => ({
    fromUnit: one(units, {
      fields: [unitConversions.fromUnitId],
      references: [units.id],
      relationName: "fromUnit"
    }),
    toUnit: one(units, {
      fields: [unitConversions.toUnitId],
      references: [units.id],
      relationName: "toUnit"
    })
  })
);
const products = sqliteTable(
  "products",
  {
    id: integer$1("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    categoryId: integer$1("category_id").references(() => categories.id),
    companyId: integer$1("company_id").references(() => companies.id),
    ...timestamps,
    ...softDelete
  },
  (t) => ({
    nameIdx: index("products_name_idx").on(t.name),
    categoryIdx: index("products_category_idx").on(t.categoryId),
    companyIdx: index("products_company_idx").on(t.companyId)
  })
);
const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id]
  }),
  company: one(companies, {
    fields: [products.companyId],
    references: [companies.id]
  })
  // variants: many(variants), — added in Phase 1.6
}));
const variants = sqliteTable(
  "variants",
  {
    id: integer$1("id").primaryKey({ autoIncrement: true }),
    productId: integer$1("product_id").notNull().references(() => products.id),
    name: text("name").notNull(),
    baseUnitId: integer$1("base_unit_id").notNull().references(() => units.id),
    /**
     * Low-stock alert threshold (milli-units).
     * null = no threshold set (never alerts).
     */
    lowStockThreshold: quantity("low_stock_threshold"),
    ...timestamps,
    ...softDelete
  },
  (t) => ({
    productIdx: index("variants_product_idx").on(t.productId),
    unitIdx: index("variants_unit_idx").on(t.baseUnitId),
    nameIdx: index("variants_name_idx").on(t.name)
  })
);
const variantsRelations = relations(variants, ({ one, many }) => ({
  product: one(products, {
    fields: [variants.productId],
    references: [products.id]
  }),
  baseUnit: one(units, {
    fields: [variants.baseUnitId],
    references: [units.id]
  })
}));
const stockLedger = sqliteTable(
  "stock_ledger",
  {
    id: integer$1("id").primaryKey({ autoIncrement: true }),
    batchId: integer$1("batch_id").notNull().references(() => stockBatches.id),
    variantId: integer$1("variant_id").notNull().references(() => variants.id),
    // Positive = stock in, negative = stock out
    quantityChange: quantity("quantity_change").notNull(),
    unitCost: money("unit_cost").notNull(),
    movementType: text("movement_type", {
      enum: ["purchase", "sale", "adjustment", "damage", "return"]
    }).notNull(),
    // Polymorphic reference: which purchase / bill / adjustment caused this.
    referenceType: text("reference_type", {
      enum: ["purchase", "bill", "adjustment"]
    }),
    referenceId: integer$1("reference_id"),
    notes: text("notes"),
    ...timestamps
  },
  (t) => ({
    batchIdx: index("stock_ledger_batch_idx").on(t.batchId),
    variantIdx: index("stock_ledger_variant_idx").on(t.variantId),
    refIdx: index("stock_ledger_ref_idx").on(t.referenceType, t.referenceId),
    typeIdx: index("stock_ledger_type_idx").on(t.movementType),
    dateIdx: index("stock_ledger_created_idx").on(t.createdAt)
  })
);
const stockLedgerRelations = relations(stockLedger, ({ one }) => ({
  batch: one(stockBatches, {
    fields: [stockLedger.batchId],
    references: [stockBatches.id]
  }),
  variant: one(variants, {
    fields: [stockLedger.variantId],
    references: [variants.id]
  })
}));
const stockBatches = sqliteTable(
  "stock_batches",
  {
    id: integer$1("id").primaryKey({ autoIncrement: true }),
    variantId: integer$1("variant_id").notNull().references(() => variants.id),
    // Nullable: positive adjustments create batches without a purchase
    purchaseId: integer$1("purchase_id").references(() => purchases.id),
    purchasePrice: money("purchase_price").notNull(),
    suggestedRetailPrice: money("suggested_retail_price"),
    suggestedWholesalePrice: money("suggested_wholesale_price"),
    quantityPurchased: quantity("quantity_purchased").notNull(),
    remainingQuantity: quantity("remaining_quantity").notNull(),
    purchaseDate: integer$1("purchase_date", { mode: "timestamp" }).notNull(),
    ...timestamps
  },
  (t) => ({
    variantIdx: index("stock_batches_variant_idx").on(t.variantId),
    fifoIdx: index("stock_batches_fifo_idx").on(t.variantId, t.purchaseDate)
  })
);
const stockBatchesRelations = relations(stockBatches, ({ one, many }) => ({
  variant: one(variants, {
    fields: [stockBatches.variantId],
    references: [variants.id]
  }),
  purchase: one(purchases, {
    fields: [stockBatches.purchaseId],
    references: [purchases.id]
  }),
  ledgerEntries: many(stockLedger)
}));
const purchases = sqliteTable(
  "purchases",
  {
    id: integer$1("id").primaryKey({ autoIncrement: true }),
    purchaseNumber: text("purchase_number").notNull().unique(),
    companyId: integer$1("company_id").notNull().references(() => companies.id),
    purchaseDate: integer$1("purchase_date", { mode: "timestamp" }).notNull(),
    totalAmount: money("total_amount").notNull(),
    paidAmount: money("paid_amount").notNull().default(0),
    remarks: text("remarks"),
    ...timestamps
  },
  (t) => ({
    companyIdx: index("purchases_company_idx").on(t.companyId),
    dateIdx: index("purchases_date_idx").on(t.purchaseDate)
  })
);
const purchasesRelations = relations(purchases, ({ one, many }) => ({
  company: one(companies, {
    fields: [purchases.companyId],
    references: [companies.id]
  }),
  batches: many(stockBatches)
}));
const stockAdjustments = sqliteTable(
  "stock_adjustments",
  {
    id: integer$1("id").primaryKey({ autoIncrement: true }),
    variantId: integer$1("variant_id").notNull().references(() => variants.id),
    // Signed: negative = write-off, positive = found/returned
    quantity: quantity("quantity").notNull(),
    // Cost per unit at adjustment time (paisa). Used for COGS/loss accounting.
    unitCost: money("unit_cost").notNull(),
    adjustmentType: text("adjustment_type", {
      enum: ["damaged", "lost", "correction", "return"]
    }).notNull(),
    reason: text("reason"),
    adjustmentDate: integer$1("adjustment_date", {
      mode: "timestamp"
    }).notNull(),
    ...timestamps
  },
  (t) => ({
    variantIdx: index("stock_adjustments_variant_idx").on(t.variantId),
    typeIdx: index("stock_adjustments_type_idx").on(t.adjustmentType),
    dateIdx: index("stock_adjustments_date_idx").on(t.adjustmentDate)
  })
);
const stockAdjustmentsRelations = relations(
  stockAdjustments,
  ({ one }) => ({
    variant: one(variants, {
      fields: [stockAdjustments.variantId],
      references: [variants.id]
    })
  })
);
const billItemFifo = sqliteTable(
  "bill_item_fifo",
  {
    id: integer$1("id").primaryKey({ autoIncrement: true }),
    billItemId: integer$1("bill_item_id").notNull().references(() => billItems.id, { onDelete: "cascade" }),
    batchId: integer$1("batch_id").notNull().references(() => stockBatches.id),
    quantityConsumed: quantity("quantity_consumed").notNull(),
    unitCost: money("unit_cost").notNull(),
    ...timestamps
  },
  (t) => ({
    billItemIdx: index("bill_item_fifo_item_idx").on(t.billItemId),
    batchIdx: index("bill_item_fifo_batch_idx").on(t.batchId)
  })
);
const billItemFifoRelations = relations(billItemFifo, ({ one }) => ({
  billItem: one(billItems, {
    fields: [billItemFifo.billItemId],
    references: [billItems.id]
  }),
  batch: one(stockBatches, {
    fields: [billItemFifo.batchId],
    references: [stockBatches.id]
  })
}));
const billItems = sqliteTable(
  "bill_items",
  {
    id: integer$1("id").primaryKey({ autoIncrement: true }),
    billId: integer$1("bill_id").notNull().references(() => bills.id, { onDelete: "cascade" }),
    variantId: integer$1("variant_id").notNull().references(() => variants.id),
    unitId: integer$1("unit_id").notNull().references(() => units.id),
    quantity: quantity("quantity").notNull(),
    unitPrice: money("unit_price").notNull(),
    lineTotal: money("line_total").notNull(),
    lineCogs: money("line_cogs").notNull().default(0),
    ...timestamps
  },
  (t) => ({
    billIdx: index("bill_items_bill_idx").on(t.billId),
    variantIdx: index("bill_items_variant_idx").on(t.variantId)
  })
);
const billItemsRelations = relations(billItems, ({ one, many }) => ({
  bill: one(bills, {
    fields: [billItems.billId],
    references: [bills.id]
  }),
  variant: one(variants, {
    fields: [billItems.variantId],
    references: [variants.id]
  }),
  unit: one(units, {
    fields: [billItems.unitId],
    references: [units.id]
  }),
  fifoConsumptions: many(billItemFifo)
}));
const paymentAllocations = sqliteTable(
  "payment_allocations",
  {
    id: integer$1("id").primaryKey({ autoIncrement: true }),
    paymentId: integer$1("payment_id").notNull().references(() => payments.id, { onDelete: "cascade" }),
    billId: integer$1("bill_id").notNull().references(() => bills.id),
    amount: money("amount").notNull(),
    ...timestamps
  },
  (t) => ({
    paymentIdx: index("payment_alloc_payment_idx").on(t.paymentId),
    billIdx: index("payment_alloc_bill_idx").on(t.billId)
  })
);
const paymentAllocationsRelations = relations(
  paymentAllocations,
  ({ one }) => ({
    payment: one(payments, {
      fields: [paymentAllocations.paymentId],
      references: [payments.id]
    }),
    bill: one(bills, {
      fields: [paymentAllocations.billId],
      references: [bills.id]
    })
  })
);
const payments = sqliteTable(
  "payments",
  {
    id: integer$1("id").primaryKey({ autoIncrement: true }),
    customerId: integer$1("customer_id").notNull().references(() => customers.id),
    billId: integer$1("bill_id").references(() => bills.id),
    amount: money("amount").notNull(),
    paymentDate: integer$1("payment_date", { mode: "timestamp" }).notNull(),
    remarks: text("remarks"),
    ...timestamps
  },
  (t) => ({
    customerIdx: index("payments_customer_idx").on(t.customerId),
    billIdx: index("payments_bill_idx").on(t.billId),
    dateIdx: index("payments_date_idx").on(t.paymentDate)
  })
);
const paymentsRelations = relations(payments, ({ one, many }) => ({
  customer: one(customers, {
    fields: [payments.customerId],
    references: [customers.id]
  }),
  bill: one(bills, {
    fields: [payments.billId],
    references: [bills.id]
  }),
  allocations: many(paymentAllocations)
}));
const bills = sqliteTable(
  "bills",
  {
    id: integer$1("id").primaryKey({ autoIncrement: true }),
    billNumber: text("bill_number").notNull().unique(),
    customerId: integer$1("customer_id").references(() => customers.id),
    billDate: integer$1("bill_date", { mode: "timestamp" }).notNull(),
    totalAmount: money("total_amount").notNull(),
    paidAmount: money("paid_amount").notNull().default(0),
    remainingAmount: money("remaining_amount").notNull().default(0),
    cogs: money("cogs").notNull().default(0),
    status: text("status", {
      enum: ["draft", "held", "finalized", "cancelled", "returned"]
    }).notNull().default("finalized"),
    remarks: text("remarks"),
    ...timestamps
  },
  (t) => ({
    customerIdx: index("bills_customer_idx").on(t.customerId),
    dateIdx: index("bills_date_idx").on(t.billDate),
    statusIdx: index("bills_status_idx").on(t.status)
  })
);
const billsRelations = relations(bills, ({ one, many }) => ({
  customer: one(customers, {
    fields: [bills.customerId],
    references: [customers.id]
  }),
  items: many(billItems),
  payments: many(payments)
}));
const expenses = sqliteTable(
  "expenses",
  {
    id: integer$1("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    amount: money("amount").notNull(),
    date: integer$1("date", { mode: "timestamp" }).notNull(),
    remarks: text("remarks"),
    ...timestamps
  },
  (t) => ({
    dateIdx: index("expenses_date_idx").on(t.date),
    nameIdx: index("expenses_name_idx").on(t.name)
  })
);
const companyPayments = sqliteTable(
  "company_payments",
  {
    id: integer$1("id").primaryKey({ autoIncrement: true }),
    companyId: integer$1("company_id").notNull().references(() => companies.id),
    purchaseId: integer$1("purchase_id").references(() => purchases.id),
    amount: money("amount").notNull(),
    date: integer$1("date", { mode: "timestamp" }).notNull(),
    remarks: text("remarks"),
    ...timestamps
  },
  (t) => ({
    companyIdx: index("company_payments_company_idx").on(t.companyId),
    dateIdx: index("company_payments_date_idx").on(t.date)
  })
);
const companyPaymentsRelations = relations(
  companyPayments,
  ({ one }) => ({
    company: one(companies, {
      fields: [companyPayments.companyId],
      references: [companies.id]
    }),
    purchase: one(purchases, {
      fields: [companyPayments.purchaseId],
      references: [purchases.id]
    })
  })
);
const companyPaymentAllocations = sqliteTable(
  "company_payment_allocations",
  {
    id: integer$1("id").primaryKey({ autoIncrement: true }),
    companyPaymentId: integer$1("company_payment_id").notNull().references(() => companyPayments.id, { onDelete: "cascade" }),
    purchaseId: integer$1("purchase_id").notNull().references(() => purchases.id),
    amount: money("amount").notNull(),
    ...timestamps
  },
  (t) => ({
    paymentIdx: index("company_payment_alloc_payment_idx").on(
      t.companyPaymentId
    ),
    purchaseIdx: index("company_payment_alloc_purchase_idx").on(t.purchaseId)
  })
);
const companyPaymentAllocationsRelations = relations(
  companyPaymentAllocations,
  ({ one }) => ({
    companyPayment: one(companyPayments, {
      fields: [companyPaymentAllocations.companyPaymentId],
      references: [companyPayments.id]
    }),
    purchase: one(purchases, {
      fields: [companyPaymentAllocations.purchaseId],
      references: [purchases.id]
    })
  })
);
const schema = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  billItemFifo,
  billItemFifoRelations,
  billItems,
  billItemsRelations,
  bills,
  billsRelations,
  categories,
  categoriesRelations,
  companies,
  companiesRelations,
  companyPaymentAllocations,
  companyPaymentAllocationsRelations,
  companyPayments,
  companyPaymentsRelations,
  customers,
  customersRelations,
  expenses,
  money,
  paymentAllocations,
  paymentAllocationsRelations,
  payments,
  paymentsRelations,
  products,
  productsRelations,
  purchases,
  purchasesRelations,
  quantity,
  softDelete,
  stockAdjustments,
  stockAdjustmentsRelations,
  stockBatches,
  stockBatchesRelations,
  stockLedger,
  stockLedgerRelations,
  timestamps,
  unitConversions,
  unitConversionsRelations,
  units,
  unitsRelations,
  variants,
  variantsRelations
}, Symbol.toStringTag, { value: "Module" }));
const DB_FILENAME = "apni-dukan.db";
function getUserDataDir() {
  const dir = require$$3$1.app.getPath("userData");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}
function getDatabasePath() {
  if (process.env.NODE_ENV === "development" || !require$$3$1.app.isPackaged) {
    return path.join(process.cwd(), "dev-apni-dukan.db");
  }
  return path.join(getUserDataDir(), DB_FILENAME);
}
function getMigrationsPath() {
  if (process.env.NODE_ENV === "development" || !require$$3$1.app.isPackaged) {
    return path.join(process.cwd(), "drizzle");
  }
  return path.join(process.resourcesPath, "drizzle");
}
function createClient() {
  const dbPath = getDatabasePath();
  const sqlite = new Client(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  sqlite.pragma("synchronous = NORMAL");
  return drizzle(sqlite, { schema });
}
let _db = null;
function getDb() {
  if (!_db) {
    _db = createClient();
  }
  return _db;
}
function closeDb() {
  if (_db) {
    _db.$client.close();
    _db = null;
  }
}
function runMigrations() {
  const migrationsFolder = getMigrationsPath();
  if (!fs.existsSync(migrationsFolder)) {
    console.warn(
      `[migrate] Migrations folder not found at ${migrationsFolder}. Skipping.`
    );
    return;
  }
  console.log(`[migrate] Running migrations from ${migrationsFolder}`);
  try {
    migrate(getDb(), { migrationsFolder });
    console.log("[migrate] Migrations applied successfully.");
  } catch (err) {
    console.error("[migrate] Migration failed:", err);
    throw err;
  }
}
function registerAppIpc() {
  require$$3$1.ipcMain.handle(
    "app:ping",
    async (_event, payload) => {
      return {
        reply: `pong: ${payload.message}`,
        timestamp: Date.now()
      };
    }
  );
  require$$3$1.ipcMain.handle(
    "app:version",
    async () => {
      return {
        app: require$$3$1.app.getVersion(),
        electron: process.versions.electron,
        node: process.versions.node,
        chrome: process.versions.chrome
      };
    }
  );
}
function toDto$7(row) {
  return {
    id: row.id,
    name: row.name,
    contactNumber: row.contactNumber ?? null,
    address: row.address ?? null,
    cachedOutstanding: row.cachedOutstanding,
    createdAt: Math.floor(row.createdAt.getTime() / 1e3),
    updatedAt: Math.floor(row.updatedAt.getTime() / 1e3),
    deletedAt: row.deletedAt ? Math.floor(row.deletedAt.getTime() / 1e3) : null
  };
}
const customerService = {
  async list(query) {
    const db = getDb();
    const conditions = [];
    if (!query.includeDeleted) {
      conditions.push(isNull(customers.deletedAt));
    }
    if (query.search && query.search.length > 0) {
      const term = `%${query.search}%`;
      conditions.push(
        or(
          like(customers.name, term),
          like(customers.contactNumber, term)
        )
      );
    }
    const rows = await db.select().from(customers).where(conditions.length > 0 ? and(...conditions) : void 0).orderBy(asc(customers.name)).limit(query.limit).offset(query.offset);
    return rows.map(toDto$7);
  },
  async getById(id) {
    const db = getDb();
    const rows = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    return rows[0] ? toDto$7(rows[0]) : null;
  },
  async create(input) {
    const db = getDb();
    const [row] = await db.insert(customers).values({
      name: input.name,
      contactNumber: input.contactNumber ?? null,
      address: input.address ?? null
    }).returning();
    return toDto$7(row);
  },
  async update(input) {
    const db = getDb();
    const { id, ...patch } = input;
    const updateValues = {
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (patch.name !== void 0) updateValues.name = patch.name;
    if (patch.contactNumber !== void 0)
      updateValues.contactNumber = patch.contactNumber ?? null;
    if (patch.address !== void 0)
      updateValues.address = patch.address ?? null;
    const [row] = await db.update(customers).set(updateValues).where(eq(customers.id, id)).returning();
    if (!row) throw new Error(`Customer ${id} not found`);
    return toDto$7(row);
  },
  /**
   * Soft delete. Never physically removes.
   * Financial records (bills, payments) keep pointing at the row.
   */
  async softDelete(id) {
    const db = getDb();
    await db.update(customers).set({ deletedAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where(eq(customers.id, id));
  },
  async restore(id) {
    const db = getDb();
    await db.update(customers).set({ deletedAt: null, updatedAt: /* @__PURE__ */ new Date() }).where(eq(customers.id, id));
  },
  /**
   * Fast count for list pagination headers.
   */
  async count(query) {
    const db = getDb();
    const conditions = [];
    if (!query.includeDeleted) conditions.push(isNull(customers.deletedAt));
    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(
        or(like(customers.name, term), like(customers.contactNumber, term))
      );
    }
    const [row] = await db.select({ count: sql`count(*)` }).from(customers).where(conditions.length > 0 ? and(...conditions) : void 0);
    return row?.count ?? 0;
  }
};
var _a$1;
function $constructor(name, initializer2, params) {
  function init(inst, def) {
    if (!inst._zod) {
      Object.defineProperty(inst, "_zod", {
        value: {
          def,
          constr: _,
          traits: /* @__PURE__ */ new Set()
        },
        enumerable: false
      });
    }
    if (inst._zod.traits.has(name)) {
      return;
    }
    inst._zod.traits.add(name);
    initializer2(inst, def);
    const proto = _.prototype;
    const keys = Object.keys(proto);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (!(k in inst)) {
        inst[k] = proto[k].bind(inst);
      }
    }
  }
  const Parent = params?.Parent ?? Object;
  class Definition extends Parent {
  }
  Object.defineProperty(Definition, "name", { value: name });
  function _(def) {
    var _a2;
    const inst = params?.Parent ? new Definition() : this;
    init(inst, def);
    (_a2 = inst._zod).deferred ?? (_a2.deferred = []);
    for (const fn of inst._zod.deferred) {
      fn();
    }
    return inst;
  }
  Object.defineProperty(_, "init", { value: init });
  Object.defineProperty(_, Symbol.hasInstance, {
    value: (inst) => {
      if (params?.Parent && inst instanceof params.Parent)
        return true;
      return inst?._zod?.traits?.has(name);
    }
  });
  Object.defineProperty(_, "name", { value: name });
  return _;
}
class $ZodAsyncError extends Error {
  constructor() {
    super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
  }
}
class $ZodEncodeError extends Error {
  constructor(name) {
    super(`Encountered unidirectional transform during encode: ${name}`);
    this.name = "ZodEncodeError";
  }
}
(_a$1 = globalThis).__zod_globalConfig ?? (_a$1.__zod_globalConfig = {});
const globalConfig = globalThis.__zod_globalConfig;
function config(newConfig) {
  return globalConfig;
}
function getEnumValues(entries) {
  const numericValues = Object.values(entries).filter((v) => typeof v === "number");
  const values = Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
  return values;
}
function jsonStringifyReplacer(_, value) {
  if (typeof value === "bigint")
    return value.toString();
  return value;
}
function cached(getter) {
  return {
    get value() {
      {
        const value = getter();
        Object.defineProperty(this, "value", { value });
        return value;
      }
    }
  };
}
function nullish(input) {
  return input === null || input === void 0;
}
function cleanRegex(source) {
  const start = source.startsWith("^") ? 1 : 0;
  const end = source.endsWith("$") ? source.length - 1 : source.length;
  return source.slice(start, end);
}
function floatSafeRemainder(val, step) {
  const ratio = val / step;
  const roundedRatio = Math.round(ratio);
  const tolerance = Number.EPSILON * Math.max(Math.abs(ratio), 1);
  if (Math.abs(ratio - roundedRatio) < tolerance)
    return 0;
  return ratio - roundedRatio;
}
const EVALUATING = /* @__PURE__ */ Symbol("evaluating");
function defineLazy(object2, key, getter) {
  let value = void 0;
  Object.defineProperty(object2, key, {
    get() {
      if (value === EVALUATING) {
        return void 0;
      }
      if (value === void 0) {
        value = EVALUATING;
        value = getter();
      }
      return value;
    },
    set(v) {
      Object.defineProperty(object2, key, {
        value: v
        // configurable: true,
      });
    },
    configurable: true
  });
}
function assignProp(target, prop, value) {
  Object.defineProperty(target, prop, {
    value,
    writable: true,
    enumerable: true,
    configurable: true
  });
}
function mergeDefs(...defs) {
  const mergedDescriptors = {};
  for (const def of defs) {
    const descriptors = Object.getOwnPropertyDescriptors(def);
    Object.assign(mergedDescriptors, descriptors);
  }
  return Object.defineProperties({}, mergedDescriptors);
}
function esc(str) {
  return JSON.stringify(str);
}
function slugify(input) {
  return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
const captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {
};
function isObject(data) {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}
const allowsEval = /* @__PURE__ */ cached(() => {
  if (globalConfig.jitless) {
    return false;
  }
  if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) {
    return false;
  }
  try {
    const F = Function;
    new F("");
    return true;
  } catch (_) {
    return false;
  }
});
function isPlainObject(o) {
  if (isObject(o) === false)
    return false;
  const ctor = o.constructor;
  if (ctor === void 0)
    return true;
  if (typeof ctor !== "function")
    return true;
  const prot = ctor.prototype;
  if (isObject(prot) === false)
    return false;
  if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) {
    return false;
  }
  return true;
}
function shallowClone(o) {
  if (isPlainObject(o))
    return { ...o };
  if (Array.isArray(o))
    return [...o];
  if (o instanceof Map)
    return new Map(o);
  if (o instanceof Set)
    return new Set(o);
  return o;
}
const propertyKeyTypes = /* @__PURE__ */ new Set(["string", "number", "symbol"]);
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
  const cl = new inst._zod.constr(def ?? inst._zod.def);
  if (!def || params?.parent)
    cl._zod.parent = inst;
  return cl;
}
function normalizeParams(_params) {
  const params = _params;
  if (!params)
    return {};
  if (typeof params === "string")
    return { error: () => params };
  if (params?.message !== void 0) {
    if (params?.error !== void 0)
      throw new Error("Cannot specify both `message` and `error` params");
    params.error = params.message;
  }
  delete params.message;
  if (typeof params.error === "string")
    return { ...params, error: () => params.error };
  return params;
}
function optionalKeys(shape) {
  return Object.keys(shape).filter((k) => {
    return shape[k]._zod.optin === "optional" && shape[k]._zod.optout === "optional";
  });
}
const NUMBER_FORMAT_RANGES = {
  safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  int32: [-2147483648, 2147483647],
  uint32: [0, 4294967295],
  float32: [-34028234663852886e22, 34028234663852886e22],
  float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
};
function pick(schema2, mask) {
  const currDef = schema2._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".pick() cannot be used on object schemas containing refinements");
  }
  const def = mergeDefs(schema2._zod.def, {
    get shape() {
      const newShape = {};
      for (const key in mask) {
        if (!(key in currDef.shape)) {
          throw new Error(`Unrecognized key: "${key}"`);
        }
        if (!mask[key])
          continue;
        newShape[key] = currDef.shape[key];
      }
      assignProp(this, "shape", newShape);
      return newShape;
    },
    checks: []
  });
  return clone(schema2, def);
}
function omit(schema2, mask) {
  const currDef = schema2._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".omit() cannot be used on object schemas containing refinements");
  }
  const def = mergeDefs(schema2._zod.def, {
    get shape() {
      const newShape = { ...schema2._zod.def.shape };
      for (const key in mask) {
        if (!(key in currDef.shape)) {
          throw new Error(`Unrecognized key: "${key}"`);
        }
        if (!mask[key])
          continue;
        delete newShape[key];
      }
      assignProp(this, "shape", newShape);
      return newShape;
    },
    checks: []
  });
  return clone(schema2, def);
}
function extend(schema2, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to extend: expected a plain object");
  }
  const checks = schema2._zod.def.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    const existingShape = schema2._zod.def.shape;
    for (const key in shape) {
      if (Object.getOwnPropertyDescriptor(existingShape, key) !== void 0) {
        throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
      }
    }
  }
  const def = mergeDefs(schema2._zod.def, {
    get shape() {
      const _shape = { ...schema2._zod.def.shape, ...shape };
      assignProp(this, "shape", _shape);
      return _shape;
    }
  });
  return clone(schema2, def);
}
function safeExtend(schema2, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to safeExtend: expected a plain object");
  }
  const def = mergeDefs(schema2._zod.def, {
    get shape() {
      const _shape = { ...schema2._zod.def.shape, ...shape };
      assignProp(this, "shape", _shape);
      return _shape;
    }
  });
  return clone(schema2, def);
}
function merge(a, b) {
  if (a._zod.def.checks?.length) {
    throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
  }
  const def = mergeDefs(a._zod.def, {
    get shape() {
      const _shape = { ...a._zod.def.shape, ...b._zod.def.shape };
      assignProp(this, "shape", _shape);
      return _shape;
    },
    get catchall() {
      return b._zod.def.catchall;
    },
    checks: b._zod.def.checks ?? []
  });
  return clone(a, def);
}
function partial(Class, schema2, mask) {
  const currDef = schema2._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".partial() cannot be used on object schemas containing refinements");
  }
  const def = mergeDefs(schema2._zod.def, {
    get shape() {
      const oldShape = schema2._zod.def.shape;
      const shape = { ...oldShape };
      if (mask) {
        for (const key in mask) {
          if (!(key in oldShape)) {
            throw new Error(`Unrecognized key: "${key}"`);
          }
          if (!mask[key])
            continue;
          shape[key] = Class ? new Class({
            type: "optional",
            innerType: oldShape[key]
          }) : oldShape[key];
        }
      } else {
        for (const key in oldShape) {
          shape[key] = Class ? new Class({
            type: "optional",
            innerType: oldShape[key]
          }) : oldShape[key];
        }
      }
      assignProp(this, "shape", shape);
      return shape;
    },
    checks: []
  });
  return clone(schema2, def);
}
function required(Class, schema2, mask) {
  const def = mergeDefs(schema2._zod.def, {
    get shape() {
      const oldShape = schema2._zod.def.shape;
      const shape = { ...oldShape };
      if (mask) {
        for (const key in mask) {
          if (!(key in shape)) {
            throw new Error(`Unrecognized key: "${key}"`);
          }
          if (!mask[key])
            continue;
          shape[key] = new Class({
            type: "nonoptional",
            innerType: oldShape[key]
          });
        }
      } else {
        for (const key in oldShape) {
          shape[key] = new Class({
            type: "nonoptional",
            innerType: oldShape[key]
          });
        }
      }
      assignProp(this, "shape", shape);
      return shape;
    }
  });
  return clone(schema2, def);
}
function aborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue !== true) {
      return true;
    }
  }
  return false;
}
function explicitlyAborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue === false) {
      return true;
    }
  }
  return false;
}
function prefixIssues(path2, issues) {
  return issues.map((iss) => {
    var _a2;
    (_a2 = iss).path ?? (_a2.path = []);
    iss.path.unshift(path2);
    return iss;
  });
}
function unwrapMessage(message) {
  return typeof message === "string" ? message : message?.message;
}
function finalizeIssue(iss, ctx, config2) {
  const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config2.customError?.(iss)) ?? unwrapMessage(config2.localeError?.(iss)) ?? "Invalid input";
  const { inst: _inst, continue: _continue, input: _input, ...rest } = iss;
  rest.path ?? (rest.path = []);
  rest.message = message;
  if (ctx?.reportInput) {
    rest.input = _input;
  }
  return rest;
}
function getLengthableOrigin(input) {
  if (Array.isArray(input))
    return "array";
  if (typeof input === "string")
    return "string";
  return "unknown";
}
function issue(...args) {
  const [iss, input, inst] = args;
  if (typeof iss === "string") {
    return {
      message: iss,
      code: "custom",
      input,
      inst
    };
  }
  return { ...iss };
}
const initializer$1 = (inst, def) => {
  inst.name = "$ZodError";
  Object.defineProperty(inst, "_zod", {
    value: inst._zod,
    enumerable: false
  });
  Object.defineProperty(inst, "issues", {
    value: def,
    enumerable: false
  });
  inst.message = JSON.stringify(def, jsonStringifyReplacer, 2);
  Object.defineProperty(inst, "toString", {
    value: () => inst.message,
    enumerable: false
  });
};
const $ZodError = $constructor("$ZodError", initializer$1);
const $ZodRealError = $constructor("$ZodError", initializer$1, { Parent: Error });
function flattenError(error, mapper = (issue2) => issue2.message) {
  const fieldErrors = {};
  const formErrors = [];
  for (const sub of error.issues) {
    if (sub.path.length > 0) {
      fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
      fieldErrors[sub.path[0]].push(mapper(sub));
    } else {
      formErrors.push(mapper(sub));
    }
  }
  return { formErrors, fieldErrors };
}
function formatError(error, mapper = (issue2) => issue2.message) {
  const fieldErrors = { _errors: [] };
  const processError = (error2, path2 = []) => {
    for (const issue2 of error2.issues) {
      if (issue2.code === "invalid_union" && issue2.errors.length) {
        issue2.errors.map((issues) => processError({ issues }, [...path2, ...issue2.path]));
      } else if (issue2.code === "invalid_key") {
        processError({ issues: issue2.issues }, [...path2, ...issue2.path]);
      } else if (issue2.code === "invalid_element") {
        processError({ issues: issue2.issues }, [...path2, ...issue2.path]);
      } else {
        const fullpath = [...path2, ...issue2.path];
        if (fullpath.length === 0) {
          fieldErrors._errors.push(mapper(issue2));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < fullpath.length) {
            const el = fullpath[i];
            const terminal = i === fullpath.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue2));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    }
  };
  processError(error);
  return fieldErrors;
}
const _parse = (_Err) => (schema2, value, _ctx, _params) => {
  const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
  const result = schema2._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) {
    throw new $ZodAsyncError();
  }
  if (result.issues.length) {
    const e = new (_params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
    captureStackTrace(e, _params?.callee);
    throw e;
  }
  return result.value;
};
const _parseAsync = (_Err) => async (schema2, value, _ctx, params) => {
  const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
  let result = schema2._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  if (result.issues.length) {
    const e = new (params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
    captureStackTrace(e, params?.callee);
    throw e;
  }
  return result.value;
};
const _safeParse = (_Err) => (schema2, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
  const result = schema2._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) {
    throw new $ZodAsyncError();
  }
  return result.issues.length ? {
    success: false,
    error: new (_Err ?? $ZodError)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  } : { success: true, data: result.value };
};
const safeParse$1 = /* @__PURE__ */ _safeParse($ZodRealError);
const _safeParseAsync = (_Err) => async (schema2, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
  let result = schema2._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  return result.issues.length ? {
    success: false,
    error: new _Err(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  } : { success: true, data: result.value };
};
const safeParseAsync$1 = /* @__PURE__ */ _safeParseAsync($ZodRealError);
const _encode = (_Err) => (schema2, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _parse(_Err)(schema2, value, ctx);
};
const _decode = (_Err) => (schema2, value, _ctx) => {
  return _parse(_Err)(schema2, value, _ctx);
};
const _encodeAsync = (_Err) => async (schema2, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _parseAsync(_Err)(schema2, value, ctx);
};
const _decodeAsync = (_Err) => async (schema2, value, _ctx) => {
  return _parseAsync(_Err)(schema2, value, _ctx);
};
const _safeEncode = (_Err) => (schema2, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _safeParse(_Err)(schema2, value, ctx);
};
const _safeDecode = (_Err) => (schema2, value, _ctx) => {
  return _safeParse(_Err)(schema2, value, _ctx);
};
const _safeEncodeAsync = (_Err) => async (schema2, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _safeParseAsync(_Err)(schema2, value, ctx);
};
const _safeDecodeAsync = (_Err) => async (schema2, value, _ctx) => {
  return _safeParseAsync(_Err)(schema2, value, _ctx);
};
const cuid = /^[cC][0-9a-z]{6,}$/;
const cuid2 = /^[0-9a-z]+$/;
const ulid = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/;
const xid = /^[0-9a-vA-V]{20}$/;
const ksuid = /^[A-Za-z0-9]{27}$/;
const nanoid = /^[a-zA-Z0-9_-]{21}$/;
const duration$1 = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
const guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
const uuid = (version2) => {
  if (!version2)
    return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
  return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version2}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
};
const email = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
const _emoji$1 = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
function emoji() {
  return new RegExp(_emoji$1, "u");
}
const ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
const ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
const cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
const cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
const base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
const base64url = /^[A-Za-z0-9_-]*$/;
const httpProtocol = /^https?$/;
const e164 = /^\+[1-9]\d{6,14}$/;
const dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
const date$2 = /* @__PURE__ */ new RegExp(`^${dateSource}$`);
function timeSource(args) {
  const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
  const regex = typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
  return regex;
}
function time$1(args) {
  return new RegExp(`^${timeSource(args)}$`);
}
function datetime$1(args) {
  const time2 = timeSource({ precision: args.precision });
  const opts = ["Z"];
  if (args.local)
    opts.push("");
  if (args.offset)
    opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
  const timeRegex = `${time2}(?:${opts.join("|")})`;
  return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}
const string$1 = (params) => {
  const regex = params ? `[\\s\\S]{${params?.minimum ?? 0},${params?.maximum ?? ""}}` : `[\\s\\S]*`;
  return new RegExp(`^${regex}$`);
};
const integer = /^-?\d+$/;
const number$1 = /^-?\d+(?:\.\d+)?$/;
const boolean$1 = /^(?:true|false)$/i;
const _null$2 = /^null$/i;
const _undefined$2 = /^undefined$/i;
const lowercase = /^[^A-Z]*$/;
const uppercase = /^[^a-z]*$/;
const $ZodCheck = /* @__PURE__ */ $constructor("$ZodCheck", (inst, def) => {
  var _a2;
  inst._zod ?? (inst._zod = {});
  inst._zod.def = def;
  (_a2 = inst._zod).onattach ?? (_a2.onattach = []);
});
const numericOriginMap = {
  number: "number",
  bigint: "bigint",
  object: "date"
};
const $ZodCheckLessThan = /* @__PURE__ */ $constructor("$ZodCheckLessThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    const curr = (def.inclusive ? bag.maximum : bag.exclusiveMaximum) ?? Number.POSITIVE_INFINITY;
    if (def.value < curr) {
      if (def.inclusive)
        bag.maximum = def.value;
      else
        bag.exclusiveMaximum = def.value;
    }
  });
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value <= def.value : payload.value < def.value) {
      return;
    }
    payload.issues.push({
      origin,
      code: "too_big",
      maximum: typeof def.value === "object" ? def.value.getTime() : def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
const $ZodCheckGreaterThan = /* @__PURE__ */ $constructor("$ZodCheckGreaterThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    const curr = (def.inclusive ? bag.minimum : bag.exclusiveMinimum) ?? Number.NEGATIVE_INFINITY;
    if (def.value > curr) {
      if (def.inclusive)
        bag.minimum = def.value;
      else
        bag.exclusiveMinimum = def.value;
    }
  });
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value >= def.value : payload.value > def.value) {
      return;
    }
    payload.issues.push({
      origin,
      code: "too_small",
      minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
const $ZodCheckMultipleOf = /* @__PURE__ */ $constructor("$ZodCheckMultipleOf", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.onattach.push((inst2) => {
    var _a2;
    (_a2 = inst2._zod.bag).multipleOf ?? (_a2.multipleOf = def.value);
  });
  inst._zod.check = (payload) => {
    if (typeof payload.value !== typeof def.value)
      throw new Error("Cannot mix number and bigint in multiple_of check.");
    const isMultiple = typeof payload.value === "bigint" ? payload.value % def.value === BigInt(0) : floatSafeRemainder(payload.value, def.value) === 0;
    if (isMultiple)
      return;
    payload.issues.push({
      origin: typeof payload.value,
      code: "not_multiple_of",
      divisor: def.value,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
const $ZodCheckNumberFormat = /* @__PURE__ */ $constructor("$ZodCheckNumberFormat", (inst, def) => {
  $ZodCheck.init(inst, def);
  def.format = def.format || "float64";
  const isInt = def.format?.includes("int");
  const origin = isInt ? "int" : "number";
  const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.format = def.format;
    bag.minimum = minimum;
    bag.maximum = maximum;
    if (isInt)
      bag.pattern = integer;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    if (isInt) {
      if (!Number.isInteger(input)) {
        payload.issues.push({
          expected: origin,
          format: def.format,
          code: "invalid_type",
          continue: false,
          input,
          inst
        });
        return;
      }
      if (!Number.isSafeInteger(input)) {
        if (input > 0) {
          payload.issues.push({
            input,
            code: "too_big",
            maximum: Number.MAX_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            inclusive: true,
            continue: !def.abort
          });
        } else {
          payload.issues.push({
            input,
            code: "too_small",
            minimum: Number.MIN_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            inclusive: true,
            continue: !def.abort
          });
        }
        return;
      }
    }
    if (input < minimum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_small",
        minimum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
    if (input > maximum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_big",
        maximum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
  };
});
const $ZodCheckMaxLength = /* @__PURE__ */ $constructor("$ZodCheckMaxLength", (inst, def) => {
  var _a2;
  $ZodCheck.init(inst, def);
  (_a2 = inst._zod.def).when ?? (_a2.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.length !== void 0;
  });
  inst._zod.onattach.push((inst2) => {
    const curr = inst2._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
    if (def.maximum < curr)
      inst2._zod.bag.maximum = def.maximum;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const length = input.length;
    if (length <= def.maximum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_big",
      maximum: def.maximum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
const $ZodCheckMinLength = /* @__PURE__ */ $constructor("$ZodCheckMinLength", (inst, def) => {
  var _a2;
  $ZodCheck.init(inst, def);
  (_a2 = inst._zod.def).when ?? (_a2.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.length !== void 0;
  });
  inst._zod.onattach.push((inst2) => {
    const curr = inst2._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
    if (def.minimum > curr)
      inst2._zod.bag.minimum = def.minimum;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const length = input.length;
    if (length >= def.minimum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_small",
      minimum: def.minimum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
const $ZodCheckLengthEquals = /* @__PURE__ */ $constructor("$ZodCheckLengthEquals", (inst, def) => {
  var _a2;
  $ZodCheck.init(inst, def);
  (_a2 = inst._zod.def).when ?? (_a2.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.length !== void 0;
  });
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.minimum = def.length;
    bag.maximum = def.length;
    bag.length = def.length;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const length = input.length;
    if (length === def.length)
      return;
    const origin = getLengthableOrigin(input);
    const tooBig = length > def.length;
    payload.issues.push({
      origin,
      ...tooBig ? { code: "too_big", maximum: def.length } : { code: "too_small", minimum: def.length },
      inclusive: true,
      exact: true,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
const $ZodCheckStringFormat = /* @__PURE__ */ $constructor("$ZodCheckStringFormat", (inst, def) => {
  var _a2, _b;
  $ZodCheck.init(inst, def);
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.format = def.format;
    if (def.pattern) {
      bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
      bag.patterns.add(def.pattern);
    }
  });
  if (def.pattern)
    (_a2 = inst._zod).check ?? (_a2.check = (payload) => {
      def.pattern.lastIndex = 0;
      if (def.pattern.test(payload.value))
        return;
      payload.issues.push({
        origin: "string",
        code: "invalid_format",
        format: def.format,
        input: payload.value,
        ...def.pattern ? { pattern: def.pattern.toString() } : {},
        inst,
        continue: !def.abort
      });
    });
  else
    (_b = inst._zod).check ?? (_b.check = () => {
    });
});
const $ZodCheckRegex = /* @__PURE__ */ $constructor("$ZodCheckRegex", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    def.pattern.lastIndex = 0;
    if (def.pattern.test(payload.value))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "regex",
      input: payload.value,
      pattern: def.pattern.toString(),
      inst,
      continue: !def.abort
    });
  };
});
const $ZodCheckLowerCase = /* @__PURE__ */ $constructor("$ZodCheckLowerCase", (inst, def) => {
  def.pattern ?? (def.pattern = lowercase);
  $ZodCheckStringFormat.init(inst, def);
});
const $ZodCheckUpperCase = /* @__PURE__ */ $constructor("$ZodCheckUpperCase", (inst, def) => {
  def.pattern ?? (def.pattern = uppercase);
  $ZodCheckStringFormat.init(inst, def);
});
const $ZodCheckIncludes = /* @__PURE__ */ $constructor("$ZodCheckIncludes", (inst, def) => {
  $ZodCheck.init(inst, def);
  const escapedRegex = escapeRegex(def.includes);
  const pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position}}${escapedRegex}` : escapedRegex);
  def.pattern = pattern;
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
    bag.patterns.add(pattern);
  });
  inst._zod.check = (payload) => {
    if (payload.value.includes(def.includes, def.position))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "includes",
      includes: def.includes,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
const $ZodCheckStartsWith = /* @__PURE__ */ $constructor("$ZodCheckStartsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
    bag.patterns.add(pattern);
  });
  inst._zod.check = (payload) => {
    if (payload.value.startsWith(def.prefix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "starts_with",
      prefix: def.prefix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
const $ZodCheckEndsWith = /* @__PURE__ */ $constructor("$ZodCheckEndsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
    bag.patterns.add(pattern);
  });
  inst._zod.check = (payload) => {
    if (payload.value.endsWith(def.suffix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "ends_with",
      suffix: def.suffix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
const $ZodCheckOverwrite = /* @__PURE__ */ $constructor("$ZodCheckOverwrite", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.check = (payload) => {
    payload.value = def.tx(payload.value);
  };
});
class Doc {
  constructor(args = []) {
    this.content = [];
    this.indent = 0;
    if (this)
      this.args = args;
  }
  indented(fn) {
    this.indent += 1;
    fn(this);
    this.indent -= 1;
  }
  write(arg) {
    if (typeof arg === "function") {
      arg(this, { execution: "sync" });
      arg(this, { execution: "async" });
      return;
    }
    const content = arg;
    const lines = content.split("\n").filter((x) => x);
    const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
    const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
    for (const line of dedented) {
      this.content.push(line);
    }
  }
  compile() {
    const F = Function;
    const args = this?.args;
    const content = this?.content ?? [``];
    const lines = [...content.map((x) => `  ${x}`)];
    return new F(...args, lines.join("\n"));
  }
}
const version = {
  major: 4,
  minor: 4,
  patch: 3
};
const $ZodType = /* @__PURE__ */ $constructor("$ZodType", (inst, def) => {
  var _a2;
  inst ?? (inst = {});
  inst._zod.def = def;
  inst._zod.bag = inst._zod.bag || {};
  inst._zod.version = version;
  const checks = [...inst._zod.def.checks ?? []];
  if (inst._zod.traits.has("$ZodCheck")) {
    checks.unshift(inst);
  }
  for (const ch of checks) {
    for (const fn of ch._zod.onattach) {
      fn(inst);
    }
  }
  if (checks.length === 0) {
    (_a2 = inst._zod).deferred ?? (_a2.deferred = []);
    inst._zod.deferred?.push(() => {
      inst._zod.run = inst._zod.parse;
    });
  } else {
    const runChecks = (payload, checks2, ctx) => {
      let isAborted = aborted(payload);
      let asyncResult;
      for (const ch of checks2) {
        if (ch._zod.def.when) {
          if (explicitlyAborted(payload))
            continue;
          const shouldRun = ch._zod.def.when(payload);
          if (!shouldRun)
            continue;
        } else if (isAborted) {
          continue;
        }
        const currLen = payload.issues.length;
        const _ = ch._zod.check(payload);
        if (_ instanceof Promise && ctx?.async === false) {
          throw new $ZodAsyncError();
        }
        if (asyncResult || _ instanceof Promise) {
          asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
            await _;
            const nextLen = payload.issues.length;
            if (nextLen === currLen)
              return;
            if (!isAborted)
              isAborted = aborted(payload, currLen);
          });
        } else {
          const nextLen = payload.issues.length;
          if (nextLen === currLen)
            continue;
          if (!isAborted)
            isAborted = aborted(payload, currLen);
        }
      }
      if (asyncResult) {
        return asyncResult.then(() => {
          return payload;
        });
      }
      return payload;
    };
    const handleCanaryResult = (canary, payload, ctx) => {
      if (aborted(canary)) {
        canary.aborted = true;
        return canary;
      }
      const checkResult = runChecks(payload, checks, ctx);
      if (checkResult instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError();
        return checkResult.then((checkResult2) => inst._zod.parse(checkResult2, ctx));
      }
      return inst._zod.parse(checkResult, ctx);
    };
    inst._zod.run = (payload, ctx) => {
      if (ctx.skipChecks) {
        return inst._zod.parse(payload, ctx);
      }
      if (ctx.direction === "backward") {
        const canary = inst._zod.parse({ value: payload.value, issues: [] }, { ...ctx, skipChecks: true });
        if (canary instanceof Promise) {
          return canary.then((canary2) => {
            return handleCanaryResult(canary2, payload, ctx);
          });
        }
        return handleCanaryResult(canary, payload, ctx);
      }
      const result = inst._zod.parse(payload, ctx);
      if (result instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError();
        return result.then((result2) => runChecks(result2, checks, ctx));
      }
      return runChecks(result, checks, ctx);
    };
  }
  defineLazy(inst, "~standard", () => ({
    validate: (value) => {
      try {
        const r = safeParse$1(inst, value);
        return r.success ? { value: r.data } : { issues: r.error?.issues };
      } catch (_) {
        return safeParseAsync$1(inst, value).then((r) => r.success ? { value: r.data } : { issues: r.error?.issues });
      }
    },
    vendor: "zod",
    version: 1
  }));
});
const $ZodString = /* @__PURE__ */ $constructor("$ZodString", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = [...inst?._zod.bag?.patterns ?? []].pop() ?? string$1(inst._zod.bag);
  inst._zod.parse = (payload, _) => {
    if (def.coerce)
      try {
        payload.value = String(payload.value);
      } catch (_2) {
      }
    if (typeof payload.value === "string")
      return payload;
    payload.issues.push({
      expected: "string",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
const $ZodStringFormat = /* @__PURE__ */ $constructor("$ZodStringFormat", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  $ZodString.init(inst, def);
});
const $ZodGUID = /* @__PURE__ */ $constructor("$ZodGUID", (inst, def) => {
  def.pattern ?? (def.pattern = guid);
  $ZodStringFormat.init(inst, def);
});
const $ZodUUID = /* @__PURE__ */ $constructor("$ZodUUID", (inst, def) => {
  if (def.version) {
    const versionMap = {
      v1: 1,
      v2: 2,
      v3: 3,
      v4: 4,
      v5: 5,
      v6: 6,
      v7: 7,
      v8: 8
    };
    const v = versionMap[def.version];
    if (v === void 0)
      throw new Error(`Invalid UUID version: "${def.version}"`);
    def.pattern ?? (def.pattern = uuid(v));
  } else
    def.pattern ?? (def.pattern = uuid());
  $ZodStringFormat.init(inst, def);
});
const $ZodEmail = /* @__PURE__ */ $constructor("$ZodEmail", (inst, def) => {
  def.pattern ?? (def.pattern = email);
  $ZodStringFormat.init(inst, def);
});
const $ZodURL = /* @__PURE__ */ $constructor("$ZodURL", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    try {
      const trimmed = payload.value.trim();
      if (!def.normalize && def.protocol?.source === httpProtocol.source) {
        if (!/^https?:\/\//i.test(trimmed)) {
          payload.issues.push({
            code: "invalid_format",
            format: "url",
            note: "Invalid URL format",
            input: payload.value,
            inst,
            continue: !def.abort
          });
          return;
        }
      }
      const url = new URL(trimmed);
      if (def.hostname) {
        def.hostname.lastIndex = 0;
        if (!def.hostname.test(url.hostname)) {
          payload.issues.push({
            code: "invalid_format",
            format: "url",
            note: "Invalid hostname",
            pattern: def.hostname.source,
            input: payload.value,
            inst,
            continue: !def.abort
          });
        }
      }
      if (def.protocol) {
        def.protocol.lastIndex = 0;
        if (!def.protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol)) {
          payload.issues.push({
            code: "invalid_format",
            format: "url",
            note: "Invalid protocol",
            pattern: def.protocol.source,
            input: payload.value,
            inst,
            continue: !def.abort
          });
        }
      }
      if (def.normalize) {
        payload.value = url.href;
      } else {
        payload.value = trimmed;
      }
      return;
    } catch (_) {
      payload.issues.push({
        code: "invalid_format",
        format: "url",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
const $ZodEmoji = /* @__PURE__ */ $constructor("$ZodEmoji", (inst, def) => {
  def.pattern ?? (def.pattern = emoji());
  $ZodStringFormat.init(inst, def);
});
const $ZodNanoID = /* @__PURE__ */ $constructor("$ZodNanoID", (inst, def) => {
  def.pattern ?? (def.pattern = nanoid);
  $ZodStringFormat.init(inst, def);
});
const $ZodCUID = /* @__PURE__ */ $constructor("$ZodCUID", (inst, def) => {
  def.pattern ?? (def.pattern = cuid);
  $ZodStringFormat.init(inst, def);
});
const $ZodCUID2 = /* @__PURE__ */ $constructor("$ZodCUID2", (inst, def) => {
  def.pattern ?? (def.pattern = cuid2);
  $ZodStringFormat.init(inst, def);
});
const $ZodULID = /* @__PURE__ */ $constructor("$ZodULID", (inst, def) => {
  def.pattern ?? (def.pattern = ulid);
  $ZodStringFormat.init(inst, def);
});
const $ZodXID = /* @__PURE__ */ $constructor("$ZodXID", (inst, def) => {
  def.pattern ?? (def.pattern = xid);
  $ZodStringFormat.init(inst, def);
});
const $ZodKSUID = /* @__PURE__ */ $constructor("$ZodKSUID", (inst, def) => {
  def.pattern ?? (def.pattern = ksuid);
  $ZodStringFormat.init(inst, def);
});
const $ZodISODateTime = /* @__PURE__ */ $constructor("$ZodISODateTime", (inst, def) => {
  def.pattern ?? (def.pattern = datetime$1(def));
  $ZodStringFormat.init(inst, def);
});
const $ZodISODate = /* @__PURE__ */ $constructor("$ZodISODate", (inst, def) => {
  def.pattern ?? (def.pattern = date$2);
  $ZodStringFormat.init(inst, def);
});
const $ZodISOTime = /* @__PURE__ */ $constructor("$ZodISOTime", (inst, def) => {
  def.pattern ?? (def.pattern = time$1(def));
  $ZodStringFormat.init(inst, def);
});
const $ZodISODuration = /* @__PURE__ */ $constructor("$ZodISODuration", (inst, def) => {
  def.pattern ?? (def.pattern = duration$1);
  $ZodStringFormat.init(inst, def);
});
const $ZodIPv4 = /* @__PURE__ */ $constructor("$ZodIPv4", (inst, def) => {
  def.pattern ?? (def.pattern = ipv4);
  $ZodStringFormat.init(inst, def);
  inst._zod.bag.format = `ipv4`;
});
const $ZodIPv6 = /* @__PURE__ */ $constructor("$ZodIPv6", (inst, def) => {
  def.pattern ?? (def.pattern = ipv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.bag.format = `ipv6`;
  inst._zod.check = (payload) => {
    try {
      new URL(`http://[${payload.value}]`);
    } catch {
      payload.issues.push({
        code: "invalid_format",
        format: "ipv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
const $ZodCIDRv4 = /* @__PURE__ */ $constructor("$ZodCIDRv4", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv4);
  $ZodStringFormat.init(inst, def);
});
const $ZodCIDRv6 = /* @__PURE__ */ $constructor("$ZodCIDRv6", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    const parts = payload.value.split("/");
    try {
      if (parts.length !== 2)
        throw new Error();
      const [address, prefix] = parts;
      if (!prefix)
        throw new Error();
      const prefixNum = Number(prefix);
      if (`${prefixNum}` !== prefix)
        throw new Error();
      if (prefixNum < 0 || prefixNum > 128)
        throw new Error();
      new URL(`http://[${address}]`);
    } catch {
      payload.issues.push({
        code: "invalid_format",
        format: "cidrv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
function isValidBase64(data) {
  if (data === "")
    return true;
  if (/\s/.test(data))
    return false;
  if (data.length % 4 !== 0)
    return false;
  try {
    atob(data);
    return true;
  } catch {
    return false;
  }
}
const $ZodBase64 = /* @__PURE__ */ $constructor("$ZodBase64", (inst, def) => {
  def.pattern ?? (def.pattern = base64);
  $ZodStringFormat.init(inst, def);
  inst._zod.bag.contentEncoding = "base64";
  inst._zod.check = (payload) => {
    if (isValidBase64(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
function isValidBase64URL(data) {
  if (!base64url.test(data))
    return false;
  const base642 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
  const padded = base642.padEnd(Math.ceil(base642.length / 4) * 4, "=");
  return isValidBase64(padded);
}
const $ZodBase64URL = /* @__PURE__ */ $constructor("$ZodBase64URL", (inst, def) => {
  def.pattern ?? (def.pattern = base64url);
  $ZodStringFormat.init(inst, def);
  inst._zod.bag.contentEncoding = "base64url";
  inst._zod.check = (payload) => {
    if (isValidBase64URL(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64url",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
const $ZodE164 = /* @__PURE__ */ $constructor("$ZodE164", (inst, def) => {
  def.pattern ?? (def.pattern = e164);
  $ZodStringFormat.init(inst, def);
});
function isValidJWT(token, algorithm = null) {
  try {
    const tokensParts = token.split(".");
    if (tokensParts.length !== 3)
      return false;
    const [header] = tokensParts;
    if (!header)
      return false;
    const parsedHeader = JSON.parse(atob(header));
    if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT")
      return false;
    if (!parsedHeader.alg)
      return false;
    if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm))
      return false;
    return true;
  } catch {
    return false;
  }
}
const $ZodJWT = /* @__PURE__ */ $constructor("$ZodJWT", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidJWT(payload.value, def.alg))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "jwt",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
const $ZodNumber = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = inst._zod.bag.pattern ?? number$1;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Number(payload.value);
      } catch (_) {
      }
    const input = payload.value;
    if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) {
      return payload;
    }
    const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? "Infinity" : void 0 : void 0;
    payload.issues.push({
      expected: "number",
      code: "invalid_type",
      input,
      inst,
      ...received ? { received } : {}
    });
    return payload;
  };
});
const $ZodNumberFormat = /* @__PURE__ */ $constructor("$ZodNumberFormat", (inst, def) => {
  $ZodCheckNumberFormat.init(inst, def);
  $ZodNumber.init(inst, def);
});
const $ZodBoolean = /* @__PURE__ */ $constructor("$ZodBoolean", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = boolean$1;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Boolean(payload.value);
      } catch (_) {
      }
    const input = payload.value;
    if (typeof input === "boolean")
      return payload;
    payload.issues.push({
      expected: "boolean",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
const $ZodUndefined = /* @__PURE__ */ $constructor("$ZodUndefined", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = _undefined$2;
  inst._zod.values = /* @__PURE__ */ new Set([void 0]);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (typeof input === "undefined")
      return payload;
    payload.issues.push({
      expected: "undefined",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
const $ZodNull = /* @__PURE__ */ $constructor("$ZodNull", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = _null$2;
  inst._zod.values = /* @__PURE__ */ new Set([null]);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (input === null)
      return payload;
    payload.issues.push({
      expected: "null",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
const $ZodUnknown = /* @__PURE__ */ $constructor("$ZodUnknown", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload) => payload;
});
const $ZodNever = /* @__PURE__ */ $constructor("$ZodNever", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    payload.issues.push({
      expected: "never",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
const $ZodDate = /* @__PURE__ */ $constructor("$ZodDate", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce) {
      try {
        payload.value = new Date(payload.value);
      } catch (_err) {
      }
    }
    const input = payload.value;
    const isDate = input instanceof Date;
    const isValidDate = isDate && !Number.isNaN(input.getTime());
    if (isValidDate)
      return payload;
    payload.issues.push({
      expected: "date",
      code: "invalid_type",
      input,
      ...isDate ? { received: "Invalid Date" } : {},
      inst
    });
    return payload;
  };
});
function handleArrayResult(result, final, index2) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(index2, result.issues));
  }
  final.value[index2] = result.value;
}
const $ZodArray = /* @__PURE__ */ $constructor("$ZodArray", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!Array.isArray(input)) {
      payload.issues.push({
        expected: "array",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = Array(input.length);
    const proms = [];
    for (let i = 0; i < input.length; i++) {
      const item = input[i];
      const result = def.element._zod.run({
        value: item,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        proms.push(result.then((result2) => handleArrayResult(result2, payload, i)));
      } else {
        handleArrayResult(result, payload, i);
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
function handlePropertyResult(result, final, key, input, isOptionalIn, isOptionalOut) {
  const isPresent = key in input;
  if (result.issues.length) {
    if (isOptionalIn && isOptionalOut && !isPresent) {
      return;
    }
    final.issues.push(...prefixIssues(key, result.issues));
  }
  if (!isPresent && !isOptionalIn) {
    if (!result.issues.length) {
      final.issues.push({
        code: "invalid_type",
        expected: "nonoptional",
        input: void 0,
        path: [key]
      });
    }
    return;
  }
  if (result.value === void 0) {
    if (isPresent) {
      final.value[key] = void 0;
    }
  } else {
    final.value[key] = result.value;
  }
}
function normalizeDef(def) {
  const keys = Object.keys(def.shape);
  for (const k of keys) {
    if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) {
      throw new Error(`Invalid element at key "${k}": expected a Zod schema`);
    }
  }
  const okeys = optionalKeys(def.shape);
  return {
    ...def,
    keys,
    keySet: new Set(keys),
    numKeys: keys.length,
    optionalKeys: new Set(okeys)
  };
}
function handleCatchall(proms, input, payload, ctx, def, inst) {
  const unrecognized = [];
  const keySet = def.keySet;
  const _catchall = def.catchall._zod;
  const t = _catchall.def.type;
  const isOptionalIn = _catchall.optin === "optional";
  const isOptionalOut = _catchall.optout === "optional";
  for (const key in input) {
    if (key === "__proto__")
      continue;
    if (keySet.has(key))
      continue;
    if (t === "never") {
      unrecognized.push(key);
      continue;
    }
    const r = _catchall.run({ value: input[key], issues: [] }, ctx);
    if (r instanceof Promise) {
      proms.push(r.then((r2) => handlePropertyResult(r2, payload, key, input, isOptionalIn, isOptionalOut)));
    } else {
      handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut);
    }
  }
  if (unrecognized.length) {
    payload.issues.push({
      code: "unrecognized_keys",
      keys: unrecognized,
      input,
      inst
    });
  }
  if (!proms.length)
    return payload;
  return Promise.all(proms).then(() => {
    return payload;
  });
}
const $ZodObject = /* @__PURE__ */ $constructor("$ZodObject", (inst, def) => {
  $ZodType.init(inst, def);
  const desc2 = Object.getOwnPropertyDescriptor(def, "shape");
  if (!desc2?.get) {
    const sh = def.shape;
    Object.defineProperty(def, "shape", {
      get: () => {
        const newSh = { ...sh };
        Object.defineProperty(def, "shape", {
          value: newSh
        });
        return newSh;
      }
    });
  }
  const _normalized = cached(() => normalizeDef(def));
  defineLazy(inst._zod, "propValues", () => {
    const shape = def.shape;
    const propValues = {};
    for (const key in shape) {
      const field = shape[key]._zod;
      if (field.values) {
        propValues[key] ?? (propValues[key] = /* @__PURE__ */ new Set());
        for (const v of field.values)
          propValues[key].add(v);
      }
    }
    return propValues;
  });
  const isObject$1 = isObject;
  const catchall = def.catchall;
  let value;
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject$1(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = {};
    const proms = [];
    const shape = value.shape;
    for (const key of value.keys) {
      const el = shape[key];
      const isOptionalIn = el._zod.optin === "optional";
      const isOptionalOut = el._zod.optout === "optional";
      const r = el._zod.run({ value: input[key], issues: [] }, ctx);
      if (r instanceof Promise) {
        proms.push(r.then((r2) => handlePropertyResult(r2, payload, key, input, isOptionalIn, isOptionalOut)));
      } else {
        handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut);
      }
    }
    if (!catchall) {
      return proms.length ? Promise.all(proms).then(() => payload) : payload;
    }
    return handleCatchall(proms, input, payload, ctx, _normalized.value, inst);
  };
});
const $ZodObjectJIT = /* @__PURE__ */ $constructor("$ZodObjectJIT", (inst, def) => {
  $ZodObject.init(inst, def);
  const superParse = inst._zod.parse;
  const _normalized = cached(() => normalizeDef(def));
  const generateFastpass = (shape) => {
    const doc = new Doc(["shape", "payload", "ctx"]);
    const normalized = _normalized.value;
    const parseStr = (key) => {
      const k = esc(key);
      return `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
    };
    doc.write(`const input = payload.value;`);
    const ids = /* @__PURE__ */ Object.create(null);
    let counter = 0;
    for (const key of normalized.keys) {
      ids[key] = `key_${counter++}`;
    }
    doc.write(`const newResult = {};`);
    for (const key of normalized.keys) {
      const id = ids[key];
      const k = esc(key);
      const schema2 = shape[key];
      const isOptionalIn = schema2?._zod?.optin === "optional";
      const isOptionalOut = schema2?._zod?.optout === "optional";
      doc.write(`const ${id} = ${parseStr(key)};`);
      if (isOptionalIn && isOptionalOut) {
        doc.write(`
        if (${id}.issues.length) {
          if (${k} in input) {
            payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
              ...iss,
              path: iss.path ? [${k}, ...iss.path] : [${k}]
            })));
          }
        }
        
        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }
        
      `);
      } else if (!isOptionalIn) {
        doc.write(`
        const ${id}_present = ${k} in input;
        if (${id}.issues.length) {
          payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${k}, ...iss.path] : [${k}]
          })));
        }
        if (!${id}_present && !${id}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${k}]
          });
        }

        if (${id}_present) {
          if (${id}.value === undefined) {
            newResult[${k}] = undefined;
          } else {
            newResult[${k}] = ${id}.value;
          }
        }

      `);
      } else {
        doc.write(`
        if (${id}.issues.length) {
          payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${k}, ...iss.path] : [${k}]
          })));
        }
        
        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }
        
      `);
      }
    }
    doc.write(`payload.value = newResult;`);
    doc.write(`return payload;`);
    const fn = doc.compile();
    return (payload, ctx) => fn(shape, payload, ctx);
  };
  let fastpass;
  const isObject$1 = isObject;
  const jit = !globalConfig.jitless;
  const allowsEval$1 = allowsEval;
  const fastEnabled = jit && allowsEval$1.value;
  const catchall = def.catchall;
  let value;
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject$1(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
      if (!fastpass)
        fastpass = generateFastpass(def.shape);
      payload = fastpass(payload, ctx);
      if (!catchall)
        return payload;
      return handleCatchall([], input, payload, ctx, value, inst);
    }
    return superParse(payload, ctx);
  };
});
function handleUnionResults(results, final, inst, ctx) {
  for (const result of results) {
    if (result.issues.length === 0) {
      final.value = result.value;
      return final;
    }
  }
  const nonaborted = results.filter((r) => !aborted(r));
  if (nonaborted.length === 1) {
    final.value = nonaborted[0].value;
    return nonaborted[0];
  }
  final.issues.push({
    code: "invalid_union",
    input: final.value,
    inst,
    errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  });
  return final;
}
const $ZodUnion = /* @__PURE__ */ $constructor("$ZodUnion", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "optin", () => def.options.some((o) => o._zod.optin === "optional") ? "optional" : void 0);
  defineLazy(inst._zod, "optout", () => def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0);
  defineLazy(inst._zod, "values", () => {
    if (def.options.every((o) => o._zod.values)) {
      return new Set(def.options.flatMap((option) => Array.from(option._zod.values)));
    }
    return void 0;
  });
  defineLazy(inst._zod, "pattern", () => {
    if (def.options.every((o) => o._zod.pattern)) {
      const patterns = def.options.map((o) => o._zod.pattern);
      return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
    }
    return void 0;
  });
  const first = def.options.length === 1 ? def.options[0]._zod.run : null;
  inst._zod.parse = (payload, ctx) => {
    if (first) {
      return first(payload, ctx);
    }
    let async = false;
    const results = [];
    for (const option of def.options) {
      const result = option._zod.run({
        value: payload.value,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        results.push(result);
        async = true;
      } else {
        if (result.issues.length === 0)
          return result;
        results.push(result);
      }
    }
    if (!async)
      return handleUnionResults(results, payload, inst, ctx);
    return Promise.all(results).then((results2) => {
      return handleUnionResults(results2, payload, inst, ctx);
    });
  };
});
const $ZodIntersection = /* @__PURE__ */ $constructor("$ZodIntersection", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    const left = def.left._zod.run({ value: input, issues: [] }, ctx);
    const right = def.right._zod.run({ value: input, issues: [] }, ctx);
    const async = left instanceof Promise || right instanceof Promise;
    if (async) {
      return Promise.all([left, right]).then(([left2, right2]) => {
        return handleIntersectionResults(payload, left2, right2);
      });
    }
    return handleIntersectionResults(payload, left, right);
  };
});
function mergeValues(a, b) {
  if (a === b) {
    return { valid: true, data: a };
  }
  if (a instanceof Date && b instanceof Date && +a === +b) {
    return { valid: true, data: a };
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const bKeys = Object.keys(b);
    const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
        };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return { valid: false, mergeErrorPath: [] };
    }
    const newArray = [];
    for (let index2 = 0; index2 < a.length; index2++) {
      const itemA = a[index2];
      const itemB = b[index2];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [index2, ...sharedValue.mergeErrorPath]
        };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  }
  return { valid: false, mergeErrorPath: [] };
}
function handleIntersectionResults(result, left, right) {
  const unrecKeys = /* @__PURE__ */ new Map();
  let unrecIssue;
  for (const iss of left.issues) {
    if (iss.code === "unrecognized_keys") {
      unrecIssue ?? (unrecIssue = iss);
      for (const k of iss.keys) {
        if (!unrecKeys.has(k))
          unrecKeys.set(k, {});
        unrecKeys.get(k).l = true;
      }
    } else {
      result.issues.push(iss);
    }
  }
  for (const iss of right.issues) {
    if (iss.code === "unrecognized_keys") {
      for (const k of iss.keys) {
        if (!unrecKeys.has(k))
          unrecKeys.set(k, {});
        unrecKeys.get(k).r = true;
      }
    } else {
      result.issues.push(iss);
    }
  }
  const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
  if (bothKeys.length && unrecIssue) {
    result.issues.push({ ...unrecIssue, keys: bothKeys });
  }
  if (aborted(result))
    return result;
  const merged = mergeValues(left.value, right.value);
  if (!merged.valid) {
    throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`);
  }
  result.value = merged.data;
  return result;
}
const $ZodEnum = /* @__PURE__ */ $constructor("$ZodEnum", (inst, def) => {
  $ZodType.init(inst, def);
  const values = getEnumValues(def.entries);
  const valuesSet = new Set(values);
  inst._zod.values = valuesSet;
  inst._zod.pattern = new RegExp(`^(${values.filter((k) => propertyKeyTypes.has(typeof k)).map((o) => typeof o === "string" ? escapeRegex(o) : o.toString()).join("|")})$`);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (valuesSet.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values,
      input,
      inst
    });
    return payload;
  };
});
const $ZodLiteral = /* @__PURE__ */ $constructor("$ZodLiteral", (inst, def) => {
  $ZodType.init(inst, def);
  if (def.values.length === 0) {
    throw new Error("Cannot create literal schema with no valid values");
  }
  const values = new Set(def.values);
  inst._zod.values = values;
  inst._zod.pattern = new RegExp(`^(${def.values.map((o) => typeof o === "string" ? escapeRegex(o) : o ? escapeRegex(o.toString()) : String(o)).join("|")})$`);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (values.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values: def.values,
      input,
      inst
    });
    return payload;
  };
});
const $ZodTransform = /* @__PURE__ */ $constructor("$ZodTransform", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      throw new $ZodEncodeError(inst.constructor.name);
    }
    const _out = def.transform(payload.value, payload);
    if (ctx.async) {
      const output = _out instanceof Promise ? _out : Promise.resolve(_out);
      return output.then((output2) => {
        payload.value = output2;
        payload.fallback = true;
        return payload;
      });
    }
    if (_out instanceof Promise) {
      throw new $ZodAsyncError();
    }
    payload.value = _out;
    payload.fallback = true;
    return payload;
  };
});
function handleOptionalResult(result, input) {
  if (input === void 0 && (result.issues.length || result.fallback)) {
    return { issues: [], value: void 0 };
  }
  return result;
}
const $ZodOptional = /* @__PURE__ */ $constructor("$ZodOptional", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  inst._zod.optout = "optional";
  defineLazy(inst._zod, "values", () => {
    return def.innerType._zod.values ? /* @__PURE__ */ new Set([...def.innerType._zod.values, void 0]) : void 0;
  });
  defineLazy(inst._zod, "pattern", () => {
    const pattern = def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    if (def.innerType._zod.optin === "optional") {
      const input = payload.value;
      const result = def.innerType._zod.run(payload, ctx);
      if (result instanceof Promise)
        return result.then((r) => handleOptionalResult(r, input));
      return handleOptionalResult(result, input);
    }
    if (payload.value === void 0) {
      return payload;
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
const $ZodExactOptional = /* @__PURE__ */ $constructor("$ZodExactOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  defineLazy(inst._zod, "pattern", () => def.innerType._zod.pattern);
  inst._zod.parse = (payload, ctx) => {
    return def.innerType._zod.run(payload, ctx);
  };
});
const $ZodNullable = /* @__PURE__ */ $constructor("$ZodNullable", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
  defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
  defineLazy(inst._zod, "pattern", () => {
    const pattern = def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : void 0;
  });
  defineLazy(inst._zod, "values", () => {
    return def.innerType._zod.values ? /* @__PURE__ */ new Set([...def.innerType._zod.values, null]) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === null)
      return payload;
    return def.innerType._zod.run(payload, ctx);
  };
});
const $ZodDefault = /* @__PURE__ */ $constructor("$ZodDefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    if (payload.value === void 0) {
      payload.value = def.defaultValue;
      return payload;
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => handleDefaultResult(result2, def));
    }
    return handleDefaultResult(result, def);
  };
});
function handleDefaultResult(payload, def) {
  if (payload.value === void 0) {
    payload.value = def.defaultValue;
  }
  return payload;
}
const $ZodPrefault = /* @__PURE__ */ $constructor("$ZodPrefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    if (payload.value === void 0) {
      payload.value = def.defaultValue;
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
const $ZodNonOptional = /* @__PURE__ */ $constructor("$ZodNonOptional", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "values", () => {
    const v = def.innerType._zod.values;
    return v ? new Set([...v].filter((x) => x !== void 0)) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => handleNonOptionalResult(result2, inst));
    }
    return handleNonOptionalResult(result, inst);
  };
});
function handleNonOptionalResult(payload, inst) {
  if (!payload.issues.length && payload.value === void 0) {
    payload.issues.push({
      code: "invalid_type",
      expected: "nonoptional",
      input: payload.value,
      inst
    });
  }
  return payload;
}
const $ZodCatch = /* @__PURE__ */ $constructor("$ZodCatch", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => {
        payload.value = result2.value;
        if (result2.issues.length) {
          payload.value = def.catchValue({
            ...payload,
            error: {
              issues: result2.issues.map((iss) => finalizeIssue(iss, ctx, config()))
            },
            input: payload.value
          });
          payload.issues = [];
          payload.fallback = true;
        }
        return payload;
      });
    }
    payload.value = result.value;
    if (result.issues.length) {
      payload.value = def.catchValue({
        ...payload,
        error: {
          issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config()))
        },
        input: payload.value
      });
      payload.issues = [];
      payload.fallback = true;
    }
    return payload;
  };
});
const $ZodPipe = /* @__PURE__ */ $constructor("$ZodPipe", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "values", () => def.in._zod.values);
  defineLazy(inst._zod, "optin", () => def.in._zod.optin);
  defineLazy(inst._zod, "optout", () => def.out._zod.optout);
  defineLazy(inst._zod, "propValues", () => def.in._zod.propValues);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      const right = def.out._zod.run(payload, ctx);
      if (right instanceof Promise) {
        return right.then((right2) => handlePipeResult(right2, def.in, ctx));
      }
      return handlePipeResult(right, def.in, ctx);
    }
    const left = def.in._zod.run(payload, ctx);
    if (left instanceof Promise) {
      return left.then((left2) => handlePipeResult(left2, def.out, ctx));
    }
    return handlePipeResult(left, def.out, ctx);
  };
});
function handlePipeResult(left, next, ctx) {
  if (left.issues.length) {
    left.aborted = true;
    return left;
  }
  return next._zod.run({ value: left.value, issues: left.issues, fallback: left.fallback }, ctx);
}
const $ZodReadonly = /* @__PURE__ */ $constructor("$ZodReadonly", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "propValues", () => def.innerType._zod.propValues);
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  defineLazy(inst._zod, "optin", () => def.innerType?._zod?.optin);
  defineLazy(inst._zod, "optout", () => def.innerType?._zod?.optout);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then(handleReadonlyResult);
    }
    return handleReadonlyResult(result);
  };
});
function handleReadonlyResult(payload) {
  payload.value = Object.freeze(payload.value);
  return payload;
}
const $ZodCustom = /* @__PURE__ */ $constructor("$ZodCustom", (inst, def) => {
  $ZodCheck.init(inst, def);
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _) => {
    return payload;
  };
  inst._zod.check = (payload) => {
    const input = payload.value;
    const r = def.fn(input);
    if (r instanceof Promise) {
      return r.then((r2) => handleRefineResult(r2, payload, input, inst));
    }
    handleRefineResult(r, payload, input, inst);
    return;
  };
});
function handleRefineResult(result, payload, input, inst) {
  if (!result) {
    const _iss = {
      code: "custom",
      input,
      inst,
      // incorporates params.error into issue reporting
      path: [...inst._zod.def.path ?? []],
      // incorporates params.error into issue reporting
      continue: !inst._zod.def.abort
      // params: inst._zod.def.params,
    };
    if (inst._zod.def.params)
      _iss.params = inst._zod.def.params;
    payload.issues.push(issue(_iss));
  }
}
var _a;
class $ZodRegistry {
  constructor() {
    this._map = /* @__PURE__ */ new WeakMap();
    this._idmap = /* @__PURE__ */ new Map();
  }
  add(schema2, ..._meta) {
    const meta = _meta[0];
    this._map.set(schema2, meta);
    if (meta && typeof meta === "object" && "id" in meta) {
      this._idmap.set(meta.id, schema2);
    }
    return this;
  }
  clear() {
    this._map = /* @__PURE__ */ new WeakMap();
    this._idmap = /* @__PURE__ */ new Map();
    return this;
  }
  remove(schema2) {
    const meta = this._map.get(schema2);
    if (meta && typeof meta === "object" && "id" in meta) {
      this._idmap.delete(meta.id);
    }
    this._map.delete(schema2);
    return this;
  }
  get(schema2) {
    const p = schema2._zod.parent;
    if (p) {
      const pm = { ...this.get(p) ?? {} };
      delete pm.id;
      const f = { ...pm, ...this._map.get(schema2) };
      return Object.keys(f).length ? f : void 0;
    }
    return this._map.get(schema2);
  }
  has(schema2) {
    return this._map.has(schema2);
  }
}
function registry() {
  return new $ZodRegistry();
}
(_a = globalThis).__zod_globalRegistry ?? (_a.__zod_globalRegistry = registry());
const globalRegistry = globalThis.__zod_globalRegistry;
// @__NO_SIDE_EFFECTS__
function _string(Class, params) {
  return new Class({
    type: "string",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _email(Class, params) {
  return new Class({
    type: "string",
    format: "email",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _guid(Class, params) {
  return new Class({
    type: "string",
    format: "guid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uuid(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uuidv4(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v4",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uuidv6(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v6",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uuidv7(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v7",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _url(Class, params) {
  return new Class({
    type: "string",
    format: "url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _emoji(Class, params) {
  return new Class({
    type: "string",
    format: "emoji",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _nanoid(Class, params) {
  return new Class({
    type: "string",
    format: "nanoid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _cuid(Class, params) {
  return new Class({
    type: "string",
    format: "cuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _cuid2(Class, params) {
  return new Class({
    type: "string",
    format: "cuid2",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _ulid(Class, params) {
  return new Class({
    type: "string",
    format: "ulid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _xid(Class, params) {
  return new Class({
    type: "string",
    format: "xid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _ksuid(Class, params) {
  return new Class({
    type: "string",
    format: "ksuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _ipv4(Class, params) {
  return new Class({
    type: "string",
    format: "ipv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _ipv6(Class, params) {
  return new Class({
    type: "string",
    format: "ipv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _cidrv4(Class, params) {
  return new Class({
    type: "string",
    format: "cidrv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _cidrv6(Class, params) {
  return new Class({
    type: "string",
    format: "cidrv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _base64(Class, params) {
  return new Class({
    type: "string",
    format: "base64",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _base64url(Class, params) {
  return new Class({
    type: "string",
    format: "base64url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _e164(Class, params) {
  return new Class({
    type: "string",
    format: "e164",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _jwt(Class, params) {
  return new Class({
    type: "string",
    format: "jwt",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _isoDateTime(Class, params) {
  return new Class({
    type: "string",
    format: "datetime",
    check: "string_format",
    offset: false,
    local: false,
    precision: null,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _isoDate(Class, params) {
  return new Class({
    type: "string",
    format: "date",
    check: "string_format",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _isoTime(Class, params) {
  return new Class({
    type: "string",
    format: "time",
    check: "string_format",
    precision: null,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _isoDuration(Class, params) {
  return new Class({
    type: "string",
    format: "duration",
    check: "string_format",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _number(Class, params) {
  return new Class({
    type: "number",
    checks: [],
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _int(Class, params) {
  return new Class({
    type: "number",
    check: "number_format",
    abort: false,
    format: "safeint",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _boolean(Class, params) {
  return new Class({
    type: "boolean",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _undefined$1(Class, params) {
  return new Class({
    type: "undefined",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _null$1(Class, params) {
  return new Class({
    type: "null",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _unknown(Class) {
  return new Class({
    type: "unknown"
  });
}
// @__NO_SIDE_EFFECTS__
function _never(Class, params) {
  return new Class({
    type: "never",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _coercedDate(Class, params) {
  return new Class({
    type: "date",
    coerce: true,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _lt(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
// @__NO_SIDE_EFFECTS__
function _lte(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
// @__NO_SIDE_EFFECTS__
function _gt(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
// @__NO_SIDE_EFFECTS__
function _gte(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
// @__NO_SIDE_EFFECTS__
function _multipleOf(value, params) {
  return new $ZodCheckMultipleOf({
    check: "multiple_of",
    ...normalizeParams(params),
    value
  });
}
// @__NO_SIDE_EFFECTS__
function _maxLength(maximum, params) {
  const ch = new $ZodCheckMaxLength({
    check: "max_length",
    ...normalizeParams(params),
    maximum
  });
  return ch;
}
// @__NO_SIDE_EFFECTS__
function _minLength(minimum, params) {
  return new $ZodCheckMinLength({
    check: "min_length",
    ...normalizeParams(params),
    minimum
  });
}
// @__NO_SIDE_EFFECTS__
function _length(length, params) {
  return new $ZodCheckLengthEquals({
    check: "length_equals",
    ...normalizeParams(params),
    length
  });
}
// @__NO_SIDE_EFFECTS__
function _regex(pattern, params) {
  return new $ZodCheckRegex({
    check: "string_format",
    format: "regex",
    ...normalizeParams(params),
    pattern
  });
}
// @__NO_SIDE_EFFECTS__
function _lowercase(params) {
  return new $ZodCheckLowerCase({
    check: "string_format",
    format: "lowercase",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uppercase(params) {
  return new $ZodCheckUpperCase({
    check: "string_format",
    format: "uppercase",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _includes(includes, params) {
  return new $ZodCheckIncludes({
    check: "string_format",
    format: "includes",
    ...normalizeParams(params),
    includes
  });
}
// @__NO_SIDE_EFFECTS__
function _startsWith(prefix, params) {
  return new $ZodCheckStartsWith({
    check: "string_format",
    format: "starts_with",
    ...normalizeParams(params),
    prefix
  });
}
// @__NO_SIDE_EFFECTS__
function _endsWith(suffix, params) {
  return new $ZodCheckEndsWith({
    check: "string_format",
    format: "ends_with",
    ...normalizeParams(params),
    suffix
  });
}
// @__NO_SIDE_EFFECTS__
function _overwrite(tx) {
  return new $ZodCheckOverwrite({
    check: "overwrite",
    tx
  });
}
// @__NO_SIDE_EFFECTS__
function _normalize(form) {
  return /* @__PURE__ */ _overwrite((input) => input.normalize(form));
}
// @__NO_SIDE_EFFECTS__
function _trim() {
  return /* @__PURE__ */ _overwrite((input) => input.trim());
}
// @__NO_SIDE_EFFECTS__
function _toLowerCase() {
  return /* @__PURE__ */ _overwrite((input) => input.toLowerCase());
}
// @__NO_SIDE_EFFECTS__
function _toUpperCase() {
  return /* @__PURE__ */ _overwrite((input) => input.toUpperCase());
}
// @__NO_SIDE_EFFECTS__
function _slugify() {
  return /* @__PURE__ */ _overwrite((input) => slugify(input));
}
// @__NO_SIDE_EFFECTS__
function _array(Class, element, params) {
  return new Class({
    type: "array",
    element,
    // get element() {
    //   return element;
    // },
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _refine(Class, fn, _params) {
  const schema2 = new Class({
    type: "custom",
    check: "custom",
    fn,
    ...normalizeParams(_params)
  });
  return schema2;
}
// @__NO_SIDE_EFFECTS__
function _superRefine(fn, params) {
  const ch = /* @__PURE__ */ _check((payload) => {
    payload.addIssue = (issue$1) => {
      if (typeof issue$1 === "string") {
        payload.issues.push(issue(issue$1, payload.value, ch._zod.def));
      } else {
        const _issue = issue$1;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        _issue.input ?? (_issue.input = payload.value);
        _issue.inst ?? (_issue.inst = ch);
        _issue.continue ?? (_issue.continue = !ch._zod.def.abort);
        payload.issues.push(issue(_issue));
      }
    };
    return fn(payload.value, payload);
  }, params);
  return ch;
}
// @__NO_SIDE_EFFECTS__
function _check(fn, params) {
  const ch = new $ZodCheck({
    check: "custom",
    ...normalizeParams(params)
  });
  ch._zod.check = fn;
  return ch;
}
function initializeContext(params) {
  let target = params?.target ?? "draft-2020-12";
  if (target === "draft-4")
    target = "draft-04";
  if (target === "draft-7")
    target = "draft-07";
  return {
    processors: params.processors ?? {},
    metadataRegistry: params?.metadata ?? globalRegistry,
    target,
    unrepresentable: params?.unrepresentable ?? "throw",
    override: params?.override ?? (() => {
    }),
    io: params?.io ?? "output",
    counter: 0,
    seen: /* @__PURE__ */ new Map(),
    cycles: params?.cycles ?? "ref",
    reused: params?.reused ?? "inline",
    external: params?.external ?? void 0
  };
}
function process$1(schema2, ctx, _params = { path: [], schemaPath: [] }) {
  var _a2;
  const def = schema2._zod.def;
  const seen = ctx.seen.get(schema2);
  if (seen) {
    seen.count++;
    const isCycle = _params.schemaPath.includes(schema2);
    if (isCycle) {
      seen.cycle = _params.path;
    }
    return seen.schema;
  }
  const result = { schema: {}, count: 1, cycle: void 0, path: _params.path };
  ctx.seen.set(schema2, result);
  const overrideSchema = schema2._zod.toJSONSchema?.();
  if (overrideSchema) {
    result.schema = overrideSchema;
  } else {
    const params = {
      ..._params,
      schemaPath: [..._params.schemaPath, schema2],
      path: _params.path
    };
    if (schema2._zod.processJSONSchema) {
      schema2._zod.processJSONSchema(ctx, result.schema, params);
    } else {
      const _json = result.schema;
      const processor = ctx.processors[def.type];
      if (!processor) {
        throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
      }
      processor(schema2, ctx, _json, params);
    }
    const parent = schema2._zod.parent;
    if (parent) {
      if (!result.ref)
        result.ref = parent;
      process$1(parent, ctx, params);
      ctx.seen.get(parent).isParent = true;
    }
  }
  const meta = ctx.metadataRegistry.get(schema2);
  if (meta)
    Object.assign(result.schema, meta);
  if (ctx.io === "input" && isTransforming(schema2)) {
    delete result.schema.examples;
    delete result.schema.default;
  }
  if (ctx.io === "input" && "_prefault" in result.schema)
    (_a2 = result.schema).default ?? (_a2.default = result.schema._prefault);
  delete result.schema._prefault;
  const _result = ctx.seen.get(schema2);
  return _result.schema;
}
function extractDefs(ctx, schema2) {
  const root = ctx.seen.get(schema2);
  if (!root)
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  const idToSchema = /* @__PURE__ */ new Map();
  for (const entry of ctx.seen.entries()) {
    const id = ctx.metadataRegistry.get(entry[0])?.id;
    if (id) {
      const existing = idToSchema.get(id);
      if (existing && existing !== entry[0]) {
        throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
      }
      idToSchema.set(id, entry[0]);
    }
  }
  const makeURI = (entry) => {
    const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
    if (ctx.external) {
      const externalId = ctx.external.registry.get(entry[0])?.id;
      const uriGenerator = ctx.external.uri ?? ((id2) => id2);
      if (externalId) {
        return { ref: uriGenerator(externalId) };
      }
      const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
      entry[1].defId = id;
      return { defId: id, ref: `${uriGenerator("__shared")}#/${defsSegment}/${id}` };
    }
    if (entry[1] === root) {
      return { ref: "#" };
    }
    const uriPrefix = `#`;
    const defUriPrefix = `${uriPrefix}/${defsSegment}/`;
    const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
    return { defId, ref: defUriPrefix + defId };
  };
  const extractToDef = (entry) => {
    if (entry[1].schema.$ref) {
      return;
    }
    const seen = entry[1];
    const { ref, defId } = makeURI(entry);
    seen.def = { ...seen.schema };
    if (defId)
      seen.defId = defId;
    const schema3 = seen.schema;
    for (const key in schema3) {
      delete schema3[key];
    }
    schema3.$ref = ref;
  };
  if (ctx.cycles === "throw") {
    for (const entry of ctx.seen.entries()) {
      const seen = entry[1];
      if (seen.cycle) {
        throw new Error(`Cycle detected: #/${seen.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
      }
    }
  }
  for (const entry of ctx.seen.entries()) {
    const seen = entry[1];
    if (schema2 === entry[0]) {
      extractToDef(entry);
      continue;
    }
    if (ctx.external) {
      const ext = ctx.external.registry.get(entry[0])?.id;
      if (schema2 !== entry[0] && ext) {
        extractToDef(entry);
        continue;
      }
    }
    const id = ctx.metadataRegistry.get(entry[0])?.id;
    if (id) {
      extractToDef(entry);
      continue;
    }
    if (seen.cycle) {
      extractToDef(entry);
      continue;
    }
    if (seen.count > 1) {
      if (ctx.reused === "ref") {
        extractToDef(entry);
        continue;
      }
    }
  }
}
function finalize(ctx, schema2) {
  const root = ctx.seen.get(schema2);
  if (!root)
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  const flattenRef = (zodSchema) => {
    const seen = ctx.seen.get(zodSchema);
    if (seen.ref === null)
      return;
    const schema3 = seen.def ?? seen.schema;
    const _cached = { ...schema3 };
    const ref = seen.ref;
    seen.ref = null;
    if (ref) {
      flattenRef(ref);
      const refSeen = ctx.seen.get(ref);
      const refSchema = refSeen.schema;
      if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
        schema3.allOf = schema3.allOf ?? [];
        schema3.allOf.push(refSchema);
      } else {
        Object.assign(schema3, refSchema);
      }
      Object.assign(schema3, _cached);
      const isParentRef = zodSchema._zod.parent === ref;
      if (isParentRef) {
        for (const key in schema3) {
          if (key === "$ref" || key === "allOf")
            continue;
          if (!(key in _cached)) {
            delete schema3[key];
          }
        }
      }
      if (refSchema.$ref && refSeen.def) {
        for (const key in schema3) {
          if (key === "$ref" || key === "allOf")
            continue;
          if (key in refSeen.def && JSON.stringify(schema3[key]) === JSON.stringify(refSeen.def[key])) {
            delete schema3[key];
          }
        }
      }
    }
    const parent = zodSchema._zod.parent;
    if (parent && parent !== ref) {
      flattenRef(parent);
      const parentSeen = ctx.seen.get(parent);
      if (parentSeen?.schema.$ref) {
        schema3.$ref = parentSeen.schema.$ref;
        if (parentSeen.def) {
          for (const key in schema3) {
            if (key === "$ref" || key === "allOf")
              continue;
            if (key in parentSeen.def && JSON.stringify(schema3[key]) === JSON.stringify(parentSeen.def[key])) {
              delete schema3[key];
            }
          }
        }
      }
    }
    ctx.override({
      zodSchema,
      jsonSchema: schema3,
      path: seen.path ?? []
    });
  };
  for (const entry of [...ctx.seen.entries()].reverse()) {
    flattenRef(entry[0]);
  }
  const result = {};
  if (ctx.target === "draft-2020-12") {
    result.$schema = "https://json-schema.org/draft/2020-12/schema";
  } else if (ctx.target === "draft-07") {
    result.$schema = "http://json-schema.org/draft-07/schema#";
  } else if (ctx.target === "draft-04") {
    result.$schema = "http://json-schema.org/draft-04/schema#";
  } else if (ctx.target === "openapi-3.0") ;
  else ;
  if (ctx.external?.uri) {
    const id = ctx.external.registry.get(schema2)?.id;
    if (!id)
      throw new Error("Schema is missing an `id` property");
    result.$id = ctx.external.uri(id);
  }
  Object.assign(result, root.def ?? root.schema);
  const rootMetaId = ctx.metadataRegistry.get(schema2)?.id;
  if (rootMetaId !== void 0 && result.id === rootMetaId)
    delete result.id;
  const defs = ctx.external?.defs ?? {};
  for (const entry of ctx.seen.entries()) {
    const seen = entry[1];
    if (seen.def && seen.defId) {
      if (seen.def.id === seen.defId)
        delete seen.def.id;
      defs[seen.defId] = seen.def;
    }
  }
  if (ctx.external) ;
  else {
    if (Object.keys(defs).length > 0) {
      if (ctx.target === "draft-2020-12") {
        result.$defs = defs;
      } else {
        result.definitions = defs;
      }
    }
  }
  try {
    const finalized = JSON.parse(JSON.stringify(result));
    Object.defineProperty(finalized, "~standard", {
      value: {
        ...schema2["~standard"],
        jsonSchema: {
          input: createStandardJSONSchemaMethod(schema2, "input", ctx.processors),
          output: createStandardJSONSchemaMethod(schema2, "output", ctx.processors)
        }
      },
      enumerable: false,
      writable: false
    });
    return finalized;
  } catch (_err) {
    throw new Error("Error converting schema to JSON.");
  }
}
function isTransforming(_schema, _ctx) {
  const ctx = _ctx ?? { seen: /* @__PURE__ */ new Set() };
  if (ctx.seen.has(_schema))
    return false;
  ctx.seen.add(_schema);
  const def = _schema._zod.def;
  if (def.type === "transform")
    return true;
  if (def.type === "array")
    return isTransforming(def.element, ctx);
  if (def.type === "set")
    return isTransforming(def.valueType, ctx);
  if (def.type === "lazy")
    return isTransforming(def.getter(), ctx);
  if (def.type === "promise" || def.type === "optional" || def.type === "nonoptional" || def.type === "nullable" || def.type === "readonly" || def.type === "default" || def.type === "prefault") {
    return isTransforming(def.innerType, ctx);
  }
  if (def.type === "intersection") {
    return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
  }
  if (def.type === "record" || def.type === "map") {
    return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
  }
  if (def.type === "pipe") {
    if (_schema._zod.traits.has("$ZodCodec"))
      return true;
    return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
  }
  if (def.type === "object") {
    for (const key in def.shape) {
      if (isTransforming(def.shape[key], ctx))
        return true;
    }
    return false;
  }
  if (def.type === "union") {
    for (const option of def.options) {
      if (isTransforming(option, ctx))
        return true;
    }
    return false;
  }
  if (def.type === "tuple") {
    for (const item of def.items) {
      if (isTransforming(item, ctx))
        return true;
    }
    if (def.rest && isTransforming(def.rest, ctx))
      return true;
    return false;
  }
  return false;
}
const createToJSONSchemaMethod = (schema2, processors = {}) => (params) => {
  const ctx = initializeContext({ ...params, processors });
  process$1(schema2, ctx);
  extractDefs(ctx, schema2);
  return finalize(ctx, schema2);
};
const createStandardJSONSchemaMethod = (schema2, io, processors = {}) => (params) => {
  const { libraryOptions, target } = params ?? {};
  const ctx = initializeContext({ ...libraryOptions ?? {}, target, io, processors });
  process$1(schema2, ctx);
  extractDefs(ctx, schema2);
  return finalize(ctx, schema2);
};
const formatMap = {
  guid: "uuid",
  url: "uri",
  datetime: "date-time",
  json_string: "json-string",
  regex: ""
  // do not set
};
const stringProcessor = (schema2, ctx, _json, _params) => {
  const json = _json;
  json.type = "string";
  const { minimum, maximum, format, patterns, contentEncoding } = schema2._zod.bag;
  if (typeof minimum === "number")
    json.minLength = minimum;
  if (typeof maximum === "number")
    json.maxLength = maximum;
  if (format) {
    json.format = formatMap[format] ?? format;
    if (json.format === "")
      delete json.format;
    if (format === "time") {
      delete json.format;
    }
  }
  if (contentEncoding)
    json.contentEncoding = contentEncoding;
  if (patterns && patterns.size > 0) {
    const regexes = [...patterns];
    if (regexes.length === 1)
      json.pattern = regexes[0].source;
    else if (regexes.length > 1) {
      json.allOf = [
        ...regexes.map((regex) => ({
          ...ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0" ? { type: "string" } : {},
          pattern: regex.source
        }))
      ];
    }
  }
};
const numberProcessor = (schema2, ctx, _json, _params) => {
  const json = _json;
  const { minimum, maximum, format, multipleOf, exclusiveMaximum, exclusiveMinimum } = schema2._zod.bag;
  if (typeof format === "string" && format.includes("int"))
    json.type = "integer";
  else
    json.type = "number";
  const exMin = typeof exclusiveMinimum === "number" && exclusiveMinimum >= (minimum ?? Number.NEGATIVE_INFINITY);
  const exMax = typeof exclusiveMaximum === "number" && exclusiveMaximum <= (maximum ?? Number.POSITIVE_INFINITY);
  const legacy = ctx.target === "draft-04" || ctx.target === "openapi-3.0";
  if (exMin) {
    if (legacy) {
      json.minimum = exclusiveMinimum;
      json.exclusiveMinimum = true;
    } else {
      json.exclusiveMinimum = exclusiveMinimum;
    }
  } else if (typeof minimum === "number") {
    json.minimum = minimum;
  }
  if (exMax) {
    if (legacy) {
      json.maximum = exclusiveMaximum;
      json.exclusiveMaximum = true;
    } else {
      json.exclusiveMaximum = exclusiveMaximum;
    }
  } else if (typeof maximum === "number") {
    json.maximum = maximum;
  }
  if (typeof multipleOf === "number")
    json.multipleOf = multipleOf;
};
const booleanProcessor = (_schema, _ctx, json, _params) => {
  json.type = "boolean";
};
const nullProcessor = (_schema, ctx, json, _params) => {
  if (ctx.target === "openapi-3.0") {
    json.type = "string";
    json.nullable = true;
    json.enum = [null];
  } else {
    json.type = "null";
  }
};
const undefinedProcessor = (_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Undefined cannot be represented in JSON Schema");
  }
};
const neverProcessor = (_schema, _ctx, json, _params) => {
  json.not = {};
};
const unknownProcessor = (_schema, _ctx, _json, _params) => {
};
const dateProcessor = (_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Date cannot be represented in JSON Schema");
  }
};
const enumProcessor = (schema2, _ctx, json, _params) => {
  const def = schema2._zod.def;
  const values = getEnumValues(def.entries);
  if (values.every((v) => typeof v === "number"))
    json.type = "number";
  if (values.every((v) => typeof v === "string"))
    json.type = "string";
  json.enum = values;
};
const literalProcessor = (schema2, ctx, json, _params) => {
  const def = schema2._zod.def;
  const vals = [];
  for (const val of def.values) {
    if (val === void 0) {
      if (ctx.unrepresentable === "throw") {
        throw new Error("Literal `undefined` cannot be represented in JSON Schema");
      }
    } else if (typeof val === "bigint") {
      if (ctx.unrepresentable === "throw") {
        throw new Error("BigInt literals cannot be represented in JSON Schema");
      } else {
        vals.push(Number(val));
      }
    } else {
      vals.push(val);
    }
  }
  if (vals.length === 0) ;
  else if (vals.length === 1) {
    const val = vals[0];
    json.type = val === null ? "null" : typeof val;
    if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") {
      json.enum = [val];
    } else {
      json.const = val;
    }
  } else {
    if (vals.every((v) => typeof v === "number"))
      json.type = "number";
    if (vals.every((v) => typeof v === "string"))
      json.type = "string";
    if (vals.every((v) => typeof v === "boolean"))
      json.type = "boolean";
    if (vals.every((v) => v === null))
      json.type = "null";
    json.enum = vals;
  }
};
const customProcessor = (_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Custom types cannot be represented in JSON Schema");
  }
};
const transformProcessor = (_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Transforms cannot be represented in JSON Schema");
  }
};
const arrayProcessor = (schema2, ctx, _json, params) => {
  const json = _json;
  const def = schema2._zod.def;
  const { minimum, maximum } = schema2._zod.bag;
  if (typeof minimum === "number")
    json.minItems = minimum;
  if (typeof maximum === "number")
    json.maxItems = maximum;
  json.type = "array";
  json.items = process$1(def.element, ctx, {
    ...params,
    path: [...params.path, "items"]
  });
};
const objectProcessor = (schema2, ctx, _json, params) => {
  const json = _json;
  const def = schema2._zod.def;
  json.type = "object";
  json.properties = {};
  const shape = def.shape;
  for (const key in shape) {
    json.properties[key] = process$1(shape[key], ctx, {
      ...params,
      path: [...params.path, "properties", key]
    });
  }
  const allKeys = new Set(Object.keys(shape));
  const requiredKeys = new Set([...allKeys].filter((key) => {
    const v = def.shape[key]._zod;
    if (ctx.io === "input") {
      return v.optin === void 0;
    } else {
      return v.optout === void 0;
    }
  }));
  if (requiredKeys.size > 0) {
    json.required = Array.from(requiredKeys);
  }
  if (def.catchall?._zod.def.type === "never") {
    json.additionalProperties = false;
  } else if (!def.catchall) {
    if (ctx.io === "output")
      json.additionalProperties = false;
  } else if (def.catchall) {
    json.additionalProperties = process$1(def.catchall, ctx, {
      ...params,
      path: [...params.path, "additionalProperties"]
    });
  }
};
const unionProcessor = (schema2, ctx, json, params) => {
  const def = schema2._zod.def;
  const isExclusive = def.inclusive === false;
  const options = def.options.map((x, i) => process$1(x, ctx, {
    ...params,
    path: [...params.path, isExclusive ? "oneOf" : "anyOf", i]
  }));
  if (isExclusive) {
    json.oneOf = options;
  } else {
    json.anyOf = options;
  }
};
const intersectionProcessor = (schema2, ctx, json, params) => {
  const def = schema2._zod.def;
  const a = process$1(def.left, ctx, {
    ...params,
    path: [...params.path, "allOf", 0]
  });
  const b = process$1(def.right, ctx, {
    ...params,
    path: [...params.path, "allOf", 1]
  });
  const isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1;
  const allOf = [
    ...isSimpleIntersection(a) ? a.allOf : [a],
    ...isSimpleIntersection(b) ? b.allOf : [b]
  ];
  json.allOf = allOf;
};
const nullableProcessor = (schema2, ctx, json, params) => {
  const def = schema2._zod.def;
  const inner = process$1(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema2);
  if (ctx.target === "openapi-3.0") {
    seen.ref = def.innerType;
    json.nullable = true;
  } else {
    json.anyOf = [inner, { type: "null" }];
  }
};
const nonoptionalProcessor = (schema2, ctx, _json, params) => {
  const def = schema2._zod.def;
  process$1(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema2);
  seen.ref = def.innerType;
};
const defaultProcessor = (schema2, ctx, json, params) => {
  const def = schema2._zod.def;
  process$1(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema2);
  seen.ref = def.innerType;
  json.default = JSON.parse(JSON.stringify(def.defaultValue));
};
const prefaultProcessor = (schema2, ctx, json, params) => {
  const def = schema2._zod.def;
  process$1(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema2);
  seen.ref = def.innerType;
  if (ctx.io === "input")
    json._prefault = JSON.parse(JSON.stringify(def.defaultValue));
};
const catchProcessor = (schema2, ctx, json, params) => {
  const def = schema2._zod.def;
  process$1(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema2);
  seen.ref = def.innerType;
  let catchValue;
  try {
    catchValue = def.catchValue(void 0);
  } catch {
    throw new Error("Dynamic catch values are not supported in JSON Schema");
  }
  json.default = catchValue;
};
const pipeProcessor = (schema2, ctx, _json, params) => {
  const def = schema2._zod.def;
  const inIsTransform = def.in._zod.traits.has("$ZodTransform");
  const innerType = ctx.io === "input" ? inIsTransform ? def.out : def.in : def.out;
  process$1(innerType, ctx, params);
  const seen = ctx.seen.get(schema2);
  seen.ref = innerType;
};
const readonlyProcessor = (schema2, ctx, json, params) => {
  const def = schema2._zod.def;
  process$1(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema2);
  seen.ref = def.innerType;
  json.readOnly = true;
};
const optionalProcessor = (schema2, ctx, _json, params) => {
  const def = schema2._zod.def;
  process$1(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema2);
  seen.ref = def.innerType;
};
const ZodISODateTime = /* @__PURE__ */ $constructor("ZodISODateTime", (inst, def) => {
  $ZodISODateTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function datetime(params) {
  return /* @__PURE__ */ _isoDateTime(ZodISODateTime, params);
}
const ZodISODate = /* @__PURE__ */ $constructor("ZodISODate", (inst, def) => {
  $ZodISODate.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function date$1(params) {
  return /* @__PURE__ */ _isoDate(ZodISODate, params);
}
const ZodISOTime = /* @__PURE__ */ $constructor("ZodISOTime", (inst, def) => {
  $ZodISOTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function time(params) {
  return /* @__PURE__ */ _isoTime(ZodISOTime, params);
}
const ZodISODuration = /* @__PURE__ */ $constructor("ZodISODuration", (inst, def) => {
  $ZodISODuration.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function duration(params) {
  return /* @__PURE__ */ _isoDuration(ZodISODuration, params);
}
const initializer = (inst, issues) => {
  $ZodError.init(inst, issues);
  inst.name = "ZodError";
  Object.defineProperties(inst, {
    format: {
      value: (mapper) => formatError(inst, mapper)
      // enumerable: false,
    },
    flatten: {
      value: (mapper) => flattenError(inst, mapper)
      // enumerable: false,
    },
    addIssue: {
      value: (issue2) => {
        inst.issues.push(issue2);
        inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
      }
      // enumerable: false,
    },
    addIssues: {
      value: (issues2) => {
        inst.issues.push(...issues2);
        inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
      }
      // enumerable: false,
    },
    isEmpty: {
      get() {
        return inst.issues.length === 0;
      }
      // enumerable: false,
    }
  });
};
const ZodRealError = /* @__PURE__ */ $constructor("ZodError", initializer, {
  Parent: Error
});
const parse = /* @__PURE__ */ _parse(ZodRealError);
const parseAsync = /* @__PURE__ */ _parseAsync(ZodRealError);
const safeParse = /* @__PURE__ */ _safeParse(ZodRealError);
const safeParseAsync = /* @__PURE__ */ _safeParseAsync(ZodRealError);
const encode = /* @__PURE__ */ _encode(ZodRealError);
const decode = /* @__PURE__ */ _decode(ZodRealError);
const encodeAsync = /* @__PURE__ */ _encodeAsync(ZodRealError);
const decodeAsync = /* @__PURE__ */ _decodeAsync(ZodRealError);
const safeEncode = /* @__PURE__ */ _safeEncode(ZodRealError);
const safeDecode = /* @__PURE__ */ _safeDecode(ZodRealError);
const safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
const safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);
const _installedGroups = /* @__PURE__ */ new WeakMap();
function _installLazyMethods(inst, group, methods) {
  const proto = Object.getPrototypeOf(inst);
  let installed = _installedGroups.get(proto);
  if (!installed) {
    installed = /* @__PURE__ */ new Set();
    _installedGroups.set(proto, installed);
  }
  if (installed.has(group))
    return;
  installed.add(group);
  for (const key in methods) {
    const fn = methods[key];
    Object.defineProperty(proto, key, {
      configurable: true,
      enumerable: false,
      get() {
        const bound = fn.bind(this);
        Object.defineProperty(this, key, {
          configurable: true,
          writable: true,
          enumerable: true,
          value: bound
        });
        return bound;
      },
      set(v) {
        Object.defineProperty(this, key, {
          configurable: true,
          writable: true,
          enumerable: true,
          value: v
        });
      }
    });
  }
}
const ZodType = /* @__PURE__ */ $constructor("ZodType", (inst, def) => {
  $ZodType.init(inst, def);
  Object.assign(inst["~standard"], {
    jsonSchema: {
      input: createStandardJSONSchemaMethod(inst, "input"),
      output: createStandardJSONSchemaMethod(inst, "output")
    }
  });
  inst.toJSONSchema = createToJSONSchemaMethod(inst, {});
  inst.def = def;
  inst.type = def.type;
  Object.defineProperty(inst, "_def", { value: def });
  inst.parse = (data, params) => parse(inst, data, params, { callee: inst.parse });
  inst.safeParse = (data, params) => safeParse(inst, data, params);
  inst.parseAsync = async (data, params) => parseAsync(inst, data, params, { callee: inst.parseAsync });
  inst.safeParseAsync = async (data, params) => safeParseAsync(inst, data, params);
  inst.spa = inst.safeParseAsync;
  inst.encode = (data, params) => encode(inst, data, params);
  inst.decode = (data, params) => decode(inst, data, params);
  inst.encodeAsync = async (data, params) => encodeAsync(inst, data, params);
  inst.decodeAsync = async (data, params) => decodeAsync(inst, data, params);
  inst.safeEncode = (data, params) => safeEncode(inst, data, params);
  inst.safeDecode = (data, params) => safeDecode(inst, data, params);
  inst.safeEncodeAsync = async (data, params) => safeEncodeAsync(inst, data, params);
  inst.safeDecodeAsync = async (data, params) => safeDecodeAsync(inst, data, params);
  _installLazyMethods(inst, "ZodType", {
    check(...chks) {
      const def2 = this.def;
      return this.clone(mergeDefs(def2, {
        checks: [
          ...def2.checks ?? [],
          ...chks.map((ch) => typeof ch === "function" ? { _zod: { check: ch, def: { check: "custom" }, onattach: [] } } : ch)
        ]
      }), { parent: true });
    },
    with(...chks) {
      return this.check(...chks);
    },
    clone(def2, params) {
      return clone(this, def2, params);
    },
    brand() {
      return this;
    },
    register(reg, meta) {
      reg.add(this, meta);
      return this;
    },
    refine(check, params) {
      return this.check(refine(check, params));
    },
    superRefine(refinement, params) {
      return this.check(superRefine(refinement, params));
    },
    overwrite(fn) {
      return this.check(/* @__PURE__ */ _overwrite(fn));
    },
    optional() {
      return optional(this);
    },
    exactOptional() {
      return exactOptional(this);
    },
    nullable() {
      return nullable(this);
    },
    nullish() {
      return optional(nullable(this));
    },
    nonoptional(params) {
      return nonoptional(this, params);
    },
    array() {
      return array(this);
    },
    or(arg) {
      return union([this, arg]);
    },
    and(arg) {
      return intersection(this, arg);
    },
    transform(tx) {
      return pipe(this, transform(tx));
    },
    default(d) {
      return _default(this, d);
    },
    prefault(d) {
      return prefault(this, d);
    },
    catch(params) {
      return _catch(this, params);
    },
    pipe(target) {
      return pipe(this, target);
    },
    readonly() {
      return readonly(this);
    },
    describe(description) {
      const cl = this.clone();
      globalRegistry.add(cl, { description });
      return cl;
    },
    meta(...args) {
      if (args.length === 0)
        return globalRegistry.get(this);
      const cl = this.clone();
      globalRegistry.add(cl, args[0]);
      return cl;
    },
    isOptional() {
      return this.safeParse(void 0).success;
    },
    isNullable() {
      return this.safeParse(null).success;
    },
    apply(fn) {
      return fn(this);
    }
  });
  Object.defineProperty(inst, "description", {
    get() {
      return globalRegistry.get(inst)?.description;
    },
    configurable: true
  });
  return inst;
});
const _ZodString = /* @__PURE__ */ $constructor("_ZodString", (inst, def) => {
  $ZodString.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => stringProcessor(inst, ctx, json);
  const bag = inst._zod.bag;
  inst.format = bag.format ?? null;
  inst.minLength = bag.minimum ?? null;
  inst.maxLength = bag.maximum ?? null;
  _installLazyMethods(inst, "_ZodString", {
    regex(...args) {
      return this.check(/* @__PURE__ */ _regex(...args));
    },
    includes(...args) {
      return this.check(/* @__PURE__ */ _includes(...args));
    },
    startsWith(...args) {
      return this.check(/* @__PURE__ */ _startsWith(...args));
    },
    endsWith(...args) {
      return this.check(/* @__PURE__ */ _endsWith(...args));
    },
    min(...args) {
      return this.check(/* @__PURE__ */ _minLength(...args));
    },
    max(...args) {
      return this.check(/* @__PURE__ */ _maxLength(...args));
    },
    length(...args) {
      return this.check(/* @__PURE__ */ _length(...args));
    },
    nonempty(...args) {
      return this.check(/* @__PURE__ */ _minLength(1, ...args));
    },
    lowercase(params) {
      return this.check(/* @__PURE__ */ _lowercase(params));
    },
    uppercase(params) {
      return this.check(/* @__PURE__ */ _uppercase(params));
    },
    trim() {
      return this.check(/* @__PURE__ */ _trim());
    },
    normalize(...args) {
      return this.check(/* @__PURE__ */ _normalize(...args));
    },
    toLowerCase() {
      return this.check(/* @__PURE__ */ _toLowerCase());
    },
    toUpperCase() {
      return this.check(/* @__PURE__ */ _toUpperCase());
    },
    slugify() {
      return this.check(/* @__PURE__ */ _slugify());
    }
  });
});
const ZodString = /* @__PURE__ */ $constructor("ZodString", (inst, def) => {
  $ZodString.init(inst, def);
  _ZodString.init(inst, def);
  inst.email = (params) => inst.check(/* @__PURE__ */ _email(ZodEmail, params));
  inst.url = (params) => inst.check(/* @__PURE__ */ _url(ZodURL, params));
  inst.jwt = (params) => inst.check(/* @__PURE__ */ _jwt(ZodJWT, params));
  inst.emoji = (params) => inst.check(/* @__PURE__ */ _emoji(ZodEmoji, params));
  inst.guid = (params) => inst.check(/* @__PURE__ */ _guid(ZodGUID, params));
  inst.uuid = (params) => inst.check(/* @__PURE__ */ _uuid(ZodUUID, params));
  inst.uuidv4 = (params) => inst.check(/* @__PURE__ */ _uuidv4(ZodUUID, params));
  inst.uuidv6 = (params) => inst.check(/* @__PURE__ */ _uuidv6(ZodUUID, params));
  inst.uuidv7 = (params) => inst.check(/* @__PURE__ */ _uuidv7(ZodUUID, params));
  inst.nanoid = (params) => inst.check(/* @__PURE__ */ _nanoid(ZodNanoID, params));
  inst.guid = (params) => inst.check(/* @__PURE__ */ _guid(ZodGUID, params));
  inst.cuid = (params) => inst.check(/* @__PURE__ */ _cuid(ZodCUID, params));
  inst.cuid2 = (params) => inst.check(/* @__PURE__ */ _cuid2(ZodCUID2, params));
  inst.ulid = (params) => inst.check(/* @__PURE__ */ _ulid(ZodULID, params));
  inst.base64 = (params) => inst.check(/* @__PURE__ */ _base64(ZodBase64, params));
  inst.base64url = (params) => inst.check(/* @__PURE__ */ _base64url(ZodBase64URL, params));
  inst.xid = (params) => inst.check(/* @__PURE__ */ _xid(ZodXID, params));
  inst.ksuid = (params) => inst.check(/* @__PURE__ */ _ksuid(ZodKSUID, params));
  inst.ipv4 = (params) => inst.check(/* @__PURE__ */ _ipv4(ZodIPv4, params));
  inst.ipv6 = (params) => inst.check(/* @__PURE__ */ _ipv6(ZodIPv6, params));
  inst.cidrv4 = (params) => inst.check(/* @__PURE__ */ _cidrv4(ZodCIDRv4, params));
  inst.cidrv6 = (params) => inst.check(/* @__PURE__ */ _cidrv6(ZodCIDRv6, params));
  inst.e164 = (params) => inst.check(/* @__PURE__ */ _e164(ZodE164, params));
  inst.datetime = (params) => inst.check(datetime(params));
  inst.date = (params) => inst.check(date$1(params));
  inst.time = (params) => inst.check(time(params));
  inst.duration = (params) => inst.check(duration(params));
});
function string(params) {
  return /* @__PURE__ */ _string(ZodString, params);
}
const ZodStringFormat = /* @__PURE__ */ $constructor("ZodStringFormat", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  _ZodString.init(inst, def);
});
const ZodEmail = /* @__PURE__ */ $constructor("ZodEmail", (inst, def) => {
  $ZodEmail.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodGUID = /* @__PURE__ */ $constructor("ZodGUID", (inst, def) => {
  $ZodGUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodUUID = /* @__PURE__ */ $constructor("ZodUUID", (inst, def) => {
  $ZodUUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodURL = /* @__PURE__ */ $constructor("ZodURL", (inst, def) => {
  $ZodURL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodEmoji = /* @__PURE__ */ $constructor("ZodEmoji", (inst, def) => {
  $ZodEmoji.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodNanoID = /* @__PURE__ */ $constructor("ZodNanoID", (inst, def) => {
  $ZodNanoID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodCUID = /* @__PURE__ */ $constructor("ZodCUID", (inst, def) => {
  $ZodCUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodCUID2 = /* @__PURE__ */ $constructor("ZodCUID2", (inst, def) => {
  $ZodCUID2.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodULID = /* @__PURE__ */ $constructor("ZodULID", (inst, def) => {
  $ZodULID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodXID = /* @__PURE__ */ $constructor("ZodXID", (inst, def) => {
  $ZodXID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodKSUID = /* @__PURE__ */ $constructor("ZodKSUID", (inst, def) => {
  $ZodKSUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodIPv4 = /* @__PURE__ */ $constructor("ZodIPv4", (inst, def) => {
  $ZodIPv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodIPv6 = /* @__PURE__ */ $constructor("ZodIPv6", (inst, def) => {
  $ZodIPv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodCIDRv4 = /* @__PURE__ */ $constructor("ZodCIDRv4", (inst, def) => {
  $ZodCIDRv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodCIDRv6 = /* @__PURE__ */ $constructor("ZodCIDRv6", (inst, def) => {
  $ZodCIDRv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodBase64 = /* @__PURE__ */ $constructor("ZodBase64", (inst, def) => {
  $ZodBase64.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodBase64URL = /* @__PURE__ */ $constructor("ZodBase64URL", (inst, def) => {
  $ZodBase64URL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodE164 = /* @__PURE__ */ $constructor("ZodE164", (inst, def) => {
  $ZodE164.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodJWT = /* @__PURE__ */ $constructor("ZodJWT", (inst, def) => {
  $ZodJWT.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodNumber = /* @__PURE__ */ $constructor("ZodNumber", (inst, def) => {
  $ZodNumber.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => numberProcessor(inst, ctx, json);
  _installLazyMethods(inst, "ZodNumber", {
    gt(value, params) {
      return this.check(/* @__PURE__ */ _gt(value, params));
    },
    gte(value, params) {
      return this.check(/* @__PURE__ */ _gte(value, params));
    },
    min(value, params) {
      return this.check(/* @__PURE__ */ _gte(value, params));
    },
    lt(value, params) {
      return this.check(/* @__PURE__ */ _lt(value, params));
    },
    lte(value, params) {
      return this.check(/* @__PURE__ */ _lte(value, params));
    },
    max(value, params) {
      return this.check(/* @__PURE__ */ _lte(value, params));
    },
    int(params) {
      return this.check(int(params));
    },
    safe(params) {
      return this.check(int(params));
    },
    positive(params) {
      return this.check(/* @__PURE__ */ _gt(0, params));
    },
    nonnegative(params) {
      return this.check(/* @__PURE__ */ _gte(0, params));
    },
    negative(params) {
      return this.check(/* @__PURE__ */ _lt(0, params));
    },
    nonpositive(params) {
      return this.check(/* @__PURE__ */ _lte(0, params));
    },
    multipleOf(value, params) {
      return this.check(/* @__PURE__ */ _multipleOf(value, params));
    },
    step(value, params) {
      return this.check(/* @__PURE__ */ _multipleOf(value, params));
    },
    finite() {
      return this;
    }
  });
  const bag = inst._zod.bag;
  inst.minValue = Math.max(bag.minimum ?? Number.NEGATIVE_INFINITY, bag.exclusiveMinimum ?? Number.NEGATIVE_INFINITY) ?? null;
  inst.maxValue = Math.min(bag.maximum ?? Number.POSITIVE_INFINITY, bag.exclusiveMaximum ?? Number.POSITIVE_INFINITY) ?? null;
  inst.isInt = (bag.format ?? "").includes("int") || Number.isSafeInteger(bag.multipleOf ?? 0.5);
  inst.isFinite = true;
  inst.format = bag.format ?? null;
});
function number(params) {
  return /* @__PURE__ */ _number(ZodNumber, params);
}
const ZodNumberFormat = /* @__PURE__ */ $constructor("ZodNumberFormat", (inst, def) => {
  $ZodNumberFormat.init(inst, def);
  ZodNumber.init(inst, def);
});
function int(params) {
  return /* @__PURE__ */ _int(ZodNumberFormat, params);
}
const ZodBoolean = /* @__PURE__ */ $constructor("ZodBoolean", (inst, def) => {
  $ZodBoolean.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => booleanProcessor(inst, ctx, json);
});
function boolean(params) {
  return /* @__PURE__ */ _boolean(ZodBoolean, params);
}
const ZodUndefined = /* @__PURE__ */ $constructor("ZodUndefined", (inst, def) => {
  $ZodUndefined.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => undefinedProcessor(inst, ctx);
});
function _undefined(params) {
  return /* @__PURE__ */ _undefined$1(ZodUndefined, params);
}
const ZodNull = /* @__PURE__ */ $constructor("ZodNull", (inst, def) => {
  $ZodNull.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => nullProcessor(inst, ctx, json);
});
function _null(params) {
  return /* @__PURE__ */ _null$1(ZodNull, params);
}
const ZodUnknown = /* @__PURE__ */ $constructor("ZodUnknown", (inst, def) => {
  $ZodUnknown.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => unknownProcessor();
});
function unknown() {
  return /* @__PURE__ */ _unknown(ZodUnknown);
}
const ZodNever = /* @__PURE__ */ $constructor("ZodNever", (inst, def) => {
  $ZodNever.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => neverProcessor(inst, ctx, json);
});
function never(params) {
  return /* @__PURE__ */ _never(ZodNever, params);
}
const ZodDate = /* @__PURE__ */ $constructor("ZodDate", (inst, def) => {
  $ZodDate.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => dateProcessor(inst, ctx);
  inst.min = (value, params) => inst.check(/* @__PURE__ */ _gte(value, params));
  inst.max = (value, params) => inst.check(/* @__PURE__ */ _lte(value, params));
  const c = inst._zod.bag;
  inst.minDate = c.minimum ? new Date(c.minimum) : null;
  inst.maxDate = c.maximum ? new Date(c.maximum) : null;
});
const ZodArray = /* @__PURE__ */ $constructor("ZodArray", (inst, def) => {
  $ZodArray.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => arrayProcessor(inst, ctx, json, params);
  inst.element = def.element;
  _installLazyMethods(inst, "ZodArray", {
    min(n, params) {
      return this.check(/* @__PURE__ */ _minLength(n, params));
    },
    nonempty(params) {
      return this.check(/* @__PURE__ */ _minLength(1, params));
    },
    max(n, params) {
      return this.check(/* @__PURE__ */ _maxLength(n, params));
    },
    length(n, params) {
      return this.check(/* @__PURE__ */ _length(n, params));
    },
    unwrap() {
      return this.element;
    }
  });
});
function array(element, params) {
  return /* @__PURE__ */ _array(ZodArray, element, params);
}
const ZodObject = /* @__PURE__ */ $constructor("ZodObject", (inst, def) => {
  $ZodObjectJIT.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => objectProcessor(inst, ctx, json, params);
  defineLazy(inst, "shape", () => {
    return def.shape;
  });
  _installLazyMethods(inst, "ZodObject", {
    keyof() {
      return _enum(Object.keys(this._zod.def.shape));
    },
    catchall(catchall) {
      return this.clone({ ...this._zod.def, catchall });
    },
    passthrough() {
      return this.clone({ ...this._zod.def, catchall: unknown() });
    },
    loose() {
      return this.clone({ ...this._zod.def, catchall: unknown() });
    },
    strict() {
      return this.clone({ ...this._zod.def, catchall: never() });
    },
    strip() {
      return this.clone({ ...this._zod.def, catchall: void 0 });
    },
    extend(incoming) {
      return extend(this, incoming);
    },
    safeExtend(incoming) {
      return safeExtend(this, incoming);
    },
    merge(other) {
      return merge(this, other);
    },
    pick(mask) {
      return pick(this, mask);
    },
    omit(mask) {
      return omit(this, mask);
    },
    partial(...args) {
      return partial(ZodOptional, this, args[0]);
    },
    required(...args) {
      return required(ZodNonOptional, this, args[0]);
    }
  });
});
function object(shape, params) {
  const def = {
    type: "object",
    shape: shape ?? {},
    ...normalizeParams(params)
  };
  return new ZodObject(def);
}
const ZodUnion = /* @__PURE__ */ $constructor("ZodUnion", (inst, def) => {
  $ZodUnion.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => unionProcessor(inst, ctx, json, params);
  inst.options = def.options;
});
function union(options, params) {
  return new ZodUnion({
    type: "union",
    options,
    ...normalizeParams(params)
  });
}
const ZodIntersection = /* @__PURE__ */ $constructor("ZodIntersection", (inst, def) => {
  $ZodIntersection.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => intersectionProcessor(inst, ctx, json, params);
});
function intersection(left, right) {
  return new ZodIntersection({
    type: "intersection",
    left,
    right
  });
}
const ZodEnum = /* @__PURE__ */ $constructor("ZodEnum", (inst, def) => {
  $ZodEnum.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => enumProcessor(inst, ctx, json);
  inst.enum = def.entries;
  inst.options = Object.values(def.entries);
  const keys = new Set(Object.keys(def.entries));
  inst.extract = (values, params) => {
    const newEntries = {};
    for (const value of values) {
      if (keys.has(value)) {
        newEntries[value] = def.entries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...normalizeParams(params),
      entries: newEntries
    });
  };
  inst.exclude = (values, params) => {
    const newEntries = { ...def.entries };
    for (const value of values) {
      if (keys.has(value)) {
        delete newEntries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...normalizeParams(params),
      entries: newEntries
    });
  };
});
function _enum(values, params) {
  const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
  return new ZodEnum({
    type: "enum",
    entries,
    ...normalizeParams(params)
  });
}
const ZodLiteral = /* @__PURE__ */ $constructor("ZodLiteral", (inst, def) => {
  $ZodLiteral.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => literalProcessor(inst, ctx, json);
  inst.values = new Set(def.values);
  Object.defineProperty(inst, "value", {
    get() {
      if (def.values.length > 1) {
        throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
      }
      return def.values[0];
    }
  });
});
function literal(value, params) {
  return new ZodLiteral({
    type: "literal",
    values: Array.isArray(value) ? value : [value],
    ...normalizeParams(params)
  });
}
const ZodTransform = /* @__PURE__ */ $constructor("ZodTransform", (inst, def) => {
  $ZodTransform.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => transformProcessor(inst, ctx);
  inst._zod.parse = (payload, _ctx) => {
    if (_ctx.direction === "backward") {
      throw new $ZodEncodeError(inst.constructor.name);
    }
    payload.addIssue = (issue$1) => {
      if (typeof issue$1 === "string") {
        payload.issues.push(issue(issue$1, payload.value, def));
      } else {
        const _issue = issue$1;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        _issue.input ?? (_issue.input = payload.value);
        _issue.inst ?? (_issue.inst = inst);
        payload.issues.push(issue(_issue));
      }
    };
    const output = def.transform(payload.value, payload);
    if (output instanceof Promise) {
      return output.then((output2) => {
        payload.value = output2;
        payload.fallback = true;
        return payload;
      });
    }
    payload.value = output;
    payload.fallback = true;
    return payload;
  };
});
function transform(fn) {
  return new ZodTransform({
    type: "transform",
    transform: fn
  });
}
const ZodOptional = /* @__PURE__ */ $constructor("ZodOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
  return new ZodOptional({
    type: "optional",
    innerType
  });
}
const ZodExactOptional = /* @__PURE__ */ $constructor("ZodExactOptional", (inst, def) => {
  $ZodExactOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function exactOptional(innerType) {
  return new ZodExactOptional({
    type: "optional",
    innerType
  });
}
const ZodNullable = /* @__PURE__ */ $constructor("ZodNullable", (inst, def) => {
  $ZodNullable.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => nullableProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
  return new ZodNullable({
    type: "nullable",
    innerType
  });
}
const ZodDefault = /* @__PURE__ */ $constructor("ZodDefault", (inst, def) => {
  $ZodDefault.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => defaultProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeDefault = inst.unwrap;
});
function _default(innerType, defaultValue) {
  return new ZodDefault({
    type: "default",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
    }
  });
}
const ZodPrefault = /* @__PURE__ */ $constructor("ZodPrefault", (inst, def) => {
  $ZodPrefault.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => prefaultProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
  return new ZodPrefault({
    type: "prefault",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
    }
  });
}
const ZodNonOptional = /* @__PURE__ */ $constructor("ZodNonOptional", (inst, def) => {
  $ZodNonOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => nonoptionalProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
  return new ZodNonOptional({
    type: "nonoptional",
    innerType,
    ...normalizeParams(params)
  });
}
const ZodCatch = /* @__PURE__ */ $constructor("ZodCatch", (inst, def) => {
  $ZodCatch.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => catchProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeCatch = inst.unwrap;
});
function _catch(innerType, catchValue) {
  return new ZodCatch({
    type: "catch",
    innerType,
    catchValue: typeof catchValue === "function" ? catchValue : () => catchValue
  });
}
const ZodPipe = /* @__PURE__ */ $constructor("ZodPipe", (inst, def) => {
  $ZodPipe.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => pipeProcessor(inst, ctx, json, params);
  inst.in = def.in;
  inst.out = def.out;
});
function pipe(in_, out) {
  return new ZodPipe({
    type: "pipe",
    in: in_,
    out
    // ...util.normalizeParams(params),
  });
}
const ZodReadonly = /* @__PURE__ */ $constructor("ZodReadonly", (inst, def) => {
  $ZodReadonly.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => readonlyProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function readonly(innerType) {
  return new ZodReadonly({
    type: "readonly",
    innerType
  });
}
const ZodCustom = /* @__PURE__ */ $constructor("ZodCustom", (inst, def) => {
  $ZodCustom.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => customProcessor(inst, ctx);
});
function refine(fn, _params = {}) {
  return /* @__PURE__ */ _refine(ZodCustom, fn, _params);
}
function superRefine(fn, params) {
  return /* @__PURE__ */ _superRefine(fn, params);
}
function date(params) {
  return /* @__PURE__ */ _coercedDate(ZodDate, params);
}
const createCustomerSchema = object({
  name: string().trim().min(1, "Name is required").max(120, "Name is too long"),
  contactNumber: string().trim().max(30).optional().transform((v) => v === "" || v === void 0 ? void 0 : v),
  address: string().trim().max(500).optional().or(literal("")).transform((v) => v === "" ? void 0 : v)
});
const updateCustomerSchema = createCustomerSchema.partial().extend({
  id: number().int().positive()
});
const customerListQuerySchema = object({
  search: string().trim().optional(),
  includeDeleted: boolean().optional().default(false),
  limit: number().int().positive().max(500).optional().default(100),
  offset: number().int().nonnegative().optional().default(0)
});
function registerCustomerIpc() {
  require$$3$1.ipcMain.handle("customer:list", async (_e, rawQuery) => {
    const query = customerListQuerySchema.parse(rawQuery ?? {});
    return customerService.list(query);
  });
  require$$3$1.ipcMain.handle("customer:count", async (_e, rawQuery) => {
    const query = customerListQuerySchema.pick({ search: true, includeDeleted: true }).parse(rawQuery ?? {});
    return customerService.count(query);
  });
  require$$3$1.ipcMain.handle("customer:get", async (_e, id) => {
    return customerService.getById(id);
  });
  require$$3$1.ipcMain.handle("customer:create", async (_e, rawInput) => {
    const input = createCustomerSchema.parse(rawInput);
    return customerService.create(input);
  });
  require$$3$1.ipcMain.handle("customer:update", async (_e, rawInput) => {
    const input = updateCustomerSchema.parse(rawInput);
    return customerService.update(input);
  });
  require$$3$1.ipcMain.handle("customer:delete", async (_e, id) => {
    await customerService.softDelete(id);
    return { ok: true };
  });
  require$$3$1.ipcMain.handle("customer:restore", async (_e, id) => {
    await customerService.restore(id);
    return { ok: true };
  });
}
function toDto$6(row) {
  return {
    id: row.id,
    name: row.name,
    contactNumber: row.contactNumber ?? null,
    createdAt: Math.floor(row.createdAt.getTime() / 1e3),
    updatedAt: Math.floor(row.updatedAt.getTime() / 1e3),
    deletedAt: row.deletedAt ? Math.floor(row.deletedAt.getTime() / 1e3) : null
  };
}
const companyService = {
  async list(query) {
    const db = getDb();
    const conditions = [];
    if (!query.includeDeleted) {
      conditions.push(isNull(companies.deletedAt));
    }
    if (query.search && query.search.length > 0) {
      const term = `%${query.search}%`;
      conditions.push(
        or(like(companies.name, term), like(companies.contactNumber, term))
      );
    }
    const rows = await db.select().from(companies).where(conditions.length > 0 ? and(...conditions) : void 0).orderBy(asc(companies.name)).limit(query.limit).offset(query.offset);
    return rows.map(toDto$6);
  },
  async getById(id) {
    const db = getDb();
    const rows = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
    return rows[0] ? toDto$6(rows[0]) : null;
  },
  async create(input) {
    const db = getDb();
    const [row] = await db.insert(companies).values({
      name: input.name,
      contactNumber: input.contactNumber ?? null
    }).returning();
    return toDto$6(row);
  },
  async update(input) {
    const db = getDb();
    const { id, ...patch } = input;
    const updateValues = { updatedAt: /* @__PURE__ */ new Date() };
    if (patch.name !== void 0) updateValues.name = patch.name;
    if (patch.contactNumber !== void 0)
      updateValues.contactNumber = patch.contactNumber ?? null;
    const [row] = await db.update(companies).set(updateValues).where(eq(companies.id, id)).returning();
    if (!row) throw new Error(`Company ${id} not found`);
    return toDto$6(row);
  },
  async softDelete(id) {
    const db = getDb();
    await db.update(companies).set({ deletedAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where(eq(companies.id, id));
  },
  async restore(id) {
    const db = getDb();
    await db.update(companies).set({ deletedAt: null, updatedAt: /* @__PURE__ */ new Date() }).where(eq(companies.id, id));
  },
  async count(query) {
    const db = getDb();
    const conditions = [];
    if (!query.includeDeleted) conditions.push(isNull(companies.deletedAt));
    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(
        or(like(companies.name, term), like(companies.contactNumber, term))
      );
    }
    const [row] = await db.select({ count: sql`count(*)` }).from(companies).where(conditions.length > 0 ? and(...conditions) : void 0);
    return row?.count ?? 0;
  }
};
const createCompanySchema = object({
  name: string().trim().min(1, "Name is required").max(120, "Name is too long"),
  contactNumber: string().trim().max(30).optional().transform((v) => v === "" || v === void 0 ? void 0 : v)
});
const updateCompanySchema = createCompanySchema.partial().extend({
  id: number().int().positive()
});
const companyListQuerySchema = object({
  search: string().trim().optional(),
  includeDeleted: boolean().optional().default(false),
  limit: number().int().positive().max(500).optional().default(100),
  offset: number().int().nonnegative().optional().default(0)
});
function registerCompanyIpc() {
  require$$3$1.ipcMain.handle("company:list", async (_e, rawQuery) => {
    const query = companyListQuerySchema.parse(rawQuery ?? {});
    return companyService.list(query);
  });
  require$$3$1.ipcMain.handle("company:count", async (_e, rawQuery) => {
    const query = companyListQuerySchema.pick({ search: true, includeDeleted: true }).parse(rawQuery ?? {});
    return companyService.count(query);
  });
  require$$3$1.ipcMain.handle("company:get", async (_e, id) => {
    return companyService.getById(id);
  });
  require$$3$1.ipcMain.handle("company:create", async (_e, rawInput) => {
    const input = createCompanySchema.parse(rawInput);
    return companyService.create(input);
  });
  require$$3$1.ipcMain.handle("company:update", async (_e, rawInput) => {
    const input = updateCompanySchema.parse(rawInput);
    return companyService.update(input);
  });
  require$$3$1.ipcMain.handle("company:delete", async (_e, id) => {
    await companyService.softDelete(id);
    return { ok: true };
  });
  require$$3$1.ipcMain.handle("company:restore", async (_e, id) => {
    await companyService.restore(id);
    return { ok: true };
  });
}
function toDto$5(row) {
  return {
    id: row.id,
    name: row.name,
    createdAt: Math.floor(row.createdAt.getTime() / 1e3),
    updatedAt: Math.floor(row.updatedAt.getTime() / 1e3),
    deletedAt: row.deletedAt ? Math.floor(row.deletedAt.getTime() / 1e3) : null
  };
}
async function assertNameAvailable(name, excludeId) {
  const db = getDb();
  const conditions = [isNull(categories.deletedAt), eq(categories.name, name)];
  if (excludeId !== void 0) {
    conditions.push(ne(categories.id, excludeId));
  }
  const [existing] = await db.select({ id: categories.id }).from(categories).where(and(...conditions)).limit(1);
  if (existing) {
    throw new Error(`Category "${name}" already exists`);
  }
}
const categoryService = {
  async list(query) {
    const db = getDb();
    const conditions = [];
    if (!query.includeDeleted) conditions.push(isNull(categories.deletedAt));
    if (query.search) {
      conditions.push(like(categories.name, `%${query.search}%`));
    }
    const rows = await db.select().from(categories).where(conditions.length > 0 ? and(...conditions) : void 0).orderBy(asc(categories.name)).limit(query.limit).offset(query.offset);
    return rows.map(toDto$5);
  },
  async getById(id) {
    const db = getDb();
    const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return rows[0] ? toDto$5(rows[0]) : null;
  },
  async create(input) {
    await assertNameAvailable(input.name);
    const db = getDb();
    const [row] = await db.insert(categories).values({ name: input.name }).returning();
    return toDto$5(row);
  },
  async update(input) {
    if (input.name !== void 0) {
      await assertNameAvailable(input.name, input.id);
    }
    const db = getDb();
    const updateValues = { updatedAt: /* @__PURE__ */ new Date() };
    if (input.name !== void 0) updateValues.name = input.name;
    const [row] = await db.update(categories).set(updateValues).where(eq(categories.id, input.id)).returning();
    if (!row) throw new Error(`Category ${input.id} not found`);
    return toDto$5(row);
  },
  async softDelete(id) {
    const db = getDb();
    await db.update(categories).set({ deletedAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where(eq(categories.id, id));
  },
  async restore(id) {
    const db = getDb();
    await db.update(categories).set({ deletedAt: null, updatedAt: /* @__PURE__ */ new Date() }).where(eq(categories.id, id));
  },
  async count(query) {
    const db = getDb();
    const conditions = [];
    if (!query.includeDeleted) conditions.push(isNull(categories.deletedAt));
    if (query.search) conditions.push(like(categories.name, `%${query.search}%`));
    const [row] = await db.select({ count: sql`count(*)` }).from(categories).where(conditions.length > 0 ? and(...conditions) : void 0);
    return row?.count ?? 0;
  }
};
const createCategorySchema = object({
  name: string().trim().min(1, "Name is required").max(80, "Name is too long")
});
const updateCategorySchema = createCategorySchema.partial().extend({
  id: number().int().positive()
});
const categoryListQuerySchema = object({
  search: string().trim().optional(),
  includeDeleted: boolean().optional().default(false),
  limit: number().int().positive().max(500).optional().default(100),
  offset: number().int().nonnegative().optional().default(0)
});
function registerCategoryIpc() {
  require$$3$1.ipcMain.handle("category:list", async (_e, rawQuery) => {
    const query = categoryListQuerySchema.parse(rawQuery ?? {});
    return categoryService.list(query);
  });
  require$$3$1.ipcMain.handle("category:count", async (_e, rawQuery) => {
    const query = categoryListQuerySchema.pick({ search: true, includeDeleted: true }).parse(rawQuery ?? {});
    return categoryService.count(query);
  });
  require$$3$1.ipcMain.handle("category:get", async (_e, id) => {
    return categoryService.getById(id);
  });
  require$$3$1.ipcMain.handle("category:create", async (_e, rawInput) => {
    const input = createCategorySchema.parse(rawInput);
    return categoryService.create(input);
  });
  require$$3$1.ipcMain.handle("category:update", async (_e, rawInput) => {
    const input = updateCategorySchema.parse(rawInput);
    return categoryService.update(input);
  });
  require$$3$1.ipcMain.handle("category:delete", async (_e, id) => {
    await categoryService.softDelete(id);
    return { ok: true };
  });
  require$$3$1.ipcMain.handle("category:restore", async (_e, id) => {
    await categoryService.restore(id);
    return { ok: true };
  });
}
function toUnitDto(row) {
  return {
    id: row.id,
    name: row.name,
    shortName: row.shortName,
    createdAt: Math.floor(row.createdAt.getTime() / 1e3),
    updatedAt: Math.floor(row.updatedAt.getTime() / 1e3),
    deletedAt: row.deletedAt ? Math.floor(row.deletedAt.getTime() / 1e3) : null
  };
}
async function assertUnitNameAvailable(name, shortName, excludeId) {
  const db = getDb();
  const conditions = [isNull(units.deletedAt)];
  if (excludeId !== void 0) conditions.push(ne(units.id, excludeId));
  const [byName] = await db.select({ id: units.id }).from(units).where(and(...conditions, eq(units.name, name))).limit(1);
  if (byName) throw new Error(`Unit "${name}" already exists`);
  const [byShort] = await db.select({ id: units.id }).from(units).where(and(...conditions, eq(units.shortName, shortName))).limit(1);
  if (byShort) throw new Error(`Short name "${shortName}" already exists`);
}
const unitService = {
  async list(query) {
    const db = getDb();
    const conditions = [];
    if (!query.includeDeleted) conditions.push(isNull(units.deletedAt));
    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(or(like(units.name, term), like(units.shortName, term)));
    }
    const rows = await db.select().from(units).where(conditions.length > 0 ? and(...conditions) : void 0).orderBy(asc(units.name)).limit(query.limit).offset(query.offset);
    return rows.map(toUnitDto);
  },
  async getById(id) {
    const db = getDb();
    const rows = await db.select().from(units).where(eq(units.id, id)).limit(1);
    return rows[0] ? toUnitDto(rows[0]) : null;
  },
  async create(input) {
    await assertUnitNameAvailable(input.name, input.shortName);
    const db = getDb();
    const [row] = await db.insert(units).values({ name: input.name, shortName: input.shortName }).returning();
    return toUnitDto(row);
  },
  async update(input) {
    const db = getDb();
    const current = await this.getById(input.id);
    if (!current) throw new Error(`Unit ${input.id} not found`);
    const nextName = input.name ?? current.name;
    const nextShort = input.shortName ?? current.shortName;
    await assertUnitNameAvailable(nextName, nextShort, input.id);
    const updateValues = { updatedAt: /* @__PURE__ */ new Date() };
    if (input.name !== void 0) updateValues.name = input.name;
    if (input.shortName !== void 0) updateValues.shortName = input.shortName;
    const [row] = await db.update(units).set(updateValues).where(eq(units.id, input.id)).returning();
    return toUnitDto(row);
  },
  async softDelete(id) {
    const db = getDb();
    await db.update(units).set({ deletedAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where(eq(units.id, id));
  },
  async restore(id) {
    const db = getDb();
    await db.update(units).set({ deletedAt: null, updatedAt: /* @__PURE__ */ new Date() }).where(eq(units.id, id));
  },
  async count(query) {
    const db = getDb();
    const conditions = [];
    if (!query.includeDeleted) conditions.push(isNull(units.deletedAt));
    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(or(like(units.name, term), like(units.shortName, term)));
    }
    const [row] = await db.select({ count: sql`count(*)` }).from(units).where(conditions.length > 0 ? and(...conditions) : void 0);
    return row?.count ?? 0;
  }
};
const conversionSelect = {
  id: unitConversions.id,
  fromUnitId: unitConversions.fromUnitId,
  toUnitId: unitConversions.toUnitId,
  factor: unitConversions.factor,
  createdAt: unitConversions.createdAt,
  updatedAt: unitConversions.updatedAt,
  fromUnitName: sql`from_unit.name`,
  fromUnitShortName: sql`from_unit.short_name`,
  toUnitName: sql`to_unit.name`,
  toUnitShortName: sql`to_unit.short_name`
};
function toConversionDto(row) {
  return {
    id: row.id,
    fromUnitId: row.fromUnitId,
    toUnitId: row.toUnitId,
    factor: row.factor,
    fromUnitName: row.fromUnitName,
    fromUnitShortName: row.fromUnitShortName,
    toUnitName: row.toUnitName,
    toUnitShortName: row.toUnitShortName,
    createdAt: Math.floor(row.createdAt.getTime() / 1e3),
    updatedAt: Math.floor(row.updatedAt.getTime() / 1e3)
  };
}
const unitConversionService = {
  /**
   * List all conversions, optionally filtered by a specific unit
   * (returns both directions involving that unit).
   */
  async list(filter) {
    const db = getDb();
    const rows = await db.select(conversionSelect).from(unitConversions).innerJoin(
      sql`units AS from_unit`,
      sql`from_unit.id = ${unitConversions.fromUnitId}`
    ).innerJoin(
      sql`units AS to_unit`,
      sql`to_unit.id = ${unitConversions.toUnitId}`
    ).where(
      filter?.unitId !== void 0 ? or(
        eq(unitConversions.fromUnitId, filter.unitId),
        eq(unitConversions.toUnitId, filter.unitId)
      ) : void 0
    ).orderBy(asc(unitConversions.fromUnitId), asc(unitConversions.toUnitId));
    return rows.map(toConversionDto);
  },
  async create(input) {
    const db = getDb();
    const existing = await db.select({ id: unitConversions.id }).from(unitConversions).where(
      or(
        and(
          eq(unitConversions.fromUnitId, input.fromUnitId),
          eq(unitConversions.toUnitId, input.toUnitId)
        ),
        and(
          eq(unitConversions.fromUnitId, input.toUnitId),
          eq(unitConversions.toUnitId, input.fromUnitId)
        )
      )
    ).limit(1);
    if (existing.length > 0) {
      throw new Error("A conversion between these units already exists");
    }
    const milliFactor = Math.round(input.factor * 1e3);
    const [inserted] = await db.insert(unitConversions).values({
      fromUnitId: input.fromUnitId,
      toUnitId: input.toUnitId,
      factor: milliFactor
    }).returning({ id: unitConversions.id });
    const [row] = await db.select(conversionSelect).from(unitConversions).innerJoin(
      sql`units AS from_unit`,
      sql`from_unit.id = ${unitConversions.fromUnitId}`
    ).innerJoin(
      sql`units AS to_unit`,
      sql`to_unit.id = ${unitConversions.toUnitId}`
    ).where(eq(unitConversions.id, inserted.id)).limit(1);
    return toConversionDto(row);
  },
  async update(input) {
    const db = getDb();
    const milliFactor = Math.round(input.factor * 1e3);
    await db.update(unitConversions).set({ factor: milliFactor, updatedAt: /* @__PURE__ */ new Date() }).where(eq(unitConversions.id, input.id));
    const [row] = await db.select(conversionSelect).from(unitConversions).innerJoin(
      sql`units AS from_unit`,
      sql`from_unit.id = ${unitConversions.fromUnitId}`
    ).innerJoin(
      sql`units AS to_unit`,
      sql`to_unit.id = ${unitConversions.toUnitId}`
    ).where(eq(unitConversions.id, input.id)).limit(1);
    if (!row) throw new Error(`Conversion ${input.id} not found`);
    return toConversionDto(row);
  },
  async delete(id) {
    const db = getDb();
    await db.delete(unitConversions).where(eq(unitConversions.id, id));
  }
};
const createUnitSchema = object({
  name: string().trim().min(1, "Name is required").max(40),
  shortName: string().trim().min(1, "Short name is required").max(10)
});
const updateUnitSchema = createUnitSchema.partial().extend({
  id: number().int().positive()
});
const unitListQuerySchema = object({
  search: string().trim().optional(),
  includeDeleted: boolean().optional().default(false),
  limit: number().int().positive().max(500).optional().default(100),
  offset: number().int().nonnegative().optional().default(0)
});
const createUnitConversionSchema = object({
  fromUnitId: number().int().positive(),
  toUnitId: number().int().positive(),
  factor: number().positive("Factor must be positive").max(1e9, "Factor too large")
}).refine((v) => v.fromUnitId !== v.toUnitId, {
  message: "From and To units must be different",
  path: ["toUnitId"]
});
const updateUnitConversionSchema = object({
  id: number().int().positive(),
  factor: number().positive("Factor must be positive").max(1e9, "Factor too large")
});
function registerUnitIpc() {
  require$$3$1.ipcMain.handle("unit:list", async (_e, rawQuery) => {
    const query = unitListQuerySchema.parse(rawQuery ?? {});
    return unitService.list(query);
  });
  require$$3$1.ipcMain.handle("unit:count", async (_e, rawQuery) => {
    const query = unitListQuerySchema.pick({ search: true, includeDeleted: true }).parse(rawQuery ?? {});
    return unitService.count(query);
  });
  require$$3$1.ipcMain.handle("unit:get", async (_e, id) => {
    return unitService.getById(id);
  });
  require$$3$1.ipcMain.handle("unit:create", async (_e, rawInput) => {
    const input = createUnitSchema.parse(rawInput);
    return unitService.create(input);
  });
  require$$3$1.ipcMain.handle("unit:update", async (_e, rawInput) => {
    const input = updateUnitSchema.parse(rawInput);
    return unitService.update(input);
  });
  require$$3$1.ipcMain.handle("unit:delete", async (_e, id) => {
    await unitService.softDelete(id);
    return { ok: true };
  });
  require$$3$1.ipcMain.handle("unit:restore", async (_e, id) => {
    await unitService.restore(id);
    return { ok: true };
  });
  require$$3$1.ipcMain.handle(
    "unitConversion:list",
    async (_e, filter) => {
      return unitConversionService.list(filter);
    }
  );
  require$$3$1.ipcMain.handle("unitConversion:create", async (_e, rawInput) => {
    const input = createUnitConversionSchema.parse(rawInput);
    return unitConversionService.create(input);
  });
  require$$3$1.ipcMain.handle("unitConversion:update", async (_e, rawInput) => {
    const input = updateUnitConversionSchema.parse(rawInput);
    return unitConversionService.update(input);
  });
  require$$3$1.ipcMain.handle("unitConversion:delete", async (_e, id) => {
    await unitConversionService.delete(id);
    return { ok: true };
  });
}
function toDto$4(row) {
  return {
    id: row.id,
    name: row.name,
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    companyId: row.companyId,
    companyName: row.companyName,
    createdAt: Math.floor(row.createdAt.getTime() / 1e3),
    updatedAt: Math.floor(row.updatedAt.getTime() / 1e3),
    deletedAt: row.deletedAt ? Math.floor(row.deletedAt.getTime() / 1e3) : null
  };
}
const productSelect = {
  id: products.id,
  name: products.name,
  categoryId: products.categoryId,
  companyId: products.companyId,
  createdAt: products.createdAt,
  updatedAt: products.updatedAt,
  deletedAt: products.deletedAt,
  categoryName: sql`cat.name`,
  companyName: sql`comp.name`
};
function baseJoin$1(query) {
  return query.from(products).leftJoin(sql`categories AS cat`, sql`cat.id = ${products.categoryId}`).leftJoin(sql`companies AS comp`, sql`comp.id = ${products.companyId}`);
}
const productService = {
  async list(query) {
    const db = getDb();
    const conditions = [];
    if (!query.includeDeleted) conditions.push(isNull(products.deletedAt));
    if (query.search) {
      conditions.push(like(products.name, `%${query.search}%`));
    }
    if (query.categoryId) {
      conditions.push(eq(products.categoryId, query.categoryId));
    }
    if (query.companyId) {
      conditions.push(eq(products.companyId, query.companyId));
    }
    const rows = await baseJoin$1(db.select(productSelect)).where(conditions.length > 0 ? and(...conditions) : void 0).orderBy(asc(products.name)).limit(query.limit).offset(query.offset);
    return rows.map(toDto$4);
  },
  async getById(id) {
    const db = getDb();
    const rows = await baseJoin$1(db.select(productSelect)).where(eq(products.id, id)).limit(1);
    return rows[0] ? toDto$4(rows[0]) : null;
  },
  async create(input) {
    const db = getDb();
    const [inserted] = await db.insert(products).values({
      name: input.name,
      categoryId: input.categoryId ?? null,
      companyId: input.companyId ?? null
    }).returning({ id: products.id });
    const created = await this.getById(inserted.id);
    if (!created) throw new Error("Failed to load created product");
    return created;
  },
  async update(input) {
    const db = getDb();
    const updateValues = { updatedAt: /* @__PURE__ */ new Date() };
    if (input.name !== void 0) updateValues.name = input.name;
    if (input.categoryId !== void 0)
      updateValues.categoryId = input.categoryId ?? null;
    if (input.companyId !== void 0)
      updateValues.companyId = input.companyId ?? null;
    await db.update(products).set(updateValues).where(eq(products.id, input.id));
    const updated = await this.getById(input.id);
    if (!updated) throw new Error(`Product ${input.id} not found`);
    return updated;
  },
  async softDelete(id) {
    const db = getDb();
    await db.update(products).set({ deletedAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where(eq(products.id, id));
  },
  async restore(id) {
    const db = getDb();
    await db.update(products).set({ deletedAt: null, updatedAt: /* @__PURE__ */ new Date() }).where(eq(products.id, id));
  },
  async count(query) {
    const db = getDb();
    const conditions = [];
    if (!query.includeDeleted) conditions.push(isNull(products.deletedAt));
    if (query.search) conditions.push(like(products.name, `%${query.search}%`));
    if (query.categoryId) conditions.push(eq(products.categoryId, query.categoryId));
    if (query.companyId) conditions.push(eq(products.companyId, query.companyId));
    const [row] = await db.select({ count: sql`count(*)` }).from(products).where(conditions.length > 0 ? and(...conditions) : void 0);
    return row?.count ?? 0;
  }
};
const createProductSchema = object({
  name: string().trim().min(1, "Name is required").max(150, "Name is too long"),
  categoryId: number().int().positive().nullable().optional(),
  companyId: number().int().positive().nullable().optional()
});
const updateProductSchema = createProductSchema.partial().extend({
  id: number().int().positive()
});
const productListQuerySchema = object({
  search: string().trim().optional(),
  categoryId: number().int().positive().optional(),
  companyId: number().int().positive().optional(),
  includeDeleted: boolean().optional().default(false),
  limit: number().int().positive().max(500).optional().default(100),
  offset: number().int().nonnegative().optional().default(0)
});
function registerProductIpc() {
  require$$3$1.ipcMain.handle("product:list", async (_e, rawQuery) => {
    const query = productListQuerySchema.parse(rawQuery ?? {});
    return productService.list(query);
  });
  require$$3$1.ipcMain.handle("product:count", async (_e, rawQuery) => {
    const query = productListQuerySchema.pick({
      search: true,
      includeDeleted: true,
      categoryId: true,
      companyId: true
    }).parse(rawQuery ?? {});
    return productService.count(query);
  });
  require$$3$1.ipcMain.handle("product:get", async (_e, id) => {
    return productService.getById(id);
  });
  require$$3$1.ipcMain.handle("product:create", async (_e, rawInput) => {
    const input = createProductSchema.parse(rawInput);
    return productService.create(input);
  });
  require$$3$1.ipcMain.handle("product:update", async (_e, rawInput) => {
    const input = updateProductSchema.parse(rawInput);
    return productService.update(input);
  });
  require$$3$1.ipcMain.handle("product:delete", async (_e, id) => {
    await productService.softDelete(id);
    return { ok: true };
  });
  require$$3$1.ipcMain.handle("product:restore", async (_e, id) => {
    await productService.restore(id);
    return { ok: true };
  });
}
function toDto$3(row) {
  return {
    id: row.id,
    productId: row.productId,
    productName: row.productName,
    name: row.name,
    baseUnitId: row.baseUnitId,
    baseUnitName: row.baseUnitName,
    baseUnitShortName: row.baseUnitShortName,
    lowStockThreshold: row.lowStockThreshold,
    createdAt: Math.floor(row.createdAt.getTime() / 1e3),
    updatedAt: Math.floor(row.updatedAt.getTime() / 1e3),
    deletedAt: row.deletedAt ? Math.floor(row.deletedAt.getTime() / 1e3) : null
  };
}
const variantSelect = {
  id: variants.id,
  productId: variants.productId,
  name: variants.name,
  baseUnitId: variants.baseUnitId,
  lowStockThreshold: variants.lowStockThreshold,
  createdAt: variants.createdAt,
  updatedAt: variants.updatedAt,
  deletedAt: variants.deletedAt,
  productName: sql`p.name`,
  baseUnitName: sql`u.name`,
  baseUnitShortName: sql`u.short_name`
};
function baseJoin(query) {
  return query.from(variants).innerJoin(sql`products AS p`, sql`p.id = ${variants.productId}`).innerJoin(sql`units AS u`, sql`u.id = ${variants.baseUnitId}`);
}
const variantService = {
  async list(query) {
    const db = getDb();
    const conditions = [];
    if (!query.includeDeleted) conditions.push(isNull(variants.deletedAt));
    if (query.productId) {
      conditions.push(eq(variants.productId, query.productId));
    }
    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(
        or(like(variants.name, term), like(sql`p.name`, term))
      );
    }
    const rows = await baseJoin(db.select(variantSelect)).where(conditions.length > 0 ? and(...conditions) : void 0).orderBy(asc(variants.productId), asc(variants.name)).limit(query.limit).offset(query.offset);
    return rows.map(toDto$3);
  },
  async getById(id) {
    const db = getDb();
    const rows = await baseJoin(db.select(variantSelect)).where(eq(variants.id, id)).limit(1);
    return rows[0] ? toDto$3(rows[0]) : null;
  },
  async create(input) {
    const db = getDb();
    const [inserted] = await db.insert(variants).values({
      productId: input.productId,
      name: input.name,
      baseUnitId: input.baseUnitId,
      lowStockThreshold: input.lowStockThreshold ?? null
    }).returning({ id: variants.id });
    const created = await this.getById(inserted.id);
    if (!created) throw new Error("Failed to load created variant");
    return created;
  },
  async update(input) {
    const db = getDb();
    const updateValues = { updatedAt: /* @__PURE__ */ new Date() };
    if (input.name !== void 0) updateValues.name = input.name;
    if (input.baseUnitId !== void 0)
      updateValues.baseUnitId = input.baseUnitId;
    if (input.lowStockThreshold !== void 0)
      updateValues.lowStockThreshold = input.lowStockThreshold;
    await db.update(variants).set(updateValues).where(eq(variants.id, input.id));
    const updated = await this.getById(input.id);
    if (!updated) throw new Error(`Variant ${input.id} not found`);
    return updated;
  },
  async softDelete(id) {
    const db = getDb();
    await db.update(variants).set({ deletedAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where(eq(variants.id, id));
  },
  async restore(id) {
    const db = getDb();
    await db.update(variants).set({ deletedAt: null, updatedAt: /* @__PURE__ */ new Date() }).where(eq(variants.id, id));
  },
  async count(query) {
    const db = getDb();
    const conditions = [];
    if (!query.includeDeleted) conditions.push(isNull(variants.deletedAt));
    if (query.productId)
      conditions.push(eq(variants.productId, query.productId));
    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(
        or(like(variants.name, term), like(sql`p.name`, term))
      );
    }
    const [row] = await db.select({ count: sql`count(*)` }).from(variants).innerJoin(sql`products AS p`, sql`p.id = ${variants.productId}`).where(conditions.length > 0 ? and(...conditions) : void 0);
    return row?.count ?? 0;
  }
};
const createVariantSchema = object({
  productId: number().int().positive(),
  name: string().trim().min(1, "Name is required").max(80, "Name is too long"),
  baseUnitId: number().int().positive(),
  /** milli-units; null / undefined = no threshold */
  lowStockThreshold: number().int().nonnegative().nullable().optional()
});
const updateVariantSchema = object({
  id: number().int().positive(),
  name: string().trim().min(1).max(80).optional(),
  baseUnitId: number().int().positive().optional(),
  lowStockThreshold: number().int().nonnegative().nullable().optional()
});
const variantListQuerySchema = object({
  search: string().trim().optional(),
  productId: number().int().positive().optional(),
  includeDeleted: boolean().optional().default(false),
  limit: number().int().positive().max(500).optional().default(100),
  offset: number().int().nonnegative().optional().default(0)
});
function registerVariantIpc() {
  require$$3$1.ipcMain.handle("variant:list", async (_e, rawQuery) => {
    const query = variantListQuerySchema.parse(rawQuery ?? {});
    return variantService.list(query);
  });
  require$$3$1.ipcMain.handle("variant:count", async (_e, rawQuery) => {
    const query = variantListQuerySchema.pick({ search: true, includeDeleted: true, productId: true }).parse(rawQuery ?? {});
    return variantService.count(query);
  });
  require$$3$1.ipcMain.handle("variant:get", async (_e, id) => {
    return variantService.getById(id);
  });
  require$$3$1.ipcMain.handle("variant:create", async (_e, rawInput) => {
    const input = createVariantSchema.parse(rawInput);
    return variantService.create(input);
  });
  require$$3$1.ipcMain.handle("variant:update", async (_e, rawInput) => {
    const input = updateVariantSchema.parse(rawInput);
    return variantService.update(input);
  });
  require$$3$1.ipcMain.handle("variant:delete", async (_e, id) => {
    await variantService.softDelete(id);
    return { ok: true };
  });
  require$$3$1.ipcMain.handle("variant:restore", async (_e, id) => {
    await variantService.restore(id);
    return { ok: true };
  });
}
function toPurchaseDto(row) {
  return {
    id: row.id,
    purchaseNumber: row.purchaseNumber,
    companyId: row.companyId,
    companyName: row.companyName,
    purchaseDate: Math.floor(row.purchaseDate.getTime() / 1e3),
    totalAmount: row.totalAmount,
    paidAmount: row.paidAmount,
    remarks: row.remarks,
    createdAt: Math.floor(row.createdAt.getTime() / 1e3),
    updatedAt: Math.floor(row.updatedAt.getTime() / 1e3)
  };
}
async function generatePurchaseNumber() {
  const db = getDb();
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  const prefix = `PUR-${year}-`;
  const [row] = await db.select({ max: sql`max(${purchases.purchaseNumber})` }).from(purchases).where(like(purchases.purchaseNumber, `${prefix}%`));
  const lastNumber = row?.max ? parseInt(row.max.slice(prefix.length), 10) : 0;
  const next = (lastNumber + 1).toString().padStart(4, "0");
  return `${prefix}${next}`;
}
const purchaseService = {
  async create(input) {
    const db = getDb();
    const totalAmount = input.lines.reduce(
      (sum, line) => sum + Math.round(line.quantity * line.purchasePrice / 1e3),
      0
    );
    const purchaseDate = input.purchaseDate ?? /* @__PURE__ */ new Date();
    const purchaseNumber = await generatePurchaseNumber();
    const insertedId = db.transaction((tx) => {
      const [purchase] = tx.insert(purchases).values({
        purchaseNumber,
        companyId: input.companyId,
        purchaseDate,
        totalAmount,
        paidAmount: input.paidAmount ?? 0,
        remarks: input.remarks ?? null
      }).returning({ id: purchases.id }).all();
      for (const line of input.lines) {
        const [batch] = tx.insert(stockBatches).values({
          variantId: line.variantId,
          purchaseId: purchase.id,
          purchasePrice: line.purchasePrice,
          suggestedRetailPrice: line.suggestedRetailPrice ?? null,
          suggestedWholesalePrice: line.suggestedWholesalePrice ?? null,
          quantityPurchased: line.quantity,
          remainingQuantity: line.quantity,
          purchaseDate
        }).returning({ id: stockBatches.id }).all();
        tx.insert(stockLedger).values({
          batchId: batch.id,
          variantId: line.variantId,
          quantityChange: line.quantity,
          unitCost: line.purchasePrice,
          movementType: "purchase",
          referenceType: "purchase",
          referenceId: purchase.id,
          notes: null
        }).run();
      }
      return purchase.id;
    });
    const created = await this.getById(insertedId);
    if (!created) throw new Error("Failed to load created purchase");
    return created;
  },
  async list(query) {
    const db = getDb();
    const conditions = [];
    if (query.companyId) {
      conditions.push(eq(purchases.companyId, query.companyId));
    }
    if (query.fromDate) {
      conditions.push(gte(purchases.purchaseDate, query.fromDate));
    }
    if (query.toDate) {
      conditions.push(lte(purchases.purchaseDate, query.toDate));
    }
    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(
        or(like(purchases.purchaseNumber, term), like(sql`c.name`, term))
      );
    }
    const rows = await db.select({
      id: purchases.id,
      purchaseNumber: purchases.purchaseNumber,
      companyId: purchases.companyId,
      purchaseDate: purchases.purchaseDate,
      totalAmount: purchases.totalAmount,
      paidAmount: purchases.paidAmount,
      remarks: purchases.remarks,
      createdAt: purchases.createdAt,
      updatedAt: purchases.updatedAt,
      companyName: sql`c.name`
    }).from(purchases).innerJoin(sql`companies AS c`, sql`c.id = ${purchases.companyId}`).where(conditions.length > 0 ? and(...conditions) : void 0).orderBy(desc(purchases.purchaseDate), desc(purchases.id)).limit(query.limit).offset(query.offset);
    return rows.map(toPurchaseDto);
  },
  async getById(id) {
    const db = getDb();
    const rows = await db.select({
      id: purchases.id,
      purchaseNumber: purchases.purchaseNumber,
      companyId: purchases.companyId,
      purchaseDate: purchases.purchaseDate,
      totalAmount: purchases.totalAmount,
      paidAmount: purchases.paidAmount,
      remarks: purchases.remarks,
      createdAt: purchases.createdAt,
      updatedAt: purchases.updatedAt,
      companyName: sql`c.name`
    }).from(purchases).innerJoin(sql`companies AS c`, sql`c.id = ${purchases.companyId}`).where(eq(purchases.id, id)).limit(1);
    return rows[0] ? toPurchaseDto(rows[0]) : null;
  },
  async getBatches(purchaseId) {
    const db = getDb();
    const rows = await db.select({
      id: stockBatches.id,
      variantId: stockBatches.variantId,
      purchaseId: stockBatches.purchaseId,
      purchasePrice: stockBatches.purchasePrice,
      suggestedRetailPrice: stockBatches.suggestedRetailPrice,
      suggestedWholesalePrice: stockBatches.suggestedWholesalePrice,
      quantityPurchased: stockBatches.quantityPurchased,
      remainingQuantity: stockBatches.remainingQuantity,
      purchaseDate: stockBatches.purchaseDate,
      variantName: sql`v.name`,
      productName: sql`p.name`,
      baseUnitShortName: sql`u.short_name`,
      purchaseNumber: sql`pur.purchase_number`
    }).from(stockBatches).innerJoin(sql`variants AS v`, sql`v.id = ${stockBatches.variantId}`).innerJoin(sql`products AS p`, sql`p.id = v.product_id`).innerJoin(sql`units AS u`, sql`u.id = v.base_unit_id`).innerJoin(
      sql`purchases AS pur`,
      sql`pur.id = ${stockBatches.purchaseId}`
    ).where(eq(stockBatches.purchaseId, purchaseId)).orderBy(asc(stockBatches.id));
    return rows.map((row) => ({
      id: row.id,
      variantId: row.variantId,
      variantName: row.variantName,
      productName: row.productName,
      baseUnitShortName: row.baseUnitShortName,
      purchaseId: row.purchaseId,
      purchaseNumber: row.purchaseNumber,
      purchasePrice: row.purchasePrice,
      suggestedRetailPrice: row.suggestedRetailPrice,
      suggestedWholesalePrice: row.suggestedWholesalePrice,
      quantityPurchased: row.quantityPurchased,
      remainingQuantity: row.remainingQuantity,
      purchaseDate: Math.floor(row.purchaseDate.getTime() / 1e3)
    }));
  },
  async count(query) {
    const db = getDb();
    const conditions = [];
    if (query.companyId)
      conditions.push(eq(purchases.companyId, query.companyId));
    if (query.fromDate)
      conditions.push(gte(purchases.purchaseDate, query.fromDate));
    if (query.toDate)
      conditions.push(lte(purchases.purchaseDate, query.toDate));
    const [row] = await db.select({ count: sql`count(*)` }).from(purchases).where(conditions.length > 0 ? and(...conditions) : void 0);
    return row?.count ?? 0;
  },
  /**
   * Update the paid amount on a purchase.
   * Used by the "Record Payment" feature until Phase 5 (Company Payments)
   * is built, at which point this becomes a proxy for a company_payment row.
   */
  async setPaidAmount(id, paidAmount) {
    const db = getDb();
    await db.update(purchases).set({ paidAmount, updatedAt: /* @__PURE__ */ new Date() }).where(eq(purchases.id, id));
    const updated = await this.getById(id);
    if (!updated) throw new Error(`Purchase ${id} not found`);
    return updated;
  }
};
const optionalTrimmedString$2 = (max) => union([string(), _null(), _undefined()]).transform((v) => {
  if (v === null || v === void 0) return void 0;
  const t = v.trim();
  if (t === "") return void 0;
  if (t.length > max) throw new Error(`Must be at most ${max} characters`);
  return t;
});
const purchaseLineSchema = object({
  variantId: number().int().positive(),
  quantity: number().int().positive("Quantity must be positive"),
  purchasePrice: number().int().nonnegative("Price cannot be negative"),
  suggestedRetailPrice: number().int().nonnegative().nullable().optional(),
  suggestedWholesalePrice: number().int().nonnegative().nullable().optional()
});
const createPurchaseSchema = object({
  companyId: number().int().positive(),
  purchaseDate: date().optional(),
  paidAmount: number().int().nonnegative().optional().default(0),
  remarks: optionalTrimmedString$2(500),
  lines: array(purchaseLineSchema).min(1, "Add at least one line")
});
const purchaseListQuerySchema = object({
  search: string().trim().optional(),
  companyId: number().int().positive().optional(),
  fromDate: date().optional(),
  toDate: date().optional(),
  limit: number().int().positive().max(500).optional().default(100),
  offset: number().int().nonnegative().optional().default(0)
});
const setPaidAmountSchema = object({
  id: number().int().positive(),
  paidAmount: number().int().nonnegative()
});
function registerPurchaseIpc() {
  require$$3$1.ipcMain.handle("purchase:list", async (_e, rawQuery) => {
    const query = purchaseListQuerySchema.parse(rawQuery ?? {});
    return purchaseService.list(query);
  });
  require$$3$1.ipcMain.handle("purchase:count", async (_e, rawQuery) => {
    const query = purchaseListQuerySchema.pick({ companyId: true, fromDate: true, toDate: true }).parse(rawQuery ?? {});
    return purchaseService.count(query);
  });
  require$$3$1.ipcMain.handle("purchase:get", async (_e, id) => {
    return purchaseService.getById(id);
  });
  require$$3$1.ipcMain.handle("purchase:getBatches", async (_e, purchaseId) => {
    return purchaseService.getBatches(purchaseId);
  });
  require$$3$1.ipcMain.handle("purchase:create", async (_e, rawInput) => {
    const input = createPurchaseSchema.parse(rawInput);
    return purchaseService.create(input);
  });
  require$$3$1.ipcMain.handle("purchase:setPaidAmount", async (_e, rawInput) => {
    const input = setPaidAmountSchema.parse(rawInput);
    return purchaseService.setPaidAmount(input.id, input.paidAmount);
  });
}
const inventoryService = {
  async listStock(query) {
    const db = getDb();
    const rows = db.$client.prepare(
      `
        SELECT
          b.variant_id                             AS variantId,
          v.product_id                             AS productId,
          p.name                                   AS productName,
          v.name                                   AS variantName,
          v.base_unit_id                           AS baseUnitId,
          u.name                                   AS baseUnitName,
          u.short_name                             AS baseUnitShortName,
          v.low_stock_threshold                    AS lowStockThreshold,
          SUM(b.remaining_quantity)                AS currentStock,
          SUM(b.remaining_quantity * b.purchase_price) AS valueMilliPaisa,
          COUNT(*)                                 AS activeBatchCount,
          MAX(b.purchase_date)                     AS lastPurchaseDate
        FROM stock_batches b
        INNER JOIN variants  v ON v.id = b.variant_id
        INNER JOIN products  p ON p.id = v.product_id
        INNER JOIN units     u ON u.id = v.base_unit_id
        WHERE b.remaining_quantity > 0
          AND v.deleted_at IS NULL
          ${query.search ? "AND (p.name LIKE @search OR v.name LIKE @search)" : ""}
        GROUP BY b.variant_id
        `
    ).all(query.search ? { search: `%${query.search}%` } : {});
    const variantIds = rows.map((r) => r.variantId);
    const latestPrices = /* @__PURE__ */ new Map();
    if (variantIds.length > 0) {
      const placeholders = variantIds.map(() => "?").join(",");
      const priceRows = db.$client.prepare(
        `
          SELECT b1.variant_id AS variant_id,
                 b1.suggested_retail_price AS retail,
                 b1.suggested_wholesale_price AS wholesale
          FROM stock_batches b1
          INNER JOIN (
            SELECT variant_id, MAX(purchase_date) AS max_date
            FROM stock_batches
            WHERE variant_id IN (${placeholders})
            GROUP BY variant_id
          ) b2 ON b2.variant_id = b1.variant_id AND b2.max_date = b1.purchase_date
          GROUP BY b1.variant_id
          `
      ).all(...variantIds);
      for (const pr of priceRows) {
        latestPrices.set(pr.variant_id, {
          retail: pr.retail,
          wholesale: pr.wholesale
        });
      }
    }
    let items = rows.map((r) => {
      const currentStock = r.currentStock;
      const stockValuePaisa = Math.round(r.valueMilliPaisa / 1e3);
      const avgCost = currentStock > 0 ? Math.round(stockValuePaisa / (currentStock / 1e3)) : 0;
      const prices = latestPrices.get(r.variantId);
      return {
        variantId: r.variantId,
        productId: r.productId,
        productName: r.productName,
        variantName: r.variantName,
        baseUnitId: r.baseUnitId,
        baseUnitName: r.baseUnitName,
        baseUnitShortName: r.baseUnitShortName,
        currentStock,
        avgCost,
        stockValue: stockValuePaisa,
        latestRetailPrice: prices?.retail ?? null,
        latestWholesalePrice: prices?.wholesale ?? null,
        activeBatchCount: r.activeBatchCount,
        lastPurchaseDate: r.lastPurchaseDate ? Math.floor(r.lastPurchaseDate) : null,
        lowStockThreshold: r.lowStockThreshold ?? null
      };
    });
    if (query.filter === "out") {
      items = items.filter((i) => i.currentStock === 0);
    } else if (query.filter === "in") {
      items = items.filter((i) => i.currentStock > 0);
    } else if (query.filter === "low") {
      items = items.filter(
        (i) => i.lowStockThreshold !== null && i.currentStock <= i.lowStockThreshold
      );
    }
    const sort = query.sort ?? "name";
    items.sort((a, b) => {
      switch (sort) {
        case "name":
          return a.productName.localeCompare(b.productName) || a.variantName.localeCompare(b.variantName);
        case "stock_asc":
          return a.currentStock - b.currentStock;
        case "stock_desc":
          return b.currentStock - a.currentStock;
        case "value_asc":
          return a.stockValue - b.stockValue;
        case "value_desc":
          return b.stockValue - a.stockValue;
        default:
          return 0;
      }
    });
    return items.slice(query.offset, query.offset + query.limit);
  },
  async totals() {
    const db = getDb();
    const [row] = db.$client.prepare(
      `
        SELECT
          COUNT(DISTINCT variant_id) AS totalVariants,
          COALESCE(SUM(remaining_quantity * purchase_price) / 1000, 0) AS valuePaisa
        FROM stock_batches
        WHERE remaining_quantity > 0
        `
    ).all();
    const [lowRow] = db.$client.prepare(
      `
        SELECT COUNT(*) AS lowCount
        FROM variants v
        WHERE v.deleted_at IS NULL
          AND v.low_stock_threshold IS NOT NULL
          AND COALESCE(
            (SELECT SUM(b.remaining_quantity)
             FROM stock_batches b
             WHERE b.variant_id = v.id AND b.remaining_quantity > 0),
            0
          ) <= v.low_stock_threshold
        `
    ).all();
    const [outRow] = db.$client.prepare(
      `
        SELECT COUNT(*) AS outCount
        FROM variants v
        WHERE NOT EXISTS (
          SELECT 1 FROM stock_batches b
          WHERE b.variant_id = v.id AND b.remaining_quantity > 0
        )
        AND v.deleted_at IS NULL
        `
    ).all();
    return {
      totalVariants: row?.totalVariants ?? 0,
      totalStockValue: Math.round(row?.valuePaisa ?? 0),
      lowStockCount: lowRow?.lowCount ?? 0,
      outOfStockCount: outRow?.outCount ?? 0
    };
  },
  /**
   * All purchase batches for a variant, oldest first.
   * Used by the price-history modal.
   */
  async priceHistory(variantId) {
    const db = getDb();
    const rows = db.$client.prepare(
      `
        SELECT
          b.id                       AS batchId,
          b.purchase_id              AS purchaseId,
          pur.purchase_number        AS purchaseNumber,
          c.name                     AS companyName,
          b.purchase_date            AS purchaseDate,
          b.purchase_price           AS purchasePrice,
          b.quantity_purchased       AS quantityPurchased,
          b.remaining_quantity       AS remainingQuantity,
          b.suggested_retail_price   AS suggestedRetailPrice,
          b.suggested_wholesale_price AS suggestedWholesalePrice
        FROM stock_batches b
        LEFT JOIN purchases pur ON pur.id = b.purchase_id
        LEFT JOIN companies c   ON c.id = pur.company_id
        WHERE b.variant_id = ?
        ORDER BY b.purchase_date ASC, b.id ASC
        `
    ).all(variantId);
    return rows.map((r) => ({
      batchId: r.batchId,
      purchaseId: r.purchaseId,
      purchaseNumber: r.purchaseNumber,
      companyName: r.companyName,
      purchaseDate: Math.floor(r.purchaseDate),
      purchasePrice: r.purchasePrice,
      quantityPurchased: r.quantityPurchased,
      remainingQuantity: r.remainingQuantity,
      suggestedRetailPrice: r.suggestedRetailPrice,
      suggestedWholesalePrice: r.suggestedWholesalePrice
    }));
  }
};
const stockListQuerySchema = object({
  search: string().trim().optional(),
  filter: _enum(["all", "in", "low", "out"]).optional().default("all"),
  sort: _enum(["name", "stock_asc", "stock_desc", "value_desc", "value_asc"]).optional().default("name"),
  limit: number().int().positive().max(1e3).optional().default(500),
  offset: number().int().nonnegative().optional().default(0)
});
const priceHistoryQuerySchema = object({
  variantId: number().int().positive()
});
function registerInventoryIpc() {
  require$$3$1.ipcMain.handle("inventory:listStock", async (_e, rawQuery) => {
    const query = stockListQuerySchema.parse(rawQuery ?? {});
    return inventoryService.listStock(query);
  });
  require$$3$1.ipcMain.handle("inventory:totals", async () => {
    return inventoryService.totals();
  });
  require$$3$1.ipcMain.handle("inventory:priceHistory", async (_e, rawQuery) => {
    const { variantId } = priceHistoryQuerySchema.parse(rawQuery ?? {});
    return inventoryService.priceHistory(variantId);
  });
}
function toDto$2(row) {
  return {
    id: row.id,
    variantId: row.variantId,
    productName: row.productName,
    variantName: row.variantName,
    baseUnitShortName: row.baseUnitShortName,
    quantity: row.quantity,
    unitCost: row.unitCost,
    adjustmentType: row.adjustmentType,
    reason: row.reason,
    adjustmentDate: Math.floor(row.adjustmentDate.getTime() / 1e3),
    createdAt: Math.floor(row.createdAt.getTime() / 1e3)
  };
}
function resolveSignedQuantity(input) {
  const absQty = input.quantity;
  switch (input.adjustmentType) {
    case "damaged":
    case "lost":
      return -absQty;
    case "return":
      return absQty;
    case "correction":
      if (!input.sign) {
        throw new Error("Sign is required for correction type");
      }
      return input.sign === "negative" ? -absQty : absQty;
    default:
      throw new Error(`Unknown adjustment type: ${input.adjustmentType}`);
  }
}
const adjustmentService = {
  async create(input) {
    const db = getDb();
    const signedQty = resolveSignedQuantity(input);
    const insertedId = db.transaction((tx) => {
      const [costRow] = tx.select({
        avgCost: sql`
            CAST(
              COALESCE(
                SUM(${stockBatches.remainingQuantity} * ${stockBatches.purchasePrice})
                  / NULLIF(SUM(${stockBatches.remainingQuantity}), 0),
                0
              ) AS INTEGER
            )
          `
      }).from(stockBatches).where(
        and(
          eq(stockBatches.variantId, input.variantId),
          sql`${stockBatches.remainingQuantity} > 0`
        )
      ).all();
      const unitCost = Math.round(costRow?.avgCost ?? 0);
      const [adj] = tx.insert(stockAdjustments).values({
        variantId: input.variantId,
        quantity: signedQty,
        unitCost,
        adjustmentType: input.adjustmentType,
        reason: input.reason ?? null,
        adjustmentDate: /* @__PURE__ */ new Date()
      }).returning({ id: stockAdjustments.id }).all();
      if (signedQty < 0) {
        let remaining = -signedQty;
        const batches = tx.select().from(stockBatches).where(
          and(
            eq(stockBatches.variantId, input.variantId),
            sql`${stockBatches.remainingQuantity} > 0`
          )
        ).orderBy(asc(stockBatches.purchaseDate), asc(stockBatches.id)).all();
        const totalAvailable = batches.reduce(
          (sum, b) => sum + b.remainingQuantity,
          0
        );
        if (totalAvailable < remaining) {
          throw new Error(
            `Not enough stock. Available: ${(totalAvailable / 1e3).toFixed(3)}, requested: ${(remaining / 1e3).toFixed(3)}`
          );
        }
        for (const batch of batches) {
          if (remaining <= 0) break;
          const consume = Math.min(remaining, batch.remainingQuantity);
          remaining -= consume;
          tx.update(stockBatches).set({ remainingQuantity: batch.remainingQuantity - consume }).where(eq(stockBatches.id, batch.id)).run();
          tx.insert(stockLedger).values({
            batchId: batch.id,
            variantId: input.variantId,
            quantityChange: -consume,
            unitCost: batch.purchasePrice,
            movementType: input.adjustmentType === "damaged" ? "damage" : "adjustment",
            referenceType: "adjustment",
            referenceId: adj.id,
            notes: input.reason ?? null
          }).run();
        }
      } else if (signedQty > 0) {
        const [batch] = tx.insert(stockBatches).values({
          variantId: input.variantId,
          purchaseId: null,
          purchasePrice: unitCost,
          suggestedRetailPrice: null,
          suggestedWholesalePrice: null,
          quantityPurchased: signedQty,
          remainingQuantity: signedQty,
          purchaseDate: /* @__PURE__ */ new Date()
        }).returning({ id: stockBatches.id }).all();
        tx.insert(stockLedger).values({
          batchId: batch.id,
          variantId: input.variantId,
          quantityChange: signedQty,
          unitCost,
          movementType: "adjustment",
          referenceType: "adjustment",
          referenceId: adj.id,
          notes: input.reason ?? null
        }).run();
      }
      return adj.id;
    });
    const created = await this.getById(insertedId);
    if (!created) throw new Error("Failed to load created adjustment");
    return created;
  },
  async getById(id) {
    const db = getDb();
    const rows = await db.select({
      id: stockAdjustments.id,
      variantId: stockAdjustments.variantId,
      quantity: stockAdjustments.quantity,
      unitCost: stockAdjustments.unitCost,
      adjustmentType: stockAdjustments.adjustmentType,
      reason: stockAdjustments.reason,
      adjustmentDate: stockAdjustments.adjustmentDate,
      createdAt: stockAdjustments.createdAt,
      productName: sql`p.name`,
      variantName: sql`v.name`,
      baseUnitShortName: sql`u.short_name`
    }).from(stockAdjustments).innerJoin(sql`variants v`, sql`v.id = ${stockAdjustments.variantId}`).innerJoin(sql`products p`, sql`p.id = v.product_id`).innerJoin(sql`units u`, sql`u.id = v.base_unit_id`).where(eq(stockAdjustments.id, id)).limit(1);
    return rows[0] ? toDto$2(rows[0]) : null;
  },
  async list(query) {
    const db = getDb();
    const conditions = [];
    if (query.variantId) {
      conditions.push(eq(stockAdjustments.variantId, query.variantId));
    }
    if (query.adjustmentType) {
      conditions.push(
        eq(stockAdjustments.adjustmentType, query.adjustmentType)
      );
    }
    if (query.fromDate) {
      conditions.push(gte(stockAdjustments.adjustmentDate, query.fromDate));
    }
    if (query.toDate) {
      conditions.push(lte(stockAdjustments.adjustmentDate, query.toDate));
    }
    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(or(sql`p.name LIKE ${term}`, sql`v.name LIKE ${term}`));
    }
    const rows = await db.select({
      id: stockAdjustments.id,
      variantId: stockAdjustments.variantId,
      quantity: stockAdjustments.quantity,
      unitCost: stockAdjustments.unitCost,
      adjustmentType: stockAdjustments.adjustmentType,
      reason: stockAdjustments.reason,
      adjustmentDate: stockAdjustments.adjustmentDate,
      createdAt: stockAdjustments.createdAt,
      productName: sql`p.name`,
      variantName: sql`v.name`,
      baseUnitShortName: sql`u.short_name`
    }).from(stockAdjustments).innerJoin(sql`variants v`, sql`v.id = ${stockAdjustments.variantId}`).innerJoin(sql`products p`, sql`p.id = v.product_id`).innerJoin(sql`units u`, sql`u.id = v.base_unit_id`).where(conditions.length > 0 ? and(...conditions) : void 0).orderBy(
      desc(stockAdjustments.adjustmentDate),
      desc(stockAdjustments.id)
    ).limit(query.limit).offset(query.offset);
    return rows.map(toDto$2);
  },
  /**
   * Count adjustments for a variant — useful for showing "N adjustments" on
   * a variant row.
   */
  async countByVariant(variantId) {
    const db = getDb();
    const [row] = await db.select({ count: sql`count(*)` }).from(stockAdjustments).where(eq(stockAdjustments.variantId, variantId));
    return row?.count ?? 0;
  }
};
const ADJUSTMENT_TYPES = [
  "damaged",
  "lost",
  "correction",
  "return"
];
const createAdjustmentSchema = object({
  variantId: number().int().positive(),
  quantity: number().int().positive("Quantity must be positive"),
  adjustmentType: _enum(ADJUSTMENT_TYPES),
  /**
   * For "correction": positive = found, negative = missing.
   * For "damaged" / "lost": always negative (write-off).
   * For "return": always positive.
   */
  sign: _enum(["positive", "negative"]).optional(),
  reason: string().trim().max(500).optional().or(literal("")).transform((v) => v === "" ? void 0 : v)
});
const adjustmentListQuerySchema = object({
  variantId: number().int().positive().optional(),
  adjustmentType: _enum(ADJUSTMENT_TYPES).optional(),
  search: string().trim().optional(),
  fromDate: date().optional(),
  toDate: date().optional(),
  limit: number().int().positive().max(500).optional().default(100),
  offset: number().int().nonnegative().optional().default(0)
});
function registerAdjustmentIpc() {
  require$$3$1.ipcMain.handle("adjustment:list", async (_e, rawQuery) => {
    const query = adjustmentListQuerySchema.parse(rawQuery ?? {});
    return adjustmentService.list(query);
  });
  require$$3$1.ipcMain.handle("adjustment:get", async (_e, id) => {
    return adjustmentService.getById(id);
  });
  require$$3$1.ipcMain.handle("adjustment:create", async (_e, rawInput) => {
    const input = createAdjustmentSchema.parse(rawInput);
    return adjustmentService.create(input);
  });
}
async function generateBillNumber() {
  const db = getDb();
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  const prefix = `BILL-${year}-`;
  const [row] = await db.select({ max: sql`max(${bills.billNumber})` }).from(bills).where(like(bills.billNumber, `${prefix}%`));
  const lastNumber = row?.max ? parseInt(row.max.slice(prefix.length), 10) : 0;
  const next = (lastNumber + 1).toString().padStart(4, "0");
  return `${prefix}${next}`;
}
function toBillDto(row) {
  return {
    id: row.id,
    billNumber: row.billNumber,
    customerId: row.customerId,
    customerName: row.customerName,
    billDate: Math.floor(row.billDate.getTime() / 1e3),
    totalAmount: row.totalAmount,
    paidAmount: row.paidAmount,
    remainingAmount: row.remainingAmount,
    cogs: row.cogs,
    grossProfit: row.totalAmount - row.cogs,
    status: row.status,
    remarks: row.remarks,
    itemCount: row.itemCount,
    createdAt: Math.floor(row.createdAt.getTime() / 1e3),
    updatedAt: Math.floor(row.updatedAt.getTime() / 1e3)
  };
}
function computeTotal(lines) {
  return lines.reduce(
    (sum, line) => sum + Math.round(line.quantity * line.unitPrice / 1e3),
    0
  );
}
const billService = {
  /**
   * Create a bill.
   *
   * - If status is "finalized": run full FIFO consumption, update batches,
   *   write ledger, update customer balance.
   * - If status is "draft" or "held": skip all business-side effects. Just
   *   save the header + items (so we can reload + edit later). No stock change,
   *   no Khaata.
   */
  async create(input) {
    const db = getDb();
    const totalAmount = computeTotal(input.lines);
    const billDate = input.billDate ?? /* @__PURE__ */ new Date();
    const billNumber = await generateBillNumber();
    const paidAmount = input.paidAmount ?? 0;
    const status = input.status ?? "finalized";
    const isDraftish = status === "draft" || status === "held";
    const billId = db.transaction((tx) => {
      const [bill] = tx.insert(bills).values({
        billNumber,
        customerId: input.customerId ?? null,
        billDate,
        totalAmount,
        paidAmount: isDraftish ? 0 : paidAmount,
        remainingAmount: 0,
        cogs: 0,
        status,
        remarks: input.remarks ?? null
      }).returning({ id: bills.id }).all();
      let totalCogs = 0;
      for (const line of input.lines) {
        const lineTotal = Math.round(
          line.quantity * line.unitPrice / 1e3
        );
        const [item] = tx.insert(billItems).values({
          billId: bill.id,
          variantId: line.variantId,
          unitId: line.unitId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          lineTotal,
          lineCogs: 0
        }).returning({ id: billItems.id }).all();
        if (!isDraftish) {
          const availableBatches = tx.select().from(stockBatches).where(
            and(
              eq(stockBatches.variantId, line.variantId),
              sql`${stockBatches.remainingQuantity} > 0`
            )
          ).orderBy(asc(stockBatches.purchaseDate), asc(stockBatches.id)).all();
          const totalAvailable = availableBatches.reduce(
            (sum, b) => sum + b.remainingQuantity,
            0
          );
          if (totalAvailable < line.quantity) {
            throw new Error(
              `Not enough stock for variant ${line.variantId}. Available: ${(totalAvailable / 1e3).toFixed(3)}, requested: ${(line.quantity / 1e3).toFixed(3)}`
            );
          }
          let remaining = line.quantity;
          let lineCogs = 0;
          for (const batch of availableBatches) {
            if (remaining <= 0) break;
            const consume = Math.min(remaining, batch.remainingQuantity);
            remaining -= consume;
            const costContribution = Math.round(
              consume * batch.purchasePrice / 1e3
            );
            lineCogs += costContribution;
            tx.update(stockBatches).set({ remainingQuantity: batch.remainingQuantity - consume }).where(eq(stockBatches.id, batch.id)).run();
            tx.insert(billItemFifo).values({
              billItemId: item.id,
              batchId: batch.id,
              quantityConsumed: consume,
              unitCost: batch.purchasePrice
            }).run();
            tx.insert(stockLedger).values({
              batchId: batch.id,
              variantId: line.variantId,
              quantityChange: -consume,
              unitCost: batch.purchasePrice,
              movementType: "sale",
              referenceType: "bill",
              referenceId: bill.id,
              notes: null
            }).run();
          }
          tx.update(billItems).set({ lineCogs }).where(eq(billItems.id, item.id)).run();
          totalCogs += lineCogs;
        }
      }
      const remainingAmount = isDraftish ? 0 : totalAmount - paidAmount;
      tx.update(bills).set({
        cogs: totalCogs,
        remainingAmount,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(bills.id, bill.id)).run();
      if (!isDraftish && input.customerId && remainingAmount > 0) {
        const [cust] = tx.select({ cachedOutstanding: customers.cachedOutstanding }).from(customers).where(eq(customers.id, input.customerId)).limit(1).all();
        if (cust) {
          tx.update(customers).set({
            cachedOutstanding: cust.cachedOutstanding + remainingAmount,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq(customers.id, input.customerId)).run();
        }
      }
      return bill.id;
    });
    const created = await this.getById(billId);
    if (!created) throw new Error("Failed to load created bill");
    return created;
  },
  /**
   * Finalize a draft or held bill. Runs the FIFO consumption NOW (using
   * current stock), then updates balances.
   *
   * Throws if the bill is not a draft or held, or if stock is insufficient.
   */
  async finalize(billId) {
    const db = getDb();
    const [bill] = await db.select().from(bills).where(eq(bills.id, billId)).limit(1);
    if (!bill) throw new Error(`Bill ${billId} not found`);
    if (bill.status !== "draft" && bill.status !== "held") {
      throw new Error(`Only draft or held bills can be finalized`);
    }
    const items = await db.select().from(billItems).where(eq(billItems.billId, billId)).orderBy(asc(billItems.id));
    db.transaction((tx) => {
      let totalCogs = 0;
      for (const item of items) {
        const availableBatches = tx.select().from(stockBatches).where(
          and(
            eq(stockBatches.variantId, item.variantId),
            sql`${stockBatches.remainingQuantity} > 0`
          )
        ).orderBy(asc(stockBatches.purchaseDate), asc(stockBatches.id)).all();
        const totalAvailable = availableBatches.reduce(
          (sum, b) => sum + b.remainingQuantity,
          0
        );
        if (totalAvailable < item.quantity) {
          throw new Error(
            `Not enough stock for variant ${item.variantId}. Available: ${(totalAvailable / 1e3).toFixed(3)}, requested: ${(item.quantity / 1e3).toFixed(3)}`
          );
        }
        let remaining = item.quantity;
        let lineCogs = 0;
        for (const batch of availableBatches) {
          if (remaining <= 0) break;
          const consume = Math.min(remaining, batch.remainingQuantity);
          remaining -= consume;
          const costContribution = Math.round(
            consume * batch.purchasePrice / 1e3
          );
          lineCogs += costContribution;
          tx.update(stockBatches).set({ remainingQuantity: batch.remainingQuantity - consume }).where(eq(stockBatches.id, batch.id)).run();
          tx.insert(billItemFifo).values({
            billItemId: item.id,
            batchId: batch.id,
            quantityConsumed: consume,
            unitCost: batch.purchasePrice
          }).run();
          tx.insert(stockLedger).values({
            batchId: batch.id,
            variantId: item.variantId,
            quantityChange: -consume,
            unitCost: batch.purchasePrice,
            movementType: "sale",
            referenceType: "bill",
            referenceId: billId,
            notes: null
          }).run();
        }
        tx.update(billItems).set({ lineCogs }).where(eq(billItems.id, item.id)).run();
        totalCogs += lineCogs;
      }
      const remainingAmount = bill.totalAmount - bill.paidAmount;
      tx.update(bills).set({
        status: "finalized",
        cogs: totalCogs,
        remainingAmount,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(bills.id, billId)).run();
      if (bill.customerId && remainingAmount > 0) {
        const [cust] = tx.select({ cachedOutstanding: customers.cachedOutstanding }).from(customers).where(eq(customers.id, bill.customerId)).limit(1).all();
        if (cust) {
          tx.update(customers).set({
            cachedOutstanding: cust.cachedOutstanding + remainingAmount,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq(customers.id, bill.customerId)).run();
        }
      }
    });
    const updated = await this.getById(billId);
    if (!updated) throw new Error("Failed to load finalized bill");
    return updated;
  },
  /**
   * Delete a draft or held bill. Doesn't touch inventory (nothing to
   * restore). Finalized bills cannot be deleted.
   */
  async deleteDraft(billId) {
    const db = getDb();
    const [bill] = await db.select().from(bills).where(eq(bills.id, billId)).limit(1);
    if (!bill) throw new Error(`Bill ${billId} not found`);
    if (bill.status !== "draft" && bill.status !== "held") {
      throw new Error(`Only draft or held bills can be deleted`);
    }
    await db.delete(bills).where(eq(bills.id, billId));
  },
  async getById(id) {
    const db = getDb();
    const [header] = await db.select({
      id: bills.id,
      billNumber: bills.billNumber,
      customerId: bills.customerId,
      customerName: sql`c.name`,
      billDate: bills.billDate,
      totalAmount: bills.totalAmount,
      paidAmount: bills.paidAmount,
      remainingAmount: bills.remainingAmount,
      cogs: bills.cogs,
      status: bills.status,
      remarks: bills.remarks,
      itemCount: sql`(SELECT COUNT(*) FROM bill_items WHERE bill_id = ${bills.id})`,
      createdAt: bills.createdAt,
      updatedAt: bills.updatedAt
    }).from(bills).leftJoin(sql`customers c`, sql`c.id = ${bills.customerId}`).where(eq(bills.id, id)).limit(1);
    if (!header) return null;
    const items = await db.select({
      id: billItems.id,
      variantId: billItems.variantId,
      unitId: billItems.unitId,
      quantity: billItems.quantity,
      unitPrice: billItems.unitPrice,
      lineTotal: billItems.lineTotal,
      lineCogs: billItems.lineCogs,
      productName: sql`p.name`,
      variantName: sql`v.name`,
      baseUnitShortName: sql`u.short_name`,
      unitName: sql`unit.name`
    }).from(billItems).innerJoin(sql`variants v`, sql`v.id = ${billItems.variantId}`).innerJoin(sql`products p`, sql`p.id = v.product_id`).innerJoin(sql`units u`, sql`u.id = v.base_unit_id`).innerJoin(sql`units unit`, sql`unit.id = ${billItems.unitId}`).where(eq(billItems.billId, id)).orderBy(asc(billItems.id));
    const fifoRows = await db.select({
      id: billItemFifo.id,
      billItemId: billItemFifo.billItemId,
      batchId: billItemFifo.batchId,
      quantityConsumed: billItemFifo.quantityConsumed,
      unitCost: billItemFifo.unitCost,
      batchPurchaseDate: stockBatches.purchaseDate
    }).from(billItemFifo).innerJoin(
      stockBatches,
      eq(stockBatches.id, billItemFifo.batchId)
    ).where(
      sql`${billItemFifo.billItemId} IN (SELECT id FROM bill_items WHERE bill_id = ${id})`
    );
    const fifoByItem = {};
    for (const r of fifoRows) {
      const arr = fifoByItem[r.billItemId] ?? [];
      arr.push({
        id: r.id,
        batchId: r.batchId,
        batchPurchaseDate: Math.floor(r.batchPurchaseDate.getTime() / 1e3),
        quantityConsumed: r.quantityConsumed,
        unitCost: r.unitCost
      });
      fifoByItem[r.billItemId] = arr;
    }
    const itemsDto = items.map((i) => ({
      id: i.id,
      variantId: i.variantId,
      productName: i.productName,
      variantName: i.variantName,
      baseUnitShortName: i.baseUnitShortName,
      unitId: i.unitId,
      unitName: i.unitName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
      lineCogs: i.lineCogs
    }));
    return {
      ...toBillDto(header),
      items: itemsDto,
      fifo: fifoByItem
    };
  },
  async list(query) {
    const db = getDb();
    const conditions = [];
    if (query.customerId) {
      conditions.push(eq(bills.customerId, query.customerId));
    }
    if (query.status) {
      conditions.push(eq(bills.status, query.status));
    }
    if (query.fromDate) {
      conditions.push(gte(bills.billDate, query.fromDate));
    }
    if (query.toDate) {
      conditions.push(lte(bills.billDate, query.toDate));
    }
    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(
        or(like(bills.billNumber, term), like(sql`c.name`, term))
      );
    }
    const statusOrder = sql`CASE ${bills.status}
      WHEN 'held' THEN 0
      WHEN 'draft' THEN 1
      WHEN 'finalized' THEN 2
      WHEN 'returned' THEN 3
      WHEN 'cancelled' THEN 4
      ELSE 5
    END`;
    const rows = await db.select({
      id: bills.id,
      billNumber: bills.billNumber,
      customerId: bills.customerId,
      customerName: sql`c.name`,
      billDate: bills.billDate,
      totalAmount: bills.totalAmount,
      paidAmount: bills.paidAmount,
      remainingAmount: bills.remainingAmount,
      cogs: bills.cogs,
      status: bills.status,
      remarks: bills.remarks,
      itemCount: sql`(SELECT COUNT(*) FROM bill_items WHERE bill_id = ${bills.id})`,
      createdAt: bills.createdAt,
      updatedAt: bills.updatedAt
    }).from(bills).leftJoin(sql`customers c`, sql`c.id = ${bills.customerId}`).where(conditions.length > 0 ? and(...conditions) : void 0).orderBy(asc(statusOrder), desc(bills.billDate), desc(bills.id)).limit(query.limit).offset(query.offset);
    return rows.map(toBillDto);
  },
  async count(query) {
    const db = getDb();
    const conditions = [];
    if (query.customerId)
      conditions.push(eq(bills.customerId, query.customerId));
    if (query.status) conditions.push(eq(bills.status, query.status));
    if (query.fromDate)
      conditions.push(gte(bills.billDate, query.fromDate));
    if (query.toDate) conditions.push(lte(bills.billDate, query.toDate));
    const [row] = await db.select({ count: sql`count(*)` }).from(bills).where(conditions.length > 0 ? and(...conditions) : void 0);
    return row?.count ?? 0;
  }
};
const optionalTrimmedString$1 = (max) => union([string(), _null(), _undefined()]).transform((v) => {
  if (v === null || v === void 0) return void 0;
  const t = v.trim();
  if (t === "") return void 0;
  if (t.length > max) throw new Error(`Must be at most ${max} characters`);
  return t;
});
const billLineSchema = object({
  variantId: number().int().positive(),
  unitId: number().int().positive(),
  quantity: number().int().positive("Quantity must be positive"),
  // milli-units
  unitPrice: number().int().nonnegative("Price cannot be negative")
  // paisa
});
const createBillSchema = object({
  customerId: number().int().positive().nullable().optional(),
  billDate: date().optional(),
  paidAmount: number().int().nonnegative().optional().default(0),
  remarks: optionalTrimmedString$1(500),
  status: _enum(["draft", "held", "finalized"]).optional().default("finalized"),
  lines: array(billLineSchema).min(1, "Add at least one item")
});
const billListQuerySchema = object({
  search: string().trim().optional(),
  customerId: number().int().positive().optional(),
  status: _enum(["draft", "held", "finalized", "cancelled", "returned"]).optional(),
  fromDate: date().optional(),
  toDate: date().optional(),
  limit: number().int().positive().max(500).optional().default(100),
  offset: number().int().nonnegative().optional().default(0)
});
function registerBillIpc() {
  require$$3$1.ipcMain.handle("bill:list", async (_e, rawQuery) => {
    const query = billListQuerySchema.parse(rawQuery ?? {});
    return billService.list(query);
  });
  require$$3$1.ipcMain.handle("bill:count", async (_e, rawQuery) => {
    const query = billListQuerySchema.pick({ customerId: true, status: true, fromDate: true, toDate: true }).parse(rawQuery ?? {});
    return billService.count(query);
  });
  require$$3$1.ipcMain.handle("bill:get", async (_e, id) => {
    return billService.getById(id);
  });
  require$$3$1.ipcMain.handle("bill:create", async (_e, rawInput) => {
    const input = createBillSchema.parse(rawInput);
    return billService.create(input);
  });
  require$$3$1.ipcMain.handle("bill:finalize", async (_e, id) => {
    return billService.finalize(id);
  });
  require$$3$1.ipcMain.handle("bill:deleteDraft", async (_e, id) => {
    await billService.deleteDraft(id);
    return { ok: true };
  });
}
function toPaymentDto(row) {
  return {
    id: row.id,
    customerId: row.customerId,
    customerName: row.customerName,
    billId: row.billId,
    billNumber: row.billNumber,
    amount: row.amount,
    paymentDate: Math.floor(row.paymentDate.getTime() / 1e3),
    remarks: row.remarks,
    createdAt: Math.floor(row.createdAt.getTime() / 1e3)
  };
}
const paymentService = {
  async create(input) {
    const db = getDb();
    const paymentDate = input.paymentDate ?? /* @__PURE__ */ new Date();
    const paymentId = db.transaction((tx) => {
      const [cust] = tx.select().from(customers).where(eq(customers.id, input.customerId)).limit(1).all();
      if (!cust) throw new Error(`Customer ${input.customerId} not found`);
      const [payment] = tx.insert(payments).values({
        customerId: input.customerId,
        billId: null,
        amount: input.amount,
        paymentDate,
        remarks: input.remarks ?? null
      }).returning({ id: payments.id }).all();
      const unpaidBills = tx.select().from(bills).where(
        and(
          eq(bills.customerId, input.customerId),
          eq(bills.status, "finalized"),
          sql`${bills.remainingAmount} > 0`
        )
      ).orderBy(asc(bills.billDate), asc(bills.id)).all();
      let remainingToAllocate = input.amount;
      let totalAllocated = 0;
      for (const bill of unpaidBills) {
        if (remainingToAllocate <= 0) break;
        const allocate = Math.min(remainingToAllocate, bill.remainingAmount);
        remainingToAllocate -= allocate;
        totalAllocated += allocate;
        tx.insert(paymentAllocations).values({
          paymentId: payment.id,
          billId: bill.id,
          amount: allocate
        }).run();
        tx.update(bills).set({
          paidAmount: bill.paidAmount + allocate,
          remainingAmount: bill.remainingAmount - allocate,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(bills.id, bill.id)).run();
      }
      if (totalAllocated > 0) {
        tx.update(customers).set({
          cachedOutstanding: cust.cachedOutstanding - totalAllocated,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(customers.id, input.customerId)).run();
      }
      return payment.id;
    });
    const created = await this.getById(paymentId);
    if (!created) throw new Error("Failed to load created payment");
    return created;
  },
  async getById(id) {
    const db = getDb();
    const [header] = await db.select({
      id: payments.id,
      customerId: payments.customerId,
      customerName: sql`c.name`,
      billId: payments.billId,
      billNumber: sql`b.bill_number`,
      amount: payments.amount,
      paymentDate: payments.paymentDate,
      remarks: payments.remarks,
      createdAt: payments.createdAt
    }).from(payments).innerJoin(sql`customers c`, sql`c.id = ${payments.customerId}`).leftJoin(sql`bills b`, sql`b.id = ${payments.billId}`).where(eq(payments.id, id)).limit(1);
    if (!header) return null;
    const allocations = await db.select({
      id: paymentAllocations.id,
      billId: paymentAllocations.billId,
      billNumber: sql`b.bill_number`,
      billDate: sql`b.bill_date`,
      amount: paymentAllocations.amount
    }).from(paymentAllocations).innerJoin(sql`bills b`, sql`b.id = ${paymentAllocations.billId}`).where(eq(paymentAllocations.paymentId, id)).orderBy(asc(sql`b.bill_date`));
    return {
      ...toPaymentDto(header),
      allocations: allocations.map((a) => ({
        id: a.id,
        billId: a.billId,
        billNumber: a.billNumber,
        billDate: Math.floor(
          typeof a.billDate === "object" ? a.billDate.getTime() / 1e3 : Number(a.billDate)
        ),
        amount: a.amount
      }))
    };
  },
  async list(query) {
    const db = getDb();
    const conditions = [];
    if (query.customerId) {
      conditions.push(eq(payments.customerId, query.customerId));
    }
    if (query.fromDate) {
      conditions.push(gte(payments.paymentDate, query.fromDate));
    }
    if (query.toDate) {
      conditions.push(lte(payments.paymentDate, query.toDate));
    }
    if (query.search) {
      conditions.push(like(sql`c.name`, `%${query.search}%`));
    }
    const rows = await db.select({
      id: payments.id,
      customerId: payments.customerId,
      customerName: sql`c.name`,
      billId: payments.billId,
      billNumber: sql`b.bill_number`,
      amount: payments.amount,
      paymentDate: payments.paymentDate,
      remarks: payments.remarks,
      createdAt: payments.createdAt
    }).from(payments).innerJoin(sql`customers c`, sql`c.id = ${payments.customerId}`).leftJoin(sql`bills b`, sql`b.id = ${payments.billId}`).where(conditions.length > 0 ? and(...conditions) : void 0).orderBy(desc(payments.paymentDate), desc(payments.id)).limit(query.limit).offset(query.offset);
    return rows.map(toPaymentDto);
  },
  async count(query) {
    const db = getDb();
    const conditions = [];
    if (query.customerId)
      conditions.push(eq(payments.customerId, query.customerId));
    if (query.fromDate)
      conditions.push(gte(payments.paymentDate, query.fromDate));
    if (query.toDate)
      conditions.push(lte(payments.paymentDate, query.toDate));
    const [row] = await db.select({ count: sql`count(*)` }).from(payments).where(conditions.length > 0 ? and(...conditions) : void 0);
    return row?.count ?? 0;
  }
};
const khaataService = {
  async list(query) {
    const db = getDb();
    const conditions = [
      sql`${customers.cachedOutstanding} > 0`,
      isNull(customers.deletedAt)
    ];
    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(
        or(
          like(customers.name, term),
          like(customers.contactNumber, term)
        )
      );
    }
    const rows = await db.select({
      customerId: customers.id,
      customerName: customers.name,
      contactNumber: customers.contactNumber,
      totalOutstanding: customers.cachedOutstanding,
      billCount: sql`(
          SELECT COUNT(*) FROM bills
          WHERE customer_id = ${customers.id}
            AND status = 'finalized'
            AND remaining_amount > 0
        )`,
      oldestBillDate: sql`(
          SELECT MIN(bill_date) FROM bills
          WHERE customer_id = ${customers.id}
            AND status = 'finalized'
            AND remaining_amount > 0
        )`
    }).from(customers).where(and(...conditions)).orderBy(desc(customers.cachedOutstanding)).limit(query.limit).offset(query.offset);
    return rows.map((r) => ({
      customerId: r.customerId,
      customerName: r.customerName,
      contactNumber: r.contactNumber,
      totalOutstanding: r.totalOutstanding,
      billCount: r.billCount,
      oldestBillDate: r.oldestBillDate
    }));
  },
  async detail(customerId) {
    const db = getDb();
    const [cust] = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
    if (!cust) return null;
    const rows = await db.select({
      billId: bills.id,
      billNumber: bills.billNumber,
      billDate: bills.billDate,
      totalAmount: bills.totalAmount,
      paidAmount: bills.paidAmount,
      remainingAmount: bills.remainingAmount
    }).from(bills).where(
      and(
        eq(bills.customerId, customerId),
        eq(bills.status, "finalized"),
        sql`${bills.remainingAmount} > 0`
      )
    ).orderBy(asc(bills.billDate), asc(bills.id));
    const billsDto = rows.map((r) => ({
      billId: r.billId,
      billNumber: r.billNumber,
      billDate: Math.floor(r.billDate.getTime() / 1e3),
      totalAmount: r.totalAmount,
      paidAmount: r.paidAmount,
      remainingAmount: r.remainingAmount
    }));
    const totalOutstanding = billsDto.reduce(
      (s, b) => s + b.remainingAmount,
      0
    );
    return {
      customerId: cust.id,
      customerName: cust.name,
      contactNumber: cust.contactNumber,
      address: cust.address,
      totalOutstanding,
      bills: billsDto
    };
  },
  async totalOutstanding() {
    const db = getDb();
    const [row] = await db.select({
      total: sql`COALESCE(SUM(${customers.cachedOutstanding}), 0)`
    }).from(customers).where(isNull(customers.deletedAt));
    return row?.total ?? 0;
  }
};
const createPaymentSchema = object({
  customerId: number().int().positive(),
  amount: number().int().positive("Amount must be positive"),
  // paisa
  paymentDate: date().optional(),
  remarks: union([string(), _null(), _undefined()]).transform((v) => {
    if (v === null || v === void 0) return void 0;
    const t = v.trim();
    return t === "" ? void 0 : t;
  })
});
const paymentListQuerySchema = object({
  customerId: number().int().positive().optional(),
  search: string().trim().optional(),
  // customer name
  fromDate: date().optional(),
  toDate: date().optional(),
  limit: number().int().positive().max(500).optional().default(100),
  offset: number().int().nonnegative().optional().default(0)
});
const khaataListQuerySchema = object({
  search: string().trim().optional(),
  limit: number().int().positive().max(500).optional().default(200),
  offset: number().int().nonnegative().optional().default(0)
});
function registerPaymentIpc() {
  require$$3$1.ipcMain.handle("payment:list", async (_e, rawQuery) => {
    const query = paymentListQuerySchema.parse(rawQuery ?? {});
    return paymentService.list(query);
  });
  require$$3$1.ipcMain.handle("payment:count", async (_e, rawQuery) => {
    const query = paymentListQuerySchema.pick({ customerId: true, fromDate: true, toDate: true }).parse(rawQuery ?? {});
    return paymentService.count(query);
  });
  require$$3$1.ipcMain.handle("payment:get", async (_e, id) => {
    return paymentService.getById(id);
  });
  require$$3$1.ipcMain.handle("payment:create", async (_e, rawInput) => {
    const input = createPaymentSchema.parse(rawInput);
    return paymentService.create(input);
  });
  require$$3$1.ipcMain.handle("khaata:list", async (_e, rawQuery) => {
    const query = khaataListQuerySchema.parse(rawQuery ?? {});
    return khaataService.list(query);
  });
  require$$3$1.ipcMain.handle("khaata:detail", async (_e, customerId) => {
    return khaataService.detail(customerId);
  });
  require$$3$1.ipcMain.handle("khaata:totalOutstanding", async () => {
    return khaataService.totalOutstanding();
  });
}
function toDto$1(row) {
  return {
    id: row.id,
    name: row.name,
    amount: row.amount,
    date: Math.floor(row.date.getTime() / 1e3),
    remarks: row.remarks,
    createdAt: Math.floor(row.createdAt.getTime() / 1e3),
    updatedAt: Math.floor(row.updatedAt.getTime() / 1e3)
  };
}
const expenseService = {
  async list(query) {
    const db = getDb();
    const conditions = [];
    if (query.search) {
      conditions.push(like(expenses.name, `%${query.search}%`));
    }
    if (query.fromDate) {
      conditions.push(gte(expenses.date, query.fromDate));
    }
    if (query.toDate) {
      conditions.push(lte(expenses.date, query.toDate));
    }
    const rows = await db.select().from(expenses).where(conditions.length > 0 ? and(...conditions) : void 0).orderBy(desc(expenses.date), desc(expenses.id)).limit(query.limit).offset(query.offset);
    return rows.map(toDto$1);
  },
  async getById(id) {
    const db = getDb();
    const rows = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
    return rows[0] ? toDto$1(rows[0]) : null;
  },
  async create(input) {
    const db = getDb();
    const [row] = await db.insert(expenses).values({
      name: input.name,
      amount: input.amount,
      date: input.date ?? /* @__PURE__ */ new Date(),
      remarks: input.remarks ?? null
    }).returning();
    return toDto$1(row);
  },
  async update(input) {
    const db = getDb();
    const updateValues = { updatedAt: /* @__PURE__ */ new Date() };
    if (input.name !== void 0) updateValues.name = input.name;
    if (input.amount !== void 0) updateValues.amount = input.amount;
    if (input.date !== void 0) updateValues.date = input.date;
    if (input.remarks !== void 0)
      updateValues.remarks = input.remarks ?? null;
    const [row] = await db.update(expenses).set(updateValues).where(eq(expenses.id, input.id)).returning();
    if (!row) throw new Error(`Expense ${input.id} not found`);
    return toDto$1(row);
  },
  async remove(id) {
    const db = getDb();
    await db.delete(expenses).where(eq(expenses.id, id));
  },
  async count(query) {
    const db = getDb();
    const conditions = [];
    if (query.search) conditions.push(like(expenses.name, `%${query.search}%`));
    if (query.fromDate)
      conditions.push(gte(expenses.date, query.fromDate));
    if (query.toDate) conditions.push(lte(expenses.date, query.toDate));
    const [row] = await db.select({ count: sql`count(*)` }).from(expenses).where(conditions.length > 0 ? and(...conditions) : void 0);
    return row?.count ?? 0;
  },
  /**
   * Total expenses within a date range (used for reports).
   */
  async totalInRange(fromDate, toDate) {
    const db = getDb();
    const [row] = await db.select({ total: sql`COALESCE(SUM(${expenses.amount}), 0)` }).from(expenses).where(and(gte(expenses.date, fromDate), lte(expenses.date, toDate)));
    return row?.total ?? 0;
  }
};
function toDto(row) {
  return {
    id: row.id,
    companyId: row.companyId,
    companyName: row.companyName,
    purchaseId: row.purchaseId,
    purchaseNumber: row.purchaseNumber,
    amount: row.amount,
    date: Math.floor(row.date.getTime() / 1e3),
    remarks: row.remarks,
    createdAt: Math.floor(row.createdAt.getTime() / 1e3)
  };
}
const companyPaymentService = {
  async list(query) {
    const db = getDb();
    const conditions = [];
    if (query.companyId) {
      conditions.push(eq(companyPayments.companyId, query.companyId));
    }
    if (query.fromDate) {
      conditions.push(gte(companyPayments.date, query.fromDate));
    }
    if (query.toDate) {
      conditions.push(lte(companyPayments.date, query.toDate));
    }
    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(
        or(like(sql`c.name`, term), like(sql`pur.purchase_number`, term))
      );
    }
    const rows = await db.select({
      id: companyPayments.id,
      companyId: companyPayments.companyId,
      companyName: sql`c.name`,
      purchaseId: companyPayments.purchaseId,
      purchaseNumber: sql`pur.purchase_number`,
      amount: companyPayments.amount,
      date: companyPayments.date,
      remarks: companyPayments.remarks,
      createdAt: companyPayments.createdAt
    }).from(companyPayments).innerJoin(sql`companies c`, sql`c.id = ${companyPayments.companyId}`).leftJoin(sql`purchases pur`, sql`pur.id = ${companyPayments.purchaseId}`).where(conditions.length > 0 ? and(...conditions) : void 0).orderBy(desc(companyPayments.date), desc(companyPayments.id)).limit(query.limit).offset(query.offset);
    return rows.map(toDto);
  },
  async getById(id) {
    const db = getDb();
    const rows = await db.select({
      id: companyPayments.id,
      companyId: companyPayments.companyId,
      companyName: sql`c.name`,
      purchaseId: companyPayments.purchaseId,
      purchaseNumber: sql`pur.purchase_number`,
      amount: companyPayments.amount,
      date: companyPayments.date,
      remarks: companyPayments.remarks,
      createdAt: companyPayments.createdAt
    }).from(companyPayments).innerJoin(sql`companies c`, sql`c.id = ${companyPayments.companyId}`).leftJoin(sql`purchases pur`, sql`pur.id = ${companyPayments.purchaseId}`).where(eq(companyPayments.id, id)).limit(1);
    return rows[0] ? toDto(rows[0]) : null;
  },
  /**
   * Get allocations for a payment (which purchases it was applied to).
   */
  async getAllocations(paymentId) {
    const db = getDb();
    const rows = await db.select({
      id: companyPaymentAllocations.id,
      purchaseId: companyPaymentAllocations.purchaseId,
      purchaseNumber: sql`p.purchase_number`,
      purchaseDate: sql`p.purchase_date`,
      amount: companyPaymentAllocations.amount
    }).from(companyPaymentAllocations).innerJoin(
      sql`purchases p`,
      sql`p.id = ${companyPaymentAllocations.purchaseId}`
    ).where(eq(companyPaymentAllocations.companyPaymentId, paymentId)).orderBy(asc(sql`p.purchase_date`));
    return rows.map((r) => ({
      id: r.id,
      purchaseId: r.purchaseId,
      purchaseNumber: r.purchaseNumber,
      purchaseDate: Math.floor(
        typeof r.purchaseDate === "object" ? r.purchaseDate.getTime() / 1e3 : Number(r.purchaseDate)
      ),
      amount: r.amount
    }));
  },
  /**
   * Record a payment to a company.
   *
   * - If purchaseId is set → allocate ONLY to that purchase.
   * - If purchaseId is null  → FIFO allocate across unpaid purchases (oldest first).
   *
   * Every allocation updates the corresponding purchase's paidAmount.
   * Everything runs in ONE transaction.
   */
  async create(input) {
    const db = getDb();
    const date2 = input.date ?? /* @__PURE__ */ new Date();
    const insertedId = db.transaction((tx) => {
      const [payment] = tx.insert(companyPayments).values({
        companyId: input.companyId,
        purchaseId: input.purchaseId ?? null,
        amount: input.amount,
        date: date2,
        remarks: input.remarks ?? null
      }).returning({ id: companyPayments.id }).all();
      if (input.purchaseId) {
        const [pur] = tx.select().from(purchases).where(eq(purchases.id, input.purchaseId)).limit(1).all();
        if (!pur) throw new Error(`Purchase ${input.purchaseId} not found`);
        const outstanding = pur.totalAmount - pur.paidAmount;
        const allocate = Math.min(input.amount, outstanding);
        if (allocate > 0) {
          tx.insert(companyPaymentAllocations).values({
            companyPaymentId: payment.id,
            purchaseId: pur.id,
            amount: allocate
          }).run();
          tx.update(purchases).set({
            paidAmount: pur.paidAmount + allocate,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq(purchases.id, pur.id)).run();
        }
      } else {
        const unpaidPurchases = tx.select().from(purchases).where(
          and(
            eq(purchases.companyId, input.companyId),
            sql`${purchases.paidAmount} < ${purchases.totalAmount}`
          )
        ).orderBy(asc(purchases.purchaseDate), asc(purchases.id)).all();
        let remaining = input.amount;
        for (const pur of unpaidPurchases) {
          if (remaining <= 0) break;
          const outstanding = pur.totalAmount - pur.paidAmount;
          const allocate = Math.min(remaining, outstanding);
          remaining -= allocate;
          if (allocate <= 0) continue;
          tx.insert(companyPaymentAllocations).values({
            companyPaymentId: payment.id,
            purchaseId: pur.id,
            amount: allocate
          }).run();
          tx.update(purchases).set({
            paidAmount: pur.paidAmount + allocate,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq(purchases.id, pur.id)).run();
        }
        if (remaining > 0) {
          throw new Error(
            `Payment exceeds total outstanding by Rs. ${(remaining / 100).toFixed(2)}. Please reduce the amount.`
          );
        }
      }
      return payment.id;
    });
    const created = await this.getById(insertedId);
    if (!created) throw new Error("Failed to load created payment");
    return created;
  },
  async remove(id) {
    const db = getDb();
    await db.delete(companyPayments).where(eq(companyPayments.id, id));
  },
  /**
   * Total company payments within a date range.
   */
  async totalInRange(fromDate, toDate) {
    const db = getDb();
    const [row] = await db.select({
      total: sql`COALESCE(SUM(${companyPayments.amount}), 0)`
    }).from(companyPayments).where(
      and(
        gte(companyPayments.date, fromDate),
        lte(companyPayments.date, toDate)
      )
    );
    return row?.total ?? 0;
  },
  /**
   * Total outstanding across ALL companies.
   */
  async totalOutstanding() {
    const db = getDb();
    const [row] = await db.select({
      total: sql`COALESCE(SUM(${purchases.totalAmount} - ${purchases.paidAmount}), 0)`
    }).from(purchases);
    return row?.total ?? 0;
  }
};
const optionalTrimmedString = (max) => union([string(), _null(), _undefined()]).transform((v) => {
  if (v === null || v === void 0) return void 0;
  const t = v.trim();
  if (t === "") return void 0;
  if (t.length > max) throw new Error(`Must be at most ${max} characters`);
  return t;
});
const createExpenseSchema = object({
  name: string().trim().min(1, "Name is required").max(120, "Name is too long"),
  amount: number().int().positive("Amount must be positive"),
  // paisa
  date: date().optional(),
  remarks: optionalTrimmedString(500)
});
const updateExpenseSchema = createExpenseSchema.partial().extend({
  id: number().int().positive()
});
const expenseListQuerySchema = object({
  search: string().trim().optional(),
  fromDate: date().optional(),
  toDate: date().optional(),
  limit: number().int().positive().max(500).optional().default(100),
  offset: number().int().nonnegative().optional().default(0)
});
const createCompanyPaymentSchema = object({
  companyId: number().int().positive(),
  purchaseId: number().int().positive().nullable().optional(),
  amount: number().int().positive("Amount must be positive"),
  // paisa
  date: date().optional(),
  remarks: optionalTrimmedString(500)
});
const companyPaymentListQuerySchema = object({
  companyId: number().int().positive().optional(),
  search: string().trim().optional(),
  fromDate: date().optional(),
  toDate: date().optional(),
  limit: number().int().positive().max(500).optional().default(100),
  offset: number().int().nonnegative().optional().default(0)
});
function registerExpenseIpc() {
  require$$3$1.ipcMain.handle("expense:list", async (_e, rawQuery) => {
    const query = expenseListQuerySchema.parse(rawQuery ?? {});
    return expenseService.list(query);
  });
  require$$3$1.ipcMain.handle("expense:count", async (_e, rawQuery) => {
    const query = expenseListQuerySchema.pick({ search: true, fromDate: true, toDate: true }).parse(rawQuery ?? {});
    return expenseService.count(query);
  });
  require$$3$1.ipcMain.handle("expense:get", async (_e, id) => {
    return expenseService.getById(id);
  });
  require$$3$1.ipcMain.handle("expense:create", async (_e, rawInput) => {
    const input = createExpenseSchema.parse(rawInput);
    return expenseService.create(input);
  });
  require$$3$1.ipcMain.handle("expense:update", async (_e, rawInput) => {
    const input = updateExpenseSchema.parse(rawInput);
    return expenseService.update(input);
  });
  require$$3$1.ipcMain.handle("expense:delete", async (_e, id) => {
    await expenseService.remove(id);
    return { ok: true };
  });
  require$$3$1.ipcMain.handle("companyPayment:list", async (_e, rawQuery) => {
    const query = companyPaymentListQuerySchema.parse(rawQuery ?? {});
    return companyPaymentService.list(query);
  });
  require$$3$1.ipcMain.handle("companyPayment:get", async (_e, id) => {
    return companyPaymentService.getById(id);
  });
  require$$3$1.ipcMain.handle("companyPayment:getAllocations", async (_e, id) => {
    return companyPaymentService.getAllocations(id);
  });
  require$$3$1.ipcMain.handle("companyPayment:create", async (_e, rawInput) => {
    const input = createCompanyPaymentSchema.parse(rawInput);
    return companyPaymentService.create(input);
  });
  require$$3$1.ipcMain.handle("companyPayment:delete", async (_e, id) => {
    await companyPaymentService.remove(id);
    return { ok: true };
  });
  require$$3$1.ipcMain.handle("companyPayment:totalOutstanding", async () => {
    return companyPaymentService.totalOutstanding();
  });
}
function registerAllIpc() {
  registerAppIpc();
  registerCustomerIpc();
  registerCompanyIpc();
  registerCategoryIpc();
  registerUnitIpc();
  registerProductIpc();
  registerVariantIpc();
  registerPurchaseIpc();
  registerInventoryIpc();
  registerAdjustmentIpc();
  registerBillIpc();
  registerPaymentIpc();
  registerExpenseIpc();
}
if (started) {
  require$$3$1.app.quit();
}
function createWindow() {
  const win = new require$$3$1.BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 720,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
      // required for better-sqlite3 in main + preload APIs
    }
  });
  win.once("ready-to-show", () => win.show());
  {
    win.loadURL("http://localhost:5173");
  }
}
require$$3$1.app.whenReady().then(() => {
  runMigrations();
  registerAllIpc();
  createWindow();
  require$$3$1.app.on("activate", () => {
    if (require$$3$1.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
require$$3$1.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") require$$3$1.app.quit();
});
require$$3$1.app.on("before-quit", () => {
  closeDb();
});
