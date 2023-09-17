/* eslint-disable @typescript-eslint/ban-ts-comment */
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL } from '@ffmpeg/util'
// @ts-ignore
// import coreURL from '../ffmpeg/ffmpeg-core.js?url'
// // @ts-ignore
// import workerURL from '../ffmpeg/ffmpeg-worker.js?url'
// // @ts-ignore
// import wasmURL from '../ffmpeg/ffmpeg.core.wasm'

let ffmpeg: FFmpeg | null

export async function getFFmpeg() {
  if (ffmpeg) {
    return ffmpeg
  }
  ffmpeg = new FFmpeg()
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.2/dist/umd'

  if (!ffmpeg.loaded) {
    // await ffmpeg.load({
    //   coreURL,
    //   workerURL,
    //   wasmURL,
    // })
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        'application/wasm',
      ),
    })
  }
  return ffmpeg
}
