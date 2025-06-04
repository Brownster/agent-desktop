/**
 * @fileoverview Tests for time utility functions
 */

import { formatDuration, formatDurationMMS, formatDurationHMS, getRelativeTime } from './time';

describe('time utilities', () => {
  describe('formatDuration', () => {
    it('should format seconds correctly', () => {
      expect(formatDuration(30)).toBe('30s');
      expect(formatDuration(45)).toBe('45s');
      expect(formatDuration(1)).toBe('1s');
    });

    it('should format minutes and seconds correctly', () => {
      expect(formatDuration(60)).toBe('1m');
      expect(formatDuration(90)).toBe('1m 30s');
      expect(formatDuration(125)).toBe('2m 5s');
      expect(formatDuration(3540)).toBe('59m');
    });

    it('should format hours correctly', () => {
      expect(formatDuration(3600)).toBe('1h');
      expect(formatDuration(3660)).toBe('1h 1m');
      expect(formatDuration(7200)).toBe('2h');
      expect(formatDuration(7800)).toBe('2h 10m');
    });

    it('should handle zero duration', () => {
      expect(formatDuration(0)).toBe('0s');
    });
  });

  describe('formatDurationMMS', () => {
    it('should format in MM:SS format', () => {
      expect(formatDurationMMS(0)).toBe('0:00');
      expect(formatDurationMMS(30)).toBe('0:30');
      expect(formatDurationMMS(60)).toBe('1:00');
      expect(formatDurationMMS(90)).toBe('1:30');
      expect(formatDurationMMS(125)).toBe('2:05');
      expect(formatDurationMMS(3600)).toBe('60:00');
    });
  });

  describe('formatDurationHMS', () => {
    it('should format in MM:SS format for durations under an hour', () => {
      expect(formatDurationHMS(0)).toBe('0:00');
      expect(formatDurationHMS(30)).toBe('0:30');
      expect(formatDurationHMS(60)).toBe('1:00');
      expect(formatDurationHMS(3540)).toBe('59:00');
    });

    it('should format in HH:MM:SS format for durations over an hour', () => {
      expect(formatDurationHMS(3600)).toBe('1:00:00');
      expect(formatDurationHMS(3660)).toBe('1:01:00');
      expect(formatDurationHMS(3665)).toBe('1:01:05');
      expect(formatDurationHMS(7200)).toBe('2:00:00');
    });
  });

  describe('getRelativeTime', () => {
    beforeEach(() => {
      // Mock Date.now to return a consistent timestamp
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return "just now" for recent times', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      const oneSecondAgo = new Date('2024-01-01T11:59:59Z');
      
      expect(getRelativeTime(now)).toBe('just now');
      expect(getRelativeTime(oneSecondAgo)).toBe('just now');
    });

    it('should return seconds ago for times under a minute', () => {
      const thirtySecondsAgo = new Date('2024-01-01T11:59:30Z');
      const fortyFiveSecondsAgo = new Date('2024-01-01T11:59:15Z');
      
      expect(getRelativeTime(thirtySecondsAgo)).toBe('30 seconds ago');
      expect(getRelativeTime(fortyFiveSecondsAgo)).toBe('45 seconds ago');
    });

    it('should return minutes ago for times under an hour', () => {
      const oneMinuteAgo = new Date('2024-01-01T11:59:00Z');
      const thirtyMinutesAgo = new Date('2024-01-01T11:30:00Z');
      const fiftyNineMinutesAgo = new Date('2024-01-01T11:01:00Z');
      
      expect(getRelativeTime(oneMinuteAgo)).toBe('1 minute ago');
      expect(getRelativeTime(thirtyMinutesAgo)).toBe('30 minutes ago');
      expect(getRelativeTime(fiftyNineMinutesAgo)).toBe('59 minutes ago');
    });

    it('should return hours ago for times under a day', () => {
      const oneHourAgo = new Date('2024-01-01T11:00:00Z');
      const fiveHoursAgo = new Date('2024-01-01T07:00:00Z');
      const twentyThreeHoursAgo = new Date('2023-12-31T13:00:00Z');
      
      expect(getRelativeTime(oneHourAgo)).toBe('1 hour ago');
      expect(getRelativeTime(fiveHoursAgo)).toBe('5 hours ago');
      expect(getRelativeTime(twentyThreeHoursAgo)).toBe('23 hours ago');
    });

    it('should return days ago for times over a day', () => {
      const oneDayAgo = new Date('2023-12-31T12:00:00Z');
      const threeDaysAgo = new Date('2023-12-29T12:00:00Z');
      
      expect(getRelativeTime(oneDayAgo)).toBe('1 day ago');
      expect(getRelativeTime(threeDaysAgo)).toBe('3 days ago');
    });
  });
});