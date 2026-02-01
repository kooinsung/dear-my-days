# Database Schema Diagram

## Tables Overview

### Core Tables

#### `events`

사용자가 등록한 이벤트 (생일, 기념일 등)를 저장합니다.

#### `user_providers`

한 사용자가 여러 OAuth 프로바이더를 연결할 수 있습니다.

#### `notification_rules`

사용자별 알림 설정을 저장합니다.

#### `notification_jobs`

실제 예약된 알림 작업을 저장합니다.

### Supporting Tables

#### `user_plans`

사용자의 플랜 정보를 저장합니다.

#### `device_tokens`

푸시 알림을 위한 디바이스 토큰을 저장합니다.

#### `event_purchases`

이벤트 관련 구매 내역을 저장합니다.

## Custom Types (Enums)

### `category_type`

```sql
BIRTHDAY
| ANNIVERSARY | MEMORIAL | HOLIDAY | OTHER
```

### `calendar_type`

```sql
SOLAR
| LUNAR
```

### `payment_provider`

```sql
DEFAULT | APPLE | GOOGLE | STRIPE
```

### `notification_status`

```sql
PENDING
| SENT | FAILED | CANCELLED
```

### `plan_type`

```sql
FREE
| PRO
```

### `auth_provider`

```sql
email
| google | kakao | naver
```

```sql
create table public.events
(
    id         uuid not null default gen_random_uuid(),
    user_id    uuid not null,
    category public.category_type not null,
    title      text not null,
    note       text null,
    calendar_type public.calendar_type null default 'SOLAR'::calendar_type,
    created_at timestamp with time zone null default now(),
    updated_at timestamp with time zone null default now(),
    solar_date date not null,
    lunar_date date null,
    is_leap_month boolean not null default false,
    constraint events_pkey primary key (id),
    constraint events_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
)
```

```sql
create table public.device_tokens
(
    id         uuid not null default gen_random_uuid(),
    user_id    uuid not null,
    token      text not null,
    platform   text not null,
    created_at timestamp with time zone null default now(),
    constraint device_tokens_pkey primary key (id),
    constraint device_tokens_token_key unique (token),
    constraint device_tokens_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
)
```

```sql
create table public.event_purchases
(
    id         uuid                     not null default gen_random_uuid(),
    user_id    uuid                     not null,
    event_id   uuid                     not null,
    provider public.payment_provider not null default 'DEFAULT'::payment_provider,
    amount     integer                  not null,
    currency   character(3)             not null default 'KRW'::bpchar,
    created_at timestamp with time zone not null default now(),
    constraint event_purchases_pkey primary key (id)
)
```

```sql
create table public.notification_jobs
(
    id           uuid                     not null default gen_random_uuid(),
    user_id      uuid                     not null,
    event_id     uuid                     not null,
    scheduled_at timestamp with time zone not null,
    status public.notification_status not null default 'PENDING'::notification_status,
    created_at   timestamp with time zone null default now(),
    constraint notification_jobs_pkey primary key (id),
    constraint notification_jobs_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE,
    constraint notification_jobs_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
)
```

```sql
create table public.notification_rules
(
    id          uuid  not null default gen_random_uuid(),
    user_id     uuid  not null,
    notify_time time without time zone not null,
    created_at  timestamp with time zone null default now(),
    offsets     jsonb not null default '[]'::jsonb,
    constraint notification_rules_pkey primary key (id),
    constraint notification_rules_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
)
```

```sql
create table public.user_plans
(
    user_id    uuid not null,
    plan_type public.plan_type not null default 'FREE'::plan_type,
    started_at timestamp with time zone null default now(),
    expired_at timestamp with time zone null,
    constraint user_plans_pkey primary key (user_id),
    constraint user_plans_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
)
```

```sql
create table public.user_providers
(
    id               uuid not null default gen_random_uuid(),
    user_id          uuid not null,
    provider public.auth_provider not null,
    provider_user_id text not null,
    created_at       timestamp with time zone null default now(),
    constraint user_providers_pkey primary key (id),
    constraint user_providers_provider_provider_user_id_key unique (provider, provider_user_id),
    constraint user_providers_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) 
```
