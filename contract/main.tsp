import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

using TypeSpec.Http;
using TypeSpec.OpenAPI;

@service(#{ title: "Календарь звонков API" })
@server("http://localhost:8080", "Локальный сервер разработки")
namespace CallCalendar;

model HealthStatus {
  status: "ok";
}

@doc("Тип встречи: предложение владельца.")
model EventType {
  @doc("Идентификатор: латиница в нижнем регистре, цифры, дефис.")
  id: string;

  title: string;
  description: string;

  @doc("Длительность в минутах, кратна 30, от 30 до 480.")
  durationMinutes: int32;
}

@doc("Единый формат ошибки.")
model ApiError {
  code: string;
  message: string;

  @doc("Для ошибок данных: поле → сообщение.")
  fieldErrors?: Record<string>;
}

@doc("Данные для создания типа встречи.")
model CreateEventTypeRequest {
  id: string;
  title: string;
  description: string;
  durationMinutes: int32;
}

@route("/api")
namespace Api {
  @get
  @route("/health")
  @tag("Health")
  @operationId("getHealth")
  op getHealth(): HealthStatus;

  @get
  @route("/event-types")
  @tag("EventTypes")
  @operationId("listEventTypes")
  op listEventTypes(): EventType[] | {
    @statusCode _: 500;
    @body body: ApiError;
  };

  @post
  @route("/event-types")
  @tag("EventTypes")
  @operationId("createEventType")
  op createEventType(@body body: CreateEventTypeRequest):
    | {
        @statusCode _: 201;
        @body body: EventType;
      }
    | {
        @statusCode _: 400;
        @body body: ApiError;
      }
    | {
        @statusCode _: 409;
        @body body: ApiError;
      }
    | {
        @statusCode _: 500;
        @body body: ApiError;
      };
}
