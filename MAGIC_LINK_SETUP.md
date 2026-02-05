# 🔗 Настройка Magic Link Authentication

## ✅ Что исправлено

1. ✅ **Переключились с OTP на Magic Link** - проще и работает из коробки
2. ✅ **Убрана форма ввода кода** - теперь просто нужно кликнуть ссылку в email
3. ⚠️ **ANON_KEY нужно исправить** - сейчас неправильный формат
4. ⚠️ **Google OAuth нужно настроить** в Supabase
5. ⚠️ **Email брендинг** можно настроить в Supabase

---

## 🚨 КРИТИЧНО: Исправьте ANON_KEY

### Проблема

В `.env` сейчас:
```bash
VITE_SUPABASE_ANON_KEY=sb_publishable_d4W5pK3xjBVqFRb3Y1h06Q_tIUmCwCa
```

Это **неправильный формат**! Supabase не принимает `sb_publishable_...` ключи для аутентификации.

### Решение

#### Шаг 1: Откройте Supabase Dashboard

```
https://supabase.com/dashboard/project/kirvqjgyxjyvwflghchw/settings/api
```

#### Шаг 2: Найдите правильный ключ

На странице API Settings найдите секцию **Project API keys**.

Там будет 2 ключа:

1. **anon / public** ← ЭТОТ нужен!
2. **service_role / secret** ← НЕ используйте!

#### Шаг 3: Скопируйте "anon public" ключ

Нажмите кнопку **Copy** рядом с **anon / public** ключом.

**Правильный ключ выглядит так:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpcnZxamd5eGp5dndmbGdoY2h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1MDI4NzUsImV4cCI6MjA1NDA3ODg3NX0.sEVKR2Lm5K6rZqOqtG8_QQN1xIcYl0vwC5pRaEg-sKg
```

- Начинается с `eyJ`
- Очень длинный (200+ символов)
- Содержит точки: `eyJ...eyJ...abc`

#### Шаг 4: Замените в .env

Откройте:
```
/Users/sergejdaniluk/projects/aviaframe/portal/client/.env
```

Замените строку 9:
```bash
# БЫЛО (неправильно!)
VITE_SUPABASE_ANON_KEY=sb_publishable_d4W5pK3xjBVqFRb3Y1h06Q_tIUmCwCa

# ДОЛЖНО БЫТЬ (правильно!)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Шаг 5: Перезапустите сервер

**ОБЯЗАТЕЛЬНО!** `.env` загружается только при старте.

```bash
# Остановите сервер (Ctrl+C)
cd /Users/sergejdaniluk/projects/aviaframe/portal/client
npm run dev
```

#### Шаг 6: Проверьте Console

Откройте http://localhost:3002

F12 → Console

Должно быть:
```
✅ Supabase initialized: {
  url: "https://kirvqjgyxjyvwflghchw.supabase.co",
  keyLength: 219
}
```

Если `❌ Supabase credentials missing` - ключ не загрузился, перезапустите еще раз.

---

## 📧 Как работает Magic Link

### 1. Пользователь вводит email

Нажимает **"Continue with Email"**

### 2. Supabase отправляет письмо

Тема: **"Your Magic Link"** (можно изменить)

Содержимое:
```
Click the link below to sign in:

[Sign In]
```

### 3. Пользователь кликает ссылку

Ссылка выглядит так:
```
https://kirvqjgyxjyvwflghchw.supabase.co/auth/v1/verify?token=...&type=magiclink&redirect_to=http://localhost:3002
```

### 4. Supabase создает сессию

После клика:
- Supabase проверяет токен
- Создает сессию
- Редиректит на `http://localhost:3002`
- Сессия сохраняется в cookie

### 5. Приложение получает пользователя

Нужно добавить обработчик в `App.jsx` (см. ниже).

---

## 🎨 Настройка брендинга email (Aviaticket)

### Шаг 1: Откройте Email Templates

```
https://supabase.com/dashboard/project/kirvqjgyxjyvwflghchw/auth/templates
```

### Шаг 2: Выберите "Magic Link"

Нажмите на **"Magic Link"** template.

### Шаг 3: Измените Subject

**Было:**
```
Your Magic Link
```

**Измените на:**
```
Aviaticket - Sign In to Your Account
```

### Шаг 4: Измените Body

Замените весь HTML на:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aviaticket - Sign In</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                ✈️ Aviaticket
              </h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">
                Your Flight Booking Platform
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 22px;">
                Sign in to your account
              </h2>
              <p style="margin: 0 0 25px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                Click the button below to securely sign in to Aviaticket. This link will expire in <strong>60 minutes</strong>.
              </p>

              <!-- Sign In Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="{{ .ConfirmationURL }}"
                       style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; font-size: 16px; font-weight: bold; text-decoration: none; padding: 15px 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.4);">
                      Sign In to Aviaticket
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 25px 0 0 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                Or copy and paste this URL into your browser:
              </p>
              <p style="margin: 10px 0 0 0; padding: 15px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; word-break: break-all; color: #6b7280; font-size: 13px; font-family: monospace;">
                {{ .ConfirmationURL }}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 12px;">
                If you didn't request this email, you can safely ignore it.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © 2026 Aviaticket. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### Шаг 5: Сохраните

Нажмите **"Save"** внизу страницы.

### Шаг 6: Протестируйте

Попробуйте войти снова - теперь письмо будет от **"Aviaticket"** с красивым дизайном!

---

## 🔐 Настройка Google OAuth

### Проблема

```
{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}
```

Google OAuth не настроен в Supabase.

### Решение

#### Шаг 1: Создайте Google OAuth Client

1. Откройте [Google Cloud Console](https://console.cloud.google.com)
2. Создайте новый проект или выберите существующий
3. Перейдите в **APIs & Services** → **Credentials**
4. Нажмите **"Create Credentials"** → **"OAuth client ID"**
5. Выберите **"Web application"**

#### Шаг 2: Настройте Redirect URIs

В OAuth client добавьте:

**Authorized redirect URIs:**
```
https://kirvqjgyxjyvwflghchw.supabase.co/auth/v1/callback
http://localhost:3002
```

#### Шаг 3: Скопируйте Client ID и Secret

После создания OAuth client:
- **Client ID**: `123456789-abc...apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-...`

Сохраните их!

#### Шаг 4: Настройте в Supabase

Откройте:
```
https://supabase.com/dashboard/project/kirvqjgyxjyvwflghchw/auth/providers
```

1. Найдите **Google**
2. Нажмите **Enable**
3. Вставьте:
   - **Client ID**: (из Google Cloud Console)
   - **Client Secret**: (из Google Cloud Console)
4. Нажмите **Save**

#### Шаг 5: Протестируйте

Перезапустите приложение:
```bash
npm run dev
```

Попробуйте нажать **"Continue with Google"** - должен открыться Google OAuth flow.

---

## 🔄 Добавьте обработчик Magic Link в App.jsx

После клика на ссылку в email, нужно обработать callback.

### Добавьте в App.jsx:

```javascript
// В начале компонента App, после useEffect для user
useEffect(() => {
  // Listen for auth state changes (magic link callback)
  const { data: authListener } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      console.log('Auth state changed:', event, session);

      if (event === 'SIGNED_IN' && session?.user) {
        const user = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.email.split('@')[0],
          provider: session.user.app_metadata?.provider || 'email'
        };

        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
      }

      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('user');
        setUser(null);
      }
    }
  );

  return () => {
    authListener?.subscription.unsubscribe();
  };
}, []);
```

Импортируйте `supabase`:
```javascript
import { supabase } from './lib/supabase';
```

---

## ✅ Финальный чеклист

После всех настроек проверьте:

### 1. ANON_KEY исправлен
- [ ] Ключ начинается с `eyJ`
- [ ] Длина ~200+ символов
- [ ] Сервер перезапущен
- [ ] Console показывает `✅ Supabase initialized`

### 2. Magic Link работает
- [ ] Нажимаете "Continue with Email"
- [ ] Приходит письмо (проверьте Spam!)
- [ ] Тема: "Aviaticket - Sign In to Your Account"
- [ ] Кликаете ссылку
- [ ] Автоматически логинитесь

### 3. Google OAuth работает
- [ ] Google OAuth настроен в Supabase
- [ ] Нажимаете "Continue with Google"
- [ ] Открывается Google OAuth flow
- [ ] После выбора аккаунта логинитесь

---

## 🧪 Тестирование

```bash
# 1. Убедитесь что ключ правильный
cd /Users/sergejdaniluk/projects/aviaframe/portal/client
npm run dev

# 2. Откройте приложение
# http://localhost:3002

# 3. Нажмите "Sign In"

# 4. Введите ваш реальный email

# 5. Проверьте почту (Spam folder!)

# 6. Кликните ссылку в письме

# 7. Должны автоматически войти
```

---

## 🆘 Troubleshooting

### Проблема: Письмо не приходит

**Проверьте:**
- Spam/Junk folder
- Email provider не блокирует Supabase
- Supabase Dashboard → Auth → Users (есть ли пользователь?)

### Проблема: После клика на ссылку не логинит

**Проверьте:**
- Добавлен ли `onAuthStateChange` обработчик в App.jsx
- Console показывает `Auth state changed: SIGNED_IN`
- Cookie сохраняется (F12 → Application → Cookies)

### Проблема: Google OAuth ошибка

**Проверьте:**
- Google OAuth Client создан
- Redirect URIs правильные
- Client ID и Secret добавлены в Supabase
- Provider **Enabled** в Supabase

---

**Статус**: Исправьте ANON_KEY и тестируйте! 🚀
