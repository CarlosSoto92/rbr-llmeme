# 🔥 LLMeme — Because the M stands for MEMES

> Chatbot de hackathon que responde **EXCLUSIVAMENTE** mediante memes, stickers y emoticones. Cero respuestas de texto convencional del bot.

---

## 🎯 Regla de Oro
- **Bot Output Permitido:** `IMAGE`, `STICKER`, `EMOJI`
- **Bot Output Prohibido:** `PLAIN TEXT`, `MARKDOWN`, `JSON`, `ERROR MESSAGE`, `EXPLANATION`

---

## 🚀 Arquitectura

```text
Browser (User Input)
       │
       ▼ POST /chat
Node.js Backend
       │
       ▼
LLM Meme Planner / Semantic Comedy Engine
       │
       ▼
Strict JSON Validator
       │
       ▼
Memegen URL Builder (Special Character Escaping)
       │
       ▼
Browser renders <img> (Visual Response Only)
```

---

## 🏃‍♂️ Cómo Iniciar

### 1. Iniciar el Servidor (Zero External Dependencies)
```bash
node server.js
```

Abre en tu navegador: [http://localhost:3000](http://localhost:3000)

### 2. Correr la Suite de Pruebas Automatizada
```bash
npm test
```

---

## 🎭 Plantillas Memegen Soportadas
- `drake` — Rechazar A / preferir B
- `fine` — Desastre + negación o resignación
- `two-buttons` — Dilema imposible
- `pikachu` — Consecuencia predecible que sorprende
- `db` — Distracción o abandono de prioridad
- `brain` — Escalada de sofisticación o absurdo
- `gru` — Plan que falla por su propia lógica
- `cmm` — Opinión fuerte / hot take
- `pigeon` — Confundir algo con otra cosa
- `astronaut` — Revelación de algo que siempre fue cierto
- `rollsafe` — Lógica absurda pero aparentemente inteligente
- `fry` — Duda / sospecha entre dos interpretaciones
- `doge` — Comentario absurdo o sarcástico
- `buzz` — Algo apareciendo por todas partes
- `afraid` — No comprender algo básico y tener miedo de preguntar

---

## 🛡️ Fail-Safe Absoluto
Si cualquier componente falla (LLM caído, JSON corrupto, fallo de red o plantilla inexistente), el bot responde inmediatamente con:
- `🤯` o meme visual de contingencia.
- **NUNCA** mensajes de error en texto.
