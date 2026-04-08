import { resolve } from 'node:path';
import type { HotelUpsert } from '../../phase0-enrichment/lib/types.js';
import type { PipelineContext, QnaAnswerInsert, QnaInsert, SourceResult } from '../types.js';
import {
  buildDataForSeoLocationParams,
  createDataForSeoTaskAndPoll,
  getDataForSeoString,
} from './dataforseo-common.js';
import { getCachedOrFetch, statusError, statusOk, statusSkipped } from '../utils.js';
import { assessIdentityMatch } from '../identity.js';

const CACHE_QNA = resolve(process.cwd(), 'scripts/enrich-hotel/cache/dataforseo-google-qna.jsonl');

function normalizeComparable(value: string | null | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function isOfficialAnswer(profileName: string | null, hotelName: string): boolean {
  const author = normalizeComparable(profileName);
  const target = normalizeComparable(hotelName);
  if (!author || !target) return false;
  return author === target || author.includes(target) || target.includes(author);
}

function sortAnswersNewestFirst(answers: QnaAnswerInsert[]): QnaAnswerInsert[] {
  return [...answers].sort((left, right) => {
    const leftDate = left.answered_at ? new Date(left.answered_at).getTime() : 0;
    const rightDate = right.answered_at ? new Date(right.answered_at).getTime() : 0;
    return rightDate - leftDate;
  });
}

function mapQnaItem(item: any, hotelName: string): QnaInsert | null {
  const sourceQuestionId = getDataForSeoString(item?.question_id);
  const question = getDataForSeoString(item?.question_text) ?? getDataForSeoString(item?.original_question_text);
  if (!sourceQuestionId || !question) return null;

  const answers: QnaAnswerInsert[] = Array.isArray(item?.items)
    ? item.items
      .map((answer: any) => {
        const author = getDataForSeoString(answer?.profile_name);
        return {
          answer_id: getDataForSeoString(answer?.answer_id),
          author,
          author_url: getDataForSeoString(answer?.profile_url),
          text: getDataForSeoString(answer?.answer_text) ?? getDataForSeoString(answer?.original_answer_text),
          answered_at: getDataForSeoString(answer?.timestamp),
          is_official: isOfficialAnswer(author, hotelName),
        };
      })
      .filter((answer: QnaAnswerInsert) => Boolean(answer.text || answer.answer_id))
    : [];

  const sortedAnswers = sortAnswersNewestFirst(answers);
  const latestAnswer = sortedAnswers[0] ?? null;

  return {
    source: 'google',
    source_question_id: sourceQuestionId,
    question,
    question_author: getDataForSeoString(item?.profile_name),
    question_author_url: getDataForSeoString(item?.profile_url),
    question_date: getDataForSeoString(item?.timestamp),
    answers: sortedAnswers,
    answer_count: sortedAnswers.length,
    has_answer: sortedAnswers.length > 0,
    has_official_answer: sortedAnswers.some(answer => answer.is_official),
    latest_answer: latestAnswer?.text ?? null,
    latest_answered_by: latestAnswer?.author ?? null,
    latest_answer_date: latestAnswer?.answered_at ?? null,
    raw_payload: item,
  };
}

function buildHotelQnaAggregates(qna: QnaInsert[]): HotelUpsert {
  const total = qna.length;
  const unanswered = qna.filter(row => !row.has_answer).length;
  return {
    qna_count: total,
    qna_unanswered_count: unanswered,
    qna_response_rate: total ? (total - unanswered) / total : null,
  };
}

export async function runDataForSeoQna(context: PipelineContext): Promise<SourceResult> {
  if (!context.gpPlaceId) {
    return {
      statuses: [statusSkipped('dataforseo_qna', 'No Google Place ID for Google Q&A lookup')],
    };
  }

  const locationParams = buildDataForSeoLocationParams(context);
  const cacheKey = `${context.input.name}:${JSON.stringify(locationParams)}`;

  try {
    const result = await getCachedOrFetch<any[]>(
      CACHE_QNA,
      cacheKey,
      async () => await createDataForSeoTaskAndPoll(
        '/business_data/google/questions_and_answers/task_post',
        '/business_data/google/questions_and_answers/task_get',
        [{
          keyword: context.input.name,
          place_id: context.gpPlaceId,
          ...locationParams,
          language_name: 'English',
          depth: 100,
          priority: 2,
        }],
      ),
    );

    const qna = result.data
      .filter(item => {
        const candidatePlaceId = getDataForSeoString(item?.place_id);
        const candidateName = getDataForSeoString(item?.title) ?? getDataForSeoString(item?.place_name);
        if (candidatePlaceId && context.gpPlaceId && candidatePlaceId !== context.gpPlaceId) {
          return false;
        }
        if (!candidateName) return true;
        return assessIdentityMatch(context.input, {
          name: candidateName,
          address: getDataForSeoString(item?.address),
        }, { source: 'dataforseo_qna' }).ok;
      })
      .map(item => mapQnaItem(item, context.input.name))
      .filter((row): row is QnaInsert => Boolean(row));

    return {
      hotel: buildHotelQnaAggregates(qna),
      qna,
      statuses: [
        statusOk(
          'dataforseo_qna',
          `questions=${qna.length}`,
          result.cached,
        ),
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('40102') || message.toLowerCase().includes('no search results')) {
      return {
        statuses: [statusSkipped('dataforseo_qna', 'No Google Q&A found')],
      };
    }
    return {
      statuses: [statusError('dataforseo_qna', error)],
    };
  }
}
