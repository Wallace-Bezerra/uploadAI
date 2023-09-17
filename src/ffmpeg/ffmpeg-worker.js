'use strict'
let Module = {}
const ENVIRONMENT_IS_NODE =
  typeof process === 'object' &&
  typeof process.versions === 'object' &&
  typeof process.versions.node === 'string'
if (ENVIRONMENT_IS_NODE) {
  const nodeWorkerThreads = require('worker_threads')
  const parentPort = nodeWorkerThreads.parentPort
  parentPort.on('message', (data) => onmessage({ data }))
  var fs = require('fs')
  Object.assign(global, {
    self: global,
    require,
    Module,
    location: { href: __filename },
    Worker: nodeWorkerThreads.Worker,
    importScripts: function (f) {
      ;(0, eval)(fs.readFileSync(f, 'utf8') + '//# sourceURL=' + f)
    },
    postMessage: function (msg) {
      parentPort.postMessage(msg)
    },
    performance: global.performance || {
      now: function () {
        return Date.now()
      },
    },
  })
}
let initializedJS = false
function threadPrintErr() {
  const text = Array.prototype.slice.call(arguments).join(' ')
  if (ENVIRONMENT_IS_NODE) {
    fs.writeSync(2, text + '\n')
    return
  }
  console.error(text)
}
function threadAlert() {
  const text = Array.prototype.slice.call(arguments).join(' ')
  postMessage({ cmd: 'alert', text, threadId: Module._pthread_self() })
}
const err = threadPrintErr
self.alert = threadAlert
Module.instantiateWasm = (info, receiveInstance) => {
  const module = Module.wasmModule
  Module.wasmModule = null
  const instance = new WebAssembly.Instance(module, info)
  return receiveInstance(instance)
}
self.onunhandledrejection = (e) => {
  throw e.reason ?? e
}
function handleMessage(e) {
  try {
    if (e.data.cmd === 'load') {
      const messageQueue = []
      self.onmessage = (e) => messageQueue.push(e)
      self.startWorker = (instance) => {
        Module = instance
        postMessage({ cmd: 'loaded' })
        for (const msg of messageQueue) {
          handleMessage(msg)
        }
        self.onmessage = handleMessage
      }
      Module.wasmModule = e.data.wasmModule
      for (const handler of e.data.handlers) {
        Module[handler] = function () {
          postMessage({
            cmd: 'callHandler',
            handler,
            args: [...arguments],
          })
        }
      }
      Module.wasmMemory = e.data.wasmMemory
      Module.buffer = Module.wasmMemory.buffer
      Module.ENVIRONMENT_IS_PTHREAD = true
      ;(e.data.urlOrBlob
        ? import(e.data.urlOrBlob)
        : import('./ffmpeg-core.js')
      ).then((exports) => exports.default(Module))
    } else if (e.data.cmd === 'run') {
      Module.__emscripten_thread_init(e.data.pthread_ptr, 0, 0, 1)
      Module.__emscripten_thread_mailbox_await(e.data.pthread_ptr)
      Module.establishStackSpace()
      Module.PThread.receiveObjectTransfer(e.data)
      Module.PThread.threadInitTLS()
      if (!initializedJS) {
        initializedJS = true
      }
      try {
        Module.invokeEntryPoint(e.data.start_routine, e.data.arg)
      } catch (ex) {
        if (ex != 'unwind') {
          throw ex
        }
      }
    } else if (e.data.cmd === 'cancel') {
      if (Module._pthread_self()) {
        Module.__emscripten_thread_exit(-1)
      }
    } else if (e.data.target === 'setimmediate') {
    } else if (e.data.cmd === 'checkMailbox') {
      if (initializedJS) {
        Module.checkMailbox()
      }
    } else if (e.data.cmd) {
      err('worker.js received unknown command ' + e.data.cmd)
      err(e.data)
    }
  } catch (ex) {
    if (Module.__emscripten_thread_crashed) {
      Module.__emscripten_thread_crashed()
    }
    throw ex
  }
}
self.onmessage = handleMessage
