import { interpret } from "./interpreter.js";

export function createCommandRouter() {
  const commands = new Map();

  function register(name, fn) {
    commands.set(name.toLowerCase(), fn);
  }

  function run(raw, ctx) {
    const parsed = interpret(raw);
    if (!parsed.cmd) return;

    ctx.print(`> ${raw.trim()}`, "prompt");

    const { cmd, arg } = parsed;

    // global commands
    if (commands.has(cmd)) return commands.get(cmd)({ ...ctx, cmd, arg, input: raw });

    // room actions
    const room = ctx.world[ctx.state.location];
    if (room?.actions?.[cmd]) return room.actions[cmd]({ ...ctx, cmd, arg, input: raw });

    ctx.print("Nothing happens.", "system");
  }

  return { register, run };
}

