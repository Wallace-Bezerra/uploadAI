/* eslint-disable @typescript-eslint/ban-ts-comment */
import { NextResponse } from 'next/server'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import { openai } from '@/lib/openai'

export async function POST(request: Request, response: Response) {
  // @ts-ignore
  const req = await request.json()
  const { transcription, temperature, prompt } = req
  // console.log({ transcription, temperature, prompt })
  const promptMessage = prompt.replace('{transcription}', transcription)
  console.log(promptMessage)

  const responseAI = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo-16k',
    temperature,
    messages: [{ role: 'user', content: promptMessage }],
    stream: true,
  })

  const stream = OpenAIStream(responseAI)

  return new StreamingTextResponse(stream, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST',
    },
  })

  // return NextResponse.json({ ok: 'teste complete' })
}
