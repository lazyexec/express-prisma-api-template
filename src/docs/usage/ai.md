import AIHelper from './lib/ai-helper';

const aiHelper = new AIHelper({
provider: 'openai',
openaiKey: process.env.OPENAI_API_KEY!
});

const response = await aiHelper.chat({
userId: 'user_123',
sessionId: 'session_456',
message: 'Hello!'
});

console.log(response.content);

// STREAMING

const aiHelper = new AIHelper({
provider: 'openai',
openaiKey: process.env.OPENAI_API_KEY!,
streaming: true
});

const stream = await aiHelper.chat({
userId: 'user_123',
sessionId: 'session_456',
message: 'Tell me a story'
});

stream.on('data', (chunk) => console.log(chunk));
stream.on('end', (full) => console.log('Done!', full));

// RAG

const aiHelper = new AIHelper({
provider: 'openai',
openaiKey: process.env.OPENAI_API_KEY!,
enableRAG: true
});

// Add document
await aiHelper.addRAGDocument(
'company',
'docs',
'Our refund policy is 30 days',
{ category: 'policy' }
);

// Query with RAG
const response = await aiHelper.chat({
userId: 'user_123',
sessionId: 'support',
message: 'What is the refund policy?',
ragQuery: {
userId: 'company',
projectId: 'docs',
text: 'refund policy',
limit: 3
}
});

// API

import express from 'express';
import AIHelper from './lib/ai-helper';

const app = express();
app.use(express.json());

const aiHelper = new AIHelper({
provider: 'openai',
openaiKey: process.env.OPENAI_API_KEY!
});

app.post('/api/chat', async (req, res) => {
const { userId, sessionId, message } = req.body;

const response = await aiHelper.chat({
userId,
sessionId,
message
});

res.json(response);
});

app.listen(3000);

// METHODS

// Chat
await aiHelper.chat({ userId, sessionId, message })

// Add RAG document
await aiHelper.addRAGDocument(userId, projectId, content, metadata)

// Search RAG
await aiHelper.searchRAG({ userId, projectId, text, limit })

// Get history
await aiHelper.getHistory(userId, sessionId, limit)

// Delete conversation
await aiHelper.deleteConversation(userId, sessionId)

// Close connection
await aiHelper.close()
