# NewVet Frontend

SPA construida con React, TypeScript, Vite, React Router, Axios y Tailwind CSS.

## Requisitos

- Backend Django corriendo en `http://127.0.0.1:8000`
- Node.js instalado

## Instalacion

```powershell
cd "C:\Users\jimri\Documents\Proyecto VetAtHome\Etapa 1\NewVet\frontend"
npm install
```

## Desarrollo

```powershell
npm run dev
```

Abrir:

```text
http://127.0.0.1:5173
```

El servidor Vite proxya `/api` y `/media` hacia Django, por lo que no se necesita CORS para desarrollo local.

## Usuarios demo

Despues de correr `python backend\manage.py seed_demo_data --reset`, puedes entrar con:

```text
ana.torres@newvet.demo
valentina.perez@newvet.demo
```

Contrasena:

```text
Demo12345
```
