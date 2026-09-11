// Jest transforms every file through Babel to CommonJS. `import.meta.env` (Vite's env
// access, e.g. src/api/claude/messages.ts, src/router/index.ts) has no CJS equivalent,
// so Babel leaves the literal `import.meta` in the output and Node throws at eval time
// ("Cannot use 'import.meta' outside a module"). This plugin replaces any `import.meta.env`
// member expression with an empty object, so `import.meta.env.SOME_FLAG` becomes `undefined`
// under Jest — the real value only ever matters in the Vite-built app.
function stripImportMetaEnv({ types: t }) {
  return {
    visitor: {
      MemberExpression(path) {
        const obj = path.node.object
        if (
          obj.type === 'MetaProperty' &&
          obj.meta.name === 'import' &&
          obj.property.name === 'meta' &&
          !path.node.computed &&
          path.node.property.name === 'env'
        ) {
          path.replaceWith(t.objectExpression([]))
        }
      },
    },
  }
}

module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }], '@babel/preset-typescript'],
  plugins: [stripImportMetaEnv],
}
