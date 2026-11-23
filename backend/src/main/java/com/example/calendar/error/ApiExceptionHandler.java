package com.example.calendar.error;

import com.example.calendar.model.ApiError;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Единый формат ошибок {code, message} для всех эндпоинтов. */
@RestControllerAdvice
class ApiExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

  @ExceptionHandler(Exception.class)
  ResponseEntity<ApiError> handle(Exception e) {
    // Ошибки самого Spring MVC (404, 405, 400 и т. п.) сохраняют свой статус
    if (e instanceof ErrorResponse errorResponse) {
      HttpStatusCode status = errorResponse.getStatusCode();
      HttpStatus known = HttpStatus.resolve(status.value());
      String code = known == null ? "error" : known.name().toLowerCase();
      String message = known == null ? "Ошибка запроса" : known.getReasonPhrase();
      return ResponseEntity.status(status).body(new ApiError().code(code).message(message));
    }
    log.error("Необработанная ошибка", e);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(new ApiError().code("internal_error").message("Внутренняя ошибка сервера"));
  }
}
