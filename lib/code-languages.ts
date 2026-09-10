/**
 * Prism (via refractor) only answers to its own canonical language ids. Authors
 * write js, py, sh, html, c++ and friends, none of which are canonical, so every
 * one of those fences used to render as unhighlighted text. This module maps what
 * people actually type onto what the highlighter accepts.
 */

/** Canonical ids registered by react-syntax-highlighter's Prism async loader. */
const SUPPORTED_LANGUAGES = new Set<string>([
  "abap","abnf","actionscript","ada","agda","al","antlr4","apacheconf","apex","apl","applescript","aql","arduino",
  "arff","armasm","arturo","asciidoc","asm6502","asmatmel","aspnet","autohotkey","autoit","avisynth","avro-idl","awk",
  "bash","basic","batch","bbcode","bbj","bicep","birb","bison","bnf","bqn","brainfuck","brightscript","bro","bsl","c",
  "cfscript","chaiscript","cil","cilkc","cilkcpp","clike","clojure","cmake","cobol","coffeescript","concurnas",
  "cooklang","coq","cpp","crystal","csharp","cshtml","csp","css","css-extras","csv","cue","cypher","d","dart",
  "dataweave","dax","dhall","diff","django","dns-zone-file","docker","dot","ebnf","editorconfig","eiffel","ejs",
  "elixir","elm","erb","erlang","etlua","excel-formula","factor","false","firestore-security-rules","flow","fortran",
  "fsharp","ftl","gap","gcode","gdscript","gedcom","gettext","gherkin","git","glsl","gml","gn","go","go-module",
  "gradle","graphql","groovy","haml","handlebars","haskell","haxe","hcl","hlsl","hoon","hpkp","hsts","http",
  "ichigojam","icon","icu-message-format","idris","iecst","ignore","inform7","ini","io","j","java","javadoc",
  "javadoclike","javascript","javastacktrace","jexl","jolie","jq","js-extras","js-templates","jsdoc","json","json5",
  "jsonp","jsstacktrace","jsx","julia","keepalived","keyman","kotlin","kumir","kusto","latex","latte","less",
  "lilypond","linker-script","liquid","lisp","livescript","llvm","log","lolcode","lua","magma","makefile","markdown",
  "markup","markup-templating","mata","matlab","maxscript","mel","mermaid","metafont","mizar","mongodb","monkey",
  "moonscript","n1ql","n4js","nand2tetris-hdl","naniscript","nasm","neon","nevod","nginx","nim","nix","nsis",
  "objectivec","ocaml","odin","opencl","openqasm","oz","parigp","parser","pascal","pascaligo","pcaxis","peoplecode",
  "perl","php","php-extras","phpdoc","plant-uml","plsql","powerquery","powershell","processing","prolog","promql",
  "properties","protobuf","psl","pug","puppet","pure","purebasic","purescript","python","q","qml","qore","qsharp","r",
  "racket","reason","regex","rego","renpy","rescript","rest","rip","roboconf","robotframework","ruby","rust","sas",
  "sass","scala","scheme","scss","shell-session","smali","smalltalk","smarty","sml","solidity","solution-file","soy",
  "sparql","splunk-spl","sqf","sql","squirrel","stan","stata","stylus","supercollider","swift","systemd","t4-cs",
  "t4-templating","t4-vb","tap","tcl","textile","toml","tremor","tsx","tt2","turtle","twig","typescript","typoscript",
  "unrealscript","uorazor","uri","v","vala","vbnet","velocity","verilog","vhdl","vim","visual-basic","warpscript",
  "wasm","web-idl","wgsl","wiki","wolfram","wren","xeora","xml-doc","xojo","xquery","yaml","yang","zig",
]);

/** Everything an author might realistically type, mapped to a canonical id. */
const LANGUAGE_ALIASES: Record<string, string> = {
  // Web
  js: "javascript", mjs: "javascript", cjs: "javascript", node: "javascript", nodejs: "javascript",
  es6: "javascript", esm: "javascript", ecmascript: "javascript",
  ts: "typescript", mts: "typescript", cts: "typescript",
  html: "markup", htm: "markup", xhtml: "markup", xml: "markup", svg: "markup", rss: "markup", atom: "markup",
  plist: "markup", xsl: "markup", xslt: "markup", vue: "markup", svelte: "markup", astro: "markup", angular: "markup",
  jsp: "markup-templating", aspx: "aspnet", razor: "cshtml",
  hbs: "handlebars", mustache: "handlebars",
  styl: "stylus", postcss: "css", tailwind: "css", tailwindcss: "css",

  // Shell and configuration
  sh: "bash", shell: "bash", zsh: "bash", ksh: "bash", ash: "bash", dash: "bash", sed: "bash",
  env: "bash", dotenv: "bash", envfile: "bash", bashrc: "bash", zshrc: "bash", curl: "bash",
  console: "shell-session", terminal: "shell-session", session: "shell-session", shellsession: "shell-session",
  prompt: "shell-session",
  ps: "powershell", ps1: "powershell", pwsh: "powershell", posh: "powershell",
  bat: "batch", cmd: "batch", dosbatch: "batch",
  yml: "yaml", "docker-compose": "yaml", compose: "yaml",
  conf: "ini", cfg: "ini", config: "ini", desktop: "ini",
  dockerfile: "docker", containerfile: "docker",
  make: "makefile", mk: "makefile", mak: "makefile", gnumakefile: "makefile",
  tf: "hcl", terraform: "hcl", hcl2: "hcl", tfvars: "hcl",
  apache: "apacheconf", htaccess: "apacheconf", nginxconf: "nginx",
  patch: "diff", udiff: "diff",
  gitignore: "ignore", dockerignore: "ignore", npmignore: "ignore",
  systemctl: "systemd", unit: "systemd", service: "systemd",
  jsonc: "json", geojson: "json", jsonl: "json", ndjson: "json", webmanifest: "json",
  props: "properties",

  // C family
  "c++": "cpp", cc: "cpp", cxx: "cpp", hpp: "cpp", "h++": "cpp", hxx: "cpp", cplusplus: "cpp",
  h: "c",
  "objective-c": "objectivec", objc: "objectivec", "obj-c": "objectivec", "objective-cpp": "objectivec",
  "c#": "csharp", cs: "csharp", dotnet: "csharp", netcore: "csharp",
  "f#": "fsharp", fs: "fsharp", fsx: "fsharp",
  vb: "visual-basic", "vb.net": "vbnet", vbs: "visual-basic", vba: "visual-basic",

  // Popular languages
  py: "python", py3: "python", python3: "python", python2: "python", ipython: "python", pyi: "python",
  gyp: "python", sage: "python", vyper: "python",
  rb: "ruby", jruby: "ruby", rbw: "ruby", gemfile: "ruby", rake: "ruby",
  rs: "rust", "rust-lang": "rust",
  golang: "go", gomod: "go-module", "go-mod": "go-module",
  kt: "kotlin", kts: "kotlin",
  pl: "perl", pm: "perl", perl6: "perl", raku: "perl",
  ex: "elixir", exs: "elixir", heex: "elixir", eex: "elixir",
  erl: "erlang", hrl: "erlang",
  hs: "haskell", lhs: "haskell",
  jl: "julia",
  clj: "clojure", cljs: "clojure", cljc: "clojure", edn: "clojure",
  ml: "ocaml", mli: "ocaml",
  scm: "scheme", ss: "scheme", rkt: "racket",
  fortran90: "fortran", f90: "fortran", f95: "fortran",
  octave: "matlab", m: "matlab",
  sv: "verilog", systemverilog: "verilog",
  as: "actionscript", as3: "actionscript",
  cr: "crystal", nimrod: "nim",
  gdscript3: "gdscript", godot: "gdscript",
  sol: "solidity",
  dartlang: "dart", flutter: "dart",
  swiftui: "swift",
  groovylang: "groovy", jenkins: "groovy", jenkinsfile: "groovy",
  scalajs: "scala", sbt: "scala",

  // Data and query
  postgres: "sql", postgresql: "sql", psql: "sql", mysql: "sql", mariadb: "sql", sqlite: "sql", sqlite3: "sql",
  tsql: "sql", mssql: "sql", oracle: "plsql", pgsql: "sql", ddl: "sql", dml: "sql",
  gql: "graphql", graphqls: "graphql",
  cql: "cypher", mongo: "mongodb", mongosh: "mongodb",
  proto: "protobuf", proto3: "protobuf",
  tsv: "csv",

  // Documentation and markup
  md: "markdown", mdown: "markdown", mkd: "markdown", mkdn: "markdown", mdx: "markdown", rmd: "markdown",
  tex: "latex", sty: "latex", cls: "latex", bibtex: "latex", bib: "latex",
  rst: "rest", restructuredtext: "rest", adoc: "asciidoc", asc: "asciidoc",
  regexp: "regex", re: "regex",
  wat: "wasm", webassembly: "wasm",
  httpie: "http",
  vimscript: "vim", viml: "vim",
  puml: "plant-uml", plantuml: "plant-uml",
  gitconfig: "git", gitattributes: "git",
  ino: "arduino",
  feature: "gherkin", cucumber: "gherkin",
  robot: "robotframework",
  logs: "log", logfile: "log", output: "log", stacktrace: "javastacktrace",

  // Assembly
  asm: "nasm", assembly: "nasm", intel: "nasm", "intel-asm": "nasm", x86: "nasm", x86asm: "nasm",
  "x86-64": "nasm", x86_64: "nasm", masm: "nasm", gas: "nasm", att: "nasm",
  arm: "armasm", "arm-asm": "armasm", arm_asm: "armasm", aarch64: "armasm", arm64: "armasm", thumb: "armasm",
  "6502": "asm6502", mos6502: "asm6502",
  atmel: "asmatmel", avr: "asmatmel", avr8: "asmatmel",
  ir: "llvm", llvmir: "llvm",
};

/** Ids that should render as plain, unhighlighted text rather than guess wrong. */
const PLAIN_TEXT_LANGUAGES = new Set([
  "text", "txt", "plain", "plaintext", "none", "nohighlight", "raw", "ascii", "tree", "pre",
]);

/** Nicer than shouting the raw id in the code-block header. */
const DISPLAY_NAMES: Record<string, string> = {
  armasm: "ARM asm", asm6502: "6502 asm", asmatmel: "AVR asm", aspnet: "ASP.NET", bash: "Bash",
  batch: "Batch", c: "C", clike: "C-like", cmake: "CMake", cpp: "C++", csharp: "C#", cshtml: "Razor",
  css: "CSS", csv: "CSV", diff: "Diff", docker: "Dockerfile", fsharp: "F#", gdscript: "GDScript",
  gherkin: "Gherkin", glsl: "GLSL", go: "Go", "go-module": "go.mod", graphql: "GraphQL", hcl: "HCL",
  http: "HTTP", ignore: "ignore", ini: "INI", javascript: "JavaScript", javastacktrace: "Java trace",
  json: "JSON", json5: "JSON5", jsx: "JSX", latex: "LaTeX", llvm: "LLVM IR", makefile: "Makefile",
  markdown: "Markdown", markup: "HTML", "markup-templating": "Template", matlab: "MATLAB", mermaid: "Mermaid",
  nasm: "x86 asm", nginx: "nginx", objectivec: "Objective-C", ocaml: "OCaml", php: "PHP", "plant-uml": "PlantUML",
  plsql: "PL/SQL", powershell: "PowerShell", properties: "Properties", protobuf: "Protobuf", python: "Python",
  qsharp: "Q#", regex: "RegExp", rest: "reStructuredText", ruby: "Ruby", rust: "Rust", sass: "Sass", scss: "SCSS",
  "shell-session": "Console", solidity: "Solidity", sql: "SQL", systemd: "systemd", toml: "TOML", tsx: "TSX",
  typescript: "TypeScript", "visual-basic": "Visual Basic", vbnet: "VB.NET", verilog: "Verilog", vhdl: "VHDL",
  vim: "Vim", wasm: "WebAssembly", wgsl: "WGSL", "xml-doc": "XML doc", yaml: "YAML", zig: "Zig",
};

export type ResolvedLanguage = {
  /** Canonical Prism id, or an empty string when the block renders as plain text. */
  id: string;
  /** Human label for the code-block header. */
  label: string;
  /** False when the author's language was not recognised at all. */
  recognized: boolean;
};

function displayNameFor(canonical: string, original: string): string {
  const named = DISPLAY_NAMES[canonical];
  if (named) return named;

  const source = original || canonical;
  if (source.length <= 3) return source.toUpperCase();
  return source.charAt(0).toUpperCase() + source.slice(1);
}

export function resolveCodeLanguage(raw?: string | null): ResolvedLanguage {
  const input = (raw ?? "").trim().toLowerCase().replace(/^language-/, "");

  if (!input) {
    return { id: "", label: "Code", recognized: true };
  }

  if (PLAIN_TEXT_LANGUAGES.has(input)) {
    return { id: "", label: "Text", recognized: true };
  }

  const aliased = LANGUAGE_ALIASES[input] ?? input;

  if (SUPPORTED_LANGUAGES.has(aliased)) {
    return { id: aliased, label: displayNameFor(aliased, input), recognized: true };
  }

  // Unknown ids still deserve their label in the header, just without highlighting.
  return { id: "", label: displayNameFor(input, input), recognized: false };
}

export function isMermaidLanguage(raw?: string | null): boolean {
  const input = (raw ?? "").trim().toLowerCase().replace(/^language-/, "");
  return input === "mermaid" || input === "mmd";
}

/** Languages offered in the admin editor's code-block picker. */
export const COMMON_EDITOR_LANGUAGES: { id: string; label: string }[] = [
  { id: "", label: "Plain text" },
  { id: "bash", label: "Bash" },
  { id: "c", label: "C" },
  { id: "cpp", label: "C++" },
  { id: "csharp", label: "C#" },
  { id: "css", label: "CSS" },
  { id: "diff", label: "Diff" },
  { id: "docker", label: "Dockerfile" },
  { id: "go", label: "Go" },
  { id: "graphql", label: "GraphQL" },
  { id: "html", label: "HTML" },
  { id: "java", label: "Java" },
  { id: "javascript", label: "JavaScript" },
  { id: "json", label: "JSON" },
  { id: "kotlin", label: "Kotlin" },
  { id: "lua", label: "Lua" },
  { id: "markdown", label: "Markdown" },
  { id: "mermaid", label: "Mermaid diagram" },
  { id: "nasm", label: "x86 assembly" },
  { id: "php", label: "PHP" },
  { id: "powershell", label: "PowerShell" },
  { id: "python", label: "Python" },
  { id: "ruby", label: "Ruby" },
  { id: "rust", label: "Rust" },
  { id: "shell-session", label: "Console session" },
  { id: "sql", label: "SQL" },
  { id: "swift", label: "Swift" },
  { id: "toml", label: "TOML" },
  { id: "tsx", label: "TSX" },
  { id: "typescript", label: "TypeScript" },
  { id: "yaml", label: "YAML" },
];
