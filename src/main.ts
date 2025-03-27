import { marky } from "./utils.ts";
import type {
  APIGuildMember,
  APIGuildTextChannel,
  APIMessage,
} from "discord-api-types/v10";
import { APIOverwrite } from "discord-api-types/v10";
import { bgBlue, bgBrightBlack, gray, rgb24 } from "@std/fmt/colors";
import select from "../src/select.ts";
import * as tty from "@denosaurs/tty";
import "@std/dotenv/load";
import { getColour, userCache } from "./cache.ts";
import {
  createMessage,
  getMember,
  listChannels,
  listGuilds,
  listMessages,
} from "@dressed/dressed";

if (!Deno.env.has("DISCORD_TOKEN")) {
  alert("You must provide a DISCORD_TOKEN environment variable in a .env file");
  Deno.exit(1);
}
const originalFetch = globalThis.fetch;
globalThis.fetch = (url, options) => {
  if (
    options?.headers && "Authorization" in options.headers &&
    options.headers.Authorization.startsWith("Bot ")
  ) {
    options.headers.Authorization = options.headers.Authorization.slice(4);
  }
  return originalFetch(url, options);
};

function can(
  guildMember: APIGuildMember,
  overwrites: APIOverwrite[],
  permission: number,
) {
  return (
    !overwrites?.some(
      (overwrite) =>
        Number(overwrite.deny) & permission &&
        !guildMember.roles.includes(overwrite.id),
    ) ||
    overwrites?.some(
      (overwrite) =>
        Number(overwrite.allow) & permission &&
        guildMember.roles.includes(overwrite.id),
    )
  );
}

async function fetchChannels(
  guildId: string,
) {
  try {
    const channels = await listChannels(guildId) as APIGuildTextChannel<0>[];
    return channels
      .filter(
        (channel) =>
          (channel.type === 0 || channel.type === 5) &&
          can(guildMember, channel.permission_overwrites ?? [], 1 << 10),
      )
      .sort((a, b) => a.position - b.position);
  } catch {
    return [];
  }
}

async function fetchMessages(channelId: string): Promise<APIMessage[]> {
  try {
    return await listMessages(channelId);
  } catch {
    return [];
  }
}

async function sendMessage(channelId: string, content: string) {
  await createMessage(channelId, content);
}

const guilds = await listGuilds();
const guildI = select(
  guilds.map((guild) => guild.name),
  "Select a guild",
);

const guildMember = await getMember(guilds[guildI].id);

const channels = await fetchChannels(guilds[guildI].id);
const channelI = select(
  channels.map((channel) => channel.name ?? channel.id),
  "Select a channel",
);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

while (true) {
  if (channelI === undefined || guildI === undefined) continue;

  const messages = await fetchMessages(channels[channelI].id);
  tty.goHomeSync();
  const loggables = await Promise.all(
    messages.map(async (message) => {
      const { author, reactions } = message;
      if (!userCache.has(author.id)) userCache.set(author.id, author);
      return {
        author,
        reactions,
        timestamp: new Date(message.timestamp),
        content: await marky(message.content),
      };
    }),
  );
  loggables
    .sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    ).forEach((message) => {
      const { author, content, timestamp, reactions } = message;
      console.log(
        `\n${
          rgb24(author.global_name ?? author.username, getColour(author.id))
        } ${
          gray(
            `(${author.username}) ${
              new Date(
                timestamp,
              ).toDateString()
            }`,
          )
        }\n${content}${
          reactions
            ? `\n${
              reactions.map((r) =>
                (r.me ? bgBlue : bgBrightBlack)(
                  r.emoji.name?.slice(0, 5) ?? "?",
                )
              ).slice(0, 5).join(
                " ",
              )
            }`
            : ""
        }`,
      );
    });

  if (
    can(guildMember, channels[channelI].permission_overwrites ?? [], 1 << 11)
  ) {
    tty.showCursorSync();
    const message = prompt(">");
    if (message && message.trim()) {
      await sendMessage(channels[channelI].id, message);
    }
  } else {
    tty.hideCursorSync();
    await sleep(10000);
  }
}
