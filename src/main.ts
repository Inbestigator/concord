import { callDiscord, marky } from "./utils.ts";
import { GuildListItem } from "./types.ts";
import type {
  APIGuildMember,
  APIGuildTextChannel,
  APIMessage,
  ChannelType,
} from "discord-api-types/v10";
import { APIOverwrite } from "discord-api-types/v10";
import { gray } from "@std/fmt/colors";
import select from "../src/select.ts";
import * as tty from "@denosaurs/tty";
import "@std/dotenv/load";

if (!Deno.env.has("TOKEN")) {
  alert("You must provide a TOKEN environment variable in a .env file");
  Deno.exit(1);
}

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
): Promise<APIGuildTextChannel<ChannelType.GuildText>[]> {
  try {
    const res = await callDiscord(`guilds/${guildId}/channels`, {
      method: "GET",
    });
    const channels = (await res.json()) as APIGuildTextChannel<
      ChannelType.GuildText
    >[];
    return channels
      .filter(
        (channel) =>
          (channel.type === 0 || channel.type === 5) &&
          can(guildMember, channel.permission_overwrites ?? [], 1 << 10),
      )
      .sort((a, b) => a.position - b.position);
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function fetchMessages(channelId: string): Promise<APIMessage[]> {
  try {
    const res = await callDiscord(`channels/${channelId}/messages`, {
      method: "GET",
    });
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function sendMessage(channelId: string, content: string) {
  try {
    await callDiscord(`channels/${channelId}/messages`, {
      method: "POST",
      body: { content },
    });
  } catch (error) {
    console.error(error);
  }
}

const guilds = (await (
  await callDiscord("users/@me/guilds", { method: "GET" })
).json()) as GuildListItem[];
const guildI = select(
  guilds.map((guild) => guild.name),
  "Select a guild",
);

const guildMember = (await (
  await callDiscord(`users/@me/guilds/${guilds[guildI].id}/member`, {
    method: "GET",
  })
).json()) as APIGuildMember;

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

  messages
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )
    .forEach((message) =>
      console.log(
        `\n${message.author.global_name ?? message.author.username} ${
          gray(
            `(${message.author.username}) ${
              new Date(
                message.timestamp,
              ).toDateString()
            }`,
          )
        }\n${marky(message.content)}`,
      )
    );

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
