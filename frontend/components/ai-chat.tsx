import React, { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AiChatProps {
  t: (key: string) => string
}

const QUICK_PROMPTS_EN = [
  'How is my store doing?',
  'Which products need attention?',
  'How can I increase revenue?',
  'Analyze my customer base',
]

const QUICK_PROMPTS_ES = [
  '¿Cómo va mi tienda?',
  '¿Qué productos necesitan atención?',
  '¿Cómo puedo aumentar ingresos?',
  'Analiza mi base de clientes',
]

// Simulated AI responses (used when API is not available)
const MOCK_RESPONSES: Record<string, { en: string; es: string }> = {
  'how is my store doing?': {
    en: '📊 Your store health score is 6.9/10 (Fair). Revenue is up 17.6% vs last week — strong momentum. However, Customer Mix score is low at 3.5 — you need more returning customers. I recommend a loyalty discount campaign targeting one-time buyers.',
    es: '📊 Tu puntuación de salud es 6.9/10 (Regular). Los ingresos subieron 17.6% vs semana pasada — buen momentum. Sin embargo, el Mix de Clientes es bajo (3.5) — necesitas más clientes recurrentes. Recomiendo una campaña de descuento de lealtad para compradores únicos.',
  },
  '¿cómo va mi tienda?': {
    en: '📊 Your store health score is 6.9/10 (Fair). Revenue is up 17.6% vs last week — strong momentum. However, Customer Mix score is low at 3.5 — you need more returning customers.',
    es: '📊 Tu puntuación de salud es 6.9/10 (Regular). Los ingresos subieron 17.6% vs semana pasada — buen momentum. Sin embargo, el Mix de Clientes es bajo (3.5) — necesitas más clientes recurrentes. Recomiendo una campaña de descuento de lealtad.',
  },
  'which products need attention?': {
    en: '⚠️ 2 products need immediate attention:\n\n1. **The Draft Snowboard** — 0 sales in 14 days. Dead stock. Recommend 20% discount.\n2. **The Complete Snowboard** — only 3 units left, selling ~4/day. Will stockout in <1 day. Urgent restock needed.\n\nAlpine Goggles are archived with 0 inventory — consider removing from catalog.',
    es: '⚠️ 2 productos necesitan atención inmediata:\n\n1. **The Draft Snowboard** — 0 ventas en 14 días. Stock muerto. Recomiendo 20% de descuento.\n2. **The Complete Snowboard** — solo 3 unidades, vendiendo ~4/día. Se agota en <1 día. Restock urgente.\n\nAlpine Goggles está archivado con 0 inventario — considera eliminarlo del catálogo.',
  },
  '¿qué productos necesitan atención?': {
    en: '⚠️ 2 products need immediate attention:\n\n1. **The Draft Snowboard** — 0 sales in 14 days.\n2. **The Complete Snowboard** — only 3 units left.',
    es: '⚠️ 2 productos necesitan atención:\n\n1. **The Draft Snowboard** — 0 ventas en 14 días. Stock muerto.\n2. **The Complete Snowboard** — solo 3 unidades. Restock urgente.',
  },
  'how can i increase revenue?': {
    en: '💰 3 quick wins based on your data:\n\n1. **Bundle top sellers** — Complete Snowboard + Ski Wax bundle at 10% off. They\'re frequently bought together.\n2. **Re-engage dormant customers** — 312 active customers but low return rate. Send a "We miss you" email with 15% off code.\n3. **Capitalize on the sales spike** — Orders are 4.2x normal right now. Push a flash sale to ride the momentum.\n\nEstimated impact: +$2,400/week.',
    es: '💰 3 acciones rápidas basadas en tu data:\n\n1. **Bundle de bestsellers** — Complete Snowboard + Ski Wax con 10% off. Se compran juntos frecuentemente.\n2. **Reactivar clientes dormidos** — 312 clientes activos pero baja tasa de retorno. Envía email "Te extrañamos" con 15% off.\n3. **Aprovechar el pico de ventas** — Los pedidos son 4.2x lo normal ahora. Lanza flash sale.\n\nImpacto estimado: +$2,400/semana.',
  },
  '¿cómo puedo aumentar ingresos?': {
    en: '💰 3 quick wins based on your data...',
    es: '💰 3 acciones rápidas:\n\n1. **Bundle de bestsellers** — Complete Snowboard + Ski Wax con 10% off.\n2. **Reactivar clientes dormidos** — Email "Te extrañamos" con 15% off.\n3. **Aprovechar el pico** — Flash sale ahora que los pedidos son 4.2x lo normal.\n\nImpacto: +$2,400/semana.',
  },
  'analyze my customer base': {
    en: '👥 Customer Analysis:\n\n- **891 total customers**, 312 active (35%)\n- **Avg lifetime value**: $186.09\n- **Return rate**: 35% (below 40% benchmark)\n- **Top segment**: Champions (12%) — high R, F, M scores\n- **Biggest opportunity**: 248 "At Risk" customers who bought 2+ times but haven\'t returned in 30 days\n\nAction: Target "At Risk" segment with personalized win-back campaign. Expected recovery: 15-20% = ~50 customers = ~$9,300 revenue.',
    es: '👥 Análisis de Clientes:\n\n- **891 clientes totales**, 312 activos (35%)\n- **Valor de vida promedio**: $186.09\n- **Tasa de retorno**: 35% (debajo del benchmark de 40%)\n- **Segmento top**: Champions (12%)\n- **Mayor oportunidad**: 248 clientes "En Riesgo" que compraron 2+ veces pero no vuelven hace 30 días\n\nAcción: Campaña de win-back personalizada. Recuperación esperada: 15-20% = ~50 clientes = ~$9,300.',
  },
  'analiza mi base de clientes': {
    en: '👥 Customer Analysis: 891 total, 312 active...',
    es: '👥 Análisis:\n\n- **891 clientes**, 312 activos (35%)\n- **Valor promedio**: $186.09\n- **Oportunidad**: 248 clientes "En Riesgo". Campaña win-back = ~$9,300 recuperados.',
  },
}

function getResponse(input: string, lang: 'en' | 'es'): string {
  const key = input.toLowerCase().trim()
  for (const [k, v] of Object.entries(MOCK_RESPONSES)) {
    if (key.includes(k) || k.includes(key)) {
      return v[lang]
    }
  }
  return lang === 'en'
    ? '🤔 I\'m analyzing your store data... Based on what I see, your store is performing well with room for growth. Try asking about specific areas like products, revenue, or customers.'
    : '🤔 Analizando los datos de tu tienda... En general va bien con espacio para crecer. Pregunta sobre áreas específicas como productos, ingresos o clientes.'
}

export default function AiChat({ t }: AiChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [lang, setLang] = useState<'en' | 'es'>('en')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Detect lang from t function
  useEffect(() => {
    const test = t('healthScore')
    setLang(test === 'Puntuación de Salud' ? 'es' : 'en')
  }, [t])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const quickPrompts = lang === 'es' ? QUICK_PROMPTS_ES : QUICK_PROMPTS_EN

  const sendMessage = async (text: string) => {
    if (!text.trim()) return

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Simulate AI thinking delay
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200))

    const response = getResponse(text, lang)
    const aiMsg: Message = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, aiMsg])
    setIsTyping(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-accent/15 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 14 14" className="text-accent">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" fill="none" />
            <path d="M5 6.5c0-.8.9-1.5 2-1.5s2 .7 2 1.5-.9 1.5-2 1.5v1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" />
            <circle cx="7" cy="10.5" r="0.5" fill="currentColor" />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-text-primary">{t('aiCeo')}</h3>
        <span className="text-xs text-text-tertiary px-1.5 py-0.5 bg-surface-2 rounded">Claude</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 min-h-[120px] max-h-[300px]">
        {messages.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-xs text-text-tertiary mb-3">{t('askAnything')}</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-xs px-2.5 py-1.5 bg-surface-2 border border-border rounded-md text-text-secondary hover:text-text-primary hover:border-border-hover transition-all duration-150"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-accent/15 text-accent'
                    : 'bg-surface-2 text-text-primary'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))
        )}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-surface-2 rounded-lg px-3 py-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
          placeholder={t('askAnything')}
          className="flex-1 bg-surface-2 border border-border rounded-md px-3 py-2 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent/40 transition-colors"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isTyping}
          className="px-3 py-2 bg-accent/15 text-accent rounded-md text-xs font-medium hover:bg-accent/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          &rarr;
        </button>
      </div>
    </div>
  )
}
