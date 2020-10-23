# Timeseries cache manager

![CI](https://github.com/lukemcgregor/timeseries-cache-manager/workflows/CI/badge.svg?branch=master&event=push)

The purpose of this library is to track sections of data which have been loaded into a local cache to prevent the need for fetching data which is already loaded locally. It does this by tracking time segments on a timeline which are marked as loaded, and then provides a helper to work out what segments you need to load to fetch a specific period of data. This library does NOT do the caching itself, it only tracks the state of your data in its own cache.

 - No dependencies
 - Stateless
 - Immutible methods

![diagram](https://raw.githubusercontent.com/lukemcgregor/timeseries-cache-manager/master/diagram.png)

## API

The timeseries cache manager provides the following methods:

### **recordSegment**({ cacheMap, newSegment }) => cacheMap

Takes an existing cache map and a new segment you want to add and returns a new cache map containing that segment merged into the cacheMap. The new segment is an object with a from and to field (needs to have > and < implemented, ie moment and Date both work). eg `{ from: moment('2020-01-01'), to: moment('2020-01-02') }`, from must always be less than to, however one or both can be null which expresses an unbounded time period (eg `{ from: moment('2020-01-01') }` represents the time period starting at 2020-01-01 and continuing for all time).

A null cache map initializes a brand new cache.


### **getMissingSegments**({ cacheMap, requestedPeriod }) => [segment]

Takes an existing cache map and the requested period you want data for eg `{ from: moment('2020-01-01'), to: moment('2020-01-02') }`. Returns a list of segments which need to be loaded to ensure your cache has the requested period loaded. From this you should perform requests for each of these segments, and save those into your cache.

