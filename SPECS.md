FinanzApp — UX Simplification & Navigation Redesign

1. Objetivo

Rediseñar la experiencia principal de FinanzApp para hacerla más simple, intuitiva y consistente, reduciendo acciones duplicadas y evitando que el usuario tenga que conocer la estructura técnica de la aplicación para realizar tareas cotidianas.

El problema actual no es principalmente visual. La aplicación fue creciendo incorporando funcionalidades y actualmente existen demasiados lugares, pantallas y conceptos para realizar acciones relacionadas.

Ejemplos:

* Existe una pantalla específica /capture para crear gastos.
* También existen dialogs que reutilizan QuickExpenseForm.
* El Home permite gestionar gastos e ingresos.
* Existe una pantalla separada de Gastos.
* Reportes contiene accesos hacia Gastos.
* “Nuevo gasto” aparece como elemento permanente de navegación.
* Los ingresos y gastos utilizan flujos diferentes.
* Viajes tiene demasiado protagonismo para ser una funcionalidad secundaria.
* Algunos conceptos financieros, como “Mes calendario” e “Impacto de caja”, pueden resultar poco intuitivos.

El objetivo de este cambio es simplificar el modelo mental de FinanzApp.

El usuario debería entender solamente estas intenciones:

* Home: ¿Cómo estoy?
* Movimientos: ¿Qué pasó?
* +: Quiero registrar algo.
* Reportes: Quiero entender mis finanzas.
* Más: Funcionalidades secundarias.

⸻

2. Principios del rediseño

2.1 No reescribir la aplicación

Este cambio debe reutilizar tanto como sea posible:

* servicios existentes;
* stores;
* tipos;
* endpoints;
* componentes;
* lógica de gastos;
* lógica de ingresos;
* lógica de viajes;
* lógica de cuotas;
* lógica de FX;
* lógica offline;
* presupuestos;
* reportes.

No realizar una reescritura general del proyecto.

Preferir refactors incrementales y reutilización de componentes.

⸻

2.2 Backend

La primera implementación de este rediseño debe intentar ser 100% frontend.

No modificar contratos de API ni requerir cambios en finanzapp-travels-backend salvo que sea absolutamente necesario.

Si alguna parte de esta especificación requiere inevitablemente un cambio de backend:

1. No inventar endpoints.
2. No romper funcionalidad existente.
3. Documentar claramente la necesidad en el PR.
4. Implementar el resto de la especificación que pueda realizarse solo desde frontend.

⸻

3. Nuevo modelo de navegación

Mobile

La navegación inferior debe pasar a ser:

Home | Movimientos | + | Reportes | Más

Eliminar de la navegación principal:

* Nuevo gasto
* Viajes
* Cuenta

El botón central + debe tener mayor jerarquía visual y representar una acción, no una página.

Destinos

Home:
/home

Movimientos:
usar /expenses inicialmente para minimizar cambios internos, aunque visualmente la sección debe llamarse Movimientos.

Reportes:
/reports

Más:
crear la experiencia necesaria para acceder a funciones secundarias.

⸻

4. Menú “Más”

“Viajes” deja de ser un destino de primer nivel.

Al tocar Más, mostrar las funciones secundarias de FinanzApp.

Como mínimo:

* Viajes
* Configuración
* Cuenta

Ejemplo conceptual:

Más

✈️ Viajes
Administrá gastos compartidos y presupuestos de tus viajes.

⚙️ Configuración
Configuración del espacio financiero actual.

👤 Cuenta
Perfil y preferencias.

La implementación puede ser un Sheet, Drawer o pantalla dedicada dependiendo de cuál se adapte mejor a los patrones existentes.

En mobile preferir un Sheet/Drawer si ofrece una experiencia natural.

⸻

5. Navegación desktop

Simplificar el sidebar.

Navegación principal:

* Home
* Movimientos
* Reportes

Acción destacada:

+ Nuevo movimiento

Sección secundaria:

* Viajes

Parte inferior:

* Configuración
* Cuenta

Eliminar “Nuevo gasto” como elemento de navegación.

Viajes debe tener menor jerarquía visual que Home, Movimientos y Reportes.

⸻

6. Acción global “+”

Crear un único punto de entrada para registrar movimientos.

El usuario no debería tener que decidir a qué pantalla navegar para cargar información.

Al tocar +:

Nuevo movimiento

Mostrar como mínimo:

Gasto
Registrar una compra, pago o gasto.

Ingreso
Registrar sueldo, devolución, transferencia recibida u otro ingreso.

Para tableros everyday, ofrecer también como acción secundaria:

Simular compra en cuotas

Esta opción debe tener menor jerarquía que Gasto e Ingreso.

⸻

7. Crear gasto

Actualmente existe QuickExpenseForm.

Reutilizar su lógica en lugar de crear una implementación paralela.

El nuevo flujo debe abrirse preferentemente mediante Sheet/Dialog desde cualquier lugar de la aplicación.

Evitar navegar obligatoriamente hacia /capture.

/capture puede mantenerse temporalmente por compatibilidad con links existentes, pero no debe ser una sección visible de navegación.

Si se mantiene /capture, considerar convertirla en wrapper/redirect hacia la nueva experiencia sin duplicar lógica.

⸻

8. Formulario de gasto simplificado

QuickExpenseForm soporta muchas funcionalidades y debe conservarlas.

Sin embargo, el formulario inicial debe ser mucho más simple.

Mostrar inicialmente solamente los campos necesarios para la mayoría de los gastos:

Nuevo gasto

Monto

Descripción

Categoría

Medio de pago

Guardar gasto

Debajo:

Más opciones

⸻

9. Progressive disclosure

Las opciones avanzadas no deben desaparecer.

Deben estar disponibles mediante “Más opciones” o una sección equivalente.

Dependiendo del tipo de gasto pueden incluir:

* Fecha
* Moneda
* Comercio
* Estado
* Presupuesto
* Gasto recurrente
* Cuotas
* FX
* otras opciones actualmente soportadas

La intención es:

caso común = extremadamente rápido

caso avanzado = sigue siendo posible

No eliminar funcionalidad existente para conseguir simplicidad visual.

⸻

10. Cuotas

No crear un flujo independiente para registrar compras en cuotas.

Cuando el usuario seleccione un medio de pago de tipo tarjeta de crédito, mostrar naturalmente la posibilidad de seleccionar cuotas.

Ejemplo conceptual:

Cuotas

1 | 3 | 6 | 12 | Otro

Si selecciona varias cuotas, mostrar información útil si puede calcularse con la lógica existente.

Ejemplo:

6 cuotas de $18.333

Primera cuota: agosto 2026

Reutilizar la lógica existente de installment plans.

⸻

11. Ingresos

Los ingresos actualmente utilizan CreateIncomeSheet.

Mantener la lógica existente pero integrarla en el mismo punto global +.

Flujo:

+ → Ingreso → CreateIncomeSheet

No obligar al usuario a ir al Home para registrar un ingreso.

El Home puede seguir teniendo accesos contextuales si realmente aportan valor, pero el punto de entrada principal debe ser +.

⸻

12. Gastos → Movimientos

La sección actualmente denominada Gastos debe evolucionar visualmente a:

Movimientos

La intención de esta pantalla es responder:

¿Qué movimientos ocurrieron?

Debe poder representar conceptualmente tanto gastos como ingresos.

⸻

13. Historial unificado

Cuando sea posible con los servicios existentes, mostrar gastos e ingresos dentro del mismo historial.

Ejemplo:

Hoy

Carrefour
Supermercado · Visa Galicia
−$42.300

Sueldo
Ingreso
+$2.800.000

YPF
Transporte · Débito
−$61.200

Ayer

Reintegro
Ingreso
+$18.500

Los gastos deben representarse visualmente como salidas.

Los ingresos deben representarse visualmente como entradas.

No depender únicamente del color para comunicar la diferencia; utilizar también signo, label/iconografía u otra señal accesible.

⸻

14. Filtros de Movimientos

La pantalla debe ofrecer filtros rápidos:

Todos | Gastos | Ingresos

Mantener filtros avanzados disponibles:

* mes;
* categoría;
* medio de pago;
* estado;
* otros existentes que sigan teniendo sentido.

No mostrar todos los filtros permanentemente si eso genera demasiado ruido en mobile.

Considerar un botón:

Filtros

que abra opciones avanzadas.

⸻

15. Mobile-first para Movimientos

Actualmente existen tablas de gastos.

En mobile preferir una lista optimizada para touch antes que una tabla horizontal compleja.

Cada movimiento debería mostrar principalmente:

* descripción;
* fecha;
* categoría o tipo;
* medio de pago cuando corresponda;
* importe.

Al tocar el movimiento, abrir detalle/acciones.

En desktop puede mantenerse o utilizarse una tabla cuando sea más eficiente.

⸻

16. Detalle de movimiento

Al tocar un movimiento, mostrar un Sheet/Dialog con información relevante.

Ejemplo para gasto:

Carrefour

$42.300

Fecha
11 ago 2026

Categoría
Supermercado

Medio de pago
Visa Galicia

Impacta en
Agosto 2026

Acciones:

* Editar
* Eliminar

Para ingresos, mostrar los campos correspondientes.

Reutilizar las operaciones existentes.

⸻

17. Home — propósito

Simplificar el Home.

El Home debe responder principalmente:

1. ¿Cuánto dinero tengo/disponible?
2. ¿Cuánto ingresó?
3. ¿Cuánto gasté?
4. ¿Qué gastos/compromisos vienen?
5. ¿Cómo voy con mis presupuestos?

Evitar convertir el Home en una pantalla administrativa.

⸻

18. Home — estructura objetivo

Mantener selector de contexto/tablero y selector de mes cuando corresponda.

Después priorizar una jerarquía similar a:

Disponible estimado

Mostrar la cifra principal utilizando los datos existentes de forecast cuando sea posible.

Debajo:

* Ingresos
* Gastado
* Próximos compromisos

Luego:

Presupuestos

Mostrar los presupuestos principales y su progreso.

Agregar “Ver todos” si corresponde.

Luego:

Próximos movimientos

Mostrar gastos recurrentes, cuotas u otros compromisos futuros cuando la información existente lo permita.

Luego:

Últimos movimientos

Mostrar gastos e ingresos recientes en una lista unificada.

Agregar:

Ver todos los movimientos

que navegue a Movimientos.

⸻

19. Home — reducir acciones administrativas

Eliminar o reducir protagonismo de acciones como:

* Config. tablero
* Registrar ingreso
* otras configuraciones

La configuración debe vivir principalmente en Configuración.

Registrar ingreso debe estar disponible mediante +.

No eliminar funcionalidad; cambiar jerarquía y ubicación.

⸻

20. Terminología

Evitar lenguaje innecesariamente técnico cuando exista una alternativa más comprensible.

Especialmente revisar:

Impacto de caja

y

Mes calendario

Preferir términos similares a:

Mes de pago

Las compras con tarjeta aparecen en el mes en que se pagan.

Fecha de compra

Los gastos aparecen según el día en que se realizó la compra.

Los nombres definitivos pueden adaptarse si existe una alternativa todavía más clara.

Mantener tooltips o textos explicativos breves cuando ayuden.

⸻

21. Reportes

Reportes debe tener una responsabilidad clara:

analizar y entender las finanzas.

No debe funcionar como navegación alternativa hacia funcionalidades operativas.

Eliminar o reducir elementos como:

* “Explorar gastos”
* “Registrar gasto”
* otros accesos que duplican Movimientos o +

Reportes debe centrarse en:

* ingresos;
* gastos;
* balance;
* categorías;
* medios de pago;
* evolución;
* tarjetas;
* presupuestos;
* consolidado.

No es necesario crear reportes nuevos si el backend no provee los datos.

El objetivo inmediato es reorganizar los existentes.

⸻

22. Viajes

Viajes es una funcionalidad importante pero secundaria.

No debe aparecer con la misma jerarquía que Home, Movimientos o Reportes.

Debe estar accesible desde:

Más → Viajes

en mobile.

En desktop puede aparecer en una sección secundaria del sidebar.

No eliminar:

* viajes existentes;
* presupuestos;
* participantes;
* gastos compartidos;
* balances;
* lógica travel;
* selección de tablero travel.

⸻

23. Context awareness

La acción global + debe respetar el contexto activo.

Si el usuario está utilizando un tablero Personal:

+ → Gasto

debe crear el gasto en Personal.

Si está dentro de un viaje Salta:

+ → Gasto

debe utilizar Salta como tablero activo.

Evitar preguntar nuevamente información que la aplicación ya conoce.

⸻

24. Tableros

Mantener internamente el concepto Board.

No realizar un refactor masivo del dominio.

Sin embargo, reducir la exposición de la palabra “tablero” en la interfaz cuando no sea necesaria.

El usuario debería poder pensar simplemente en contextos como:

* Personal
* Salta
* Orlando

El selector existente puede mantenerse, pero revisar textos como:

“Tablero activo”

si pueden reemplazarse por una interfaz más natural.

⸻

25. Consistencia de creación

Después de este rediseño debe existir una regla clara:

Para registrar algo nuevo, el usuario utiliza +.

Todos los botones contextuales de creación deben reutilizar el mismo mecanismo cuando sea razonable.

Evitar implementar:

* un formulario diferente desde Home;
* otro desde Movimientos;
* otro desde Reportes;
* otro desde navegación.

Una acción, una implementación.

⸻

26. Rutas existentes

Evitar romper URLs existentes innecesariamente.

Rutas como:

* /capture
* /expenses
* /travel

pueden mantenerse internamente por compatibilidad.

El objetivo principal es cambiar la arquitectura de navegación y experiencia, no necesariamente realizar una migración completa de rutas.

/expenses puede seguir siendo la URL aunque el usuario vea Movimientos.

⸻

27. Responsive

La experiencia debe funcionar correctamente en:

* iPhone/mobile;
* tablet;
* desktop.

Priorizar especialmente mobile/PWA porque FinanzApp tiene un uso natural de registro rápido desde celular.

En mobile:

* evitar tablas horizontales cuando sea posible;
* utilizar Sheets/Drawers;
* targets táctiles cómodos;
* formularios rápidos;
* bottom navigation clara.

En desktop:

* aprovechar sidebar;
* tablas cuando aporten eficiencia;
* dialogs cuando corresponda.

⸻

28. Diseño visual

No realizar un rediseño completo del design system.

Mantener:

* componentes UI existentes;
* Tailwind;
* tokens;
* tipografías;
* estilo visual actual;
* dark mode si existe;
* patrones shadcn existentes.

El foco de este trabajo es:

UX + information architecture + simplificación.

Realizar mejoras visuales solamente cuando apoyen esos objetivos.

⸻

29. Accesibilidad

Mantener o mejorar:

* labels;
* aria-labels;
* navegación por teclado;
* contraste;
* focus states;
* semántica;
* botones táctiles adecuados.

No comunicar ingreso/gasto exclusivamente mediante rojo/verde.

⸻

30. Offline / PWA

No romper:

* creación offline de gastos;
* sincronización existente;
* PWA;
* banners de sincronización;
* eventos de actualización de gastos.

La nueva experiencia de creación debe seguir utilizando la infraestructura existente.

⸻

31. Estados vacíos

Actualizar estados vacíos para utilizar el nuevo modelo mental.

Ejemplo:

En Movimientos:

Todavía no hay movimientos este mes.

+ Registrar movimiento

No utilizar múltiples CTAs diferentes como:

* Nuevo gasto
* Registrar gasto
* Crear gasto

si todos realizan la misma acción.

Mantener consistencia.

⸻

32. Compatibilidad con Travel

QuickExpenseForm contiene comportamiento específico para viajes.

No eliminarlo.

La simplificación visual debe adaptarse según board.type.

Para travel, las opciones avanzadas pueden incluir:

* pagado por;
* participantes;
* división;
* presupuesto.

Mantener la lógica actual.

⸻

33. Arquitectura sugerida

No es obligatorio utilizar estos nombres exactos, pero considerar una arquitectura similar:

* CreateMovementSheet
* MovementList
* MovementItem
* MovementDetailSheet
* reutilización de QuickExpenseForm
* reutilización de CreateIncomeSheet

Evitar duplicar lógica de negocio.

CreateMovementSheet debería actuar principalmente como orquestador:

1. elegir Gasto / Ingreso;
2. abrir el formulario correspondiente;
3. mantener contexto del board activo.

⸻

34. Scope de esta primera iteración

Prioridad P0:

1. Nueva navegación mobile.
2. Nueva navegación desktop.
3. Botón global +.
4. Gasto e ingreso accesibles desde +.
5. Eliminar “Nuevo gasto” como destino principal.
6. Gastos → Movimientos.
7. Viajes → navegación secundaria / Más.
8. Simplificar formulario de gasto mediante progressive disclosure.
9. Simplificar Home.
10. Reducir duplicación entre Home / Gastos / Reportes.

Prioridad P1:

11. Historial visual unificado de ingresos y gastos.
12. Mejor experiencia mobile de movimientos.
13. Detalle de movimiento.
14. Simplificación de filtros.
15. Terminología Mes de pago / Fecha de compra.

Prioridad P2:

16. Refinamientos visuales.
17. Animaciones/transiciones.
18. mejoras adicionales descubiertas durante la implementación.

Completar P0 antes de invertir tiempo significativo en P2.

⸻

35. Fuera de alcance

No realizar como parte de este trabajo salvo necesidad técnica:

* reescritura del backend;
* migraciones grandes de base de datos;
* reemplazo del design system;
* cambio de framework;
* refactor general de servicios;
* refactor general de Zustand;
* nuevas funcionalidades financieras no especificadas;
* cambios destructivos de datos;
* eliminación de features existentes.

⸻

36. Criterios de aceptación

La implementación debe cumplir como mínimo:

Navegación

* Mobile muestra Home / Movimientos / + / Reportes / Más.
* Viajes no aparece como navegación mobile principal.
* Desktop prioriza Home / Movimientos / Reportes.
* “Nuevo gasto” no aparece como sección principal.

Creación

* + permite crear gasto.
* + permite crear ingreso.
* En everyday permite acceder a simulación de cuotas como acción secundaria.
* Se reutilizan formularios/lógica existentes.

Gastos

* El flujo común muestra inicialmente pocos campos.
* Las opciones avanzadas siguen disponibles.
* Cuotas siguen funcionando.
* FX sigue funcionando.
* creación offline sigue funcionando.
* travel sigue funcionando.

Movimientos

* La sección se llama Movimientos.
* Los gastos siguen siendo consultables/editables/eliminables.
* Los ingresos pueden integrarse al historial si los servicios existentes lo permiten sin backend adicional.
* La experiencia mobile no depende de una tabla horizontal compleja.

Home

* Tiene menor densidad administrativa.
* Prioriza situación financiera actual.
* Registrar ingreso deja de ser una acción exclusiva del Home.
* Configuración pierde protagonismo.

Reportes

* Se centra en análisis.
* No duplica innecesariamente la navegación hacia gastos/creación.

Viajes

* Sigue completamente funcional.
* Tiene menor jerarquía de navegación.

⸻

37. Validación técnica

Antes de finalizar:

1. Ejecutar instalación de dependencias si es necesario.
2. Ejecutar lint.
3. Ejecutar TypeScript check si existe.
4. Ejecutar tests disponibles.
5. Ejecutar build de producción.
6. Corregir errores introducidos por estos cambios.

No ignorar errores TypeScript para completar el PR.

⸻

38. Revisión manual

Verificar manualmente como mínimo:

Mobile

* Home
* Movimientos
* ●	
* crear gasto
* crear ingreso
* Reportes
* Más
* Viajes
* Cuenta
* Configuración

Desktop

* sidebar;
* cambio de board;
* creación de gasto;
* creación de ingreso;
* Movimientos;
* Reportes;
* Viajes.

Verificar tanto un board:

everyday

como:

travel

si existen datos adecuados.

⸻

39. Estrategia Git

No trabajar directamente sobre main.

Crear una rama feature específica para este rediseño.

Realizar commits claros.

Al finalizar crear un Draft Pull Request contra main.

El PR debe explicar:

* cambios realizados;
* decisiones UX tomadas;
* componentes nuevos;
* componentes reutilizados;
* funcionalidades existentes preservadas;
* checks ejecutados;
* limitaciones;
* elementos de esta especificación que hayan quedado pendientes.

⸻

40. Instrucciones para el agente

Antes de modificar código:

1. Leer este SPECS.md completo.
2. Inspeccionar la arquitectura actual.
3. Identificar los componentes existentes que pueden reutilizarse.
4. Revisar especialmente:
    * routing;
    * AppShellLayout;
    * BottomNav;
    * AppSidebar;
    * DashboardPage;
    * EverydayBoardHome;
    * ExpensesPage;
    * ExpensesExplorerSection;
    * QuickExpenseForm;
    * ExpenseFormDialog;
    * CreateIncomeSheet;
    * ReportsPage;
    * flujo Travel;
    * stores de boards;
    * lógica offline.

No asumir que esta especificación exige reemplazar componentes existentes.

Preferir adaptar y componer.

Si durante la implementación existe una decisión UX menor no definida explícitamente, elegir la alternativa que:

1. requiera menor esfuerzo cognitivo del usuario;
2. mantenga consistencia;
3. reduzca duplicación;
4. preserve funcionalidad;
5. sea mobile-first.

Si existe una decisión arquitectónica importante no contemplada, documentarla en el PR.

⸻

41. Resultado esperado

Después del rediseño, un usuario nuevo debería poder aprender FinanzApp mediante cinco conceptos:

Home
Veo cómo estoy.

Movimientos
Veo qué pasó.

+
Registro algo.

Reportes
Entiendo mis finanzas.

Más
Accedo a funciones secundarias.

Viajes debe seguir siendo una funcionalidad potente, pero no definir la experiencia principal de un usuario que solamente quiere administrar sus finanzas personales.

La aplicación debe sentirse más simple después del cambio aunque conserve prácticamente la misma potencia funcional.