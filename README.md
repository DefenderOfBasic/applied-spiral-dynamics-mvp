# Spiral Dynamics MVP

Deployed at: https://applied-spiral-dynamics-mvp.vercel.app/

- Forked from: https://github.com/vercel/ai-chatbot.
- This is a submodule in the original project here: https://github.com/mettafive/applied-spiral-dynamics
- Vercel project: https://vercel.com/defenders-projects/applied-spiral-dynamics-mvp/Hve5iA2eWUoppH8q25sBAe1NZwPi
- remote ChromaDB: https://www.trychroma.com/default-4dc8c0b2/Spiral%20Dynamics%20MVP/collections/pixels-54efca47-0bfe-414c-af53-5c575299afbd

TODO:

- Change model to Claude
- pixel retrieval
- Add a visualization
- Ability to delete pixels

Notes:

- Insight model prompt https://github.com/mettafive/applied-spiral-dynamics/blob/main/insight%20model.md
- Spreadsheet of examples https://docs.google.com/spreadsheets/d/1jspvllJujDPTRtiZqkvsTFUZh21NwvXJYt_jbDSr694/edit?gid=0#gid=0
-

# Architecture

- `app/layout.tsx` is the root entry point
- `app/(chat)/layout.tsx` is the chat page entry point
- `app/(chat)/chat/[id]/page.tsx` is the actual chat page
- `components/chat.tsx` is the top level component for chat. It includes the `components/multimodal-input.tsx` which reads the text from the DOM, and then sends it to `sendMessage`, which comes from `@ai-sdk/react` (this does behind the scenes calling the API and stuff?)
  - https://ai-sdk.dev/docs/introduction
- If you want to override the request, go to `prepareSendMessagesRequest`
- `app/(chat)/api/chat/route.ts` is the Vercel server, which makes the request to OpenAI, through Vercel's gateway thing
- `app/(pixel-generation)/api/route.ts` is where the pixel generation happens
  - called from `handleUpdatePixelMap` in `chat.tsx`

LLM settings

- `lib/ai/providers.ts` defines which models are used for what
- `handleUpdatePixelMap` in `chat.tsx`
