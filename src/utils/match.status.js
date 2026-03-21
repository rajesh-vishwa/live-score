import { MATCH_STATUS } from "../validation/matches.validation.js";

function toMs(value) {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

export function getMatchStatus(startTime, endTime, now = new Date()) {
  const start = toMs(startTime);
  const end = toMs(endTime);
  const nowMs = now.getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return null;
  }

  if (nowMs < start) return MATCH_STATUS.scheduled;
  if (nowMs < end) return MATCH_STATUS.live;
  return MATCH_STATUS.finished;
}

export function syncMatchStatus(match, updateStatus = true) {
  const status = getMatchStatus(match.startTime, match.endTime);
  if (status === null) {
    return;
  }
  if (updateStatus) {
    match.status = status;
  }
  return match;
}
