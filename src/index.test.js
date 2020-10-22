const moment = require('moment');

const { getMissingSegments, recordSegment, sortSegmentsDescending } = require('./index');


describe('time-series-cach-manager', () => {
  describe('getMissingSegments', () => {
    describe('simple cache, one segment', () => {
      const cacheMap = {
        segments: [
          { from: moment('2020-01-01'), to: moment('2020-01-02') },
        ],
      };
      test('no existing segments', () => {
        const res = getMissingSegments({
          requestedPeriod: {
            from: moment('2019-01-01'),
            to: moment('2019-12-31'),
          },
        });
        expect(res).toEqual([{
          from: moment('2019-01-01'),
          to: moment('2019-12-31'),
        }]);
      });
      test('segment before', () => {
        const res = getMissingSegments({
          cacheMap,
          requestedPeriod: {
            from: moment('2019-01-01'),
            to: moment('2019-12-31'),
          },
        });
        expect(res).toEqual([{
          from: moment('2019-01-01'),
          to: moment('2019-12-31'),
        }]);
      });
      test('segment after', () => {
        const res = getMissingSegments({
          cacheMap,
          requestedPeriod: {
            from: moment('2020-01-02'),
            to: moment('2020-01-03'),
          },
        });
        expect(res).toEqual([{
          from: moment('2020-01-02'),
          to: moment('2020-01-03'),
        }]);
      });
      test('segment overlapping start', () => {
        const res = getMissingSegments({
          cacheMap,
          requestedPeriod: {
            from: moment('2019-12-31'),
            to: moment('2020-01-02'),
          },
        });
        expect(res).toEqual([{
          from: moment('2019-12-31'),
          to: moment('2020-01-01'),
        }]);
      });
      test('segment overlapping start (other way)', () => {
        const res = getMissingSegments({
          cacheMap,
          requestedPeriod: {
            from: moment('2020-01-01:12:00:00'),
            to: moment('2020-01-03'),
          },
        });
        expect(res).toEqual([{
          from: moment('2020-01-02'),
          to: moment('2020-01-03'),
        }]);
      });
      test('segment overlapping end', () => {
        const res = getMissingSegments({
          cacheMap,
          requestedPeriod: {
            from: moment('2020-01-01'),
            to: moment('2020-01-03'),
          },
        });
        expect(res).toEqual([{
          from: moment('2020-01-02'),
          to: moment('2020-01-03'),
        }]);
      });
      test('segment covering existing', () => {
        const res = getMissingSegments({
          cacheMap,
          requestedPeriod: {
            from: moment('2019-12-31'),
            to: moment('2020-01-03'),
          },
        });
        expect(res).toEqual([
          {
            from: moment('2019-12-31'),
            to: moment('2020-01-01'),
          },
          {
            from: moment('2020-01-02'),
            to: moment('2020-01-03'),
          },
        ]);
      });
    });
    describe('cache with two segments', () => {
      const cacheMap = {
        segments: [
          { from: moment('2020-01-01'), to: moment('2020-01-02') },
          { from: moment('2020-02-01'), to: moment('2020-02-02') },
        ],
      };
      test('segment before all', () => {
        const res = getMissingSegments({
          cacheMap,
          requestedPeriod: {
            from: moment('2019-01-01'),
            to: moment('2019-12-31'),
          },
        });
        expect(res).toEqual([{
          from: moment('2019-01-01'),
          to: moment('2019-12-31'),
        }]);
      });
      test('segment after all ', () => {
        const res = getMissingSegments({
          cacheMap,
          requestedPeriod: {
            from: moment('2020-02-02'),
            to: moment('2020-02-03'),
          },
        });
        expect(res).toEqual([{
          from: moment('2020-02-02'),
          to: moment('2020-02-03'),
        }]);
      });
      test('segment overlapping, but not covering both', () => {
        const res = getMissingSegments({
          cacheMap,
          requestedPeriod: {
            from: moment('2020-01-01'),
            to: moment('2020-02-02'),
          },
        });
        expect(res).toEqual([{
          from: moment('2020-01-02'),
          to: moment('2020-02-01'),
        }]);
      });
      test('segment covering both', () => {
        const res = getMissingSegments({
          cacheMap,
          requestedPeriod: {
            from: moment('2019-12-31'),
            to: moment('2020-02-03'),
          },
        });
        expect(res).toEqual([
          {
            from: moment('2019-12-31'),
            to: moment('2020-01-01'),
          },
          {
            from: moment('2020-01-02'),
            to: moment('2020-02-01'),
          },
          {
            from: moment('2020-02-02'),
            to: moment('2020-02-03'),
          }]);
      });
    });
  });
  describe('recordSegment', () => {
    describe('simple cache, one segment', () => {
      const existingSegment = { from: moment('2020-01-01'), to: moment('2020-01-10') };
      const cacheMap = {
        segmentHistory: [
          existingSegment,
        ],
        segments: [
          existingSegment,
        ],
      };
      test('segment before, not touching ', () => {
        const newSegment = {
          from: moment('2019-01-01'),
          to: moment('2019-12-31'),
        };
        const res = recordSegment({
          cacheMap,
          newSegment,
        });
        expect(res.segmentHistory).toEqual([
          existingSegment,
          newSegment,
        ]);
        expect(res.segments).toEqual([
          existingSegment,
          newSegment,
        ]);
      });
      test('segment before, touching ', () => {
        const newSegment = {
          from: moment('2019-12-31'),
          to: existingSegment.from,
        };
        const res = recordSegment({
          cacheMap,
          newSegment,
        });
        expect(res.segmentHistory).toEqual([
          existingSegment,
          newSegment,
        ]);
        expect(res.segments).toEqual([
          { from: newSegment.from, to: existingSegment.to },
        ]);
      });
      test('segment after, not touching ', () => {
        const newSegment = {
          from: moment('2020-01-11'),
          to: moment('2020-01-12'),
        };
        const res = recordSegment({
          cacheMap,
          newSegment,
        });
        expect(res.segmentHistory).toEqual([
          existingSegment,
          newSegment,
        ]);
        expect(res.segments).toEqual([
          newSegment,
          existingSegment,
        ]);
      });
      test('segment after, touching ', () => {
        const newSegment = {
          from: moment('2020-01-10'),
          to: moment('2020-01-11'),
        };
        const res = recordSegment({
          cacheMap,
          newSegment,
        });
        expect(res.segmentHistory).toEqual([
          existingSegment,
          newSegment,
        ]);
        expect(res.segments).toEqual([
          { from: existingSegment.from, to: newSegment.to },
        ]);
      });
      test('segment covering, contained inside ', () => {
        const newSegment = {
          from: moment('2020-01-02'),
          to: moment('2020-01-04'),
        };
        const res = recordSegment({
          cacheMap,
          newSegment,
        });
        expect(res.segmentHistory).toEqual([
          existingSegment,
          newSegment,
        ]);
        expect(res.segments).toEqual([
          existingSegment,
        ]);
      });
      test('segment covering, contained exact ', () => {
        const newSegment = existingSegment;
        const res = recordSegment({
          cacheMap,
          newSegment,
        });
        expect(res.segmentHistory).toEqual([
          existingSegment,
          newSegment,
        ]);
        expect(res.segments).toEqual([
          existingSegment,
        ]);
      });
      test('segment covering, overhang before', () => {
        const newSegment = {
          from: moment('2019-12-31'),
          to: moment('2020-01-02'),
        };
        const res = recordSegment({
          cacheMap,
          newSegment,
        });
        expect(res.segmentHistory).toEqual([
          existingSegment,
          newSegment,
        ]);
        expect(res.segments).toEqual([
          { from: newSegment.from, to: existingSegment.to },
        ]);
      });
      test('segment covering, overhang after', () => {
        const newSegment = {
          from: moment('2020-01-05'),
          to: moment('2020-01-11'),
        };
        const res = recordSegment({
          cacheMap,
          newSegment,
        });
        expect(res.segmentHistory).toEqual([
          existingSegment,
          newSegment,
        ]);
        expect(res.segments).toEqual([
          { from: existingSegment.from, to: newSegment.to },
        ]);
      });
      test('segment covering, overhang both', () => {
        const newSegment = {
          from: moment('2019-12-31'),
          to: moment('2020-01-11'),
        };
        const res = recordSegment({
          cacheMap,
          newSegment,
        });
        expect(res.segmentHistory).toEqual([
          existingSegment,
          newSegment,
        ]);
        expect(res.segments).toEqual([
          newSegment,
        ]);
      });
    });
    describe('cache with two segments', () => {
      const existingSegmentA = { from: moment('2020-01-01'), to: moment('2020-01-10') };
      const existingSegmentB = { from: moment('2020-02-01'), to: moment('2020-02-10') };
      const cacheMap = {
        segmentHistory: [
          existingSegmentA,
          existingSegmentB,
        ],
        segments: [
          existingSegmentA,
          existingSegmentB,
        ],
      };
      test('segment before both, not touching ', () => {
        const newSegment = {
          from: moment('2019-01-01'),
          to: moment('2019-12-31'),
        };
        const res = recordSegment({
          cacheMap,
          newSegment,
        });
        expect(res.segmentHistory).toEqual([
          existingSegmentA,
          existingSegmentB,
          newSegment,
        ]);
        expect(res.segments).toEqual([
          existingSegmentB,
          existingSegmentA,
          newSegment,
        ]);
      });
      test('segment after both, not touching ', () => {
        const newSegment = {
          from: moment('2020-02-11'),
          to: moment('2020-02-12'),
        };
        const res = recordSegment({
          cacheMap,
          newSegment,
        });
        expect(res.segmentHistory).toEqual([
          existingSegmentA,
          existingSegmentB,
          newSegment,
        ]);
        expect(res.segments).toEqual([
          newSegment,
          existingSegmentB,
          existingSegmentA,
        ]);
      });
      test('segment between, not touching', () => {
        const newSegment = {
          from: moment('2020-01-11'),
          to: moment('2020-01-12'),
        };
        const res = recordSegment({
          cacheMap,
          newSegment,
        });
        expect(res.segmentHistory).toEqual([
          existingSegmentA,
          existingSegmentB,
          newSegment,
        ]);
        expect(res.segments).toEqual([
          existingSegmentB,
          newSegment,
          existingSegmentA,
        ]);
      });
      test('segment between, touching A', () => {
        const newSegment = {
          from: moment('2020-01-10'),
          to: moment('2020-01-12'),
        };
        const res = recordSegment({
          cacheMap,
          newSegment,
        });
        expect(res.segmentHistory).toEqual([
          existingSegmentA,
          existingSegmentB,
          newSegment,
        ]);
        expect(res.segments).toEqual([
          existingSegmentB,
          { from: existingSegmentA.from, to: newSegment.to },
        ]);
      });
      test('segment between, touching B', () => {
        const newSegment = {
          from: moment('2020-01-14'),
          to: moment('2020-02-01'),
        };
        const res = recordSegment({
          cacheMap,
          newSegment,
        });
        expect(res.segmentHistory).toEqual([
          existingSegmentA,
          existingSegmentB,
          newSegment,
        ]);
        expect(res.segments).toEqual([
          { from: newSegment.from, to: existingSegmentB.to },
          existingSegmentA,
        ]);
      });
      test('segment between, touching both', () => {
        const newSegment = {
          from: moment('2020-01-14'),
          to: moment('2020-02-01'),
        };
        const res = recordSegment({
          cacheMap,
          newSegment,
        });
        expect(res.segmentHistory).toEqual([
          existingSegmentA,
          existingSegmentB,
          newSegment,
        ]);
        expect(res.segments).toEqual([
          { from: newSegment.from, to: existingSegmentB.to },
          existingSegmentA,
        ]);
      });
      test('segment between, overlapping both', () => {
        const newSegment = {
          from: moment('2020-01-05'),
          to: moment('2020-02-02'),
        };
        const res = recordSegment({
          cacheMap,
          newSegment,
        });
        expect(res.segmentHistory).toEqual([
          existingSegmentA,
          existingSegmentB,
          newSegment,
        ]);
        expect(res.segments).toEqual([
          { from: existingSegmentA.from, to: existingSegmentB.to },
        ]);
      });
      test('segment between, covering both', () => {
        const newSegment = {
          from: moment('2019-12-31'),
          to: moment('2020-02-20'),
        };
        const res = recordSegment({
          cacheMap,
          newSegment,
        });
        expect(res.segmentHistory).toEqual([
          existingSegmentA,
          existingSegmentB,
          newSegment,
        ]);
        expect(res.segments).toEqual([
          newSegment,
        ]);
      });
      test('Progressively add segments', () => {
        let updatedCacheMap = recordSegment({
          newSegment: {
            from: moment('2019-12-31'),
            to: moment('2020-02-20'),
          },
        });
        updatedCacheMap = recordSegment({
          cacheMap: updatedCacheMap,
          newSegment: {
            from: moment('2020-02-20'),
            to: moment('2020-02-22'),
          },
        });
        updatedCacheMap = recordSegment({
          cacheMap: updatedCacheMap,
          newSegment: {
            from: moment('2020-02-22'),
            to: moment('2020-03-01'),
          },
        });

        expect(updatedCacheMap.segments).toEqual([
          {
            from: moment('2019-12-31'),
            to: moment('2020-03-01'),
          },
        ]);
      });
    });
    describe('Forever segments',()=>{
      const existingSegmentA = { from: moment('2020-01-01'), to: moment('2020-01-10') };
      const existingSegmentB = { from: moment('2020-02-01'), to: moment('2020-02-10') };
      const cacheMap = {
        segmentHistory: [
          existingSegmentA,
          existingSegmentB,
        ],
        segments: [
          existingSegmentA,
          existingSegmentB,
        ],
      };
      test('Adding a to-less segment', () => {
        const nextCacheMap = recordSegment({
          newSegment: {
            from: moment('2019-12-31'),
          },
        });

        expect(nextCacheMap.segments).toEqual([
          {
            from: moment('2019-12-31'),
          },
        ]);
      });
      test('Adding a from-less segment', () => {
        const nextCacheMap = recordSegment({
          newSegment: {
            to: moment('2019-12-31'),
          },
        });

        expect(nextCacheMap.segments).toEqual([
          {
            to: moment('2019-12-31'),
          },
        ]);
      });
      test('Adding a forever segment', () => {
        const nextCacheMap = recordSegment({
          newSegment: {
          },
        });

        expect(nextCacheMap.segments).toEqual([
          {
          },
        ]);
      });
      test('Adding a forever segment over a timebound one', () => {
        const nextCacheMap = recordSegment({
          cacheMap,
          newSegment: {
          },
        });

        expect(nextCacheMap.segments).toEqual([
          {
          },
        ]);
      });
      test('Adding a from-less segment over a timebound one', () => {
        const nextCacheMap = recordSegment({
          cacheMap,
          newSegment: {
            to: moment('2020-01-05')
          },
        });

        expect(nextCacheMap.segments).toEqual([
          existingSegmentB,
          {
            to: moment('2020-01-10')
          },
        ]);
      });
      test('Adding a to-less segment over a timebound one', () => {
        const nextCacheMap = recordSegment({
          cacheMap,
          newSegment: {
            from: moment('2020-02-05')
          },
        });

        expect(nextCacheMap.segments).toEqual([
          {
            from: moment('2020-02-01')
          },
          existingSegmentA,
        ]);
      });
    });
    describe('Throwing exceptions',()=> {
      test('Throws when a new segment is not provided', () => {
        expect(()=> recordSegment({})).toThrow('A newSegment is required');
      });
      test('Throws when a new segment is not provided', () => {
        expect(()=> recordSegment({
          newSegment:{
            from: moment('2020-01-02'),
            to: moment('2020-01-01'),
          }
        })).toThrow('invalid segment, cant end before it starts');
      });
    });
    describe('Sorting',()=> {
      test('Throws when a new segment is not provided', () => {
        const nextSegments = sortSegmentsDescending(
          [
            {},
            {from: moment('2020-01-01')},
          ]
        );

        expect(nextSegments).toEqual([
          {from: moment('2020-01-01')},
          {},
        ]);
      });
    });
  });
});
