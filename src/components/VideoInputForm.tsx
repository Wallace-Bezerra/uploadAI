/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-useless-return */
'use client'
import React, {
  ChangeEvent,
  Dispatch,
  FormEvent,
  MutableRefObject,
  SetStateAction,
  useMemo,
  useState,
} from 'react'
import { FileVideo, Upload, CheckCircle } from 'lucide-react'
import { Label } from '@radix-ui/react-label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Status } from '../app/page'
// @ts-ignore
import { fetchFile } from '@ffmpeg/util'
import { getFFmpeg } from '@/lib/ffmpeg'
import { api } from '@/lib/axios'
import { openai } from '@/lib/openai'

interface VideoInputFormProps {
  textAreaRef: MutableRefObject<HTMLTextAreaElement | null>
  status: Status
  videoFile: File | null
  keyFile: number
  setTranscription: Dispatch<SetStateAction<string>>
  setStatus: Dispatch<SetStateAction<Status>>
  onVideoUploaded: (videoId: string) => void
  onFileSelected: (event: ChangeEvent<HTMLInputElement>) => void
}

export const VideoInputForm = ({
  textAreaRef,
  status,
  videoFile,
  keyFile,
  setStatus,
  setTranscription,
  onVideoUploaded,
  onFileSelected,
}: VideoInputFormProps) => {
  const [progress, setProgress] = useState(0)
  const previewURL = useMemo(() => {
    if (!videoFile) {
      return null
    }
    return URL.createObjectURL(videoFile)
  }, [videoFile])

  const convertVideoToAudio = async (video: File) => {
    console.log('Convert Starter')
    try {
      const ffmpeg = await getFFmpeg()
      ffmpeg.writeFile('input.mp4', await fetchFile(video))
      ffmpeg.on('progress', (progress) => {
        setProgress(Math.round(progress.progress * 100))
        console.log(`Convert progress ${Math.round(progress.progress * 100)}`)
      })

      await ffmpeg.exec([
        '-i',
        'input.mp4',
        '-map',
        '0:a',
        '-b:a',
        '20k',
        '-acodec',
        'libmp3lame',
        'output.mp3',
      ])

      const data = await ffmpeg.readFile('output.mp3')
      const audioFileBlob = new Blob([data], { type: 'audio/mpeg' })
      const audioFile = new File([audioFileBlob], 'audio.mp3', {
        type: 'audio/mpeg',
      })

      console.log('Convert finished')

      return audioFile
    } catch (error) {
      console.log(error)
    }
  }

  const handleUploadVideo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const prompt = textAreaRef.current?.value

    if (!videoFile) {
      return
    }
    setStatus('converting')
    // converter o video em audio

    const audioFile = await convertVideoToAudio(videoFile)
    if (!audioFile) {
      return
    }
    const data = new FormData()
    data.append('file', audioFile)

    // const response = await api.post('/upload', data)
    // console.log(response.data)
    // const videoId = response.data.video.id

    setStatus('gererating')
    // const transcription = await api.post(`/videos/${videoId}/transcription`, {
    //   prompt,
    //   audioFile,
    // })
    // const transcription = await api.post(
    //   `/videos/${videoId}/transcription`,
    //   data,
    // )

    try {
      const response = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        prompt,
        temperature: 0,
        language: 'pt',
        response_format: 'json',
      })

      const transcription = response.text

      // console.log('transcrição feita', transcription)
      setTranscription(transcription)
      setStatus('success')
    } catch (error) {
      console.log(error)
    }
    // console.log(transcription)

    // console.log('idvideo', videoId)
    // onVideoUploaded(videoId)
  }
  const statusState = {
    gererating: 'Gerando...',
    converting: 'Convertendo...',
    success: 'Concluido',
  }

  return (
    <form onSubmit={handleUploadVideo} className="space-y-6">
      <label
        className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed text-sm hover:bg-primary/5"
        htmlFor="video"
      >
        {previewURL ? (
          <video
            className="pointer-events-none inset-0 aspect-video rounded-xl "
            key={keyFile}
          >
            <source src={previewURL} />
          </video>
        ) : (
          <>
            <FileVideo />
            Selecione um vídeo
          </>
        )}
        <input
          className="sr-only"
          type="file"
          id="video"
          accept="video/mp4"
          onChange={onFileSelected}
        />
      </label>

      <Separator />
      <div className="space-y-2">
        <Label htmlFor="transcription_prompt">Prompt de Descrição</Label>
        <Textarea
          id="transcription_prompt"
          className="h-20 resize-none leading-relaxed"
          placeholder="Inclua palavras-chaves mencionadas no Vídeo separadas por vírgula (,)"
          ref={textAreaRef}
        />
      </div>
      <Button
        data-success={status === 'success'}
        data-converting={status === 'converting'}
        data-gererating={status === 'gererating'}
        disabled={status !== 'waiting'}
        type="submit"
        className="w-full 
        text-xl
        transition-all
        disabled:cursor-not-allowed
        disabled:opacity-100 
        data-[converting=true]:bg-cyan-600
        data-[gererating=true]:bg-purple-500
        data-[success=true]:bg-emerald-600 
        data-[converting=true]:text-white
        data-[gererating=true]:text-white
        data-[success=true]:text-white 
        "
      >
        {status === 'waiting' && (
          <>
            Carregar vídeo
            <Upload className="ml-5 h-4 w-4" />
          </>
        )}
        {status === 'gererating' && (
          <>
            {statusState[status]}
            <div className="ml-5 h-5 w-5 animate-spin rounded-full border-2 border-solid border-transparent border-l-white border-t-white"></div>{' '}
          </>
        )}

        {status === 'converting' && (
          <>
            {statusState[status]}
            <div className="mx-5 h-5 w-5 animate-spin rounded-full border-2 border-solid border-transparent border-l-white border-t-white"></div>{' '}
            {progress >= 0 && progress}
          </>
        )}
        {status === 'success' && (
          <>
            {statusState[status]}
            <CheckCircle className="ml-5" />
          </>
        )}
      </Button>
      {/* {progress}
      <Button type="button" onClick={() => setStatus('gererating')}>
        gerando
      </Button>
      <Button type="button" onClick={() => setStatus('converting')}>
        convertendo
      </Button>
      <Button type="button" onClick={() => setStatus('success')}>
        sucesso
      </Button>
      {status} */}
    </form>
  )
}
