import { Elysia, t } from "elysia";
import { success, ErrorCode, apiResponseSchema } from "../../utils/response.ts";
import { ApiError } from "../../middleware/errorHandler.ts";
import { authGuard } from "../../middleware/authGuard.ts";
import { roleGuard } from "../../middleware/roleGuard.ts";
import { UserRole } from "../../constants/userRole.ts";
import {
  getAllServices,
  getServiceById,
  isServiceNameTaken,
  createService,
  updateService,
  deleteService,
} from "./service.ts";

const ServiceResponseSchema = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.String(),
  createdAt: t.String(),
  updatedAt: t.String(),
});

const CreateServiceRequestSchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 255 }),
  description: t.Optional(t.String({ maxLength: 1000 })),
});

const UpdateServiceRequestSchema = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  description: t.Optional(t.String({ maxLength: 1000 })),
});

export const serviceModule = new Elysia({ prefix: "/services" })
  .use(authGuard)
  // Authenticated routes (any logged-in user)
  .get(
    "/",
    () => {
      const services = getAllServices();
      return success(services);
    },
    {
      detail: {
        summary: "List all services",
        description: "Returns all available services",
        tags: ["Service"],
      },
      response: {
        200: apiResponseSchema(t.Array(ServiceResponseSchema)),
        401: t.Any(),
      },
    }
  )
  .get(
    "/:id",
    ({ params }) => {
      const service = getServiceById(params.id);
      if (!service) {
        throw new ApiError(ErrorCode.RESOURCE_NOT_FOUND, "Service not found");
      }
      return success(service);
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        summary: "Get service by ID",
        description: "Returns a single service by its ID",
        tags: ["Service"],
      },
      response: {
        200: apiResponseSchema(ServiceResponseSchema),
        401: t.Any(),
        404: t.Any(),
      },
    }
  )
  // Admin-only routes
  .use(roleGuard(UserRole.ADMIN))
  .post(
    "/",
    ({ body }) => {
      if (isServiceNameTaken(body.name)) {
        throw new ApiError(ErrorCode.VALIDATION_ERROR, "Service name already exists");
      }
      const service = createService(body);
      return success(service);
    },
    {
      body: CreateServiceRequestSchema,
      detail: {
        summary: "Create a service (admin)",
        tags: ["Service"],
      },
      response: {
        200: apiResponseSchema(ServiceResponseSchema),
        400: t.Any(),
        401: t.Any(),
        403: t.Any(),
      },
    }
  )
  .put(
    "/:id",
    ({ params, body }) => {
      if (body.name && isServiceNameTaken(body.name, params.id)) {
        throw new ApiError(ErrorCode.VALIDATION_ERROR, "Service name already exists");
      }

      const service = updateService(params.id, body);
      if (!service) {
        throw new ApiError(ErrorCode.RESOURCE_NOT_FOUND, "Service not found");
      }
      return success(service);
    },
    {
      params: t.Object({ id: t.String() }),
      body: UpdateServiceRequestSchema,
      detail: {
        summary: "Update a service (admin)",
        tags: ["Service"],
      },
      response: {
        200: apiResponseSchema(ServiceResponseSchema),
        400: t.Any(),
        401: t.Any(),
        403: t.Any(),
        404: t.Any(),
      },
    }
  )
  .delete(
    "/:id",
    ({ params }) => {
      const deleted = deleteService(params.id);
      if (!deleted) {
        throw new ApiError(ErrorCode.RESOURCE_NOT_FOUND, "Service not found");
      }
      return success({ deleted: true });
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        summary: "Delete a service (admin)",
        tags: ["Service"],
      },
      response: {
        200: t.Any(),
        401: t.Any(),
        403: t.Any(),
        404: t.Any(),
      },
    }
  );
