'use client'
import { Github, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { useCompletion } from 'ai/react'
import { Slider } from '@/components/ui/slider'
import { VideoInputForm } from '@/components/VideoInputForm'
import { PromptSelect } from '@/components/PromptSelect'
import { ChangeEvent, useRef, useState } from 'react'

export type Status = 'waiting' | 'converting' | 'gererating' | 'success'

export default function Home() {
  const [temperature, setTemperature] = useState<number>(0.5)
  const [videoId, setVideoId] = useState<string | null>(null)
  const [transcription, setTranscription] = useState('')

  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [key, setKey] = useState<number>(0)
  const [status, setStatus] = useState<Status>('waiting')
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
  const selectRef = useRef<HTMLButtonElement | null>(null)

  const {
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    completion,
    isLoading,
  } = useCompletion({
    api: `${process.env.NEXT_PUBLIC_HOST_URL}/api/complete`,
    body: {
      transcription,
      temperature,
    },
    headers: {
      'Content-type': 'application/json',
    },
  })

  const handleFileSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const { files } = event.currentTarget
    if (!files) {
      return null
    }
    const selectedFile = files[0]
    setVideoFile(selectedFile)
    // Atualize a chave para forçar a re-renderização
    textAreaRef.current!.value = ''
    selectRef.current!.value = ''

    setStatus('waiting')
    setTemperature(0.5)
    setKey((prevKey) => prevKey + 1)
  }

  return (
    <div className=" flex min-h-screen flex-col">
      <div className="flex items-center justify-between border-b px-6 py-3">
        <h1 className="text-xl font-bold">Upload IA</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Desenvolvido com 💚
          </span>
          <Separator orientation="vertical" className="h-6" />
          <Button className="flex gap-2" variant="outline">
            <Github className="h-4 w-4" />
            <span>Github</span>
          </Button>
        </div>
      </div>
      <main className="flex flex-1 flex-col-reverse items-center gap-6 p-6 md:flex-row md:items-stretch  ">
        <div className="flex flex-1 flex-col gap-4 ">
          <div className="flex flex-1 flex-col gap-4">
            <Textarea
              className="flex min-h-[40vh] flex-1 resize-none p-4 leading-relaxed"
              placeholder="Inclua o prompt para a IA..."
              value={input}
              onChange={handleInputChange}
            />
            <Textarea
              className="flex min-h-[40vh] flex-1 resize-none p-4 leading-relaxed"
              placeholder="Resultado gerado pela IA..."
              readOnly
              value={completion}
            />
          </div>
          <span className="text-sm text-muted-foreground">
            Lembre-se: você pode utilizar a variável{' '}
            <code className="text-violet-400">transcription</code> no seu prompt
            para adiconar o conteúdo da transcrição do video selecionado.
          </span>
        </div>
        <aside className="w-[300px] space-y-6 pb-10">
          <VideoInputForm
            textAreaRef={textAreaRef}
            status={status}
            videoFile={videoFile}
            keyFile={key}
            setStatus={setStatus}
            setTranscription={setTranscription}
            onVideoUploaded={setVideoId}
            onFileSelected={handleFileSelected}
          />

          <Separator />

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Prompt</Label>
              <PromptSelect onPromptSelected={setInput} selectRef={selectRef} />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Modelo</Label>
              <Select disabled defaultValue="gpt3.5">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt3.5">GPT 3.5-turbo 16k</SelectItem>
                </SelectContent>
              </Select>
              <span className="block text-xs italic text-muted-foreground">
                Você podera custominar essa opção em breve
              </span>
            </div>
            <Separator />
            <div className="space-y-4">
              <Label>Temperatura</Label>
              <Slider
                min={0}
                max={1}
                step={0.1}
                value={[temperature]}
                onValueChange={(value) => setTemperature(value[0])}
              />
              <span className="block text-xs italic leading-relaxed text-muted-foreground">
                Valores mais altos tendem a deixar os resultados mais criativos
                e com possíveis erros
              </span>
            </div>
            <Button
              disabled={isLoading || status !== 'success'}
              type="submit"
              className="w-full"
            >
              {!isLoading ? 'Executar' : 'Gerando...'}
              <Wand2 className="ml-5 h-4 w-4" />
            </Button>
          </form>
        </aside>
      </main>
    </div>
  )
}
