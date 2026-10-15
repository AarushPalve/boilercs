/* ---------------------------------------------------------------------------
 * Isolated in-browser JavaScript runner (Web Worker).
 *
 * Implements the Execution Layer from the architecture + security specs:
 *  - Runs user JS off the main thread so an infinite loop never freezes the UI.
 *  - Communicates only via postMessage.
 *  - A console shim buffers stdout/stderr and ships it back to the main thread.
 *
 * The 3-second watchdog + forced .terminate() lives on the MAIN thread
 * (see jsRunner.ts) because a busy-looping worker cannot time itself out.
 * ------------------------------------------------------------------------- */

self.onmessage = function (e) {
  var data = e.data || {};
  if (data.type !== 'run') return;

  var code = String(data.code || '');
  var out = [];
  var err = [];

  function fmt(args) {
    return Array.prototype.map
      .call(args, function (a) {
        if (typeof a === 'string') return a;
        try {
          return JSON.stringify(a);
        } catch (_) {
          return String(a);
        }
      })
      .join(' ');
  }

  var sandboxConsole = {
    log: function () {
      out.push(fmt(arguments));
    },
    info: function () {
      out.push(fmt(arguments));
    },
    warn: function () {
      err.push(fmt(arguments));
    },
    error: function () {
      err.push(fmt(arguments));
    },
    debug: function () {
      out.push(fmt(arguments));
    },
  };

  try {
    // Execute user code with a captured console. No DOM, no network objects
    // are provided; the worker scope is already isolated from the page.
    // eslint-disable-next-line no-new-func
    var fn = new Function('console', '"use strict";\n' + code);
    fn(sandboxConsole);
    self.postMessage({
      type: 'result',
      ok: true,
      stdout: out.join('\n'),
      stderr: err.join('\n'),
    });
  } catch (ex) {
    err.push((ex && ex.name ? ex.name + ': ' : '') + (ex && ex.message ? ex.message : String(ex)));
    self.postMessage({
      type: 'result',
      ok: false,
      stdout: out.join('\n'),
      stderr: err.join('\n'),
    });
  }
};
