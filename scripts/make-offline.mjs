// Turns the static export in out/ into a copy that opens by double-clicking index.html (file://).
// Usage: node scripts/make-offline.mjs [src=out] [dest=out-offline]
import { cpSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const src = process.argv[2] ?? "out";
const dest = process.argv[3] ?? "out-offline";
rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });

const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

// Clean URLs map to the exported files: "/" -> "index.html", "/runs/x?a=1" -> "runs/x.html?a=1".
// Asset paths (with an extension) are left as they are.
const mapPath = (p) => {
  const [, path, rest] = p.match(/^([^?#]*)(.*)$/);
  if (/\.[a-z0-9]+$/i.test(path)) return path + rest;
  const clean = path.replace(/\/$/, "");
  return (clean ? `${clean}.html` : "index.html") + rest;
};

// Runs before Next's router: sends internal links to the right index.html on disk.
const runtime = `(function(){var B=window.__AC_BASE__;
function to(h){if(!h||h.charAt(0)==="#"||/^[a-z][a-z0-9+.-]*:/i.test(h)||h.slice(0,2)==="//")return null;
var u;if(h.charAt(0)==="/"){var m=h.slice(1).match(/^([^?#]*)(.*)$/),p=m[1].replace(/\\/$/,"");
if(!/\\.[a-z0-9]+$/i.test(p))p=p?p+".html":"index.html";u=new URL(B+p+m[2],location.href);}
else{u=new URL(h,location.href);}return u.href;}
document.addEventListener("click",function(e){if(e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
if(e.target.closest&&e.target.closest("button"))return;var a=e.target.closest&&e.target.closest("a[href]");if(!a||a.target==="_blank"||a.hasAttribute("download"))return;
var u=to(a.getAttribute("href"));if(!u)return;e.preventDefault();e.stopPropagation();location.href=u;},true);
var f=window.fetch;window.fetch=function(i,o){var s=typeof i==="string"?i:i instanceof URL?i.href:i&&i.url;
if(s&&(s.charAt(0)==="/"&&s.charAt(1)!=="/"||s.slice(0,5)==="file:")&&/\\.txt(\\?|$)|_rsc=/.test(s))return new Promise(function(){});
return f.apply(this,arguments);};})();`;

let pages = 0;
for (const file of walk(dest)) {
  if (file.endsWith(".css")) {
    writeFileSync(file, readFileSync(file, "utf8").replaceAll("url(/_next/static/", "url(../"));
    continue;
  }
  if (/webpack-[^/\\]+\.js$/.test(file)) {
    writeFileSync(file, readFileSync(file, "utf8").replace('.p="/_next/"', '.p=(window.__AC_BASE__||"/")+"_next/"'));
    continue;
  }
  if (!file.endsWith(".html")) continue;
  const depth = relative(dest, file).split(sep).length - 1;
  const base = depth ? "../".repeat(depth) : "./";
  let html = readFileSync(file, "utf8");
  html = html
    .replace(/\b(href|src|action)="\/(?!\/)([^"]*)"/g, (_, a, p) => `${a}="${base}${mapPath(p)}"`)
    .replaceAll('\\"/_next/', `\\"${base}_next/`)
    .replace("<head>", `<head><script>window.__AC_BASE__=${JSON.stringify(base)};${runtime}</script>`);
  writeFileSync(file, html);
  pages++;
}
console.log(`✓ ${pages} pages ready in ${dest}/ (open index.html)`);
