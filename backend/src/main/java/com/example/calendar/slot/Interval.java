package com.example.calendar.slot;

import java.time.Instant;

/**
 * Полуоткрытый интервал времени [start, end). Общая модель занятости: встречи станут такими же
 * интервалами.
 */
public record Interval(Instant start, Instant end) {

  public boolean overlaps(Interval other) {
    return start.isBefore(other.end) && other.start.isBefore(end);
  }
}
