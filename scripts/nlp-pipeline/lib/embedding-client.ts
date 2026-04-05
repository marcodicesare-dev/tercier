import OpenAI from 'openai';

export interface EmbeddingRow {
  id: string;
  text: string;
}

export interface EmbeddedReview {
  id: string;
  embedding: number[];
}

export async function generateEmbeddings(
  client: OpenAI,
  rows: EmbeddingRow[],
  batchSize = 500,
): Promise<EmbeddedReview[]> {
  const output: EmbeddedReview[] = [];

  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      dimensions: 512,
      input: batch.map(row => row.text),
    });

    for (let offset = 0; offset < response.data.length; offset += 1) {
      output.push({
        id: batch[offset].id,
        embedding: response.data[offset].embedding,
      });
    }
  }

  return output;
}
