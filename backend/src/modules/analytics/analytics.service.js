import { collection } from '../../database/client.js';

const events = () => collection('analyticsEvents');
const DAY = 24 * 60 * 60 * 1000;

export const RANGES = { '7d': 7, '30d': 30, '90d': 90 };

export async function recordEvent(formId, type, visitorId) {
  try {
    await events().insertOne({ formId, type, visitorId, createdAt: new Date() });
  } catch (error) {
    if (error.code !== 11000) throw error;
  }
}

export function recordSubmission(formId, visitorId) {
  return events().insertOne({
    formId,
    type: 'submit',
    visitorId: visitorId ?? null,
    createdAt: new Date(),
  });
}

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function rate(part, whole) {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;
}

export async function getAnalytics(formId, range) {
  const days = RANGES[range];
  const since = new Date(startOfUtcDay(new Date()).getTime() - (days - 1) * DAY);

  const rows = await events()
    .aggregate([
      { $match: { formId, createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            type: '$type',
          },
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const series = new Map();
  for (let index = 0; index < days; index += 1) {
    const day = new Date(since.getTime() + index * DAY).toISOString().slice(0, 10);
    series.set(day, { date: day, views: 0, starts: 0, submissions: 0 });
  }

  const totals = { views: 0, starts: 0, submissions: 0 };
  const keys = { view: 'views', start: 'starts', submit: 'submissions' };
  for (const { _id, count } of rows) {
    const key = keys[_id.type];
    const point = series.get(_id.day);
    if (!key || !point) continue;
    point[key] += count;
    totals[key] += count;
  }

  return {
    range,
    totals: {
      ...totals,
      completionRate: rate(totals.submissions, totals.starts),
      conversionRate: rate(totals.submissions, totals.views),
    },
    daily: [...series.values()],
  };
}
