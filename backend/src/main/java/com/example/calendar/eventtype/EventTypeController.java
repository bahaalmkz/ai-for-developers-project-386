package com.example.calendar.eventtype;

import com.example.calendar.api.EventTypesApi;
import com.example.calendar.model.EventType;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.RestController;

@RestController
class EventTypeController implements EventTypesApi {

  private final JdbcClient jdbc;

  EventTypeController(JdbcClient jdbc) {
    this.jdbc = jdbc;
  }

  @Override
  public ResponseEntity<List<EventType>> listEventTypes() {
    List<EventType> eventTypes =
        jdbc.sql(
                "SELECT id, title, description, duration_minutes FROM event_types ORDER BY title, id")
            .query(
                (rs, rowNum) ->
                    new EventType()
                        .id(rs.getString("id"))
                        .title(rs.getString("title"))
                        .description(rs.getString("description"))
                        .durationMinutes(rs.getInt("duration_minutes")))
            .list();
    return ResponseEntity.ok(eventTypes);
  }
}
