import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('http://localhost:8000/api/v1/products/types', () => {
    return HttpResponse.json([
      { id: 'laptop', name: 'Laptop', description: 'Portable computer', imageUrl: '', characteristics: [], sampleProducts: [] },
      { id: 'smartphone', name: 'Smartphone', description: 'Mobile phone', imageUrl: '', characteristics: [], sampleProducts: [] },
    ]);
  }),
  http.post('http://localhost:8000/api/v1/chat/message', async ({ request }) => {
    const data = await request.json() as { message?: string; conversationId?: string };
    return HttpResponse.json({
      message: `Mock AI response to: ${data.message || ''}`,
      conversationId: data.conversationId || 'new_mock_conv',
      timestamp: new Date().toISOString(),
    });
  }),
];
