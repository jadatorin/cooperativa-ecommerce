# 📋 Guía de Contribución - Cooperativa E-commerce

Gracias por tu interés en contribuir a este proyecto. Esta guía te ayudará a entender los flujos de trabajo, convenciones y decisiones de arquitectura del proyecto.

## 🛠️ Flujos de Trabajo (Workflows)

### SDD (Spec-Driven Development)

Este proyecto utiliza **Spec-Driven Development** para gestionar cambios sustanciales. El flujo estructurado garantiza calidad, revisiones consistentes y despliegues predecibles.

#### Ciclo de Vida SDD

```
proposal -> specs --> tasks -> apply -> verify -> archive
             ^
             |
           design
```

#### Modos de Pace

Antes de iniciar cualquier trabajo SDD, el orchestrator preguntará por el modo de ejecución:

| Modo | Descripción |
|------|-------------|
| **Interactive** (`interactive`) | Después de cada fase, se muestra un resumen y se pide al usuario que prosiga, ajuste o detenga. Usa el sistema de preguntas nativo para decisiones. |
| **Automatic** (`auto` por defecto) | Ejecutan todas las fases seguidas sin pausar el usuario. El orchestrator valida automáticamente después de cada fase para detectar problemas antes de continuar. |

**Por defecto:** `auto`. Después de la aprobación del alcance, se espera 0 prompts en el camino feliz y como máximo 1 prompt por fallo recuperable.

#### Estrategia de Envío (Delivery Strategy)

Antes de lanzar `sdd-apply`, se debe definir la estrategia de envío. Las opciones son:

| Estrategia | Cuándo usarla | Comando típico |
|------------|---------------|----------------|
| **ask-on-risk** (por defecto) | Cambios normales, risk mediano-bajo. Pregunta si forecast dice "high risk" o >400 líneas. | `sdd-apply --strategy ask-on-risk` |
| **auto-chain** | Cambios independientes en slices pequeñas. Continuación automática con PRs apilados. | `sdd-apply --strategy auto-chain` |
| **single-pr** | Cambio único y pequeño. Un solo PR. Si >400 líneas, requiere `size:exception`. | `sdd-apply --strategy single-pr` (requiere `size:exception` si >400 líneas) |
| **exception-ok** | Mantenedor ha explicitado aceptar PRs grandes. **Solo usa esto cuando el maintainer haya autorizado explícitamente.** | `sdd-apply --strategy exception-ok` |

**Configuración por defecto:** `ask-on-risk`.

**Cuándo elegir cada una:**

- **ask-on-risk**: Usa casi siempre. El orchestrator se detiene y pregunta cuando el forecast dice "high risk" o >400 líneas. Good para teams conservadores que protegen a los revisores.

- **auto-chain**: Cuando el cambio se puede dividir en slices autónomas que mergean a main en orden. Prioriza velocidad sobre revisiones profundas.

- **single-pr**: Cambio pequeño/unidad única. Fácil de revisar. Si >400 líneas, mantener `size:exception` aprobado por el maintainer.

- **exception-ok**: **Solo usa esto cuando el maintainer (líder técnico) ha explicitado "estoy de acuerdo en aceptar PRs grandes sin splitting"**. No usarlo por defecto.

#### Preflight Gate (GUARDIA OBLIGATORIA)

Antes de cualquier comando SDD (`/sdd-new`, `/sdd-ff`, `/sdd-continue`, `/sdd-apply`, etc.), se ejecuta una guardia:

1. **Pace**: Interactive o Automatic.
2. **Artifacts**: OpenSpec, Engram, o Both (ambos = `hybrid`).
3. **PR strategy**: Ask me, Single PR, o Auto.

**Policy fija:** 400 líneas cambiadas por PR; arriba de 400, dividir el PR o requerir maintainer-approved `size:exception`. **NUNCA** preguntar como cuarto grupo o presupuesto seleccionable.

#### Init Guard (GUARDIA DE INICIALIZACIÓN)

Después de la guardia de sesión y ANTES de ejecutar CUALQUIER comando SDD:

1. Buscar en Engram: `mem_search(query: "sdd-init/{project}", project: "{project}")`
2. Si encontrado -> init ya fue hecho, proceder normalmente.
3. Si NO encontrado -> correr `sdd-init` PRIMERO (delegar a sub-agent `sdd-init`), DESPUÉS proceder con el comando solicitado.

**Esto asegura:**
- Las capacidades de testing siempre sean detectadas y cached.
- Strict TDD Mode se active cuando el proyecto lo soporte.
- El contexto del proyecto (stack, convenciones) esté disponible para todas las fases.

**No saltarse este check.** El único init silencioso permitido es después de que la guardia de sesión ya haya sido satisfecha.

#### Artifact Store Mode

| Mode | Behavior |
|------|----------|
| `engram` | Default when available. Persistent memory across sessions. |
| `openspec` | File-based artifacts. Use only cuando el usuario explícitamente lo solicite. |
| `hybrid` / `both` | Ambos - files para sharing en equipo + engrid para recovery cross-session. Más tokens por operación. |
| `none` | Return results inline only. Recommend enabling engrid o openspec. |

**Si el usuario no especifica:** detectar: si engrid está disponible -> default a `engram`. Si no -> `none`.

Cachear la elección de artifact store para la sesión. Pasarlo como `artifact_store.mode` a cada sub-agent launch.

#### Estrategia de Cadena (Chain Strategy)

Cuando `delivery_strategy` resulta en PRs en cadena (ya sea por elección del usuario vía `ask-on-risk` o automáticamente vía `auto-chain`), preguntar al usuario cuál estrategia de cadena usar. Presentar las dos opciones a través de una llamada a la herramienta `question` cuando la ruta nativa usable esté disponible; de lo contrario, emitir la elección completa a través del fallback de Prompts de Bloqueo y STOP.

| Strategy | Descripción |
|----------|-------------|
| **stacked-to-main** | Cada PR mergea a main en orden. Iteración rápida, fix sobre la marcha. Mejor para teams que priorizan velocidad y slices independientes. |
| **feature-branch-chain** | La branch/features/Tracker acumula la integración final. PR #1 apunta a la branch tracker, PRs posteriores apuntan a la PR inmediata anterior así los diffs de revisión se mantienen enfocados. Solo el tracker mergea a main. Mejor para control de rollback y releases coordinados. |

**Cachear la chain strategy para la sesión.** Pasarla como `chain_strategy` a `sdd-tasks` y `sdd-apply` prompts junto con `delivery_strategy`. No preguntar nuevamente a menos que el usuario cambie el alcance.

#### Dependency Graph

```
proposal -> specs --> tasks -> apply -> verify -> archive
             ^
             |
           design
```

#### Result Contract

Cada fase retorna: `status`, `executive_summary`, `artifacts`, `next_recommended`, `risks`, `skill_resolution`.

#### Gatekeeper (VALIDACIÓN AUTOMÁTICA)

En modo **Automatic**, el orchestrator es el gatekeeper entre fases. La gatekeeper se ejecuta después de cada fase: cuando un fase delegada regresa Y ANTES de lanzar la fase delegada siguiente, el orchestrator **MUST** validar que la fase alcanzó su objetivo con todo en orden.

**Qué la gatekeeper revisa (cada fase, contra el Contract Contract):**

- **Conformidad de contrato:** la fase retornó `status`, `executive_summary`, `artifacts`, `next_recommended`, `risks`, y `skill_resolution`, y `status` indica éxito (no partial, failed, o blocked).
- **Existencia de artifact:** el artifact declarado realmente existe y es legible en el backend activo — leerlo (engrid: `mem_search` + `mem_get_observation` en el topic key; openspec: leer la ruta del archivo). Una fase que reporta éxito pero produjo no artifact retrievable FAILS la gate.
- **No alucinación:** cada ruta de archivo, símbolo, comando o artifact que la fase afirma que creó o referenció debe realmente existir; hacer spot-check de las afirmaciones concretas. Una ruta referenciada que no se resuelve FAILS la gate. Una ruta que el artifact marca explícitamente como planeado (para ser creado por un later apply) **no** es requerida aún; solo las rutas afirmadas como ya creadas o leídas deben resolverse.
- **No drift de inputs:** el output es consistente con los inputs requeridos por el Dependency Graph — spec se mantiene dentro del proposal's scope, design responde al proposal, tasks cubren spec y design. Requisitos inventados, scope creep, o requisitos caídos FAIL la gate.
- **Routing coherence:** `next_recommended` sigue el Dependency Graph y `risks` están dentro de tolerancia (no hay riesgos sin abordar CRITICAL).

**Hybrid validation mechanism (cost-aware):**

- **Inline para fases de bajo riesgo** (`sdd-explore`, `sdd-spec`, `sdd-tasks`, `sdd-archive`): el orchestrator ejecuta las verificaciones mismo leyendo el artifact de vuelta. Sin sub-agent extra.
- **Fresh-context phase-contract validator** (`sdd-design`, `sdd-apply`): validar el artifact de la fase contra sus inputs solo. No es revisión de implementación adversarial, no inspecciona el diff del código, y no crea transacciones 4D/Judgment-Day ni presupuesto.
- **Escalada en olor:** si una verificación inline en una fase de bajo riesgo encuentra algún olor (mismatch de status, ruta sin resolver, drift sospechoso, artifact faltante), escalar esa fase a una revisión delegada con contexto fresco antes de decidir.

**En gate PASS:** continuar automáticamente a la siguiente fase. Auto se mantiene auto en el camino feliz.

**En gate FAIL:** re-ejecutar la fase exactamente una vez con feedback correctivo que nombre las fallos específicos que la gatekeeper encontró (no retry blanket). Re-ejecutar la gate en el nuevo resultado. Si pasa, continuar la cadena. Si falla de nuevo, DETENER la cadena automática y surfacear un reporte al usuario nombrando la fase, qué fue lo que la gatekeeper caught, ambos intentos, y el fix recomendado. **No avanzar a fases dependientes en una gate fallida** — un artifact malo compounda downstream.

Una falla terminal `sdd_task_result_empty` o `sdd_task_result_malformed` es un fallo de transporte, **no** una gate falla: **NO** la retry automáticamente, no create ni promueva artifacts, **NO** lanzar otra fase SDD. La falla comienza con el token literal `GENTLE_AI_SDD_FAILURE`; inmediatamente después sigue el JSON handoff `gentle-ai.sdd-task-result-failure/v1`. Preservar ese JSON unchanged, seguir su `continuation` exactly once, y ejecutarlo solo cuando supplied como command. **Never** turn guidance into a guessed command: use only the coordinator's retained structured status for the selected change and artifact store; if unavailable, report the terminal failure and ask the user to select both. **Do not infer either, run unscoped status discovery, retry, or launch another phase.** Surface the typed terminal failure and wait for an explicit user decision. A later launch in the same session receives `sdd_task_dispatch_latched` en vez de eso: ese launch never dispatched, así que nombra la fase que solicitó, la fase y código anterior que realmente falló, y su `exit` — start a new session to launch SDD phases again.

OpenCode `background: true` launch acknowledgements and progress signals are nonterminal. **No deben** producir ni fallo de transporte ni un session latch; esperar al niño que complete, luego usar la ruta normal de artifact/status.

La gatekeeper se ejecuta en adición al Receipt-driven development workload guard y a los Mandatory Delegation Triggers; **nunca** las relaja y **nunca** auto-marca nada reviewado en engrid.

#### Receipt-driven Development (RDD)

El usuario controla el desarrollo con recibos con un switch: `gentle-ai review mode enable|disable|status`.

- Es **opt-in y off por defecto**. Hasta que el usuario explícitamente lo habilite, las reviews no corren y el delivery sigue policy ordinaria. **No trates eso como un fault to diagnose or work around.**
- `status` es read-only. Reporta la fuente deciding y el modo efectivo, y cambia nada. Una fuente deciding `default` significa que nadie ha elegido, así que el modo efectivo es off.
- Cuando el usuario pide parar de usar RDD, correr `disable`. **No argue, no work around it, and do not propose alternatives first.**
- Mientras está disabled, continuar implementing organically through direct inline, delegated direct, or optional SDD: **no start reviews, no retry, no reactivate it, and do not fall back to any retired path.**
- Delivery under a disabled switch follows ordinary repository policy y reports `disabled/unmanaged`, **never** a fabricated approval.
- **Never enable receipt-driven development on the user's behalf unless the user explicitly asks for it.**

#### Reglas de Delegación (Siempre ACTIVAS)

| Regla | Instrucción |
|-------|-------------|
| No work inline | Reading/writing code, analysis, tests → delegate to sub-agent |
| Preferir delegate | Siempre usar `delegate` (async) sobre `task` (sync). Solo usar `task` cuando NECESITAS el resultado antes de tu siguiente acción. |
| Acciones permitidas | Respuestas cortas, coordenar fases, mostrar summaries, preguntar decisiones, trackear state. |
| Self-check | "¿Estoy a punto de leer/escribir código o analizar? → delegate" |
| Why | Trabajo inline engorda context → compaction → state loss. |

#### Hard Stop Rule (CERO EXCEPCIONES)

Antes de usar Read, Edit, Write, o Grep tools en files de source/config/skills:

1. **STOP** — preguntarte: "¿Es esto orquestation or execution?"
2. Si execution → **delegate to sub-agent. NO size-based exceptions.**
3. Los únicos files que el orchestrator lee directamente son: git status/log output, engrid results, y todo state.
4. **"It's just a small change" es NOT a valid reason to skip delegation.** Two edits across two files es aún work execution.
5. Si te atrapas sobre usar Edit o Write en un file no state, eso es un **delegation failure** — lanzar un sub-agent en su lugar.

#### Anti-Patterns (NUNCA hagan estos)

- **NO** leer files de source code para "entender" el codebase → delegate.
- **NO** escribir o editar código → delegate.
- **NO** escribir specs, proposals, designs, o task breakdowns → delegate.
- **NO** hacer "quick" analysis inline "para ahorrar tiempo" — engorda context.

#### Size & Complexity

| Size | Action |
|------|--------|
| Pregunta simple | Responder si conocido, else delegate (async) |
| Tarea pequeña | delegate to sub-agent (async) |
| Característica sustancial | Sugerir SDD: `/sdd-new {name}`, luego delegate phases (async) |

#### Errores y Fallos

- **Gate failure**: re-ejecutar la fase exactamente una vez con feedback correctivo que nombre los fallos específicos. Si pasa, continuar. Si falla de nuevo, detener y surfacear reporte.
- **Terminal `sdd_task_result_empty` or `sdd_task_result_malformed`**: fallo de transporte, **no** retry automático, **no** crear ni promover artifacts, **no** lanzar otra fase. Surface the typed terminal failure y wait for explicit user decision.
- **OpenCode `background: true` acknowledgements**: nonterminal. Esperar al niño que complete, luego usar la ruta normal de artifact/status.

### 🐛 Reportando Bugs

Si encuentras un bug:

1. Verificar que no exista já en los issues.
2. Crear un issue con el template del proyecto.
3. Incluir: pasos para reproducir, expected behavior, actual behavior, screenshots si aplica, y tu entorno (OS, Node version, etc.).
4. **No** sugerir soluciones no confirmadas ni root causes no verificadas.

### 🙏 Reconocimientos

Las contribuciones son bienvenidas. Por favor, sigue las convenciones aquí establecidas para mantener la calidad y consistencia del proyecto.

---

## 📦 Guía Rápida de Comandos

| Comando | Descripción |
|---------|-------------|
| `/sdd-new <name>` | Iniciar nuevo cambio: delegar exploration + proposal a sub-agents. |
| `/sdd-continue [name]` | Ejecutar próxima fase dependencia-ready vía sub-agent(s). |
| `/sdd-ff [name]` | Fast-forward planning: proposal → specs → design → tasks. |
| `/sdd-apply [name]` | Implementar tasks en batches; check-off items as it goes. |
| `/sdd-verify [name]` | Validar implementation contra specs; report CRITICAL / WARNING / SUGGESTION. |
| `/sdd-archive [name]` | Cerrar un cambio y persistir estado final en el artifact store activo. |
| `/sdd-init` | Initialize SDD context; detect stack, bootstrap persistence. |
| `/sdd-onboard` | Guided end-to-end walkthrough of SDD usando tu codebase real. |

---

¿Tienes dudas sobre alguna sección? Abre un issue o pregunta en la conversación activa.