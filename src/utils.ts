import { blue, bold, brightBlue, italic, underline } from "@std/fmt/colors";
import { getUser } from "./cache.ts";

export async function callDiscord(
  endpoint: string,
  options: Record<string, unknown> = {},
) {
  const url = new URL(endpoint, "https://discord.com/api/v10/");
  if (options.body) options.body = JSON.stringify(options.body);
  const res = await fetch(url, {
    headers: {
      Authorization: Deno.env.get("TOKEN") as string,
      "Content-Type": "application/json; charset=UTF-8",
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    console.error(`Failed to ${options.method} ${endpoint}\n└ ${data.message}`);
  }
  return data;
}

export async function marky(message: string) {
  const regex = /@everyone|@here|<@(\d+?)>/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(message)) !== null) {
    let user;
    if (match[1]) user = await getUser(match[1]);
    message = message.replaceAll(
      match[0],
      brightBlue(
        user?.username ? `@${user.global_name ?? user.username}` : match[0],
      ),
    );
  }

  message = message.replaceAll(
    /\*\*(.+)\*\*|#+\s(.+)/g,
    (_, group1, group2) => {
      if (group2) return bold(group2);
      return bold(group1);
    },
  );

  message = message.replaceAll(/\*(.+)\*/g, (_, group) => {
    return italic(group);
  });

  message = message.replaceAll(
    /https?:\/\/[^\s]+|<#(.+)>/g,
    (match, _group) => {
      return blue(underline(match));
    },
  );

  return message;
}
