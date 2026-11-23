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

@route("/api")
namespace Api {
  @get
  @route("/health")
  @tag("Health")
  @operationId("getHealth")
  op getHealth(): HealthStatus;
}
