package com.example.calendar.booking;

import com.example.calendar.api.BookingsApi;
import com.example.calendar.model.Booking;
import com.example.calendar.model.CreateBookingRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
class BookingController implements BookingsApi {

  private final BookingService service;

  BookingController(BookingService service) {
    this.service = service;
  }

  @Override
  public ResponseEntity<Booking> createBooking(CreateBookingRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
  }
}
