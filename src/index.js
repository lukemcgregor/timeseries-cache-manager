/**
 * This exists to help manage caches which have non-continuous sections of
 * historic data.
 */

const sortSegmentsDescending = (segments) => segments.slice().sort((a, b) => {
  if (!a || !a.from) {
    return 1;
  }
  if (!b || !b.from) {
    return -1;
  }
  return b.from - a.from;
});

const getRelevantSegments = (cacheMap, { from, to }) => sortSegmentsDescending(
  cacheMap.segments
    .filter((segment) => segment.to > from && segment.from < to),
).reverse();

/**
 * This helps reduced data transfer by detecting and returning only the
 * time periods which havent been cached yet to fetch from the server.
 * This means that you can request a subset of records rather than all the
 * records for a requested day.
 * @param {*} cacheMap the existing cachemap to use
 * @param {*} requestedPeriod the time period which you want data for
 * @returns a list of segments which you will need to fetch data for.
 */
const getMissingSegments = ({
  cacheMap = { segments: [] },
  requestedPeriod: { from, to },
}) => {
  const relevantSegments = getRelevantSegments(cacheMap, { from, to });

  const remainingSegment = { from, to };
  const missingSegments = [];
  relevantSegments.every((segment) => {
    // We cant use equals here because object equality...
    if (remainingSegment.from >= segment.from && remainingSegment.from <= segment.from) {
      remainingSegment.from = segment.to;
    } else {
      if (remainingSegment.from < segment.from) {
        missingSegments.push({
          from: remainingSegment.from,
          to: segment.from,
        });
      }
      remainingSegment.from = segment.to;
    }
    return true;
  });

  if (remainingSegment.from < remainingSegment.to) {
    missingSegments.push({
      from: remainingSegment.from,
      to: remainingSegment.to,
    });
  }

  return missingSegments;
};

/**
 * This adds a segment to an existing cache map. Internally it will merge segments
 * which are connected to produce a minimal set of continuous segments.
 * @param opts An object containing the existing cacheMap and a newSegment to add
 * @returns a new cache map which contains the newly inserted segment
 */
const recordSegment = ({ cacheMap = { segments: [] }, newSegment }) => {
  if (!newSegment) {
    throw new Error('A newSegment is required');
  }
  if (newSegment.to && newSegment.from && newSegment.from > newSegment.to) {
    throw new Error('invalid segment, cant end before it starts');
  }

  const expandingSegment = { ...newSegment };
  const nextSegments = [];

  cacheMap.segments.forEach((segment) => {
    if (expandingSegment.from > segment.to || expandingSegment.to < segment.from) {
      nextSegments.push(segment);
      return;
    }
    if (segment.from < expandingSegment.from) {
      expandingSegment.from = segment.from;
    }
    if (segment.to > expandingSegment.to) {
      expandingSegment.to = segment.to;
    }
  });

  nextSegments.push(expandingSegment);

  return {
    segmentHistory: [...((cacheMap && cacheMap.segmentHistory) || []), newSegment],
    segments: sortSegmentsDescending(nextSegments),
  };
};

module.exports = {
  getMissingSegments,
  recordSegment,
  sortSegmentsDescending,
};
