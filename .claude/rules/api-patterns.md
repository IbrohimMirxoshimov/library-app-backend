# API Patterns

## Standard CRUD Controller

Every CRUD controller follows this pattern:

```typescript
@ApiTags('books')
@Controller('books')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BooksController {
  @Get()
  @RequirePermissions(PERMISSIONS.READ_BOOKS)
  @ApiOperation({ summary: 'List books' })
  findAll(@Query() query: QueryBookDto) { ... }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.READ_BOOKS)
  @ApiOperation({ summary: 'Get book by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) { ... }

  @Post()
  @RequirePermissions(PERMISSIONS.CREATE_BOOKS)
  @ApiOperation({ summary: 'Create book' })
  create(@Body() dto: CreateBookDto, @CurrentUser() user: RequestUser) { ... }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.UPDATE_BOOKS)
  @ApiOperation({ summary: 'Update book' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBookDto) { ... }
}
```

## Pagination

All list endpoints accept `PaginationQueryDto` and return `PaginatedResponse<T>`:

```typescript
// Query: GET /books?page=1&size=20&sort=createdAt&order=desc&q=navoiy
// Response:
{
  "items": [...],
  "meta": {
    "page": 1,
    "size": 20,
    "totalItems": 150,
    "totalPages": 8
  }
}
```

## Library Scoping

Most admin queries must be scoped to the user's library:

```typescript
// In service:
const where = {
  ...filters,
  // Owner sees all, others see only their library
  ...(user.role !== 'owner' && { libraryId: user.adminLibraryId }),
};
```

## Error Responses

Standard HTTP status codes:

| Status | When | Exception |
|--------|------|-----------|
| 400 | Invalid input, business rule violation | `BadRequestException` |
| 401 | Missing or invalid token | Automatic via JwtAuthGuard |
| 403 | Insufficient permissions | `ForbiddenException` |
| 404 | Entity not found | `NotFoundException` |
| 429 | Rate limit exceeded | `ThrottlerException` or custom |

Error response format:
```json
{
  "statusCode": 400,
  "message": "Kitob topilmadi",
  "error": "Bad Request"
}
```

## Swagger

Every endpoint MUST have:
- `@ApiTags('module-name')` on controller
- `@ApiOperation({ summary: '...' })` on each method
- `@ApiResponse({ status: 200, description: '...' })` for success
- `@ApiBearerAuth()` on protected controllers
- `@ApiProperty()` on every DTO field with description and example

## Rate Limiting

Rate-limited endpoints use Redis-backed throttling:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /auth/signin` | 10 | 1 minute |
| `POST /app/auth/signin` | 10 | 1 minute |
| `POST /users/check-passport` | 2 | 1 minute |
| `POST /app/expired-rental-info` | 5 | 1 hour |

## Audit Logging

All admin write operations (POST, PATCH) are logged by `AuditLogInterceptor`:
- Captures: userId, action, resource, resourceId, oldData, newData, ip, userAgent
- Applies automatically to all controllers with `@UseInterceptors(AuditLogInterceptor)`
- Read operations (GET) are NOT logged
