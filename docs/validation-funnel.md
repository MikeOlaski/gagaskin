# Validation funnel and instrumentation

## Information architecture

`/` names the outcome and presents three peer-level routes above the fold.

| Route | Promise | Concrete deliverable now | Primary success metric |
| --- | --- | --- | --- |
| `/ai-helper` | Turn a character/reference into an editable skin | Applied editable auto/AI plan in `/editor` | `ai_helper_plan_applied` per unique local session |
| `/personal` | Write a human-ready custom-skin brief | Copyable commission brief | `human_brief_completed` per unique local session |
| `/build` | Paint an exact Minecraft skin | Exported 64 × 64 PNG from `/editor` | `skin_exported` per unique local session |
| `/editor` | Use the real editor without an account | Working browser-local skin; sign-in only for saved projects | Supporting path, not a separate offer metric |

The human route intentionally stops at a brief. It does not pretend to submit a commission to Grace. Connecting a fulfilment queue needs a defined operator identity, delivery channel, consent/retention policy, and a server-managed authorization model.

## Named events

`landing_viewed`, `offer_path_started`, `ai_helper_brief_completed`, `ai_helper_plan_requested`, `ai_helper_plan_applied`, `human_brief_completed`, `build_your_own_started`, `editor_opened`, `reference_loaded`, `skin_exported`, `project_saved`.

Events are stored in `localStorage` under `gagaskin.validation.events.v1`, use a session-scoped random ID, record only compact scalar properties, and emit a `gagaskin:validation` browser event for a future consented analytics adapter. They do not collect image data, free text, email, filenames, or a user ID.

## Decision rules

- Do not call route starts, checkbox ticks, or raw clicks “validation.” Use the three primary completion events above as denominators and compare them with unique sessions.
- Diagnose the AI path by the progression `reference_loaded → ai_helper_plan_requested → ai_helper_plan_applied`.
- Diagnose the editor path by `editor_opened → skin_exported`; `project_saved` is a retention signal, not a substitute for an exported usable skin.
- Treat the human brief as interest only until it is delivered to an operator and an actual fulfilment response can be measured.

## Next integration gate

Before public measurement, choose a consented analytics destination and wire the existing browser event to it. Before a real human offer, choose Grace’s operator account model and a secure request queue; then add an RLS-tested schema/migration and request-delivery receipt.
