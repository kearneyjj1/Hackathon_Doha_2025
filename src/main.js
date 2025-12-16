import "./style.css";
import { state } from "./engine/state.js";
import { createRenderer } from "./engine/renderer.js";
import { createCommandRouter } from "./engine/commands.js";
import { world } from "./content/world.js";

const app = document.getElementById("app");
if (!app) throw new Error("Missing #app");

const ui = createRenderer(app);
const router = createCommandRouter();

// --- Command history (QoL) ---
const history = [];
let histIndex = -1;
let draft = "";

function pushHistory(cmd) {
  const clean = (cmd ?? "").trim();
  if (!clean) return;
  if (history.length && history[history.length - 1] === clean) return; // avoid dup spam
  history.push(clean);
  histIndex = history.length; // one past last
}


function enterRoom(id) {
  state.location = id;
  const room = world[id];

  ui.setTitle(room?.title ?? "Unknown");
  ui.renderStats(state);
  const media =
  typeof room?.media === "function"
    ? room.media({ state, room, world })
    : room?.media;

  ui.setVideo(media);



  room?.onEnter?.({ ...ui, state, world, enterRoom, room });
}

function printDirectionHints(room, { print, state, world }) {
  const exits = Object.entries(room?.exits ?? {});
  if (!exits.length) return;

  const available = [];
  const blocked = [];

  for (const [dir, exit] of exits) {
    const exitObj = typeof exit === "string" ? { to: exit } : exit;
    const isLocked = exitObj.blocked?.({ state, world, room }) ?? false;
    (isLocked ? blocked : available).push(dir);
  }

  if (available.length) {
    print(
      `A way seems open ${available.length === 1 ? "to the " : "towards the "}${available.join(", ")}.`,
      "system"
    );
  }

  if (blocked.length) {
    print(
      `Something holds fast ${blocked.length === 1 ? "to the " : "towards the "}${blocked.join(", ")}.`,
      "system"
    );
  }
}

function nudge(ctx, reason = "unknown") {
  const { print, state, world } = ctx;
  const room = world[state.location];

  // If a quiz is active and unsolved, gently point at it.
  if (room?.quiz && !state.flags[`${room.quiz.id}_solved`]) {
    if (reason === "unknown") {
      return print("The question still hangs in the air, waiting for a simple choice.", "system");
    }
    if (reason === "blocked") {
      return print("Something insists you settle the matter at hand before you leave.", "system");
    }
  }

  // If there are room actions, suggest attention-based verbs.
  const actions = Object.keys(room?.actions ?? {});
  if (actions.length) {
    return print("You sense there’s more to learn here, if you pay closer attention.", "system");
  }

  // If there are exits, hint directions without listing commands.
  const exits = Object.keys(room?.exits ?? {});
  if (exits.length) {
    return print("Paths suggest themselves, if you choose one and follow it.", "system");
  }

  // Fallback
  return print("For a moment, nothing seems to yield.", "system");
}


router.register("help", ({ print, state, world }) => {
  const room = world[state.location];

  print(
    "You pause, considering your options. Simple actions come to mind.",
    "system"
  );

  // Movement hint (only if exits exist)
  if (room?.exits && Object.keys(room.exits).length > 0) {
    print(
      "You could try moving somewhere — perhaps by heading in a direction that feels open.",
      "system"
    );
  }

  // Action hint (only if room has actions)
  if (room?.actions && Object.keys(room.actions).length > 0) {
    print(
      "There are details here that reward attention. Listening, examining, or waiting may reveal more.",
      "system"
    );
  }

  // Quiz hint (only if unresolved quiz exists)
  if (room?.quiz && !state.flags[`${room.quiz.id}_solved`]) {
    print(
      "A question lingers in the air. A simple choice, made plainly, might be enough.",
      "system"
    );
  }

  // Generic fallback
  print(
    "When unsure, speak plainly. The world understands intent better than precision.",
    "system"
  );
});

router.register("go", ({ arg, print, state, world, enterRoom }) => {
  const room = world[state.location];
  const exit = room?.exits?.[arg];

  if (!exit) {
    print("You can’t go that way.", "system");
    return nudge({ print, state, world }, "unknown");
  }

  const to = typeof exit === "string" ? exit : exit.to;

  if (typeof exit === "object" && exit.blocked?.({ state, world, room })) {
    print(exit.message ?? "You can’t leave yet.", "system");
    return nudge({ print, state, world }, "blocked");
  }

  enterRoom(to);
});


router.register("answer", ({ arg, print, state, world }) => {
  const room = world[state.location];
  const quiz = room?.quiz;
  if (!quiz) return print("There’s nothing to answer here.", "system");

  const key = (arg || "").trim().toLowerCase();
  if (!key) return print("Answer with a letter, e.g. answer b", "system");

  const override =
  typeof quiz.answerMedia?.[key] === "function"
    ? quiz.answerMedia[key]({ state, room, world })
    : quiz.answerMedia?.[key];

if (override) ui.setVideo(override);

  const ans = quiz.answers?.[key];
  if (!ans) {
    const opts = Object.keys(quiz.answers ?? {}).join(", ");
    return print(`Invalid choice. Options: ${opts}`, "system");
  }

  state.flags[`${quiz.id}_answer`] = key;
  console.log("flags now:", state.flags);

  if (key === quiz.correct) {
    if (state.flags[`${quiz.id}_solved`]) {
      print("You've already solved this quiz", "system");
    }
    else {
      state.flags[`${quiz.id}_solved`] = true;
      print(quiz.onCorrect ?? "Correct.", "success");
      print("You gained a knowledge token!", "loot");
      state.player.tokens = state.player.tokens + 1;
      ui.renderStats(state);
    }
  } else {
    print(quiz.onWrong ?? "Wrong.", "danger");
    if (state.flags[`${quiz.id}_solved`]) print("but you've already solved this quiz...", "system");
  }
  console.log("flags now:", state.flags);
});

router.register("repeat", ({ print, state, world }) => {
  const room = world[state.location];
  const quiz = room?.quiz;

  if (!quiz) {
    return print("There is nothing here that needs repeating.", "system");
  }

  // If already solved, you may or may not want to allow repeating
  if (state.flags[`${quiz.id}_solved`]) {
    return print("The question has already been answered.", "system");
  }

  // Re-print the question
  print(quiz.question, "narration");

  // Re-print answers
  for (const [key, ans] of Object.entries(quiz.answers ?? {})) {
    print(`${key}) ${ans.text}`, "system");
  }

  print(
    quiz.prompt ?? "A simple answer will suffice.",
    "prompt"
  );
});

router.register("direction", ({ print, state, world }) => {
  const room = world[state.location];
  print("You study the space for the shape of a path.", "system");
  printDirectionHints(room, { print, state, world });
});

// Input wiring
ui.el.submit.addEventListener("click", () => {
  const value = ui.el.input.value;
  pushHistory(value);

  router.run(value, { ...ui, state, world, enterRoom });

  ui.el.input.value = "";
  ui.el.input.focus();
});

ui.el.input.addEventListener("keydown", (e) => {
  // Enter submits
  if (e.key === "Enter") {
    e.preventDefault();
    ui.el.submit.click();
    return;
  }

  // History up/down
  if (e.key === "ArrowUp") {
    e.preventDefault();
    if (histIndex === history.length) draft = ui.el.input.value; // save current draft
    histIndex = Math.max(0, histIndex - 1);
    ui.el.input.value = history[histIndex] ?? "";
    return;
  }

  if (e.key === "ArrowDown") {
    e.preventDefault();
    histIndex = Math.min(history.length, histIndex + 1);
    ui.el.input.value = (histIndex === history.length) ? draft : (history[histIndex] ?? "");
    return;
  }
});


// Start
enterRoom(state.location);
