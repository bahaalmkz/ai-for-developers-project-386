package com.example.calendar.booking;

import com.example.calendar.model.Booking;
import com.example.calendar.model.EventTypeRef;
import com.example.calendar.slot.BusyIntervals;
import com.example.calendar.slot.Interval;
import com.example.calendar.slot.SlotSchedule;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** Хранилище встреч. Он же отдаёт занятые интервалы для расчёта слотов. */
@Repository
class BookingRepository implements BusyIntervals {

  private final JdbcClient jdbc;
  private final SlotSchedule schedule;

  BookingRepository(JdbcClient jdbc, SlotSchedule schedule) {
    this.jdbc = jdbc;
    this.schedule = schedule;
  }

  @Override
  public List<Interval> all() {
    return jdbc.sql("SELECT start_at, end_at FROM bookings")
        .query(
            (rs, rowNum) ->
                new Interval(
                    rs.getObject("start_at", OffsetDateTime.class).toInstant(),
                    rs.getObject("end_at", OffsetDateTime.class).toInstant()))
        .list();
  }

  Booking insert(EventTypeRef eventType, Interval interval, String guestName, String guestEmail) {
    String id = UUID.randomUUID().toString();
    OffsetDateTime start = interval.start().atZone(schedule.zone()).toOffsetDateTime();
    OffsetDateTime end = interval.end().atZone(schedule.zone()).toOffsetDateTime();
    jdbc.sql(
            "INSERT INTO bookings (id, event_type_id, start_at, end_at, guest_name, guest_email)"
                + " VALUES (?, ?, ?, ?, ?, ?)")
        .params(id, eventType.getId(), start, end, guestName, guestEmail)
        .update();
    return new Booking()
        .id(id)
        .eventType(eventType)
        .start(start)
        .end(end)
        .guestName(guestName)
        .guestEmail(guestEmail);
  }
}
