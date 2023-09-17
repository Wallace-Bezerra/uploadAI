'use client'

import React, { MutableRefObject, useEffect, useState } from 'react'
import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/lib/axios'

interface Prompt {
  id: string
  title: string
  template: string
}

interface PromptSelectedProps {
  selectRef: MutableRefObject<HTMLButtonElement | null>
  onPromptSelected: (template: string) => void
}

export const PromptSelect = ({
  onPromptSelected,
  selectRef,
}: PromptSelectedProps) => {
  const [prompts, setPrompts] = useState<Prompt[] | null>([])

  const fetchPrompt = async () => {
    const response = await api.get('/api/prompts')
    setPrompts(response.data)
  }
  useEffect(() => {
    fetchPrompt()
  }, [])

  const handlePromptSelected = (promptId: string) => {
    const selectedPrompt = prompts?.find((prompt) => prompt.id === promptId)
    if (!selectedPrompt) {
      return
    }
    onPromptSelected(selectedPrompt.template)
  }

  return (
    <Select onValueChange={handlePromptSelected}>
      <SelectTrigger ref={selectRef}>
        <SelectValue placeholder="Selecione um prompt..." />
      </SelectTrigger>
      <SelectContent>
        {prompts?.map((prompt) => (
          <SelectItem key={prompt.id} value={prompt.id}>
            {prompt.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
