# Frontend para Agente N8N

Este proyecto es una aplicación frontend construida con Next.js para proporcionar una interfaz de usuario para interactuar con un agente webhook de N8N.

## Tecnologías Utilizadas

- **Next.js**: Framework de React para renderizado del lado del servidor y generación de sitios estáticos.
- **React**: Librería de JavaScript para construir interfaces de usuario.
- **TypeScript**: Superset tipado de JavaScript que compila a JavaScript plano.
- **Tailwind CSS**: Un framework CSS de primera utilidad para un estilizado rápido.
- **Shadcn UI**: Una colección de componentes reutilizables construidos con Radix UI y Tailwind CSS.
- **N8N**: Herramienta de automatización de flujos de trabajo (interacción a través de webhook).

## Estructura del Proyecto

El proyecto sigue una estructura estándar de Next.js, con directorios y archivos clave:

- `src/`: Contiene el código fuente principal de la aplicación.
  - `src/app/`: Archivos del App Router de Next.js, incluyendo páginas y layout.
    - `page.tsx`: La página principal de la aplicación con la interfaz del agente.
    - `layout.tsx`: El layout raíz para la aplicación.
    - `globals.css`: Estilos globales, incluyendo las importaciones de Tailwind.
  - `src/components/`: Componentes React reutilizables.
    - `AgentForm.tsx`: Componente para la entrada del usuario al agente.
    - `ui/`: Componentes de Shadcn UI.
  - `src/services/`: Servicios para interactuar con APIs externas o lógica.
    - `n8nService.ts`: Servicio para interactuar con el webhook de N8N.
  - `src/hooks/`: Hooks personalizados de React.
  - `src/lib/`: Funciones de utilidad.
- `docs/`: Documentación del proyecto.
  - `blueprint.md`: Plan original del proyecto y guías de diseño.
- `public/`: Archivos estáticos.
- `package.json`: Dependencias y scripts del proyecto.
- `tailwind.config.ts`, `postcss.config.mjs`: Configuración de Tailwind CSS.
- `tsconfig.json`: Configuración de TypeScript.
- `next.config.ts`: Configuración de Next.js.

## Buenas Prácticas Observadas

- **Arquitectura Basada en Componentes**: La interfaz de usuario se divide en componentes React reutilizables (`src/components`).
- **Tipado**: Uso de TypeScript para una mejor mantenibilidad del código y reducción de errores (archivos `.ts`, `.tsx`).
- **Estilizado Utility-First**: Aprovechamiento de Tailwind CSS para un estilizado consistente y eficiente.
- **Librería de UI**: Utilización de Shadcn UI para componentes preconstruidos y accesibles.
- **Manejo de Errores**: Implementación de manejo de errores del lado del cliente para interacciones con la API (visible en `src/app/page.tsx`).
- **Separación de Responsabilidades**: La lógica para interactuar con N8N está separada en un servicio dedicado (`src/services/n8nService.ts`).
- **Estilo de Código**: Formateo y estilo consistentes (implícito por las elecciones de framework/librería).

## Primeros Pasos

1.  Clona el repositorio.
2.  Instala las dependencias:
    ```bash
    npm install
    # o
    yarn install
    ```
3.  Configura las variables de entorno. Probablemente necesitarás una variable de entorno para la URL del webhook de N8N. Crea un archivo `.env.local` en el directorio raíz:
    ```env
    NEXT_PUBLIC_N8N_WEBHOOK_URL=TU_URL_WEBHOOK_N8N
    ```
    Reemplaza `TU_URL_WEBHOOK_N8N` con la URL real de tu webhook de N8N.
4.  Ejecuta el servidor de desarrollo:
    ```bash
    npm run dev
    # o
    yarn dev
    ```
5.  Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Guías de Estilizado (del blueprint)

- Color primario: Azul oscuro (#1A237E) para una sensación profesional y confiable.
- Color secundario: Morado claro (#E1BEE7) para complementar el azul y añadir un toque de creatividad.
- Acento: Teal (#00ACC1) para elementos interactivos y destacados.
- Diseño moderno y limpio con secciones claras para información del webhook, formulario de entrada y visualización de respuestas.
- Usar iconos simples y profesionales para representar diferentes acciones y tipos de datos.
- Animaciones sutiles para estados de carga y envíos de formularios para mejorar la experiencia del usuario.

## Licencia

[Especifica tu licencia aquí, por ejemplo, MIT]