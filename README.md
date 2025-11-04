# Spiral Dynamics MVP

Deployed at: https://applied-spiral-dynamics-mvp.vercel.app/

- Forked from: https://github.com/vercel/ai-chatbot.
- This is a submodule in the original project here: https://github.com/mettafive/applied-spiral-dynamics
- Vercel project: https://vercel.com/defenders-projects/applied-spiral-dynamics-mvp/Hve5iA2eWUoppH8q25sBAe1NZwPi

TODO:

- Add a vector DB (just use Chroma Cloud, or CloudFlare?)
- Add a visualization
  - ???
- Generate a pixel from a conversation
  - "Update pixel map" button, takes current conversation
  - Run LLM with the custom instructions in the TXT file
  -

Questions:

-

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

LLM settings

- `lib/ai/providers.ts` defines which models are used for what
- `handleUpdatePixelMap` in `chat.tsx`
