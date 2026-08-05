# Litoplas Academy v5.3 - Instrucciones

## Novedades de esta versión
- Curso secuencial obligatorio (sin botón manual de completar)
- Cuestionario por módulo con preguntas configurables desde admin
- Corrección de videos de YouTube (CSP + conversión automática a embed)
- Panel admin con gestión completa de preguntas (4 opciones + respuesta correcta)

## Variables de entorno
| Variable | Valor |
|----------|-------|
| DATABASE_URL | (Render la crea automáticamente) |
| ADMIN_USER | litoplas_admin |
| ADMIN_PASS | Tu contraseña |
| JWT_SECRET | Texto largo aleatorio |
| NODE_ENV | production |

## URLs
- Curso: /index.html
- Admin: /admin.html
- Consulta pública: /consulta.html
